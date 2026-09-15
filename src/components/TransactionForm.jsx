import React, { useState } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { db } from '../db/db';

const CATEGORIES = {
  expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']
};

export default function TransactionForm({ onSuccess }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || amount <= 0) {
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: NotificationType.Error }).catch(() => {});
      }
      return alert('Please enter a valid amount');
    }
    if (!reason.trim()) {
      if (Capacitor.isNativePlatform()) {
        Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
      }
      return alert('Please enter a reason');
    }

    try {
      await db.transactions.add({
        type,
        amount: parseFloat(amount),
        reason,
        category,
        date: new Date().toISOString()
      });
      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      }
      onSuccess();
    } catch (err) {
      console.error('Failed to add transaction', err);
    }
  };

  const handleTypeChange = (newType) => {
    if (Capacitor.isNativePlatform()) {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    setType(newType);
    setCategory(CATEGORIES[newType][0]);
  };

  return (
    <div className="glass-card p-6 w-full max-w-md mx-auto">
      <h2 className="text-center mb-4" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Add Transaction</h2>
      
      <div className="flex gap-2 mb-4">
        <button 
          className={`flex-1 btn btn-outline ${type === 'expense' ? 'active' : ''}`}
          onClick={() => handleTypeChange('expense')}
        >
          Expense
        </button>
        <button 
          className={`flex-1 btn btn-outline ${type === 'income' ? 'active' : ''}`}
          onClick={() => handleTypeChange('income')}
        >
          Income
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Amount</label>
          <input 
            type="number" 
            step="0.01"
            className="form-input" 
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reason / Description</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Groceries"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES[type].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button type="submit" className={`btn w-full mt-4 btn-${type}`}>
          Save {type === 'income' ? 'Income' : 'Expense'}
        </button>
      </form>
    </div>
  );
}
