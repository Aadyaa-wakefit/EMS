<div align="center">

# LMS — Leave Management System

A small, opinionated internal tool for tracking employee leave: submission, approval, balance accounting, and a one-stop admin console. Built with the Next.js App Router on top of Neon Postgres and Better Auth.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-149eca?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-0b1120?logo=tailwindcss&logoColor=38bdf8)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Postgres-Neon-336791?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Better Auth](https://img.shields.io/badge/Auth-Better%20Auth-7c3aed)](https://www.better-auth.com/)

</div>

---

## Overview

LMS gives a team two tightly-scoped surfaces:

- **Employees** submit leave requests and watch their sick / casual / vacation balances draw down as approvals come in.
- **Admins** see every employee in one console — per-type balances, pending approvals, role toggling, and inline allocation editing — all from a single page.

Everything is a Server Component or Server Action; no REST API surface to maintain, no client-side data fetching to babysit.

---

## Screenshots

### Admin dashboard

![Admin team dashboard](./public/readme/admin.png)

> Filterable employee list with per-type balances, sticky balance panel with inline allocation editor, and role toggling behind an `AlertDialog` confirmation.

### Employee experience


![Employee leaves view](./public/readme/employee.png)

> `/leaves` shows the requester's history with status filters and a personal balance panel; `/leaves/new` enforces remaining balance at submission time.

---

## Features

| | Capability |
| --- | --- |
| Auth | Single `/auth` route for sign-in & sign-up, `role`-aware redirects, server-action cookies via `nextCookies()` |
| Submission | `/leaves/new` with date range, type, optional reason, live "Total days requested" preview |
| Approval | `/leaves/[id]` admin actions for Approve / Reject; balance deduction is transactional (`SELECT ... FOR UPDATE`) |
| Balances | Auto-seeded sick / casual / vacation rows on every sign-up; safety-net upserts on every read |
| Admin console | Employee directory, per-type balance grid, leave-type & remaining-days filter chips, sticky right-hand balance panel |
| Allocations | Inline pencil editor on each tile lets admins adjust `allocated`; transactional guard `allocated >= used` |
| Roles | Promote / demote any user from the panel (self-demotion blocked). CLI bootstrap script for the first admin |
| UX | Attio-flavoured minimal UI built on Shadcn primitives + Lucide icons + Tailwind |

---

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Server Actions)
- **Runtime**: React 19, TypeScript 5
- **Auth**: [Better Auth](https://www.better-auth.com/) (`better-auth`, `@better-auth/infra`, `nextCookies`, `dash`)
- **Database**: PostgreSQL on [Neon](https://neon.tech/) via the `pg` connection pool (channel-bound SSL)
- **UI**: Tailwind CSS 4, [Shadcn](https://ui.shadcn.com/) primitives over Radix UI, `class-variance-authority`, `tailwind-merge`
- **Icons**: [Lucide](https://lucide.dev/)
- **Tooling**: ESLint 9 (`eslint-config-next`), `tsc --noEmit` for type safety

---

## Project structure

```
employee-management/
├── app/
│   ├── (auth)/
│   │   └── auth/                      # Single sign-in + sign-up surface
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── _components/           # EmployeesTable, EmployeeBalancePanel
│   │   │   ├── actions.ts             # setUserRoleAction, setLeaveAllocationAction
│   │   │   └── page.tsx               # SSR dashboard with filter toolbar
│   │   └── leaves/
│   │       ├── _components/           # LeaveDecisionForm, shared helpers
│   │       ├── [id]/page.tsx          # Detail + admin decisions
│   │       ├── new/                   # Submission form
│   │       ├── actions.ts             # createLeaveRequest, approve / reject
│   │       └── page.tsx               # SSR list with status filters
│   ├── api/auth/[...all]/route.ts     # Better Auth handler
│   ├── components/                    # Sidebar, layout pieces
│   └── lib/
│       ├── auth.ts                    # Better Auth instance + signup hook
│       ├── auth-client.ts             # Browser session helpers
│       ├── db.ts                      # pg pool, SSL hardening
│       ├── leaves-repo.ts             # Leave CRUD, transactional approve
│       ├── leaves-shared.ts           # Client-safe constants & types
│       └── users-repo.ts              # Employees, balances, allocation upsert
├── components/ui/                     # Shadcn primitives (button, card, sheet, ...)
├── hooks/                             # Reusable React hooks
├── lib/                               # cn() and other client utilities
├── public/
│   └── assets/                        # README screenshots live here
├── scripts/
│   ├── migrate-leaves.mjs             # Creates leave_requests + leave_balances, seeds existing users
│   └── promote-admin.mjs              # Promote / demote users by email
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## Getting started

### Prerequisites

- Node.js 20+
- A Postgres database (Neon recommended — the connection string format is already supported)
- A package manager: `pnpm` (preferred), `npm`, or `bun`

### 1. Clone & install

```bash
git clone https://github.com/Aadyaa-wakefit/EMS
cd EMS
pnpm install
```

### 2. Environment variables

Create a `.env.local` at the project root:

```bash
# Postgres (Neon connection string, sslmode=require is parsed and hardened automatically)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

# Better Auth
BETTER_AUTH_SECRET=<generate via: openssl rand -base64 32>
BETTER_AUTH_API_KEY=<your dash API key, optional>

# Used by Better Auth + Next.js for trusted-origin checks and absolute URLs
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

> On Vercel, replace the last two with your deployment URL and add `VERCEL_URL` is auto-injected — `app/lib/auth.ts` already prepends `https://` for it.

### 3. Database migrations

Better Auth bootstraps its own `user` / `session` / `account` / `verification` tables on first request. The leave-specific tables need one explicit pass:

```bash
node scripts/migrate-leaves.mjs
```

This creates `leave_requests`, `leave_balances`, the `(user_id, leave_type)` unique index, and seeds defaults for any existing users. New sign-ups receive the same defaults automatically through a Better Auth `databaseHooks.user.create.after` hook.

### 4. Bootstrap the first admin

Sign-up creates `role = 'employee'` for everyone. Promote yourself via the CLI:

```bash
node scripts/promote-admin.mjs you@example.com
```

To revert:

```bash
node scripts/promote-admin.mjs you@example.com --demote
```

### 5. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, then run the promote command above and refresh.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `node scripts/migrate-leaves.mjs` | Create leave tables + seed default balances for existing users |
| `node scripts/promote-admin.mjs <email>` | Promote a user to admin |
| `node scripts/promote-admin.mjs <email> --demote` | Revert a user to employee |

---

## Routes

| Path | Who | What |
| --- | --- | --- |
| `/auth` | Public | Sign in or sign up. Redirects authenticated users to their landing surface |
| `/leaves` | Employee | Personal request list, status filters, balance panel |
| `/leaves` | Admin | Pending-approvals view defaulting to `Pending` filter |
| `/leaves/new` | Employee | Submit a request (admins are redirected away — they're approvers, not requesters) |
| `/leaves/[id]` | Both | Detail view; admins see Approve / Reject + decision history |
| `/admin` | Admin | Team dashboard — directory, balances, role toggling, allocation editor |

---

## Architecture notes

- **Server-first**: every page is a React Server Component; mutations flow through Server Actions. No API routes beyond the Better Auth catch-all.
- **Single source of truth for defaults**: sick / casual / vacation defaults live in [`app/lib/leaves-shared.ts`](app/lib/leaves-shared.ts) and are reused by the signup hook, the bulk safety-net upsert, and the panel input fallbacks.
- **Transactional approvals**: [`approveLeave`](app/lib/leaves-repo.ts) runs a `SELECT ... FOR UPDATE` on the request row, deducts from `leave_balances`, and commits or rolls back as a unit.
- **Defensive seeding**: even if the Better Auth signup hook ever silently fails, `getBalances` and `listEmployeesWithBalances` upsert missing rows before reading, so the UI never shows "Not configured".
- **SSL hardening**: [`app/lib/db.ts`](app/lib/db.ts) parses `DATABASE_URL`, drops the deprecated `sslmode` parameter, and explicitly sets `ssl: { rejectUnauthorized: true }` on the `pg.Pool`.

---

## Deployment

Optimised for [Vercel](https://vercel.com/):

1. Push the repo to GitHub.
2. Import into Vercel — framework auto-detected as Next.js.
3. Set the environment variables from step 2 of [Getting started](#2-environment-variables). Use your production deployment URL for `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL`.
4. Run `node scripts/migrate-leaves.mjs` once against the production database (locally with the prod `DATABASE_URL`, or via a one-off Vercel script).
5. Promote your first admin with `scripts/promote-admin.mjs`.

`VERCEL_URL` is auto-injected; the Better Auth instance already adds it to `trustedOrigins`.

---

## Roadmap

Not yet shipped, intentionally parked for follow-up:

- `/admin/settings` page (defaults editor, audit log, holiday calendar, leave cycle config, bulk allocation tools)
- Holiday- and weekend-aware day counting (currently every calendar day in the range counts)
- Email notifications on submit / decision
- Audit log of role changes and allocation edits

---


