# Coffee Log

A personal PWA for logging the coffees I try: snap a photo of the bag, let a vision LLM pre-fill the details (roaster, origin, process, roast), confirm, and review. Built to use daily on my iPhone, and as a portfolio project.

> 🚧 Work in progress. See [PLAN.md](PLAN.md) for the full technical plan (in Spanish).

## Stack

- **Frontend:** Vite + React + TypeScript, Tailwind CSS, installable PWA (`vite-plugin-pwa`)
- **Backend:** Supabase (Postgres with RLS, Storage, Auth, Edge Functions)
- **Hosting:** Vercel
- **Monorepo:** pnpm workspaces (Node 22: `engines` in `package.json` + `.nvmrc`)

## Getting started

Requirements: Node ≥ 20, pnpm 9, Docker Desktop (for the local Supabase stack).

```bash
pnpm install
pnpm db:start                         # local Postgres/Auth/Storage in Docker
cp apps/web/.env.example apps/web/.env.local   # fill in the publishable key printed by db:start
pnpm dev
```

Testing on a phone: use the Vercel preview deployment (HTTPS is required for the camera and the service worker).
