import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma database seed...');

  const demoEmail = 'demo@vaultflow.app';
  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        name: 'Demo User',
        email: demoEmail,
        password: hashedPassword,
        transactions: {
          create: [
            {
              type: 'income',
              amount: 5000.00,
              reason: 'Monthly Salary',
              category: 'Salary',
              date: new Date(),
            },
            {
              type: 'income',
              amount: 850.00,
              reason: 'Freelance Mobile App',
              category: 'Freelance',
              date: new Date(Date.now() - 86400000),
            },
            {
              type: 'expense',
              amount: 135.50,
              reason: 'Whole Foods Grocery',
              category: 'Food',
              date: new Date(),
            },
            {
              type: 'expense',
              amount: 42.00,
              reason: 'Uber Ride to Downtown',
              category: 'Transport',
              date: new Date(),
            },
            {
              type: 'expense',
              amount: 19.99,
              reason: 'Netflix & Spotify',
              category: 'Entertainment',
              date: new Date(Date.now() - 86400000),
            },
            {
              type: 'expense',
              amount: 110.00,
              reason: 'Electricity & Wifi Bill',
              category: 'Bills',
              date: new Date(Date.now() - 172800000),
            },
          ],
        },
      },
    });

    console.log(`✅ Seeded demo user: ${user.email} (Password: password123) with initial transactions!`);
  } else {
    console.log('ℹ️ Demo user already exists, skipping seed.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during Prisma seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
