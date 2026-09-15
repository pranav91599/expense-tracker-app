import Dexie from 'dexie';

export const db = new Dexie('ExpenseTrackerDB');

db.version(1).stores({
  transactions: '++id, type, amount, reason, category, date' // Primary key and indexed props
});
