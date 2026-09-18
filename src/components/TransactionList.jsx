import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { format, parseISO } from 'date-fns';
import { 
  Trash2, 
  Search, 
  ReceiptText, 
  Plus, 
  Utensils, 
  Car, 
  Film, 
  ShoppingBag, 
  Receipt, 
  Sparkles, 
  Briefcase, 
  TrendingUp, 
  Gift, 
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const CATEGORY_MAP = {
  Food: { icon: Utensils, color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)' },
  Transport: { icon: Car, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' },
  Entertainment: { icon: Film, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' },
  Shopping: { icon: ShoppingBag, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)' },
  Bills: { icon: Receipt, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  Salary: { icon: Briefcase, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  Freelance: { icon: Sparkles, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)' },
  Investment: { icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  Gift: { icon: Gift, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' },
  Other: { icon: Wallet, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' }
};

export default function TransactionList({ onNavigateToAdd }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, expense, income
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await api.getTransactions({
        search: searchTerm,
        type: typeFilter
      });
      if (response && response.data) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error('Failed to load transactions from REST API:', err);
      setError('Could not connect to REST API backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await api.deleteTransaction(id);
        // Optimistically remove from state
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error('Failed to delete transaction:', err);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const totalFilteredSum = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  return (
    <div className="glass-card p-5 md:p-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ReceiptText size={22} style={{ color: '#818cf8' }} />
              Transaction History
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Fetched via REST API • {transactions.length} records found
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-outline btn-icon"
              onClick={() => fetchTransactions(true)}
              title="Refresh Transactions from Server"
              aria-label="Refresh Transactions"
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

        {/* Search Bar */}
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search transactions by reason or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="filter-chip-group">
            {[
              { id: 'all', label: 'All' },
              { id: 'expense', label: 'Expenses' },
              { id: 'income', label: 'Incomes' }
            ].map(f => (
              <button
                key={f.id}
                className={`filter-chip ${typeFilter === f.id ? 'active' : ''}`}
                onClick={() => setTypeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {transactions.length > 0 && (
            <div className="text-xs text-muted font-medium">
              Net: <strong className={totalFilteredSum >= 0 ? 'text-income' : 'text-expense'}>
                {totalFilteredSum >= 0 ? '+' : '-'}${Math.abs(totalFilteredSum).toFixed(2)}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-4 rounded-xl text-center" style={{ background: 'var(--accent-expense-bg)', border: '1px solid var(--accent-expense-border)' }}>
          <div className="flex justify-center mb-1 text-expense">
            <AlertCircle size={24} />
          </div>
          <p className="text-xs text-expense font-semibold">{error}</p>
          <button 
            className="btn btn-outline mt-3" 
            onClick={() => fetchTransactions(true)}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !refreshing && (
        <div className="p-8 text-center text-muted">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          <p className="text-xs">Fetching transactions from REST API...</p>
        </div>
      )}

      {/* List / Empty State */}
      {!loading && transactions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <ReceiptText size={28} />
          </div>
          <p className="font-semibold text-secondary mb-1">
            {searchTerm || typeFilter !== 'all' ? 'No matching transactions found' : 'No transactions recorded on server'}
          </p>
          <p className="text-xs text-muted mb-4">
            {searchTerm || typeFilter !== 'all' 
              ? 'Try adjusting your search criteria or filter tags.' 
              : 'Add your first income or expense to populate the database.'}
          </p>
          {onNavigateToAdd && (
            <button className="btn btn-outline" onClick={onNavigateToAdd} style={{ padding: '8px 18px' }}>
              <Plus size={16} />
              Add Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {transactions.map(t => {
            const catInfo = CATEGORY_MAP[t.category] || CATEGORY_MAP.Other;
            const IconComp = catInfo.icon;
            let formattedDate = t.date;
            try {
              formattedDate = format(parseISO(t.date), 'MMM d, yyyy • h:mm a');
            } catch {
              formattedDate = t.date;
            }

            return (
              <div key={t.id} className="transaction-item">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="transaction-icon-box"
                    style={{ 
                      backgroundColor: catInfo.bg,
                      color: catInfo.color 
                    }}
                  >
                    <IconComp size={20} />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span 
                      className="font-semibold text-main text-sm md:text-base"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.reason}
                    </span>
                    <span className="text-dim text-xs">
                      {t.category} • {formattedDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span 
                      className={`text-sm md:text-base font-bold flex items-center justify-end gap-0.5 ${
                        t.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {t.type === 'income' ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      ${t.amount.toFixed(2)}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="transaction-delete-btn"
                    title="Delete transaction"
                    aria-label="Delete transaction"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
