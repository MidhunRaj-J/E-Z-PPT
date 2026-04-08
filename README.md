# E-Z-PPT

Build polished, image-rich PowerPoint decks from a single prompt in minutes.

E-Z-PPT is a Next.js app that turns plain language into a structured slide deck, gives you an in-browser preview, and exports a ready-to-share `.pptx` file.

If this project saves you time, please star the repo.

## Why E-Z-PPT

- Fast workflow: prompt -> preview -> export.
- Better visuals by default: each slide can be enriched with Unsplash stock images.
- Flexible AI backend: choose Gemini or Sarvam.
- Safer output: schema validation and normalization reduce malformed model responses.
- Single source of truth: preview and export use the same slide data model.

## Core Features

- Prompt-driven deck generation (business-focused structure)
- Tone presets: Professional, Creative, Minimalist
- Provider switch: Gemini or Sarvam
- Automatic image enrichment via Unsplash (`imageQuery` -> `imageUrl`)
- Slide normalization and repair for common LLM output issues
- Live slide preview UI before download
- Premium `.pptx` export using `pptxgenjs`

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create your local environment file.

```bash
copy .env.example .env.local
```

3. Add API keys to `.env.local`.

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_MODEL=sarvam-m
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions

UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

4. Start the app.

```bash
npm run dev
```

5. Open http://localhost:3000

## How It Works

1. Frontend sends prompt, tone, and provider.
2. API calls the selected model provider and requests strict JSON.
3. Server normalizes and repairs model output (layout/title/slide-count fallbacks).
4. Server optionally enriches slides with Unsplash image URLs.
5. Response is validated with Zod.
6. UI renders previews and the exporter builds a matching `.pptx`.

## Project Structure

- `src/app/page.tsx`: main UI and generation controls
- `src/app/api/generate/route.ts`: generation pipeline and provider integration
- `src/lib/slide-schema.ts`: Zod schemas and validation rules
- `src/lib/pptx.ts`: PowerPoint rendering and file export
- `src/components/slide-preview.tsx`: slide preview renderer
- `src/types/slides.ts`: shared slide and deck types

## Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: run ESLint

## Environment Notes

- Missing provider key (`GEMINI_API_KEY` or `SARVAM_API_KEY`) will fail generation for that provider.
- Missing `UNSPLASH_ACCESS_KEY` will not block generation; slides are returned without stock image enrichment.

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Run `npm run lint`
5. Open a pull request with before/after context

## Roadmap Ideas

- Multiple visual themes per tone
- Slide templates by use case (pitch, report, training, webinar)
- Team sharing and version history
- Speaker-note quality scoring
- One-click PDF export
