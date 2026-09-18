import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Global singleton pattern to prevent multiple instances in development
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('⚡ Prisma ORM connected to PostgreSQL / Supabase successfully');
  } catch (err) {
    console.warn('⚠️ Prisma connection check warning:', err.message);
    console.log('👉 Ensure your Supabase / PostgreSQL connection string is set in .env');
  }
};

export default prisma;
