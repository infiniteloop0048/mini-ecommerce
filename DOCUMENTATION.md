# ShopNext — Full Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Environment Variables](#3-environment-variables)
4. [Database Schema](#4-database-schema)
5. [Project Structure](#5-project-structure)
6. [Feature Breakdown](#6-feature-breakdown)
   - [Authentication](#61-authentication)
   - [Products](#62-products)
   - [Cart](#63-cart)
   - [Checkout & Stripe Payments](#64-checkout--stripe-payments)
   - [Orders](#65-orders)
   - [Admin Panel](#66-admin-panel)
   - [Middleware & Route Protection](#67-middleware--route-protection)
7. [API Routes Reference](#7-api-routes-reference)
8. [Build & Deployment](#8-build--deployment)
9. [Bugs Encountered & Fixes Applied](#9-bugs-encountered--fixes-applied)
10. [Key Architectural Decisions](#10-key-architectural-decisions)
11. [Git Commit History](#11-git-commit-history)

---

## 1. Project Overview

**ShopNext** is a full-stack mini e-commerce store built from scratch with Next.js 14. It supports product browsing, a persistent shopping cart, Stripe-powered checkout, order history for customers, and a full admin panel for managing products and orders.

The app is deployed on **Vercel** with a **Supabase** PostgreSQL database.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 with PrismaPg adapter |
| Authentication | NextAuth.js v4 (JWT strategy, Credentials provider) |
| Payments | Stripe (Hosted Checkout Sessions) |
| Image hosting | Cloudinary |
| Global state | Zustand with localStorage persistence |
| Deployment | Vercel (frontend + API) + Supabase (database) |

---

## 3. Environment Variables

All secrets are stored in `.env.local` (never committed to git).

```
DATABASE_URL                        # Supabase PostgreSQL connection string (pooler URL)
NEXTAUTH_SECRET                     # Random secret for JWT signing
NEXTAUTH_URL                        # Full URL of the app (e.g. https://yourapp.vercel.app)
STRIPE_SECRET_KEY                   # Stripe secret key (sk_live_... or sk_test_...)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Stripe publishable key (pk_...)
STRIPE_WEBHOOK_SECRET               # Stripe webhook signing secret (whsec_...)
CLOUDINARY_CLOUD_NAME               # Cloudinary cloud name
CLOUDINARY_API_KEY                  # Cloudinary API key
CLOUDINARY_API_SECRET               # Cloudinary API secret
```

---

## 4. Database Schema

Defined in `prisma/schema.prisma`. Uses Prisma 7 with the PrismaPg driver adapter.

### Models

#### User
```
id              String    (cuid, primary key)
name            String?
email           String    (unique)
hashedPassword  String?
role            Role      (USER | ADMIN, default USER)
createdAt       DateTime
updatedAt       DateTime
```
Relations: has many `Account`, `Session`, `Order`; has one `Cart`

#### Account / Session / VerificationToken
Standard NextAuth.js tables managed by the Prisma adapter.

#### Product
```
id          String    (cuid, primary key)
name        String
description String    (Text)
price       Float
stock       Int       (default 0)
imageUrl    String?
category    String
createdAt   DateTime
updatedAt   DateTime
```
Relations: has many `CartItem`, `OrderItem`

#### Cart
```
id        String    (cuid, primary key)
userId    String    (unique — one cart per user)
createdAt DateTime
updatedAt DateTime
```
Relations: belongs to `User`; has many `CartItem`

#### CartItem
```
id        String
cartId    String
productId String
quantity  Int       (default 1)
```
Unique constraint: `[cartId, productId]` — no duplicate products in a cart

#### Order
```
id               String       (cuid, primary key)
userId           String
totalPrice       Float
status           OrderStatus  (PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED)
stripePaymentId  String?      (@unique — enforces idempotency at DB level)
createdAt        DateTime
updatedAt        DateTime
```
Relations: belongs to `User`; has many `OrderItem`

#### OrderItem
```
id        String
orderId   String
productId String
quantity  Int
price     Float    (snapshot of price at time of purchase)
```
Note: `product` relation uses `onDelete: Restrict` — products cannot be deleted if they appear in any order.

---

## 5. Project Structure

```
src/
├── app/
│   ├── layout.tsx                        # Root layout — Navbar, Footer, Providers
│   ├── globals.css                       # Tailwind base + global body styles
│   ├── page.tsx                          # Home page (featured products, hero)
│   ├── auth/
│   │   ├── login/page.tsx                # Login form
│   │   └── register/page.tsx             # Registration form
│   ├── products/
│   │   ├── page.tsx                      # Product listing with category filter
│   │   └── [id]/page.tsx                 # Single product detail page
│   ├── cart/
│   │   └── page.tsx                      # Cart page (items, quantities, total)
│   ├── checkout/
│   │   └── page.tsx                      # Checkout form + order summary sidebar
│   ├── orders/
│   │   └── page.tsx                      # Customer order history + success banner
│   ├── admin/
│   │   ├── layout.tsx                    # Admin sidebar layout (wraps all /admin/* pages)
│   │   ├── page.tsx                      # Admin dashboard (stats + recent orders)
│   │   ├── orders/page.tsx               # Admin order management
│   │   └── products/
│   │       ├── page.tsx                  # Admin product list
│   │       ├── new/page.tsx              # Create new product form
│   │       └── [id]/edit/page.tsx        # Edit product form
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── register/route.ts             # User registration (POST)
│       ├── products/
│       │   ├── route.ts                  # GET all products, POST create (admin)
│       │   └── [id]/route.ts             # GET, PUT, DELETE single product
│       ├── orders/
│       │   └── route.ts                  # GET user orders, POST create PaymentIntent (legacy)
│       ├── admin/
│       │   ├── orders/
│       │   │   ├── route.ts              # GET all orders (admin)
│       │   │   └── [id]/route.ts         # PUT update order status (admin)
│       │   └── products/
│       │       └── [id]/route.ts         # PUT update product (admin)
│       └── stripe/
│           ├── create-checkout-session/route.ts  # POST — create Stripe Checkout Session
│           └── webhook/route.ts                  # POST — handle Stripe webhook events
├── components/
│   ├── Providers.tsx                     # SessionProvider wrapper for NextAuth
│   ├── layout/
│   │   ├── Navbar.tsx                    # Top navigation bar
│   │   └── Footer.tsx                   # Footer
│   └── products/
│       ├── ProductCard.tsx               # Product card component
│       └── ProductGrid.tsx              # Grid layout for product cards
├── lib/
│   ├── auth.ts                           # NextAuth configuration
│   ├── prisma.ts                         # Prisma client singleton with PrismaPg adapter
│   └── stripe.ts                         # Stripe client initialisation
├── middleware.ts                         # Route protection (auth + admin RBAC)
├── store/
│   └── cartStore.ts                      # Zustand cart store (persisted to localStorage)
└── types/
    └── index.ts                          # TypeScript types + NextAuth module augmentation
```

---

## 6. Feature Breakdown

### 6.1 Authentication

**Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/types/index.ts`

- Uses **NextAuth.js v4** with the **Credentials provider** (email + password).
- Passwords are hashed with **bcryptjs** before being stored. The plain password is never saved.
- Session strategy is **JWT** (not database sessions). The JWT contains `id` and `role` which are injected into the session object via `jwt` and `session` callbacks in `auth.ts`.
- TypeScript module augmentation in `src/types/index.ts` extends `next-auth`'s `Session` and `User` types to include `id` and `role`.
- The Prisma adapter manages the `Account`, `Session`, and `VerificationToken` tables automatically.
- Registration (`POST /api/register`) creates a new user with a hashed password. Duplicate email returns a 400.
- Admin role is set manually in the database (no self-serve admin promotion). One user was promoted via a one-off Prisma script during development.

### 6.2 Products

**Files:** `src/app/products/`, `src/app/api/products/`, `src/components/products/`

- `GET /api/products` — returns all products, supports `?category=Electronics` query param.
- `POST /api/products` — creates a product (ADMIN only).
- `GET /api/products/[id]` — single product.
- `PUT /api/products/[id]` — updates a product (ADMIN only).
- `DELETE /api/products/[id]` — deletes a product (ADMIN only). Will fail if the product has any order items (DB-level Restrict).
- Products have four categories: Electronics, Accessories, Kitchen, Footwear.
- Images are hosted on **Cloudinary**. The `imageUrl` is stored as a full HTTPS URL.
- The `next.config.mjs` allowlist includes `res.cloudinary.com` so Next.js `<Image>` can serve Cloudinary URLs.
- The home page (`/`) displays the 6 most recently added products. It uses `export const dynamic = "force-dynamic"` so it is never statically prerendered (it reads from the DB).

### 6.3 Cart

**Files:** `src/store/cartStore.ts`, `src/app/cart/page.tsx`, `src/components/layout/Navbar.tsx`

- Cart state lives entirely **client-side** in a **Zustand** store, persisted to `localStorage` under the key `shopnext-cart`.
- No server-side cart synchronisation — the DB `Cart`/`CartItem` models exist in the schema but are not used by the current cart flow.
- Store actions: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`.
- `addItem` increments quantity if the product already exists in the cart.
- `updateQuantity` with quantity ≤ 0 calls `removeItem`.
- The Navbar shows a live item count badge using `useCartStore`. It uses a `mounted` state guard to prevent SSR hydration mismatch.
- Cart is cleared automatically when the user lands on `/orders?success=true` after a successful payment.

### 6.4 Checkout & Stripe Payments

**Files:** `src/app/checkout/page.tsx`, `src/app/api/stripe/create-checkout-session/route.ts`, `src/app/api/stripe/webhook/route.ts`, `src/lib/stripe.ts`

The payment flow uses **Stripe Hosted Checkout** (redirect to Stripe's page, not embedded Elements).

**Flow:**
1. User fills in the shipping form on `/checkout` and clicks "Pay with Stripe".
2. The client POSTs `{ items: [{ productId, quantity }] }` to `POST /api/stripe/create-checkout-session`.
3. The API route:
   - Verifies the session (must be logged in).
   - Fetches real prices from the DB — client-supplied prices are never trusted.
   - Validates stock availability for each item.
   - Creates a **Stripe Checkout Session** with `mode: "payment"`, line items, success/cancel URLs, and metadata containing `userId` and the serialised cart items.
   - Returns `{ url }` — the Stripe-hosted checkout URL.
4. The client redirects to `window.location.href = data.url`.
5. User completes payment on Stripe's page.
6. Stripe redirects the user to `/orders?success=true`.
7. Stripe also fires a `checkout.session.completed` webhook to `POST /api/stripe/webhook`.
8. The webhook:
   - Verifies the `stripe-signature` header.
   - Extracts `userId` and `items` from session metadata.
   - **Idempotency check (application level):** queries the DB for an existing order with the same `stripePaymentId`. Returns 200 immediately if found.
   - Fetches current DB prices (never trusts the metadata prices for order total).
   - Creates the `Order` + `OrderItem` rows and decrements product stock in a **single Prisma transaction**.
   - **Idempotency check (database level):** `stripePaymentId` has a `@unique` constraint. If two simultaneous webhook deliveries race past the app-level check, the second `order.create` throws a `P2002` unique constraint error, which is caught and returns 200 so Stripe does not retry.

**Stripe client init** (`src/lib/stripe.ts`):
```ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});
```

**Images in Stripe:** Only passed if `product.imageUrl?.startsWith("https://")` — Stripe rejects non-HTTPS URLs.

**Safe JSON parsing on the client:** The checkout page uses `res.text()` then `JSON.parse()` to safely handle empty 500 responses that would cause `res.json()` to throw.

### 6.5 Orders

**Files:** `src/app/orders/page.tsx`, `src/app/api/orders/route.ts`

- `GET /api/orders` — returns all orders for the currently logged-in user, including nested `items` and `product.name`.
- Orders are created exclusively by the Stripe webhook — never directly from the frontend.
- The orders page has a `SuccessBanner` sub-component that reads `?success=true` from the URL using `useSearchParams()`. This component is wrapped in `<Suspense fallback={null}>` to satisfy Next.js's static prerendering requirement for `useSearchParams`.
- When `?success=true`, the banner shows a green "Payment successful!" message and `clearCart()` is called.
- Order status is displayed with colour-coded badges (yellow=PENDING, blue=PROCESSING, indigo=SHIPPED, green=DELIVERED, red=CANCELLED).
- Each order shows its items with name, quantity, and line total. Price is the snapshot taken at purchase time, not the current product price.

### 6.6 Admin Panel

**Files:** `src/app/admin/`, `src/app/api/admin/`

All admin pages and API routes require `role === "ADMIN"`. Non-admins are redirected to `/` by middleware. API routes double-check the role server-side on every request.

**Admin layout** (`src/app/admin/layout.tsx`):
- Server component sidebar using Next.js nested layouts.
- Links: Dashboard, Products, Orders.
- "← Back to Store" footer link.
- Applied automatically to all `/admin/*` pages without touching individual page files.

**Dashboard** (`/admin`):
- 4 stat cards: Total Products, Total Orders, Total Users, Total Revenue (via `prisma.order.aggregate`).
- Quick links to Manage Products and Manage Orders.
- Recent Orders table (last 5 orders) with colour-coded status badges.
- Uses `export const dynamic = "force-dynamic"` — reads DB at request time.

**Products** (`/admin/products`):
- Table of all products with name, category, price, stock, and Edit/Delete actions.
- "Add New Product" button links to `/admin/products/new`.
- Delete calls `DELETE /api/products/[id]`.
- Edit links to `/admin/products/[id]/edit`.

**Edit Product** (`/admin/products/[id]/edit`):
- Client component. Fetches current product data from `GET /api/products/[id]` on mount.
- Pre-fills form with `defaultValue` on all inputs.
- Submits `PUT /api/admin/products/[id]` with changed fields.
- Redirects to `/admin/products` on success.

**New Product** (`/admin/products/new`):
- Same form structure as edit but empty. Submits to `POST /api/products`.

**Orders** (`/admin/orders`):
- Client component. Fetches all orders from `GET /api/admin/orders`.
- Table with Order ID, Customer (name + email), Date, Items count (with tooltip), Total, Status.
- Each row has a `<select>` dropdown to change order status. On change, fires `PUT /api/admin/orders/[id]`.
- Status badge updates optimistically in state on success.

**Admin API routes:**
- `GET /api/admin/orders` — all orders with user and items.
- `PUT /api/admin/orders/[id]` — update status; validates against the `VALID_STATUSES` const array.
- `PUT /api/admin/products/[id]` — update product fields.

**Admin link in Navbar:**
The Admin button is conditionally rendered only when `session.user.role === "ADMIN"`. It was not there initially — this was a bug discovered after deployment.

### 6.7 Middleware & Route Protection

**File:** `src/middleware.ts`

Uses NextAuth's `withAuth` middleware wrapper.

Protected routes (require login):
- `/checkout`
- `/orders/:path*`
- `/admin/:path*`

Admin-only routes: Any path starting with `/admin`. Non-admin logged-in users are redirected to `/`.

```ts
export const config = {
  matcher: ["/checkout", "/orders/:path*", "/admin/:path*"],
};
```

---

## 7. API Routes Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/register` | Public | Create new user account |
| GET/POST | `/api/auth/[...nextauth]` | Public | NextAuth handler |
| GET | `/api/products` | Public | List products (optional `?category=`) |
| POST | `/api/products` | ADMIN | Create product |
| GET | `/api/products/[id]` | Public | Get single product |
| PUT | `/api/products/[id]` | ADMIN | Update product |
| DELETE | `/api/products/[id]` | ADMIN | Delete product |
| GET | `/api/orders` | User | Get logged-in user's orders |
| POST | `/api/orders` | User | (Legacy) Create Stripe PaymentIntent |
| POST | `/api/stripe/create-checkout-session` | User | Create Stripe Checkout Session, return URL |
| POST | `/api/stripe/webhook` | Stripe signature | Handle Stripe events, create orders |
| GET | `/api/admin/orders` | ADMIN | Get all orders |
| PUT | `/api/admin/orders/[id]` | ADMIN | Update order status |
| PUT | `/api/admin/products/[id]` | ADMIN | Update product |

---

## 8. Build & Deployment

### Build Script

```json
"build": "prisma generate && next build"
```

`prisma generate` runs before `next build` because `@prisma/client`'s TypeScript types resolve through the **generated** `.prisma/client/` directory. Without generating first, Vercel's tsc cannot find `PrismaClient` and fails with `Module '@prisma/client' has no exported member 'PrismaClient'`.

### Vercel Configuration

- No special `vercel.json` needed. Vercel auto-detects Next.js.
- All environment variables are set in the Vercel project dashboard.
- The Stripe webhook endpoint in the Stripe dashboard must be set to: `https://your-vercel-url.vercel.app/api/stripe/webhook`
- Only configure **one** webhook endpoint per environment. Having both a local ngrok URL and the Vercel URL active simultaneously causes every payment to fire the webhook twice.

### Supabase

- Database hosted on Supabase free tier.
- Uses the **connection pooler URL** (port 6543) in `DATABASE_URL`, not the direct connection URL. The pooler is required for serverless environments (Vercel functions open and close connections on every request).
- Schema changes are applied with `npx prisma db push`.

### Dynamic Rendering

Pages that read from the database at the top level are marked with:

```ts
export const dynamic = "force-dynamic";
```

This prevents Next.js from attempting to statically prerender them at build time, which would fail with a `ENETUNREACH` error because the database is not accessible during Vercel's build phase.

Pages with this directive:
- `src/app/page.tsx` (home page — fetches featured products)
- `src/app/admin/page.tsx` (dashboard — fetches stats and recent orders)

---

## 9. Bugs Encountered & Fixes Applied

This section documents every significant bug that appeared during development and what was done to fix it.

---

### Bug 1: Cart Images Not Loading

**Symptom:** Product images in the cart page showed broken image icons instead of Cloudinary images.

**Root cause:** Next.js `<Image>` component only allows remote images from explicitly allowlisted domains. `res.cloudinary.com` was missing from `next.config.mjs`.

**Fix:**
```js
// next.config.mjs
images: {
  remotePatterns: [
    { protocol: "https", hostname: "res.cloudinary.com" }
  ]
}
```
Also added `onError` handler to the `<Image>` component to hide broken image elements gracefully.

---

### Bug 2: Home Page Showing Only a Full-Screen Headphone Image (Twice)

**Symptom:** The entire home page was replaced by a single oversized product image with no navbar, footer, or layout.

**Root cause:** Running `npm run build` while `npm run dev` was active caused the build to overwrite the dev server's compiled CSS file (`_next/static/css/app/layout.css`). When the dev server then served a page, the CSS URL pointed to the build output's version instead of the development version, completely breaking all Tailwind styles. Without styles, the flex layout collapsed and the first `<img>` tag in the DOM filled the viewport.

**Fix:** Stop the dev server, run `npm run dev` again, and hard-refresh the browser. This happened twice — the lesson is: **never run `npm run build` while the dev server is running**.

---

### Bug 3: Stripe Checkout "Unexpected end of JSON input"

**Symptom:** Clicking "Pay with Stripe" showed an error: `Failed to execute json on Response: Unexpected end of JSON input`.

**Root cause:** Two issues combined:
1. An uncaught error inside the `POST /api/stripe/create-checkout-session` handler was returning an empty 500 response body (no JSON).
2. The client was calling `res.json()` on that empty body, which throws.

**Fix:**
1. Wrapped the entire route handler in a `try/catch` that always returns a JSON error response.
2. Changed the client to use `res.text()` first, then `JSON.parse(text)` — safe against empty responses.

---

### Bug 4: Admin Panel Not Visible After Login

**Symptom:** Logged in as an ADMIN user but no admin dashboard link appeared. `/admin` was still accessible by typing the URL directly, but there was no way to navigate there from the UI.

**Root cause:** The `Navbar` component never checked `session.user.role`. There was no conditional rendering for the Admin link.

**Fix:** Added a conditional Admin button to the Navbar:
```tsx
{session.user.role === "ADMIN" && (
  <Link href="/admin">Admin</Link>
)}
```

---

### Bug 5: Vercel Build — Multiple TypeScript Implicit `any` Errors

**Symptom:** Vercel builds failed with `Type error: Parameter 'X' implicitly has an 'any' type` on multiple files. Local builds passed because the local TypeScript compiler is less strict (uses cache).

**Root cause:** Vercel runs `tsc` from scratch with no cache, and the project's `tsconfig.json` has `strict: true`. Several callback parameters were not annotated, relying on inference that didn't flow through in strict mode.

**Fixes applied, file by file:**

- `src/app/api/orders/route.ts:63` — `products.find((p) => ...)` → `products.find((p: (typeof products)[number]) => ...)`
- `src/app/api/stripe/create-checkout-session/route.ts:39` — same pattern
- `src/app/api/stripe/webhook/route.ts:48` — same pattern
- `src/app/api/stripe/create-checkout-session/route.ts` — `const lineItems = []` → `const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []`
- `src/app/admin/page.tsx:97` — `recentOrders.map((order) => ...)` → `recentOrders.map((order: typeof recentOrders[number]) => ...)`

---

### Bug 6: Vercel Build — `Module '@prisma/client' has no exported member 'Prisma'`

**Symptom:** Vercel build failed after attempting to import `{ Prisma }` from `@prisma/client` to type the `$transaction` callback parameter.

**Root cause:** Prisma 7 does not export `Prisma` as a named export from `@prisma/client` in the same way older versions did. The `Prisma` namespace is not available directly.

**Fix:** Replaced `Prisma.TransactionClient` with `any` (suppressed with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`) since Prisma 7's adapter-based transaction types are complex and not straightforwardly importable.

---

### Bug 7: Vercel Build — `Module '@prisma/client' has no exported member 'PrismaClient'`

**Symptom:** Vercel build failed with this error on `src/lib/prisma.ts`.

**Root cause:** Not a wrong import. `@prisma/client` exports `PrismaClient` by re-exporting from `.prisma/client/` — the **generated** client directory. This directory only exists after `prisma generate` runs. On Vercel, the build process runs `npm install` then immediately `next build` without ever running `prisma generate`, so the generated types don't exist and TypeScript cannot resolve `PrismaClient`.

**Fix:** Changed the build script in `package.json`:
```json
"build": "prisma generate && next build"
```
This ensures the Prisma client is always generated before TypeScript compilation on every Vercel deployment.

---

### Bug 8: Vercel Prerender Error on `/admin` — `connect ENETUNREACH`

**Symptom:** Vercel deployment failed with `Error occurred prerendering page /admin` and a network error.

**Root cause:** Next.js 14 tries to statically prerender pages at build time. The `/admin` page and the `/` home page are server components that call `prisma.*` directly. During Vercel's build phase, the database is not accessible (network is restricted), so the Prisma calls fail.

**Fix:** Added `export const dynamic = "force-dynamic"` to both pages:
- `src/app/page.tsx`
- `src/app/admin/page.tsx`

This tells Next.js to always render these pages on-demand at request time, never at build time.

---

### Bug 9: Every Order Appearing Twice (Duplicate Orders)

**Symptom:** Every successful checkout created two identical orders — visible in both the customer's order history and the admin dashboard.

This bug went through three phases of investigation and fix:

#### Phase 1 — Wrong diagnosis: `payment_intent.succeeded` handler

**Initial theory:** The webhook had both a `checkout.session.completed` handler and a `payment_intent.succeeded` handler. When a Stripe Checkout Session completes, Stripe fires both events. Both handlers were creating orders.

**Fix applied:** Removed the `payment_intent.succeeded` handler entirely.

**Result:** Still duplicating. This was not the full root cause.

#### Phase 2 — Partial fix: Application-level idempotency check

**Theory:** The webhook is receiving the same event twice (Stripe retries if no fast 200 response). Added an application-level check — before creating an order, query the DB for an existing order with the same `stripePaymentId`. Return 200 immediately if found.

**Fix applied:**
```ts
const existing = await prisma.order.findFirst({ where: { stripePaymentId } });
if (existing) return NextResponse.json({ received: true });
```

**Result:** Still duplicating. This check has a race condition.

#### Phase 3 — Root cause identified and definitively fixed

**Actual root cause:** Two things combined:

1. **No database-level unique constraint on `stripePaymentId`.** Without a `@unique` constraint, two concurrent requests can both pass the application-level idempotency check (both query simultaneously, both find nothing, both proceed to create an order).

2. **Stripe sends webhook events to every configured endpoint simultaneously.** If both a local ngrok URL and the Vercel production URL are configured in the Stripe dashboard, Stripe sends the same event to both at the same millisecond. Both webhook calls hit the app concurrently, race past the `findFirst` check, and each inserts a row. No amount of application-level logic can prevent this — only the database can.

**Definitive fix:**

Step 1 — Cleaned up 6 existing duplicate orders from the DB (kept the oldest of each duplicate pair).

Step 2 — Added `@unique` to `stripePaymentId` in the Prisma schema:
```prisma
stripePaymentId  String?  @unique
```

Step 3 — Ran `npx prisma db push --accept-data-loss` to apply the constraint to Supabase.

Step 4 — Added a `try/catch` for Prisma error code `P2002` (unique constraint violation) in the webhook. If the race condition is somehow hit even with the DB constraint, the second insert is rejected at the database level, caught in code, and returns 200 so Stripe does not retry:

```ts
} catch (err) {
  if (err instanceof PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json({ received: true });
  }
  throw err;
}
```

This two-layer defence (application check + database constraint + error catch) makes the webhook fully idempotent regardless of how many times or how simultaneously Stripe calls it.

**Additional recommendation:** In the Stripe dashboard under Developers → Webhooks, only configure **one** endpoint per environment. Remove any stale local ngrok URLs.

---

## 10. Key Architectural Decisions

### Prices are never trusted from the client
Every API route that involves money fetches prices directly from the database. The cart only stores product IDs and quantities. The checkout session is built server-side with DB prices. The webhook re-fetches prices again from the DB when creating the order. This prevents price manipulation attacks.

### Stripe Hosted Checkout over Stripe Elements
Using Stripe's hosted redirect flow means no sensitive card data ever touches the application server. It also avoided the need to install `@stripe/react-stripe-js` during a session where npm network access was intermittent. The trade-off is less UI control over the payment page.

### Orders are created by the webhook, not the frontend
The order row is never created when the user clicks "Pay". It is only created after Stripe confirms the payment via webhook. This means there can never be an order in the database for a payment that failed or was abandoned.

### JWT sessions over database sessions
NextAuth is configured with `strategy: "jwt"`. Sessions are stored in a signed cookie, not in the database. This avoids a DB read on every authenticated request and is more suitable for serverless (stateless) deployments.

### Zustand cart persisted to localStorage
The cart lives in the browser, not the database. This means the cart survives page refreshes and is available immediately without any API call. The DB `Cart`/`CartItem` models exist but are unused — if server-side cart sync (e.g., across devices) were needed, those would be wired up.

### Admin layout via Next.js nested layouts
The admin sidebar is implemented as `src/app/admin/layout.tsx`, a Next.js nested layout. It automatically wraps every page under `/admin/*` without needing to import or render the sidebar in each individual page.

---

## 11. Git Commit History

```
8e4a8f9  Fix duplicate orders at the database level
5b77525  Fix duplicate orders with webhook idempotency guard
3c0fe4d  Fix duplicate orders on each checkout
d24515e  Switch to Supabase connection pooler
d281e59  Production webhook configured
96c24ae  Fix prerender errors - force dynamic for DB pages
4788866  Fix Prisma 7 client imports
598449e  Fix Prisma 7 transaction type in webhook
6f51af6  Fix all TypeScript implicit any errors across all files
625c07c  Fix all implicit any TypeScript errors
51aac95  Fix TypeScript error in admin page
fbe6612  Complete mini e-commerce store
38170d7  Initial commit from Create Next App
```
