import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';

export default function TransactionList() {
  const transactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    []
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await db.transactions.delete(id);
    }
  };

  if (!transactions) return <div className="text-center">Loading...</div>;

  return (
    <div className="glass-card p-4">
      <h2 className="mb-4 text-center" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Transactions</h2>
      
      {transactions.length === 0 ? (
        <p className="text-center text-muted py-4">No transactions yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {transactions.map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.05)' }}>
              
              <div className="flex flex-col">
                <span style={{ fontWeight: 500, fontSize: '1.05rem' }}>{t.reason}</span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {t.category} • {format(parseISO(t.date), 'MMM d, yyyy h:mm a')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span 
                  className={t.type === 'income' ? 'text-income' : 'text-expense'}
                  style={{ fontWeight: 600 }}
                >
                  {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                </span>
                
                <button 
                  onClick={() => handleDelete(t.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
