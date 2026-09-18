import React, { useState } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import api from '../services/api';
import { 
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
  ArrowDownCircle,
  ArrowUpCircle,
  Check,
  Loader2
} from 'lucide-react';

const CATEGORY_CONFIG = {
  expense: [
    { label: 'Food', icon: Utensils, color: '#f97316' },
    { label: 'Transport', icon: Car, color: '#3b82f6' },
    { label: 'Entertainment', icon: Film, color: '#a855f7' },
    { label: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
    { label: 'Bills', icon: Receipt, color: '#f59e0b' },
    { label: 'Other', icon: Sparkles, color: '#64748b' }
  ],
  income: [
    { label: 'Salary', icon: Briefcase, color: '#10b981' },
    { label: 'Freelance', icon: Sparkles, color: '#06b6d4' },
    { label: 'Investment', icon: TrendingUp, color: '#8b5cf6' },
    { label: 'Gift', icon: Gift, color: '#f43f5e' },
    { label: 'Other', icon: Wallet, color: '#64748b' }
  ]
};

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function TransactionForm({ onSuccess }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(CATEGORY_CONFIG.expense[0].label);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      }
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!reason.trim()) {
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
      }
      setFormError('Please enter a short description or reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createTransaction({
        type,
        amount: parsedAmount,
        reason: reason.trim(),
        category,
        date: new Date().toISOString()
      });

      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to create transaction via REST API:', err);
      setFormError(err.message || 'Could not connect to backend server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (newType) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setType(newType);
    setCategory(CATEGORY_CONFIG[newType][0].label);
    setFormError('');
  };

  const handleQuickAmount = (val) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setAmount(val.toString());
  };

  const categories = CATEGORY_CONFIG[type];

  return (
    <div className="glass-card p-6 w-full max-w-lg mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-1">New Transaction</h2>
        <p className="text-xs text-muted">Sync with SQLite backend via REST API</p>
      </div>

      {/* Segmented Type Toggle */}
      <div className="segmented-control mb-6">
        <button
          type="button"
          className={`segmented-btn ${type === 'expense' ? 'active-expense' : ''}`}
          onClick={() => handleTypeChange('expense')}
        >
          <ArrowDownCircle size={18} />
          Expense
        </button>
        <button
          type="button"
          className={`segmented-btn ${type === 'income' ? 'active-income' : ''}`}
          onClick={() => handleTypeChange('income')}
        >
          <ArrowUpCircle size={18} />
          Income
        </button>
      </div>

      {formError && (
        <div 
          className="p-3 mb-4 rounded-xl text-xs font-semibold text-expense text-center"
          style={{ background: 'var(--accent-expense-bg)', border: '1px solid var(--accent-expense-border)' }}
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Amount Input with Currency Symbol */}
        <div className="form-group">
          <label className="form-label">Amount ($)</label>
          <div style={{ position: 'relative' }}>
            <span 
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: type === 'income' ? 'var(--accent-income)' : 'var(--accent-expense)'
              }}
            >
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-input"
              style={{ paddingLeft: '36px', fontSize: '1.2rem', fontWeight: 600 }}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          {/* Quick Amount Suggestion Chips */}
          <div className="quick-amount-row">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type="button"
                className="quick-amount-chip"
                onClick={() => handleQuickAmount(val)}
              >
                +${val}
              </button>
            ))}
          </div>
        </div>

        {/* Reason / Description */}
        <div className="form-group">
          <label className="form-label">Description / Note</label>
          <input
            type="text"
            className="form-input"
            placeholder={type === 'expense' ? 'e.g. Dinner with friends' : 'e.g. Client payment'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Visual Category Picker Grid */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <div className="category-grid">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = category === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  className={`category-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                    }
                    setCategory(cat.label);
                  }}
                >
                  <div 
                    className="category-icon-wrapper" 
                    style={{ 
                      color: cat.color,
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.05)' 
                    }}
                  >
                    <IconComp size={18} />
                  </div>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`btn w-full mt-4 btn-${type}`}
          style={{ padding: '14px', fontSize: '1rem', fontWeight: 700 }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Saving to Server...</span>
            </>
          ) : (
            <>
              <Check size={20} />
              <span>Save {type === 'income' ? 'Income' : 'Expense'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
