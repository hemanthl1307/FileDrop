# FileDrop

Share files with a 4-digit code. Pick your files, get a code, share it —
anyone with the code collects the files directly from your device. No
accounts, no uploads to a server.

## How the flow works

**Sending**
1. Click **Generate room code** — you get a 4-digit code and a QR code instantly.
2. Add your files (drag and drop, or browse). Multiple files supported.
3. Share the code, the link, or the QR.

**Receiving**
1. Switch to **Receive**, type the 4 digits (or scan the QR / open the link).
2. The files appear and transfer automatically.
3. Click **Download** on each one.

Many people can collect the same files with the same code — the sender's
room serves everyone who joins.

**One rule:** the sender keeps their tab open until everyone has collected
the files. The files live on the sender's device and stream directly to each
receiver, so closing the tab ends the room. The app warns before you close it.

## Do I need a database?

**No — and this version deliberately doesn't use one.**

Files never touch a server. Two browsers use [PeerJS](https://peerjs.com)'s
free public broker only to exchange connection details (a WebRTC handshake),
then the file streams device-to-device over an encrypted data channel.
Nothing to provision, nothing to pay for, nothing stored anywhere.

The tradeoff is the tab rule above. If you ever need the sender to be able
to close their tab and have receivers collect hours later, that genuinely
does require file storage — Supabase Storage, Cloudflare R2, S3, or
UploadThing would each work. Be aware that changes the product meaningfully:
free tiers cap out well below the multi-GB transfers this handles today,
you take on storage costs as usage grows, and files would then sit on a
server rather than staying private between two devices.

## Why it handles 200+ concurrent users

Each pair of devices opens its own independent connection, so load never
concentrates on your deployment. Vercel is only serving a static page —
roughly 103 kB. Your traffic ceiling is effectively Vercel's free-tier
bandwidth for that page, not anything to do with file size or user count.

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo, click
   **Deploy** — detected as Next.js automatically, no configuration, no
   environment variables.

Or from the CLI:

```bash
npm i -g vercel
vercel --prod
```

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- 4-digit numeric room codes, easy to read aloud or type on a phone
- QR code that opens the app and joins the room automatically
- Multiple files per room
- Optional auto-delete timer (5 min / 15 min / 1 hour) or no timer at all
- Light mode in white and black, dark mode in blue
- No login, no signup, no database
- 64KB chunked transfer with backpressure, so large files don't stall the browser

## Optional: your own signaling server

The free public PeerJS broker is fine for normal use. For guaranteed
uptime and rate limits independent of it, run your own
[PeerServer](https://github.com/peers/peerjs-server) — it needs a small
always-on host (Render, Fly.io, a VPS), since Vercel's serverless functions
can't hold a persistent WebSocket open. Point the app at it by passing
`host` / `port` / `path` options to `new Peer(...)` in
`lib/useFileDropLink.js`.

## Tech

Next.js 14 (App Router) · JavaScript · Tailwind CSS · PeerJS (WebRTC) · qrcode
