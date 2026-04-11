import { NextResponse } from "next/server";
import { DeckResponseSchema, ProviderSchema, ToneSchema } from "@/lib/slide-schema";

type GeneratePayload = {
  prompt?: string;
  tone?: string;
  provider?: string;
  slideCount?: number;
};

function buildSystemPrompt(slideCount: number) {
  return `You are a world-class presentation architect, UI/UX designer, and visual storyteller.

Your job is to create premium, visually stunning slides that feel like Apple keynote + high-end startup pitch decks.

Return ONLY valid JSON in this exact shape:
{
  "slides": [
    {
      "layout": "TITLE | BULLETS | TWO_COLUMN | QUOTE | CLOSING",
      "title": "string",
      "subtitle": "string optional",
      "content": "string optional",
      "imageQuery": "string (2-5 words, cinematic, visually rich)",
      "bullets": ["string"] optional,
      "leftTitle": "string optional",
      "leftBullets": ["string"] optional,
      "rightTitle": "string optional",
      "rightBullets": ["string"] optional,
      "quote": "string optional",
      "quoteAuthor": "string optional",
      "speakerNotes": "string optional",

      "design": {
        "theme": "dark | light | gradient | neon",
        "accentColor": "string (e.g. blue, purple, orange)",
        "backgroundStyle": "minimal | glassmorphism | gradient | abstract",
        "visualStyle": "modern | futuristic | corporate | startup",
        "emphasis": "title | numbers | contrast | minimal"
      }
    }
  ]
}

Core Mission:
- Create slides that are NOT just informative, but visually premium and presentation-ready.
- Each slide should feel like it was designed by a professional designer.

Narrative Flow:
- Follow a compelling arc: Hook -> Problem -> Insight -> Solution -> Impact -> Closing.
- Make the audience feel progression, not just information.

Content Rules:
- Build exactly ${slideCount} slides.
- Titles must be bold, curiosity-driven, and short (max 8 words).
- Avoid generic headings like "Introduction" or "Conclusion".
- Use sharp, high-impact bullet points (no fluff).
- Include numbers, outcomes, or real-world examples whenever possible.

Design Intelligence (CRITICAL):
- Every slide must have a distinct visual identity.
- Alternate between dark and light themes for contrast.
- Use "gradient" or "neon" styles for high-impact slides (hook, solution, closing).
- Keep text minimal - let design breathe.

Layout Strategy:
- TITLE slide -> cinematic, bold, minimal text.
- BULLETS -> clean, structured, strong hierarchy.
- TWO_COLUMN -> use for comparisons, before/after, problem/solution.
- QUOTE -> emotional or powerful pause moment.
- CLOSING -> memorable, inspirational, or action-driven.

Image Strategy:
- imageQuery must feel premium and cinematic:
  BAD: "teamwork"
  GOOD: "futuristic team collaboration neon lighting"

- Images should enhance mood, not just illustrate content.

Design Variation Rules:
- Do NOT repeat same design settings across consecutive slides.
- Mix styles: minimal -> bold -> futuristic -> clean -> dramatic.

Speaker Notes:
- Add short (1 sentence), natural, presenter-friendly guidance.

Tone:
- Confident, bold, slightly dramatic.
- Think: TED Talk + Apple + YC pitch deck.

Hard Constraints:
- Start with TITLE and end with CLOSING.
- Output must be strictly valid JSON.
- No markdown, no explanations, no extra text.`;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type SarvamResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function extractJsonText(response: GeminiResponse) {
  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  return trimmed;
}

function extractSarvamJsonText(response: SarvamResponse) {
  const content = response.choices?.[0]?.message?.content?.trim() ?? "";

  if (content.startsWith("```")) {
    return content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  return content;
}

function stripFormattingArtifacts(text: string) {
  const withoutThinkBlocks = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const withoutFences = withoutThinkBlocks.replace(/```(?:json)?/gi, "").trim();
  return withoutFences;
}

function extractFirstJsonObject(text: string) {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseJsonFromModelOutput(rawText: string) {
  const cleaned = stripFormattingArtifacts(rawText);

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstObject = extractFirstJsonObject(cleaned);
    if (!firstObject) {
      throw new Error("Model response did not include a valid JSON object.");
    }
    return JSON.parse(firstObject);
  }
}

type LooseSlide = {
  layout?: unknown;
  title?: unknown;
  subtitle?: unknown;
  content?: unknown;
  imageQuery?: unknown;
  imageUrl?: unknown;
  bullets?: unknown;
  leftTitle?: unknown;
  leftBullets?: unknown;
  rightTitle?: unknown;
  rightBullets?: unknown;
  quote?: unknown;
  design?: unknown;
};

type SlideLayout = "TITLE" | "BULLETS" | "TWO_COLUMN" | "QUOTE" | "CLOSING";

type NormalizedDesign = {
  theme: "dark" | "light" | "gradient" | "neon";
  accentColor: string;
  backgroundStyle: "minimal" | "glassmorphism" | "gradient" | "abstract";
  visualStyle: "modern" | "futuristic" | "corporate" | "startup";
  emphasis: "title" | "numbers" | "contrast" | "minimal";
};

type UnsplashSearchResponse = {
  results?: Array<{
    urls?: {
      regular?: string;
    };
  }>;
};

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function inferTitleFromSlide(slide: LooseSlide, index: number) {
  const candidates = [
    slide.subtitle,
    slide.content,
    slide.leftTitle,
    slide.rightTitle,
    slide.quote,
    Array.isArray(slide.bullets) ? slide.bullets.find((item) => typeof item === "string") : null,
  ];

  for (const candidate of candidates) {
    const text = asNonEmptyString(candidate);
    if (text) {
      return text.slice(0, 120);
    }
  }

  return `Slide ${index + 1}`;
}

function inferImageQueryFromSlide(slide: LooseSlide, index: number) {
  const candidates = [
    slide.imageQuery,
    slide.title,
    slide.subtitle,
    slide.leftTitle,
    slide.rightTitle,
    slide.quote,
    Array.isArray(slide.bullets) ? slide.bullets.find((item) => typeof item === "string") : null,
  ];

  for (const candidate of candidates) {
    const text = asNonEmptyString(candidate);
    if (!text) {
      continue;
    }
    const compact = text
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (compact) {
      return compact.slice(0, 80);
    }
  }

  return `business presentation slide ${index + 1}`;
}

function normalizeLayoutValue(value: unknown): SlideLayout | null {
  if (typeof value !== "string") {
    return null;
  }

  const canonical = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const layoutMap: Record<string, SlideLayout> = {
    TITLE: "TITLE",
    OPENING: "TITLE",
    INTRO: "TITLE",
    INTRODUCTION: "TITLE",
    BULLETS: "BULLETS",
    BULLET: "BULLETS",
    POINTS: "BULLETS",
    LIST: "BULLETS",
    TWO_COLUMN: "TWO_COLUMN",
    TWO_COLUMNS: "TWO_COLUMN",
    COMPARISON: "TWO_COLUMN",
    COMPARE: "TWO_COLUMN",
    QUOTE: "QUOTE",
    CLOSING: "CLOSING",
    CONCLUSION: "CLOSING",
    ENDING: "CLOSING",
  };

  return layoutMap[canonical] ?? null;
}

function normalizeToken(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeDesign(rawDesign: unknown, index: number): NormalizedDesign | undefined {
  if (!rawDesign || typeof rawDesign !== "object") {
    return undefined;
  }

  const design = rawDesign as Record<string, unknown>;
  const themeToken = normalizeToken(design.theme);
  const bgToken = normalizeToken(design.backgroundStyle);
  const visualToken = normalizeToken(design.visualStyle);
  const emphasisToken = normalizeToken(design.emphasis);

  const themeMap: Record<string, NormalizedDesign["theme"]> = {
    dark: "dark",
    light: "light",
    gradient: "gradient",
    neon: "neon",
    dark_mode: "dark",
    light_mode: "light",
  };

  const backgroundMap: Record<string, NormalizedDesign["backgroundStyle"]> = {
    minimal: "minimal",
    glassmorphism: "glassmorphism",
    glass: "glassmorphism",
    gradient: "gradient",
    abstract: "abstract",
  };

  const visualMap: Record<string, NormalizedDesign["visualStyle"]> = {
    modern: "modern",
    futuristic: "futuristic",
    corporate: "corporate",
    startup: "startup",
    tech: "futuristic",
  };

  const emphasisMap: Record<string, NormalizedDesign["emphasis"]> = {
    title: "title",
    headline: "title",
    headings: "title",
    numbers: "numbers",
    number: "numbers",
    data: "numbers",
    metrics: "numbers",
    contrast: "contrast",
    high_contrast: "contrast",
    drama: "contrast",
    minimal: "minimal",
    clean: "minimal",
    simplicity: "minimal",
  };

  const fallbackTheme: NormalizedDesign["theme"] = index % 2 === 0 ? "dark" : "light";

  return {
    theme: themeMap[themeToken] ?? fallbackTheme,
    accentColor: asNonEmptyString(design.accentColor) ?? "blue",
    backgroundStyle: backgroundMap[bgToken] ?? "minimal",
    visualStyle: visualMap[visualToken] ?? "modern",
    emphasis: emphasisMap[emphasisToken] ?? "contrast",
  };
}

function inferLayoutFromSlide(slide: LooseSlide, index: number, totalSlides: number): SlideLayout {
  if (index === 0) {
    return "TITLE";
  }
  if (index === totalSlides - 1) {
    return "CLOSING";
  }
  if (asNonEmptyString(slide.quote)) {
    return "QUOTE";
  }
  if (Array.isArray(slide.leftBullets) && slide.leftBullets.length && Array.isArray(slide.rightBullets) && slide.rightBullets.length) {
    return "TWO_COLUMN";
  }
  return "BULLETS";
}

function normalizeDeckShape(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: unknown };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  const sourceSlides = deck.slides;

  const normalizedSlides = sourceSlides.map((slide, index) => {
    if (!slide || typeof slide !== "object") {
      return slide;
    }

    const loose = slide as LooseSlide;
    const title = asNonEmptyString(loose.title) ?? inferTitleFromSlide(loose, index);
    const imageQuery = asNonEmptyString(loose.imageQuery) ?? inferImageQueryFromSlide(loose, index);
    const layout = normalizeLayoutValue(loose.layout) ?? inferLayoutFromSlide(loose, index, sourceSlides.length);
    const design = normalizeDesign(loose.design, index);

    return {
      ...loose,
      layout,
      title,
      imageQuery,
      design,
    };
  });

  return {
    ...deck,
    slides: normalizedSlides,
  };
}

function ensureMinimumSlides(raw: unknown, minimum = 4) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  if (deck.slides.length >= minimum) {
    return raw;
  }

  const expandedSlides = [...deck.slides];

  while (expandedSlides.length < minimum) {
    const source = expandedSlides[expandedSlides.length - 1] ?? expandedSlides[0] ?? {};
    const nextIndex = expandedSlides.length + 1;
    const fallbackTitle = asNonEmptyString(source.title) ?? `Slide ${nextIndex}`;

    expandedSlides.push({
      ...source,
      layout: nextIndex === minimum ? "CLOSING" : "BULLETS",
      title: `${fallbackTitle} (cont.)`,
      imageQuery: asNonEmptyString(source.imageQuery) ?? `business strategy ${nextIndex}`,
    });
  }

  return {
    ...deck,
    slides: expandedSlides,
  };
}

function ensureExactSlides(raw: unknown, target = 8) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  if (deck.slides.length === target) {
    return raw;
  }

  if (deck.slides.length > target) {
    if (target < 2) {
      return { ...deck, slides: deck.slides.slice(0, target) };
    }

    const firstSlide = deck.slides[0];
    const lastSlide = deck.slides[deck.slides.length - 1];
    const middleCount = target - 2;
    const middleSlides = deck.slides.slice(1, 1 + middleCount);

    return {
      ...deck,
      slides: [firstSlide, ...middleSlides, lastSlide],
    };
  }

  return ensureMinimumSlides(raw, target);
}

function enforceBoundaryLayouts(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    return raw;
  }

  const slides = [...deck.slides];
  slides[0] = { ...slides[0], layout: "TITLE" };
  slides[slides.length - 1] = { ...slides[slides.length - 1], layout: "CLOSING" };

  return {
    ...deck,
    slides,
  };
}

async function fetchUnsplashImage(query: string, accessKey: string) {
  const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&content_filter=high`;
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as UnsplashSearchResponse;
  return result.results?.[0]?.urls?.regular ?? null;
}

async function enrichDeckWithUnsplash(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  const cache = new Map<string, string | null>();

  const slides = await Promise.all(
    deck.slides.map(async (slide) => {
      const imageQuery = asNonEmptyString(slide.imageQuery);
      if (!imageQuery) {
        return slide;
      }

      if (!cache.has(imageQuery)) {
        const imageUrl = await fetchUnsplashImage(imageQuery, accessKey);
        cache.set(imageQuery, imageUrl);
      }

      const imageUrl = cache.get(imageQuery) ?? null;
      if (!imageUrl) {
        return slide;
      }

      return {
        ...slide,
        imageUrl,
      };
    }),
  );

  return {
    ...deck,
    slides,
  };
}

async function generateWithGemini(prompt: string, tone: string, slideCount: number) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Server missing GEMINI_API_KEY. Add it to your .env.local file.");
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(slideCount) }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Topic: ${prompt}\nTone: ${tone}\nSlide count: ${slideCount}\nAudience: General business audience.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed with status ${response.status}. ${errorBody}`);
  }

  const result = (await response.json()) as GeminiResponse;
  const content = extractJsonText(result);

  if (!content) {
    throw new Error("The Gemini model returned an empty response.");
  }

  return content;
}

async function generateWithSarvam(prompt: string, tone: string, slideCount: number) {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    throw new Error("Server missing SARVAM_API_KEY. Add it to your .env.local file.");
  }

  const model = process.env.SARVAM_MODEL || "sarvam-m";
  const endpoint = process.env.SARVAM_API_URL || "https://api.sarvam.ai/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(slideCount) },
        {
          role: "user",
          content: `Topic: ${prompt}\nTone: ${tone}\nSlide count: ${slideCount}\nAudience: General business audience.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Sarvam request failed with status ${response.status}. ${errorBody}`);
  }

  const result = (await response.json()) as SarvamResponse;
  const content = extractSarvamJsonText(result);

  if (!content) {
    throw new Error("The Sarvam model returned an empty response.");
  }

  return content;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeneratePayload;
    const prompt = body.prompt?.trim();
    const tone = body.tone?.trim();
    const provider = body.provider?.trim() ?? "gemini";
    const requestedSlideCount = body.slideCount;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const parsedTone = ToneSchema.safeParse(tone);
    if (!parsedTone.success) {
      return NextResponse.json(
        { error: "Tone must be Professional, Creative, or Minimalist." },
        { status: 400 },
      );
    }

    const parsedProvider = ProviderSchema.safeParse(provider);
    if (!parsedProvider.success) {
      return NextResponse.json(
        { error: "Provider must be gemini or sarvam." },
        { status: 400 },
      );
    }

    const slideCount =
      typeof requestedSlideCount === "number" && Number.isFinite(requestedSlideCount)
        ? Math.max(4, Math.min(12, Math.round(requestedSlideCount)))
        : 8;

    let content: string;
    if (parsedProvider.data === "sarvam") {
      content = await generateWithSarvam(prompt, parsedTone.data, slideCount);
    } else {
      content = await generateWithGemini(prompt, parsedTone.data, slideCount);
    }

    const parsedJson = parseJsonFromModelOutput(content);
    const normalizedJson = normalizeDeckShape(parsedJson);
    const exactCountJson = ensureExactSlides(normalizedJson, slideCount);
    const boundaryLayoutsJson = enforceBoundaryLayouts(exactCountJson);
    const repairedJson = ensureMinimumSlides(boundaryLayoutsJson, 4);
    const enrichedJson = await enrichDeckWithUnsplash(repairedJson);
    const validated = DeckResponseSchema.parse(enrichedJson);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return NextResponse.json({ error: `Unable to generate deck. ${message}` }, { status: 500 });
  }
}
