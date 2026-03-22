# Mini E-commerce Store — Claude Memory File

## Project Overview
A full-stack e-commerce store built with Next.js 14, PostgreSQL, Stripe payments, and Cloudinary image hosting.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, TypeScript
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js + Prisma Adapter
- **Payments:** Stripe
- **Images:** Cloudinary
- **Global State:** Zustand
- **Deployment:** Vercel + Supabase

## Folder Rules
- All pages → src/app/
- All API routes → src/app/api/
- Reusable UI components → src/components/
- DB/auth/stripe/cloudinary setup → src/lib/
- Custom React hooks → src/hooks/
- Global state → src/store/
- TypeScript types → src/types/index.ts

## Coding Rules
- Always use TypeScript (no plain .js files)
- Always use Tailwind CSS for styling (no separate CSS files)
- Never hardcode secrets — always use .env.local
- Every API route must verify authentication before DB operations
- Use Prisma client from src/lib/prisma.ts (singleton pattern using PrismaPg adapter)
- All components must be functional components with typed props

## Build Progress
- [x] Step 1 — Project setup & CLAUDE.md
- [x] Step 2 — Database schema (Prisma)
- [x] Step 3 — Authentication (NextAuth)
- [x] Step 4 — Products API + UI
- [x] Step 5 — Cart
- [x] Step 6 — Checkout + Stripe
- [ ] Step 7 — Orders
- [x] Step 8 — Admin panel
- [ ] Step 9 — Deployment

## Environment Variables Needed
(stored in .env.local — never commit this file)
- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
