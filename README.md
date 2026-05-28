# Budget Tracker

A modern personal finance web application for tracking income and expenses, reviewing cash flow trends, and managing transactions by date.

## Overview

Budget Tracker is built with Next.js and MongoDB, with a client-first dashboard experience powered by React Query. Users can sign up or sign in, add and manage transactions, filter and search records, and view analytics and calendar-based summaries.

## Key Features

- User authentication (signup and login)
- Transaction management (create, edit, delete)
- Income and expense categorization
- Filter, sort, search, and pagination controls
- Analytics dashboard (cashflow trends and category breakdowns)
- Calendar view for daily transaction summaries
- Soft-delete behavior via trash collection
- Idempotent transaction writes using client-generated IDs

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4, Framer Motion, React Icons
- **Data fetching/state:** TanStack React Query
- **Charts:** Recharts
- **Backend/API:** Next.js Route Handlers
- **Database:** MongoDB + Mongoose
- **Validation:** Zod
- **Password hashing:** bcryptjs

## Project Structure

```text
src/
  app/
    api/            # Route handlers: budgets, login, signup
    dashboard/      # Main transaction and analytics UI
    calendar/       # Calendar-based transaction view
    login/          # Authentication page
  components/       # Reusable UI and feature components
  lib/              # Database connection, models, shared utilities
```

## Prerequisites

- Node.js 20+ (recommended)
- npm (or pnpm)
- MongoDB instance

## Environment Variables

Create a `.env.local` file in the repository root:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/budget
```

Optional authentication bootstrap variables:

```bash
# Preferred format (JSON array)
LOGIN_CREDENTIALS=[{"username":"demo","password":"demo123"}]

# Legacy fallback format
LOGIN_USERS=demo
LOGIN_PASSWORDS=demo123
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint checks

## API Endpoints

- `GET /api/budgets?user=<username>`
- `POST /api/budgets`
- `PATCH /api/budgets`
- `DELETE /api/budgets`
- `POST /api/signup`
- `POST /api/login`

## Deployment

This project can be deployed on any platform that supports Next.js applications and access to a MongoDB database (for example, Vercel).
