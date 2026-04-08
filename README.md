# E-Z-PPT

E-Z-PPT turns a text prompt into a structured presentation workflow:

1. The browser sends a topic and tone to the API.
2. The API asks the selected AI provider (Gemini or Sarvam) for strict JSON slide data.
3. The API maps each slide to a stock-photo search term and fetches matching Unsplash images.
4. The UI renders the enriched JSON as slide previews with visual backgrounds.
4. PptxGenJS converts the same JSON into a downloadable `.pptx` file.

## Features

- Prompt-driven presentation generation
- Tone selector: Professional, Creative, Minimalist
- Provider selector: Gemini or Sarvam
- Unsplash stock image enrichment per slide using `imageQuery`
- JSON validation with Zod before rendering
- Live slide preview in the browser
- PowerPoint export with `pptxgenjs`
- Secure server-side API key usage through a Next.js route

## Tech Stack

- Next.js 16 with the App Router
- React 19
- Tailwind CSS 4
- Gemini API and Sarvam API
- Unsplash API
- `pptxgenjs`
- `lucide-react`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local environment file:

```bash
copy .env.example .env.local
```

3. Add your provider API keys to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_MODEL=sarvam-m
# Optional: override if needed
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions
UNSPLASH_ACCESS_KEY=your_unsplash_access_key_here
```

4. Start the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## How It Works

The app keeps a single slide schema in [src/types/slides.ts](src/types/slides.ts) and [src/lib/slide-schema.ts](src/lib/slide-schema.ts). The preview UI and PPTX export both read from that same structure, which keeps the browser rendering and the generated deck aligned.

The generation endpoint lives in [src/app/api/generate/route.ts](src/app/api/generate/route.ts). It sends the prompt to the selected provider, normalizes slide fields, enriches slides with Unsplash image URLs when `UNSPLASH_ACCESS_KEY` is present, then validates JSON before returning it to the client.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - run the production server
- `npm run lint` - run ESLint

## Notes

- If the selected provider key is missing (for example `GEMINI_API_KEY` or `SARVAM_API_KEY`), the generation endpoint returns a server-side error.
- If `UNSPLASH_ACCESS_KEY` is not set, generation still works and simply skips stock-image enrichment.
- `pptxgenjs` uses the same slide JSON, so edits to the schema should stay consistent across preview and export.
