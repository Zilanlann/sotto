# Sotto

> Share secrets *sotto voce* — end-to-end encrypted, self-expiring paste sharing.

Sotto is a zero-knowledge pastebin built with React, HeroUI, Vite, and Cloudflare Workers. The browser encrypts paste content before upload; the server only ever sees ciphertext. Decryption keys live in the URL hash fragment, which browsers never send to the server — so even the operator of a Sotto deployment cannot read your pastes.

The name comes from the Italian *sotto voce*: spoken softly, meant only for the intended listener.

## Features

- **End-to-end encryption** — AES-256-GCM encryption happens entirely in the browser via the Web Crypto API.
- **Zero-knowledge backend** — the Worker stores only ciphertext, metadata, and expiration policy in Cloudflare KV.
- **Self-expiring pastes** — TTL from minutes up to 30 days, enforced on both client and Worker.
- **Burn after reading** — one-time pastes are destroyed server-side after the first successful read.
- **Optional password protection** — PBKDF2 derives the AES-GCM key from a password plus a URL secret, so the link alone is not enough.
- **Bilingual UI** — Chinese and English, with dark/light themes and no-flash preference persistence.
- **Markdown rendering** — sanitized with DOMPurify before display.

## Security Model

- Plaintext is never sent to the Worker.
- Decryption keys stay in the URL hash fragment (`#k=...` / `#s=...`) and are not stored by the backend.
- Paste payloads are capped at 256 KB.
- Paste TTL is capped at 30 days on both client and Worker.
- Production builds require the Worker API to be available; the localStorage fallback is enabled only during Vite development.
- Static and API responses include no-store API caching and security headers: CSP, frame blocking, referrer blocking, and nosniff.
- External font loading is avoided so the deployed app can run under a same-origin CSP.

**Out of scope:** Sotto cannot protect you if the link (including its hash fragment) leaks through your own channels — chat logs, browser history, or shoulder surfing. Treat the share link itself as the secret.

## Tech Stack

| Layer | Technology |
| --- | --- |
| UI | React 19, HeroUI v3, Tailwind CSS v4, lucide-react |
| Crypto | Web Crypto API (AES-256-GCM, PBKDF2) |
| Markdown | marked + DOMPurify |
| Build | Vite, TypeScript |
| Backend | Cloudflare Workers + KV, static assets served by the Worker |

## Getting Started

```bash
npm ci            # install dependencies
npm run dev       # Vite dev server with localStorage fallback (no Worker needed)
npm run typecheck # type-check the project
npm run build     # production build into dist/
npm run worker:dev# build, then run the full app on a local Worker
npm run deploy    # build, then deploy to Cloudflare
```

## Cloudflare Setup

Create the KV namespace in the Cloudflare account that will deploy the Worker:

```bash
npx wrangler kv namespace create PASTES
```

Copy the returned namespace id into `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "id": "your-production-kv-namespace-id",
    "binding": "PASTES"
  }
]
```

Then deploy:

```bash
npm run deploy
```

## Runtime Architecture

- `/` renders the create flow.
- `/p/:id#k=...` opens a paste encrypted with a random AES-GCM key.
- `/p/:id#s=...` opens a password-protected paste where PBKDF2 derives the AES-GCM key from the password and URL secret.
- `POST /api/pastes` stores validated ciphertext.
- `GET /api/pastes/:id` returns ciphertext and metadata unless the paste is missing or already expired.
- `POST /api/pastes/:id/destroy` clears ciphertext for burn-after-reading pastes.

## Project Structure

```
├── index.html          # app shell; applies saved theme/locale before paint
├── src/
│   ├── App.tsx         # UI, client-side crypto, API client, i18n copy
│   ├── main.tsx        # React entry point
│   ├── worker.ts       # Cloudflare Worker: API routes, KV storage, security headers
│   └── styles.css      # Tailwind + HeroUI styles
├── wrangler.jsonc      # Worker config (name, KV binding, static assets)
└── vite.config.ts      # Vite build config
```

## Operational Checklist

- Replace the placeholder KV namespace id in `wrangler.jsonc` before deployment.
- Enable Cloudflare dashboard rate limiting for `POST /api/pastes` and `POST /api/pastes/*/destroy`.
- Review Worker observability after deployment for 4xx and 5xx spikes.
- Use a dedicated custom domain and keep Cloudflare TLS mode on Full or stricter.
- Run `npm run typecheck` and `npm run build` before every deploy.
