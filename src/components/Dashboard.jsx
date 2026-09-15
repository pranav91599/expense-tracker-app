import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { isToday, isThisMonth, isThisYear, parseISO, format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

export default function Dashboard() {
  const [filter, setFilter] = useState('daily'); // daily, monthly, yearly

  const transactions = useLiveQuery(() => db.transactions.toArray(), []);

  if (!transactions) return <div className="text-center p-4">Loading...</div>;

  const filteredTransactions = transactions.filter(t => {
    const d = parseISO(t.date);
    if (filter === 'daily') return isToday(d);
    if (filter === 'monthly') return isThisMonth(d);
    if (filter === 'yearly') return isThisYear(d);
    return true;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = totalIncome - totalExpense;

  // Group expenses by category for chart
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-2 justify-center mb-2">
        {['daily', 'monthly', 'yearly'].map(f => (
          <button 
            key={f}
            className={`btn btn-outline ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '20px' }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Balance Cards */}
      <div className="glass-card p-6 text-center">
        <p className="text-muted mb-2">Net Balance</p>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700 }} className={balance >= 0 ? 'text-income' : 'text-expense'}>
          ${balance.toFixed(2)}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="text-muted text-sm mb-1">Income</p>
          <p className="text-income" style={{ fontSize: '1.25rem', fontWeight: 600 }}>+${totalIncome.toFixed(2)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-muted text-sm mb-1">Expense</p>
          <p className="text-expense" style={{ fontSize: '1.25rem', fontWeight: 600 }}>-${totalExpense.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="glass-card p-4 mt-2">
          <h3 className="text-center mb-4" style={{ fontWeight: 500 }}>Expenses by Category</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 text-center text-muted mt-2">
          No expenses for this period.
        </div>
      )}
    </div>
  );
}
