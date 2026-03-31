# sitecue

> The simplest context-aware notepad for your browser. Free your mind from the burden of note management.

Are you tired of organizing folders, tagging, and managing notes across different apps? **sitecue** is a minimalist Chrome Extension designed to liberate you from note management.

Our core philosophy is simple: **The notes you need should already be exactly where you are.**

Leave your distilled thoughts, to-dos, or AI-generated summaries anchored directly to specific URLs. When you revisit a page, your notes silently appear. Experience the feeling of being truly lightweight on the web.

## 💡 Philosophy

- **Zero Management:** No folders, no tags, no search required. Your notes are inherently tied to the URL itself.
- **No Clutter:** We intentionally excluded features like web clipping or text highlighting.
- **Context-Aware:** Notes automatically appear and hide based on your current active tab.
- **Markdown Support:** Simple and clean text rendering.

## 🛠 Tech Stack

This project is a monorepo managed with Turborepo, containing the extension, a web dashboard, and an API.

- **Extension:** React, Vite, Tailwind CSS
- **Web Dashboard:** Next.js (App Router), OpenNext, Cloudflare Workers
- **API:** Cloudflare Workers, Hono
- **Database & Auth:** Supabase (PostgreSQL with RLS)
- **Package Manager:** Bun

## 📁 Project Structure

| Directory         | Description                                                                      |
| :---------------- | :------------------------------------------------------------------------------- |
| `apps/extension/` | Chrome Extension built with Vite and React.                                      |
| `apps/app/`       | Web dashboard built with Next.js, optimized for Cloudflare Workers via OpenNext. |
| `apps/api/`       | Backend API built with Cloudflare Workers and Hono.                              |
| `supabase/`       | Database migrations, RLS policies, and tests.                                    |
| `docs/`           | Project documentation and AI-driven development context.                         |
| `.agent/`         | Strict rules and constraints for AI-driven development.                          |

## 🚀 Local Development

To run this project locally, you need [Bun](https://bun.sh/) and [Docker](https://www.docker.com/) (for Supabase CLI) installed.

### 1. Setup Environment Variables

Copy the example env files and fill in your keys:

```bash
cp apps/extension/.env.example apps/extension/.env.development
cp apps/app/.env.example apps/app/.env.local
cp apps/app/.env.example apps/app/.dev.vars # Required for Wrangler local preview
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

### 2. Start Local Database

Start the Supabase local instance:

```bash
bun run db:start
```

### 3. Start Development Servers

This command runs the extension, web, and API dev servers concurrently (using Turborepo):

```bash
bun install
bun run dev
```

### 4. Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `apps/extension/dist` directory.

## 🛡️ Security

All user data is protected by Row Level Security (RLS) policies at the database level, ensuring users can only access their own notes.

## 📄 License

MIT License
