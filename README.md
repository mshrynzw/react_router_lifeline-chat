# Calming Web Chat Interface

A single-page **chat UI** focused on a calm, supportive feel: soft visuals, a glass-style layout, and a lightweight demo conversation flow. The interface is based on a Figma design (see [Design source](#design-source)).

This repository is a **front-end prototype**. Messages are stored in React state; outgoing replies are **simulated** with canned text—there is no real counselor, AI backend, or persistence.

---

## Features

- **Chat thread** with user / peer bubbles, timestamps, and auto-scroll to the latest message
- **Demo seed messages** (Japanese) so the screen is meaningful on first load
- **Simulated responses** after you send a message (short delay, random English phrases)
- **Ambient background** (`MeditationParticles`) for a meditative atmosphere
- **Optional consultation mode** (`ai` vs `person`) exists in code; the selector UI is currently commented out in `App.tsx`
- **Static prerender** of the root HTML for faster first paint and hydration (see [Build & deploy](#build--deploy))

---

## Tech stack

| Area        | Choice |
| ----------- | ------ |
| Runtime UI  | React 18 |
| Bundler     | Vite 6 |
| Styling     | Tailwind CSS 4 |
| Components  | Radix UI primitives, MUI icons, Emotion (among others in the bundle) |
| Motion / 3D | Motion, Three.js (e.g. background effects) |

`react-router` is included in dependencies for future client-side routing; the current app is a **single view** without configured routes.

---

## Prerequisites

- **Node.js** (LTS recommended)
- **pnpm** is used in deployment scripts (`build:ssg`, `deploy`). You can use `npm` or `yarn` for local `dev` / `build` / `preview` if you prefer.

---

## Getting started

Install dependencies:

```bash
pnpm install
# or: npm install
```

Start the development server (with HMR):

```bash
pnpm dev
# or: npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

---

## Scripts

| Script | Description |
| ------ | ----------- |
| `dev` | Vite dev server |
| `build` | Production build to `dist/` |
| `preview` | Serve the production build locally |
| `prerender` | After `build`, inject server-rendered HTML for `<div id="root">` (see `scripts/prerender-index.tsx`) |
| `build:ssg` | `build` then `prerender` |
| `deploy` | `build:ssg` then deploy `dist` with Wrangler (Cloudflare Pages) |

For a static HTML shell with hydrated React, run `pnpm build` then `pnpm prerender`. `src/main.tsx` uses `hydrateRoot` when `#root` already has markup.

---

## Project layout (high level)

```
src/
  app/
    App.tsx              # Chat state, demo data, send / reply simulation
    components/          # Header, ChatMessage, MessageInput, MeditationParticles, …
  styles/                # Global CSS (e.g. liquid-glass, fonts)
  main.tsx               # createRoot / hydrateRoot entry
scripts/
  prerender-index.tsx    # Post-build prerender into dist/index.html
```

---

## Design source

Original layout and visual direction: [Calming Web Chat Interface (Figma)](https://www.figma.com/design/tdJ6GmJfmdQEuxvgGQFhZ7/Calming-Web-Chat-Interface).

---

## Disclaimer

This project is **not** medical or mental-health advice and **not** a substitute for professional support. It is a UI and interaction demo only.

---

## License

This project is private (`"private": true` in `package.json`). Add a license file if you intend to distribute or open-source it.
