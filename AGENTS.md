# SongBird — AGENTS.md

## Project

Sistema de registro de vendas (sales registration system). Portuguese-only (UI, code, comments).

Single-page app (`public/index.html`) no build step, talking to Supabase. Hosted on GitHub Pages.

**Leads scraper** was separated into its own project at `C:\Users\Felipe\SongBird-Leads` — see its own `AGENTS.md`.

## Supabase setup

1. Create a Supabase project, run `supabase-schema.sql` in SQL Editor.
2. Copy `.env.example` to `.env` locally (for `migrate-supabase.js`).
3. **Critical**: In `public/index.html:609-610`, replace the placeholder credentials with real Supabase URL and anon key.

## Commands

| Command | Purpose |
|---------|---------|
| `node migrate-supabase.js` | Migrate from legacy SQLite `dados.db` to Supabase (requires `npm install @supabase/supabase-js sql.js`) |

## Password

- SHA-256, **not bcrypt**. Both client-side login (`public/index.html:613-616`) and server-side migration use it.
- `migrate-supabase.js` reads `dados.db` (SQLite), SHA-256 hashes passwords, upserts to Supabase, then renames `dados.db` → `dados.db.bak`.

## Deployment

- **GitHub Pages** via `gh-pages` branch.
- `main` branch has all source files.
- `gh-pages` branch has `index.html` (from `public/`) at root with real Supabase credentials.
- The frontend is static HTML/JS — no server, no env injection. Credentials are hardcoded in the file.

## Important gotchas

- `public/index.html:609-610` has hardcoded Supabase credentials that must be replaced with real ones before the app works.
- `DESIGN.md` is for the OpenCode marketing site design system, unrelated to this project.
- `migrate-supabase.js` is a one-shot script for migrating legacy SQLite data.
