# E-Z-PPT

E-Z-PPT turns a text prompt into a structured presentation workflow:

1. The browser sends a topic and tone to the API.
2. The API asks Gemini for strict JSON slide data.
3. The UI renders that JSON as slide previews.
4. PptxGenJS converts the same JSON into a downloadable `.pptx` file.

## Features

- Prompt-driven presentation generation
- Tone selector: Professional, Creative, Minimalist
- JSON validation with Zod before rendering
- Live slide preview in the browser
- PowerPoint export with `pptxgenjs`
- Secure server-side API key usage through a Next.js route

## Tech Stack

- Next.js 16 with the App Router
- React 19
- Tailwind CSS 4
- Gemini API
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

3. Add your Gemini API key to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

4. Start the dev server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## How It Works

The app keeps a single slide schema in [src/types/slides.ts](src/types/slides.ts) and [src/lib/slide-schema.ts](src/lib/slide-schema.ts). The preview UI and PPTX export both read from that same structure, which keeps the browser rendering and the generated deck aligned.

The generation endpoint lives in [src/app/api/generate/route.ts](src/app/api/generate/route.ts). It asks Gemini for JSON, then validates the result before sending it back to the client.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - run the production server
- `npm run lint` - run ESLint

## Notes

- If you do not set `GEMINI_API_KEY`, the generation endpoint returns a server-side error.
- `pptxgenjs` uses the same slide JSON, so edits to the schema should stay consistent across preview and export.
