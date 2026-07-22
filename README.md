# ScanSort — AI-Powered Organization Recommendations

A web app where users upload a photo of their space (closet, pantry, garage, etc.) and receive AI-powered analysis with 3–5 tailored product recommendations, complete with purchase links.

## Quick Start

```bash
cd /home/team/shared/site
bun install
bun run publish
```

The app serves on **port 3000**. Visit `http://localhost:3000` or the public URL.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | No | OpenAI API key for GPT-4o vision analysis. Set in `.env` or environment. |

If `OPENAI_API_KEY` is **not set**, the app falls back to realistic mock responses so you can demo the full flow without an API key.

### Setting the API key

Create a `.env` file in the site root:

```
OPENAI_API_KEY=sk-your-key-here
```

Or export it before running:

```bash
export OPENAI_API_KEY=sk-your-key-here
bun run publish
```

## Architecture

- **Frontend:** React + TypeScript + TailwindCSS (TanStack Start / Vite)
- **Backend:** TanStack Start server functions (RPC-style, same port)
- **AI:** OpenAI GPT-4o with vision (with mock fallback)

### Key Files

```
src/
  routes/
    __root.tsx          # HTML shell, page title
    index.tsx           # Landing page — upload UI + results display
  lib/
    analyze.ts          # Server function: image analysis + product recommendations
  styles/
    app.css             # Tailwind entrypoint
serve.ts                # Production server (Bun)
publish.sh              # Build + restart on port 3000
```

### Flow

1. User uploads an image (drag & drop or file picker)
2. Image is previewed; user clicks "Analyze My Space"
3. The client calls `analyzeSpace()` server function via TanStack RPC
4. Server function:
   - If `OPENAI_API_KEY` is set: sends image to GPT-4o with a structured prompt
   - If API call fails or key is unset: returns a realistic mock response after a short delay
5. Results are displayed: space type badge, observations, key challenges, and 3–5 product cards with Amazon search links

## Mock Responses

Three distinct mock scenarios are included (rotated randomly):
- **Reach-in Closet** — shoe rack, storage bins, velvet hangers, over-door organizer, LED light
- **Kitchen Pantry** — shelf risers, airtight containers, Lazy Susan, can rack
- **Home Office Desk** — cable tray, monitor stand, charging station, file organizer, desk pad

## Publishing

```bash
bun run publish    # Builds and restarts the server on port 3000
```

The publish script handles port takeover across users and waits for the server to respond.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) — React full-stack framework (SSR + RPC)
- [Vite](https://vitejs.dev) — build tool
- [TailwindCSS v4](https://tailwindcss.com) — utility-first CSS
- [Bun](https://bun.sh) — JavaScript runtime and package manager
