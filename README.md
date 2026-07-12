# TransitOps — Fleet Management Platform

A full-stack fleet management system built for hackathon demonstration.

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Prisma v6** + Neon PostgreSQL
- **Auth.js v5** (JWT sessions, Credentials provider)
- **Tailwind CSS** + custom design system
- **Recharts** for analytics charts
- **Zod** for dual validation (client + API)

## Getting Started (Local)

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Push schema to database
npx prisma db push

# 4. Seed demo data
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Login Credentials (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@transitops.com | Admin@123 |
| Fleet Manager | manager@transitops.com | Manager@123 |
| Dispatcher | dispatcher@transitops.com | Dispatcher@123 |

## Environment Variables

```env
DATABASE_URL=          # Neon pooled connection string
DIRECT_DATABASE_URL=   # Neon direct connection string (for migrations)
NEXTAUTH_SECRET=       # Random 32-char secret (openssl rand -base64 32)
NEXTAUTH_URL=          # http://localhost:3000 (local) or https://yourapp.vercel.app (prod)
```

## Deploy to Vercel

1. Push repository to GitHub
2. Create new project on [vercel.com](https://vercel.com) → Import repo
3. Set all 4 environment variables in Vercel dashboard → Settings → Environment Variables
4. Override **Build Command**: `npx prisma generate && next build`
5. Click **Deploy**

After deploy:
- Update `NEXTAUTH_URL` to your Vercel URL
- Run seed via Vercel CLI: `vercel env pull && npx prisma db seed`

## Key Features

| Module | What it does |
|--------|-------------|
| **Dashboard** | 7 live KPI cards, vehicle status chart, monthly trip/revenue area chart |
| **Vehicles** | CRUD with unique reg validation, status badges, soft-retire |
| **Drivers** | Safety score gauge, license expiry warnings, available/off-duty toggle |
| **Trips** | Full lifecycle (Draft → Dispatched → Completed), transactional state machine |
| **Maintenance** | SCHEDULED → IN\_PROGRESS → COMPLETED, auto-flips vehicle to IN\_SHOP |
| **Fuel & Expenses** | Fuel log with auto total, per-vehicle cost breakdown |
| **Reports** | ROI per vehicle, fuel efficiency trend, CSV export |
| **Settings** | Role×Module RBAC matrix, general config |

## Business Rules Enforced

1. Vehicle reg number is unique (DB + Zod)
2. Retired/IN_SHOP vehicles excluded from trip dispatch
3. Expired license drivers blocked from trips
4. Cargo weight ≤ vehicle capacity (real-time + API validation)
5. Dispatch/Complete/Cancel are atomic Prisma `$transaction` operations
6. Maintenance auto-sets vehicle to `IN_SHOP`, completion restores `AVAILABLE`
