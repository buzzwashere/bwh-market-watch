# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

`bwh-market-watch`: a Vue 3 + TypeScript dashboard of the major stock, bond, and crypto benchmarks.

## Tech stack

- Vue 3.5 (`<script setup>`), Vue Router, Pinia, TypeScript strict (no `any`)
- Vite 8, Tailwind CSS v4 (CSS-first, tokens in `src/style.css`)
- Vercel function at `api/quotes.ts`; ESLint flat + oxlint + Prettier

## Commands

| Task       | Command              |
| ---------- | -------------------- |
| Dev server | `npm run dev` (9010) |
| Build      | `npm run build`      |
| Lint       | `npm run lint`       |
| Format     | `npm run format`     |

## Layout

- `api/_market-core.ts`: instrument catalog, upstream fetches, 60s cache. Leading `_` keeps it from
  becoming a Vercel route.
- `api/quotes.ts`: handler. `vite.config.ts` serves the same handler in dev through `devApi()`.
- `api/history.ts`: per-instrument chart data (`?id=&timeframe=1w|30d|1y`), also from the core module.
- `shared/market.ts`: types shared by the function and the client. Types only, so `api/` has no
  runtime dependency outside its own folder.
- `src/stores/market.ts`: quotes, polling, per-card fallback to the last good value.
- `src/stores/history.ts`: each card's timeframe and its loaded chart data.
- `src/stores/theme.ts`: light/dark choice, saved in localStorage. Dark is the default whatever the
  system theme is; `src/style.css` holds both token sets.
- `src/components/QuoteTrend.vue`: sparkline, hover readout, and timeframe control for one card.
- `src/views`: routed into `App.vue` between `AppBar` and `AppFooter`.

## Conventions

- Relative imports inside `api/` need a `.js` extension: Vercel runs them as native ESM.
- Add an instrument by adding it to the catalog in `api/_market-core.ts`.
- Yahoo's chart endpoint is unofficial and CoinGecko's public tier is rate limited, so all upstream
  calls stay server-side behind the cache.
- Current crypto quotes come from CoinGecko, but all chart history comes from Yahoo. The total market
  cap card charts BITW because that history is paid-only; the card labels the stand-in.
