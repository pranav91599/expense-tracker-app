import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma, connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Helper for timeframe date calculation
const getStartDateForFilter = (filter) => {
  const now = new Date();
  if (filter === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (filter === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === 'yearly') {
    return new Date(now.getFullYear(), 0, 1);
  }
  return null;
};

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VaultFlow Prisma ORM & Supabase REST API',
    version: '3.0.0',
  });
});

// 2. Auth Routes
app.use('/api/auth', authRoutes);

// -------------------------------------------------------------
// Protected Routes (User Authentication Required)
// -------------------------------------------------------------

// 3. GET /api/transactions - Query user's transactions with Prisma
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, type, category, filter } = req.query;

    const where = {
      userId,
    };

    if (filter && filter !== 'all') {
      const startDate = getStartDateForFilter(filter);
      if (startDate) {
        where.date = { gte: startDate };
      }
    }

    if (type && (type === 'income' || type === 'expense')) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });

    const parsedTransactions = transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: t.date.toISOString(),
    }));

    res.json({ success: true, count: parsedTransactions.length, data: parsedTransactions });
  } catch (err) {
    console.error('Error fetching transactions with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// 4. GET /api/transactions/:id - Fetch single user transaction
app.get('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = parseInt(req.params.id, 10);

    if (isNaN(txId)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: txId,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    res.json({
      success: true,
      data: {
        ...transaction,
        amount: Number(transaction.amount),
        date: transaction.date.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error fetching transaction by ID with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
});

// 5. POST /api/transactions - Create new transaction with Prisma
app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, amount, reason, category, date } = req.body;

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be either "income" or "expense"' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Reason/Description is required' });
    }

    const txDate = date ? new Date(date) : new Date();
    const txCategory = category ? category.trim() : 'Other';

    const newTx = await prisma.transaction.create({
      data: {
        userId,
        type,
        amount: parsedAmount,
        reason: reason.trim(),
        category: txCategory,
        date: txDate,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        ...newTx,
        amount: Number(newTx.amount),
        date: newTx.date.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error creating transaction with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
});

// 6. PUT /api/transactions/:id - Update transaction with Prisma
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = parseInt(req.params.id, 10);

    if (isNaN(txId)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    }

    // Verify ownership
    const existing = await prisma.transaction.findFirst({
      where: { id: txId, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    const { type, amount, reason, category, date } = req.body;

    const updatedTx = await prisma.transaction.update({
      where: { id: txId },
      data: {
        ...(type ? { type } : {}),
        ...(amount !== undefined ? { amount: parseFloat(amount) } : {}),
        ...(reason !== undefined ? { reason: reason.trim() } : {}),
        ...(category !== undefined ? { category: category.trim() } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
      },
    });

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: {
        ...updatedTx,
        amount: Number(updatedTx.amount),
        date: updatedTx.date.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error updating transaction with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to update transaction' });
  }
});

// 7. DELETE /api/transactions/:id - Delete transaction with Prisma
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const txId = parseInt(req.params.id, 10);

    if (isNaN(txId)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id: txId, userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    await prisma.transaction.delete({
      where: { id: txId },
    });

    res.json({ success: true, message: 'Transaction deleted successfully', id: txId });
  } catch (err) {
    console.error('Error deleting transaction with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
});

// 8. GET /api/stats - Aggregated user statistics with Prisma
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;

    const where = {
      userId,
    };

    if (filter && filter !== 'all') {
      const startDate = getStartDateForFilter(filter);
      if (startDate) {
        where.date = { gte: startDate };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const categoryMap = {};

    transactions.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === 'income') {
        totalIncome += amt;
        incomeCount += 1;
      } else if (t.type === 'expense') {
        totalExpense += amt;
        expenseCount += 1;
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

    const categoryBreakdown = Object.keys(categoryMap)
      .map((key) => ({
        name: key,
        value: categoryMap[key],
      }))
      .sort((a, b) => b.value - a.value);

    res.json({
      success: true,
      data: {
        filter: filter || 'all',
        totalIncome,
        totalExpense,
        balance,
        savingsRate,
        incomeCount,
        expenseCount,
        totalTransactions: transactions.length,
        categoryBreakdown,
      },
    });
  } catch (err) {
    console.error('Error computing user stats with Prisma:', err);
    res.status(500).json({ success: false, error: 'Failed to compute stats' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 VaultFlow Server running on port ${PORT}`);
  console.log(`⚡ Prisma ORM & Supabase Cloud PostgreSQL Active`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
});
