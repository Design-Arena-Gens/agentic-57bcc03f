# Agentic LinkedIn Post Generator

Generate LinkedIn-ready copy and branded visuals from a single brief. Provide a topic, target audience, desired outcome, and optional logo — the app crafts messaging and an accompanying 1080×1080 canvas you can download instantly.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to use the generator.

## Features

- AI-inspired post composition with tailored hooks, talking points, and hashtags
- Palette-aware visual builder with gradients, accented typography, and hashtag footer
- Optional logo upload rendered into the generated asset
- Downloadable PNG output sized for LinkedIn feeds

## Configuration

The generator ships fully client-ready and does not require external API keys. Modify the prompt logic inside `app/api/generate/route.ts` to change tone, structure, or palettes.

## Deployment

Build for production with `npm run build` then `npm start`, or deploy directly to Vercel:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-57bcc03f
```

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Canvas-based rendering for image output
