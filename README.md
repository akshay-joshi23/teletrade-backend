Video powered by LiveKit. Token auth stored server-side. Do not expose keys in client code.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## TeleTrade Core (MVP)

This repository contains the functional app for TeleTrade (separate from the Lovable marketing site). It includes:

- App Router pages for `/homeowner`, `/pro`, and `/room/[id]`
- Client-side navigation and minimal local UI state
- API routes for matchmaking, LiveKit token issuance, and outcome save/summary
- Tailwind-only UI primitives (`components/ui`)

Current scope:

- Anonymous sessions via `tt_session` cookie (middleware)
- In-memory pairing per trade using simple queues; poll endpoint to detect pairing
- LiveKit token issuance with participant labels (HO-xxxx/PRO-xxxx)
- Video room join via `/room/{roomId}`
- Outcome save (pro) and homeowner summary at `/summary/{roomId}`

Notes:

- Matchmaking and outcomes are in-memory only (non-persistent)
- For persistence, swap to Redis/DB in a future iteration

### Deploy checklist (Vercel)

1. Environment variables:
   - `LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `NEXT_PUBLIC_LIVEKIT_URL` (same LiveKit edge URL; required by the browser)
2. Local run:
   - `npm install`
   - `npm run dev`
3. Deploy:
   - Deploy this repo to Vercel
4. Connect marketing:
   - Update Lovable CTAs to `/homeowner` and `/pro`

Health check:
- Visit `/api/health` to verify envs at runtime. It returns commit info and boolean presence for `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `NEXT_PUBLIC_LIVEKIT_URL`.

### LiveKit setup (keys & local run)

1. Create a LiveKit Cloud project (or self-host).
2. Generate an API Key and Secret in the LiveKit console.
3. Create a `.env.local` file in this repo with:

```
LIVEKIT_URL=YOUR_LIVEKIT_WS_URL
LIVEKIT_API_KEY=YOUR_API_KEY
LIVEKIT_API_SECRET=YOUR_API_SECRET
```

4. Start the app: `npm run dev` and open `/room/test`. The app will request a token from `/api/livekit/token` and join the room.

Note: never commit real secrets. `.env.example` lists required variables.

### Post-call outcome (in-memory)

- Pro can save an outcome and optional notes during/after the call.
- Homeowner sees the summary at `/summary/{roomId}` after ending the call.
- Outcomes are stored in memory only and are not persisted.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
