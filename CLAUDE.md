# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Swappanini** (swap26.com) — a mobile-first webapp for trading Panini FIFA World Cup 2026 stickers. Users list their doubles and wishes, then get matched with collectors worldwide for in-person or mail swaps.

Currently: a static landing page (`index.html`) with a Brevo waitlist form. The full app is in design phase — see `TECHSPEC.md` for the complete technical specification.

## Planned Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Supabase** (Postgres, Auth, Storage, Realtime)
- **Tailwind CSS** (mobile-first, no component libraries)
- **next-intl** for i18n (EN/FR/ES/DE)
- **Resend** for transactional emails
- **Vercel** for hosting

## Development Commands (once Next.js app is initialized)

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Architecture

The planned file structure (from TECHSPEC.md §4):

- `app/[locale]/` — all routes under locale prefix
- `app/[locale]/(auth)/` — login/register (public)
- `app/[locale]/(app)/` — protected routes with bottom nav (home, collection, wants, playground, inbox)
- `components/stickers/`, `components/matches/`, `components/inbox/`, `components/layout/`
- `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server + cookies)
- `lib/matching.ts` — SQL matching algorithm via Supabase RPC `get_matches`
- `hooks/` — `useUserStickers`, `useMatches`, `useSwaps`
- `messages/` — i18n JSON files (en/fr/es/de)
- `supabase/migrations/001_init.sql` — full schema
- `supabase/seed_stickers.ts` — imports 980 stickers from `panini_stickers_enriched.xlsx`
- `supabase/seed_user_collection.ts` — one-shot import of founder's personal collection

## Key Constraints

**i18n is mandatory from day one.** Zero hardcoded UI strings — every piece of text goes through `useTranslations()`. When creating any component, provide the translation key in both `en.json` and `fr.json` at the same time.

**Color palette:** dark green `#1B3B1A` + lime `#AAFF00` (for the app — the landing page uses `#00C241` green).

**Sticker quantity logic:**
- No row = sticker missing (implicitly wanted)
- `quantity = 1` = owned, not available for swap
- `quantity >= 2` = owned with spare(s) available for swap

**Seed data note:** `panini_stickers_enriched.xlsx` contains a "Possédé?" column representing the founder's personal collection — this column must NOT be imported into the `stickers` catalogue table. Use `seed_user_collection.ts` to import it separately.

**Matching algorithm** runs as a Supabase RPC function `get_matches(me uuid)` — see TECHSPEC.md §6 for the full SQL. Match score = `i_give_count + i_get_count + priority_match_count * 2`.

**Swap state machine:** `pending → accepted → initiator_sent / receiver_sent → completed` (or `refused` / `cancelled`). See TECHSPEC.md §12 for full transitions.
