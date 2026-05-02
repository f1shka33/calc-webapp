# Casino Wallet Sandbox

A demo-only, sandbox crypto-wallet & casino simulator. **Not a real wallet, not a real exchange, no real money is ever involved.** All coins, balances, addresses, and transaction hashes are fake. Every screen is clearly labeled as a sandbox.

> created by **welv_bot**

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** for styling (dark luxury, Apple-style typography, orange/red accents)
- **Zustand** + `persist` middleware → localStorage for all sandbox state
- **Framer Motion** for animations
- **Recharts** for the balance activity graph
- **Sonner** for toasts
- **Lucide** for icons

No backend, no real network calls. Everything runs in your browser.

## Pages

- `/` — Dashboard (balance hero, quick actions, coin cards, recent transactions, win/loss stats)
- `/wallet` — Coin list, deposit / send / convert (all demo)
- `/transactions` — Filterable history with fake tx hashes
- `/games` — Game hub
- `/games/roulette` — European roulette
- `/games/crash` — Crash multiplier game
- `/games/mines` — Mines grid game
- `/profile` — User profile & game stats
- `/settings` — Theme, currency display, animations, reset sandbox
- `/admin` — Mock admin panel (login: `admin` / `admin`)
- `/login` — Mock login (any username works, password is ignored)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To build a production bundle:

```bash
npm run build
npm start
```

To lint & typecheck:

```bash
npm run lint
npm run typecheck
```

## Sandbox / safety notes

- No real cryptocurrency brand names, no real blockchain networks, no real exchange logos.
- Coin tickers (`WLV`, `ORX`, `NEB`, `ZIO`, `LUX`, `KRY`) are entirely fictional.
- Wallet addresses and transaction hashes are randomly generated and are clearly tagged `fake`.
- The "Demo / Sandbox" badge appears on every screen that shows balance, transactions, deposits, sends, or game results.
- The admin panel can wipe and regenerate sandbox data at will.
