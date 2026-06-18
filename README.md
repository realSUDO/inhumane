# Inhumane

Today's market of AI tools are just chatbots wrapped in a slightly different UI. We got tired of it. 
Inhumane is a minimal, highly-aesthetic workspace that actually does things. It connects directly to your Gmail and Calendar, letting you read emails, draft inline replies, and manage your schedule without leaving the canvas.

No endless chat bubbles. No clutter. Just raw signal.

[Demo video ](https://drive.google.com/drive/folders/18ZFsp3YwXx9KjVyEAVCweoXQ7ZbssiSL?usp=sharing)
<br>
[Live Link ](https://inhumane.in)

<h2 align="center">Screenshots</h2>

<p align="center">
  <img src="https://github.com/user-attachments/assets/bd9f9770-0712-4137-957a-a80c2837c667" width="45%" />
  <img src="https://github.com/user-attachments/assets/ccbda497-a0bf-4568-b54b-465cdaca6e16" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/d0f4ba93-4530-4548-b6f1-d155ca4049a0" width="45%" />
  <img src="https://github.com/user-attachments/assets/7f1f1f73-ad30-497a-a3e2-4f7124cd8c0e" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/b7d14099-d39c-4472-b470-1ac3eceee0ae" width="45%" />
  <img src="https://github.com/user-attachments/assets/485491fc-59ea-49d0-998e-e617878e8147" width="45%" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/5c2d5b86-5ae4-4a80-a30f-c55592a133d9" width="45%" />
  <img src="https://github.com/user-attachments/assets/0b41f07b-04b7-46ba-8c72-be5fd896f2b7" width="45%" />
</p>

---

## Features

- **Full Gmail Client** — Read, archive, trash, star, mark read/unread. Expandable inbox with sidebar labels (Inbox/Sent/Starred/Trash/Spam). Click any email to read the full body with clickable links. Infinite scroll pagination.
- **Full Google Calendar** — Week view with drag-to-create events. Click to edit, right-click to change color. Real-time sync with your actual Google Calendar.
- **Agentic Sequential Workflows** — Say "schedule a meeting with X and send them a follow-up email" and it executes both actions in sequence, one after the other, with inline confirmation cards.
- **Trust Mode (`/trust`)** — Type `/trust` to enable auto-execution. The AI skips confirmation cards and directly sends emails / creates events without asking. Shown as a capsule in the input bar. Toggle off anytime.
- **Two-Model AI Cascade** — Groq (llama-3.3-70b) for instant intent routing (~200ms), GPT-4.1-mini for writing and tool execution. Fast where it matters, smart where it counts.
- **Guardrails** — Prompt injection detection built into the router. Off-topic requests (coding, math, trivia) are politely deflected. The AI stays scoped to its job.
- **Atmospheric Tints** — Not just light/dark. Pick an accent color and the entire workspace shifts — background gradient, sidebar glass, message accents all respond.
- **Glassmorphism + Noise** — Frosted sidebar with `blur(50px) saturate(1.6)`, ambient gradient orbs, SVG noise texture overlay. Depth without distraction.
- **Inline Message Actions** — Hover any message: user messages get Edit (inline) + Copy, AI messages get Regenerate + Copy.
- **Collapsible Sidebar** — Toggle with chevron. Thread list with date grouping, right-click context menu (rename/pin/archive/delete) that never overflows the viewport.
- **Persistent Action State** — Close a chat, reopen it — completed actions still show as "Sent" / "Scheduled". Derived from conversation history, no extra DB calls.
- **Optimistic UI** — Every action (trash, archive, star, calendar create/delete/color) updates the UI instantly. API calls fire in the background.
- **Valkey (Redis) Caching** — Emails (2min), calendar events (1min), threads (5min), messages (5min). Cache invalidation on mutations. Graceful fallback if Redis is down.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                     │
│  useChat → DefaultChatTransport → /api/chat                  │
│  Gmail Inbox (expand) │ Calendar (week view) │ Compose cards  │
└────────────────────────────────┬────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│                     API (Express)                             │
│                                                              │
│  POST /api/chat ─── Router (Groq 70b) ──┬── Fast reply      │
│                                          ├── Writer (GPT-4.1)│
│                                          └── Tools (MCP)     │
│                                                              │
│  GET/POST /api/emails ──── Corsair Gmail Plugin              │
│  GET/POST /api/calendar ── Corsair Google Calendar Plugin    │
│  GET/POST /api/threads ─── PostgreSQL                        │
│                                                              │
│  Valkey ◄──── Cache layer (emails, events, threads, msgs)   │
└────────────────────────────────┬────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────┐
│  Corsair (Self-hosted) ─── OAuth2 ─── Gmail API / GCal API   │
│  PostgreSQL ─── Threads, Messages, Auth, Corsair state       │
│  Valkey ─── TTL-based caching with pattern invalidation      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TailwindCSS 4, AI SDK v5 |
| Backend | Express, TypeScript, tsup |
| AI | Groq (llama-3.3-70b), GPT-4.1-mini via aicredits.in |
| Integrations | Corsair (self-hosted), Gmail API, Google Calendar API |
| Auth | Better Auth with Google OAuth |
| Database | PostgreSQL 15 |
| Cache | Valkey (Redis-compatible) 8 |
| Infra | Docker, Caddy (auto-SSL), GitHub Actions CI/CD, DigitalOcean |

## Getting Started

```bash
# Clone
git clone https://github.com/your-org/inhumane.git && cd inhumane

# Install
pnpm install

# Setup environment
cp .env.example .env
# Fill in: DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, BETTER_AUTH_SECRET,
#          LLM_API_KEY, GROQ_API_KEY, CORSAIR_KEK

# Run (needs PostgreSQL + Valkey running)
pnpm dev
```

For production deployment, push to `main` — GitHub Actions builds Docker images, pushes to GHCR, and deploys to the VM via SSH.

## The AI Pipeline

```
User message
    │
    ▼
┌─ Router (Groq, ~200ms) ─────────────────────────────┐
│  Classifies: intents[], sufficient, safe, emails[]   │
└──────────┬───────────────────────────────────────────┘
           │
     ┌─────┼─────────────────┐
     ▼     ▼                 ▼
  GREETING  SEND_EMAIL     READ_EMAIL
  ABOUT     CALENDAR_CREATE CALENDAR_READ
  GENERAL                    │
     │         │             ▼
     ▼         ▼         Writer + MCP Tools
  Fast Model  Writer     (run_script → Corsair)
  (deflects   (outputs
  off-topic)  action blocks)
              │
              ▼
        ┌─────────────┐
        │ Trust mode?  │
        ├── Yes: execute directly via tools
        └── No: render inline card (Send/Schedule button)
              │
              ▼ (on user confirm)
        [System] Action completed → next task
```

## Why "Inhumane"?

Because the current standard of "humane" AI design is polite, verbose, and visually unremarkable. We wanted something that felt like a sharp tool for professionals, not a toy.
