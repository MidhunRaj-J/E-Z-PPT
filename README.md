# E-Z-PPT

<p align="center">
	<img src="public/ez-ppt-wordmark.svg" alt="E-Z-PPT" width="420" />
</p>

<p align="center">
	Turn one prompt into a polished, image-rich PowerPoint deck in minutes.
</p>

<p align="center">
	<a href="https://github.com/Midhunraj-J/E-Z-PPT/stargazers"><img src="https://img.shields.io/github/stars/Midhunraj-J/E-Z-PPT?style=for-the-badge" alt="GitHub stars" /></a>
	<img src="https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge" alt="Version" />
	<img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
	<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

E-Z-PPT is a Next.js app that generates a structured slide deck from plain language, lets you review each slide in the browser, and exports a ready-to-share `.pptx` file.

If this project saves you time, give it a star.

## Why This Exists

Creating decent decks is usually repetitive and slow: outline ideas, write copy, hunt visuals, format slides, then export. E-Z-PPT compresses that into one flow.

- Prompt once: describe your topic and intent.
- Preview instantly: review slide content before download.
- Export confidently: generate a polished `.pptx` from the same data model used in preview.

## Core Features

- Prompt-driven deck generation with business-friendly structure
- Tone presets: Professional, Creative, Minimalist
- AI provider switch: Gemini or Sarvam
- Automatic image enrichment from Unsplash (`imageQuery` -> `imageUrl`)
- Schema-driven output validation and normalization (Zod)
- Live slide preview before export
- High-quality PowerPoint export via `pptxgenjs`

## Quick Start (Under 60 Seconds)

1. Install dependencies.

```bash
npm install
```

2. Create your local env file.

```bash
copy .env.example .env.local
```

3. Add your API keys to `.env.local`.

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_MODEL=sarvam-m
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions

UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

4. Run the app.

```bash
npm run dev
```

5. Open http://localhost:3000

## How It Works

1. UI sends `prompt + tone + provider` to the generation API.
2. API requests strict JSON from the selected model provider.
3. Server repairs common LLM issues (missing layout/title/slide counts).
4. Server enriches slides with optional Unsplash image URLs.
5. Response is validated with Zod and returned to the client.
6. Preview and `.pptx` export both use the same normalized slide model.

## Project Structure

- `src/app/page.tsx`: app UI and generation controls
- `src/app/api/generate/route.ts`: generation pipeline and provider integration
- `src/lib/slide-schema.ts`: Zod schemas and validation
- `src/lib/pptx.ts`: `.pptx` rendering logic
- `src/components/slide-preview.tsx`: slide preview renderer
- `src/types/slides.ts`: shared deck/slide types

## Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: run ESLint

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commits
4. Run `npm run lint`
5. Open a PR with before/after context

When creating issues, label beginner-friendly tasks with `good first issue`.


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
