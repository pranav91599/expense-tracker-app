# VaultFlow - Full-Stack Smart Expense Tracker

A modern full-stack financial manager built with **React**, **Node.js/Express**, **Prisma ORM**, **PostgreSQL (Supabase)**, **JWT Authentication**, and **Capacitor** for Android.

---

## ⚡ Tech Stack

- **Frontend**: React 19, Vite, Recharts, Lucide Icons, Glassmorphism Vanilla CSS Design System.
- **Backend API**: Node.js, Express.js REST API.
- **Database & ORM**: **Prisma ORM** + **Supabase Cloud PostgreSQL** (or local PostgreSQL).
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing & per-user data isolation.
- **Mobile**: Capacitor (Android Status Bar, Haptics, Hardware Back Button).
- **Hosting**: Ready for **Render** (Backend API + Frontend Static Site) and **Vercel** (Frontend).

---

## 🚀 Getting Started

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your **Supabase Cloud PostgreSQL** or local PostgreSQL database connection strings:
```env
PORT=5000
JWT_SECRET=your_secure_jwt_secret
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 2. Push Schema & Generate Prisma Client
Push the schema to your Supabase/PostgreSQL database:
```bash
# Push schema to database
npm run prisma:push

# Generate Prisma Client
npm run prisma:generate

# (Optional) Seed demo user & initial transactions
npm run prisma:seed
```

### 3. Run Full-Stack Development
Start both the Express Backend (`http://localhost:5000`) and the Vite Frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

---

## 📡 REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a new account.
- `POST /api/auth/login` — Sign in and receive a JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Transactions & Analytics (`/api/transactions`, `/api/stats`) *(Protected by JWT)*
- `GET /api/transactions` — Query user transactions with filters (`?search=`, `?type=`, `?category=`, `?filter=`).
- `GET /api/transactions/:id` — Retrieve single transaction.
- `POST /api/transactions` — Create new expense or income.
- `PUT /api/transactions/:id` — Update existing transaction.
- `DELETE /api/transactions/:id` — Delete transaction.
- `GET /api/stats` — Aggregated metrics (net balance, income, expenses, savings rate, category breakdown).
- `GET /api/health` — Server health check.

---

## ☁️ Deployment & Hosting

### Option A: Render (Backend & Frontend Blueprint)
1. Push your repository to GitHub.
2. Log in to [Render](https://render.com) -> **New** -> **Blueprint**.
3. Connect your repository — Render will automatically detect [`render.yaml`](file:///d:/expense%20tracker/render.yaml) and configure:
   - **`vaultflow-api`**: Node.js Web Service running Express + Prisma.
   - **`vaultflow-web`**: Static Site hosting the React frontend.
4. Set `DATABASE_URL` and `DIRECT_URL` in your Render Web Service environment settings.

### Option B: Vercel (Frontend) + Render / Railway (Backend)
1. Deploy the backend to Render or Railway.
2. Deploy the frontend to [Vercel](https://vercel.com) using [`vercel.json`](file:///d:/expense%20tracker/vercel.json).
3. Set the environment variable `VITE_API_BASE_URL=https://your-backend-api.onrender.com/api` on Vercel.

---

## 📱 Android Build (Capacitor)
```bash
# Build React web bundle
npm run build

# Sync assets to Android
npm run cap:sync

# Open in Android Studio
npm run cap:open
```
