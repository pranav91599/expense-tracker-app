import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  PiggyBank,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_COLORS = {
  'Food': '#f97316',
  'Transport': '#3b82f6',
  'Entertainment': '#a855f7',
  'Shopping': '#ec4899',
  'Bills': '#f59e0b',
  'Salary': '#10b981',
  'Freelance': '#06b6d4',
  'Investment': '#8b5cf6',
  'Gift': '#f43f5e',
  'Other': '#64748b'
};

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#3b82f6'];

export default function Dashboard({ onNavigateToAdd }) {
  const [filter, setFilter] = useState('monthly'); // daily, monthly, yearly, all
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.getStats(filter);
      if (response && response.data) {
        setStats(response.data);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Could not connect to REST API backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !stats) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <div className="flex justify-center mb-3">
          <RefreshCw size={28} className="animate-spin text-muted" />
        </div>
        <p className="text-secondary font-semibold">Connecting to REST API...</p>
        <p className="text-xs text-muted mt-1">Retrieving latest financial metrics</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="glass-card p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-3 text-expense">
          <AlertCircle size={36} />
        </div>
        <h3 className="text-base font-bold text-main mb-1">REST API Disconnected</h3>
        <p className="text-xs text-muted mb-4 max-w-sm mx-auto">{error}</p>
        <button 
          className="btn btn-outline" 
          onClick={() => fetchDashboardData(true)}
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} />
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    balance = 0,
    savingsRate = 0,
    incomeCount = 0,
    expenseCount = 0,
    categoryBreakdown = []
  } = stats || {};

  const totalFlow = totalIncome + totalExpense;
  const incomePercent = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePercent = totalFlow > 0 ? 100 - incomePercent : 50;

  const chartData = categoryBreakdown.map((item, idx) => ({
    ...item,
    color: CATEGORY_COLORS[item.name] || PALETTE[idx % PALETTE.length]
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : 0;
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <p style={{ fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>{data.name}</p>
          <p style={{ color: '#f43f5e', fontWeight: 700, fontSize: '1.05rem' }}>
            ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{percent}% of total expenses</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Time Filter Pills & Actions */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="filter-chip-group">
          {[
            { id: 'daily', label: 'Today' },
            { id: 'monthly', label: 'This Month' },
            { id: 'yearly', label: 'This Year' },
            { id: 'all', label: 'All Time' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline btn-icon"
            onClick={() => fetchDashboardData(true)}
            title="Refresh Data from REST API"
            aria-label="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {onNavigateToAdd && (
            <button 
              className="btn btn-income"
              onClick={onNavigateToAdd}
              style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '9999px' }}
            >
              <Plus size={16} />
              <span>Add Entry</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Balance & Stats */}
      <div className="dashboard-grid">
        {/* Left Column: Net Balance Hero */}
        <div className="glass-card hero-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-secondary font-semibold text-sm flex items-center gap-2">
                <Wallet size={16} className="text-muted" />
                Net Cash Balance
              </span>
              <span className="glass-pill px-3 py-1 text-xs font-semibold" style={{ color: '#c7d2fe' }}>
                {filter === 'daily' ? 'Today' : filter === 'monthly' ? 'Monthly' : filter === 'yearly' ? 'Yearly' : 'Overall'}
              </span>
            </div>

            <div className={`hero-balance-value ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
              {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted mb-3">
              <PiggyBank size={15} style={{ color: '#a5b4fc' }} />
              <span>Savings Rate: <strong style={{ color: savingsRate > 0 ? '#10b981' : '#f8fafc' }}>{savingsRate}%</strong></span>
            </div>
          </div>

          {/* Income vs Expense Ratio Bar */}
          <div>
            <div className="flex justify-between text-xs text-muted mb-1 font-medium">
              <span className="flex items-center gap-1 text-income">
                <ArrowUpRight size={14} /> Income {incomePercent}%
              </span>
              <span className="flex items-center gap-1 text-expense">
                Expense {expensePercent}% <ArrowDownRight size={14} />
              </span>
            </div>
            <div className="ratio-bar-container">
              <div className="ratio-bar-income" style={{ width: `${incomePercent}%` }} />
              <div className="ratio-bar-expense" style={{ width: `${expensePercent}%` }} />
            </div>
          </div>
        </div>

        {/* Right Column: Quick Stats Breakdown */}
        <div className="stats-grid">
          {/* Income Card */}
          <div className="glass-card glass-card-interactive stat-card flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted text-xs font-semibold uppercase tracking-wider">Total Income</span>
                <div className="stat-amount text-income mt-2">
                  +${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-badge income">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-dim text-xs mt-3">
              {incomeCount} {incomeCount === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>

          {/* Expense Card */}
          <div className="glass-card glass-card-interactive stat-card flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
                <div className="stat-amount text-expense mt-2">
                  -${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="stat-badge expense">
                <TrendingDown size={18} />
              </div>
            </div>
            <p className="text-dim text-xs mt-3">
              {expenseCount} {expenseCount === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown Section */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <PieIcon size={18} style={{ color: '#818cf8' }} />
            Expense Breakdown by Category
          </h2>
          <span className="text-xs text-muted font-medium">
            {chartData.length} {chartData.length === 1 ? 'category' : 'categories'}
          </span>
        </div>

        {chartData.length > 0 ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Chart */}
            <div style={{ width: '100%', maxWidth: '280px', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={600}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color || PALETTE[index % PALETTE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Legend list */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chartData.map(item => {
                const percent = totalExpense > 0 ? Math.round((item.value / totalExpense) * 100) : 0;
                return (
                  <div 
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded-lg"
                    style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: item.color 
                        }} 
                      />
                      <span className="text-xs font-semibold text-secondary">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-main">
                        ${item.value.toFixed(2)}
                      </span>
                      <span className="text-dim text-xs ml-1.5">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PieIcon size={28} />
            </div>
            <p className="font-semibold text-secondary mb-1">No expense data recorded</p>
            <p className="text-xs text-muted mb-4">Add your expenses to see an automated category breakdown.</p>
            {onNavigateToAdd && (
              <button className="btn btn-outline" onClick={onNavigateToAdd} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                <Plus size={16} />
                Add First Expense
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
