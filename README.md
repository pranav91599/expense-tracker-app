# 💸 VaultFlow — Smart Expense Tracker

<p align="center">
  <img src="https://img.shields.io/badge/VaultFlow-Smart%20Expense%20Tracker-7C3AED?style=for-the-badge" alt="VaultFlow"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
</p>

<p align="center">
  <strong>A modern full-stack personal finance platform to track income, expenses, budgets, and financial insights — on Web and Android.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api">API</a> •
  <a href="#-android">Android</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## ✨ Overview

**VaultFlow** is a full-stack smart expense tracker designed to make personal financial management simple and visual.

It combines a responsive **React dashboard**, secure **JWT authentication**, a **Node.js + Express REST API**, **Prisma ORM**, and **Supabase PostgreSQL** into a single financial management platform.

The application can also be packaged as an **Android app using Capacitor**.

### 🎯 What VaultFlow Solves

* 💰 Track income and expenses
* 📊 Understand spending patterns
* 📈 Visualize financial performance
* 🔐 Keep user data isolated and protected
* 📱 Access finances from Android
* ☁️ Deploy the complete application to the cloud

---

# 🚀 Features

## 💳 Expense Management

* Add income and expenses
* Edit existing transactions
* Delete transactions
* Categorize transactions
* Add transaction descriptions
* Search transactions
* Filter by transaction type
* Filter by category
* Filter by date

## 📊 Financial Dashboard

View important financial metrics at a glance:

* 💰 Total Balance
* 📥 Total Income
* 📤 Total Expenses
* 💾 Savings
* 📊 Savings Rate
* 🏷️ Category-wise spending
* 📈 Financial trends

## 📈 Data Visualization

Powered by **Recharts**:

* Expense breakdown charts
* Income vs expense analysis
* Category distribution
* Financial trend visualization

## 🔐 Authentication

Secure authentication system using:

* JWT authentication
* bcryptjs password hashing
* Protected API routes
* Per-user data isolation
* Authenticated user profile

## 📱 Android Support

Built with **Capacitor** to provide native Android functionality:

* Android Status Bar integration
* Hardware back button handling
* Haptic feedback
* Native Android packaging
* Web-to-mobile deployment

---

# 🛠️ Tech Stack

| Layer                | Technology                  |
| -------------------- | --------------------------- |
| 🎨 Frontend          | React 19                    |
| ⚡ Build Tool         | Vite                        |
| 📊 Charts            | Recharts                    |
| 🎨 UI                | Vanilla CSS + Glassmorphism |
| 🖼️ Icons            | Lucide Icons                |
| 🔌 Backend           | Node.js                     |
| 🚀 API               | Express.js                  |
| 🗄️ Database         | PostgreSQL                  |
| ☁️ Database Hosting  | Supabase                    |
| 🔄 ORM               | Prisma                      |
| 🔐 Authentication    | JWT                         |
| 🔒 Password Security | bcryptjs                    |
| 📱 Mobile            | Capacitor                   |
| ☁️ Deployment        | Render / Vercel / Railway   |

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      User / Web      │
                    │   React + Vite UI   │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │    Express Server    │
                    │      Node.js API     │
                    └──────────┬───────────┘
                               │
                     JWT Authentication
                               │
                               ▼
                    ┌──────────────────────┐
                    │     Prisma ORM       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ PostgreSQL Database  │
                    │      Supabase        │
                    └──────────────────────┘

                               ▲
                               │
                    ┌──────────┴───────────┐
                    │   Capacitor Android  │
                    │     Mobile App       │
                    └──────────────────────┘
```

---

# 📂 Project Structure

```text
VaultFlow/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── assets/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── server.js
│
├── android/
│
├── public/
│
├── .env.example
├── render.yaml
├── vercel.json
├── package.json
└── README.md
```

> Folder names may differ depending on your final project structure.

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/vaultflow.git

cd vaultflow
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

If frontend and backend have separate package files:

```bash
cd client
npm install

cd ../server
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Configure:

```env
PORT=5000

JWT_SECRET=your_secure_jwt_secret

DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

VITE_API_BASE_URL=http://localhost:5000/api
```

⚠️ **Never commit your `.env` file to GitHub.**

---

# 🗄️ Database Setup

VaultFlow uses **Prisma ORM + PostgreSQL**.

Push the Prisma schema:

```bash
npm run prisma:push
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Optional demo data:

```bash
npm run prisma:seed
```

---

# ▶️ Run Locally

Start the development environment:

```bash
npm run dev
```

Default URLs:

```text
Frontend
http://localhost:5173

Backend
http://localhost:5000
```

---

# 📡 REST API

## 🔐 Authentication

### Register

```http
POST /api/auth/register
```

Create a new user account.

### Login

```http
POST /api/auth/login
```

Authenticate and receive a JWT token.

### Current User

```http
GET /api/auth/me
```

Returns the authenticated user's profile.

---

# 💸 Transactions

All transaction endpoints require authentication.
