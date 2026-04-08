import { NextResponse } from "next/server";
import { DeckResponseSchema, ProviderSchema, ToneSchema } from "@/lib/slide-schema";

type GeneratePayload = {
  prompt?: string;
  tone?: string;
  provider?: string;
};

const systemPrompt = `You are a presentation architect.
Return ONLY valid JSON in this exact shape:
{
  "slides": [
    {
      "layout": "TITLE | BULLETS | TWO_COLUMN | QUOTE | CLOSING",
      "title": "string",
      "subtitle": "string optional",
      "content": "string optional",
      "imageQuery": "string optional, 2-5 words, stock-photo style",
      "bullets": ["string"] optional,
      "leftTitle": "string optional",
      "leftBullets": ["string"] optional,
      "rightTitle": "string optional",
      "rightBullets": ["string"] optional,
      "quote": "string optional",
      "quoteAuthor": "string optional",
      "speakerNotes": "string optional"
    }
  ]
}

Rules:
- Build 7 to 10 slides.
- Start with TITLE and end with CLOSING.
- Use a mix of BULLETS, TWO_COLUMN, and QUOTE in the middle.
- Keep text concise and specific.
- For BULLETS slides, provide 4 to 6 bullets with practical details.
- For TWO_COLUMN slides, provide 3 to 5 bullets in each column.
- Add imageQuery on every slide using concise stock-photo search terms (example: "modern office teamwork").
- Include concrete examples, directional metrics, or outcomes whenever possible.
- Add speakerNotes on most slides with a one-sentence presenter tip.
- No markdown, no commentary, no code fences.`;

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
};

type SlideLayout = "TITLE" | "BULLETS" | "TWO_COLUMN" | "QUOTE" | "CLOSING";

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

  const normalizedSlides = deck.slides.map((slide, index) => {
    if (!slide || typeof slide !== "object") {
      return slide;
    }

    const loose = slide as LooseSlide;
    const title = asNonEmptyString(loose.title) ?? inferTitleFromSlide(loose, index);
    const imageQuery = asNonEmptyString(loose.imageQuery) ?? inferImageQueryFromSlide(loose, index);
    const layout = normalizeLayoutValue(loose.layout) ?? inferLayoutFromSlide(loose, index, deck.slides!.length);

    return {
      ...loose,
      layout,
      title,
      imageQuery,
    };
  });

  return {
    ...deck,
    slides: normalizedSlides,
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

async function generateWithGemini(prompt: string, tone: string) {
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
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Topic: ${prompt}\nTone: ${tone}\nAudience: General business audience.`,
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

async function generateWithSarvam(prompt: string, tone: string) {
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
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Topic: ${prompt}\nTone: ${tone}\nAudience: General business audience.`,
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

    let content: string;
    if (parsedProvider.data === "sarvam") {
      content = await generateWithSarvam(prompt, parsedTone.data);
    } else {
      content = await generateWithGemini(prompt, parsedTone.data);
    }

    const parsedJson = parseJsonFromModelOutput(content);
    const normalizedJson = normalizeDeckShape(parsedJson);
    const enrichedJson = await enrichDeckWithUnsplash(normalizedJson);
    const validated = DeckResponseSchema.parse(enrichedJson);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return NextResponse.json({ error: `Unable to generate deck. ${message}` }, { status: 500 });
  }
}
