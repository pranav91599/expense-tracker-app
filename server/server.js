import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query, initDB } from './db.js';
import authRoutes from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database Schema on start
initDB();

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

// Helper for PostgreSQL date filtering
const getDateCondition = (filter, startIndex = 2) => {
  const now = new Date();
  if (filter === 'daily') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    return { condition: `date >= $${startIndex}`, params: [startOfDay] };
  } else if (filter === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { condition: `date >= $${startIndex}`, params: [startOfMonth] };
  } else if (filter === 'yearly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
    return { condition: `date >= $${startIndex}`, params: [startOfYear] };
  }
  return { condition: '1=1', params: [] };
};

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'VaultFlow PostgreSQL & JWT REST API',
    version: '2.0.0'
  });
});

// 2. Auth Routes
app.use('/api/auth', authRoutes);

// -------------------------------------------------------------
// Protected Routes (User Authentication Required)
// -------------------------------------------------------------

// 3. GET /api/transactions - Query user's transactions
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { search, type, category, filter } = req.query;

    let whereClauses = ['user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (filter && filter !== 'all') {
      const dateFilter = getDateCondition(filter, paramIndex);
      if (dateFilter.params.length > 0) {
        whereClauses.push(dateFilter.condition);
        params.push(...dateFilter.params);
        paramIndex += dateFilter.params.length;
      }
    }

    if (type && (type === 'income' || type === 'expense')) {
      whereClauses.push(`type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (category) {
      whereClauses.push(`category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (search) {
      whereClauses.push(`(reason ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const sql = `SELECT * FROM transactions ${whereSql} ORDER BY date DESC, id DESC`;

    const result = await query(sql, params);
    // Parse numeric amounts for JSON response
    const transactions = result.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount)
    }));

    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions from PostgreSQL' });
  }
});

// 4. GET /api/transactions/:id - Fetch single user transaction
app.get('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    const tx = { ...result.rows[0], amount: parseFloat(result.rows[0].amount) };
    res.json({ success: true, data: tx });
  } catch (err) {
    console.error('Error fetching transaction by ID:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
});

// 5. POST /api/transactions - Create new transaction
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

    const txDate = date ? new Date(date).toISOString() : new Date().toISOString();
    const txCategory = category ? category.trim() : 'Other';

    const insertResult = await query(
      `INSERT INTO transactions (user_id, type, amount, reason, category, date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, parsedAmount, reason.trim(), txCategory, txDate]
    );

    const newTx = { ...insertResult.rows[0], amount: parseFloat(insertResult.rows[0].amount) };
    res.status(201).json({ success: true, message: 'Transaction created successfully', data: newTx });
  } catch (err) {
    console.error('Error creating transaction in PostgreSQL:', err);
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
});

// 6. PUT /api/transactions/:id - Update transaction
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingRes = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    const existing = existingRes.rows[0];
    const { type, amount, reason, category, date } = req.body;

    const updatedType = type || existing.type;
    const updatedAmount = amount !== undefined ? parseFloat(amount) : parseFloat(existing.amount);
    const updatedReason = reason !== undefined ? reason.trim() : existing.reason;
    const updatedCategory = category !== undefined ? category.trim() : existing.category;
    const updatedDate = date !== undefined ? new Date(date).toISOString() : existing.date;

    const updateRes = await query(
      `UPDATE transactions SET type = $1, amount = $2, reason = $3, category = $4, date = $5 
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [updatedType, updatedAmount, updatedReason, updatedCategory, updatedDate, id, userId]
    );

    const updatedTx = { ...updateRes.rows[0], amount: parseFloat(updateRes.rows[0].amount) };
    res.json({ success: true, message: 'Transaction updated successfully', data: updatedTx });
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ success: false, error: 'Failed to update transaction' });
  }
});

// 7. DELETE /api/transactions/:id - Delete transaction
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existingRes = await query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true, message: 'Transaction deleted successfully', id: Number(id) });
  } catch (err) {
    console.error('Error deleting transaction from PostgreSQL:', err);
    res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
});

// 8. GET /api/stats - Aggregated user statistics
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter } = req.query;

    let whereClauses = ['user_id = $1'];
    let params = [userId];

    if (filter && filter !== 'all') {
      const dateFilter = getDateCondition(filter, 2);
      if (dateFilter.params.length > 0) {
        whereClauses.push(dateFilter.condition);
        params.push(...dateFilter.params);
      }
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;
    const result = await query(`SELECT * FROM transactions ${whereSql} ORDER BY date DESC`, params);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;
    const categoryMap = {};

    result.rows.forEach(row => {
      const amount = parseFloat(row.amount);
      if (row.type === 'income') {
        totalIncome += amount;
        incomeCount += 1;
      } else if (row.type === 'expense') {
        totalExpense += amount;
        expenseCount += 1;
        categoryMap[row.category] = (categoryMap[row.category] || 0) + amount;
      }
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

    const categoryBreakdown = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

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
        totalTransactions: result.rows.length,
        categoryBreakdown
      }
    });
  } catch (err) {
    console.error('Error computing user stats:', err);
    res.status(500).json({ success: false, error: 'Failed to compute stats' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 VaultFlow Server running on port ${PORT}`);
  console.log(`🔐 PostgreSQL & JWT Authentication Active`);
  console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
});
