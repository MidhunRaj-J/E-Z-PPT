import { NextResponse } from "next/server";
import { DeckResponseSchema, PptStyleSchema, ProviderSchema, ToneSchema } from "@/lib/slide-schema";

type GeneratePayload = {
  prompt?: string;
  tone?: string;
  provider?: string;
  slideCount?: number;
  style?: string;
};

function buildSystemPrompt(slideCount: number, style: string) {
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
        "emphasis": "title | numbers | contrast | minimal",
        "layoutVariant": "asymmetric | centered | split | editorial | grid"
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
- Keep decks mostly light or soft-gradient; use dark/neon sparingly and only when it strengthens clarity.
- Use "gradient" for high-impact slides (hook, solution, closing), but preserve readability first.
- Keep text minimal - let design breathe.

Placement & Hierarchy Rules (MANDATORY):
- One focal point per slide: title first, then one supporting visual, then supporting text.
- Follow scan flow: top-left to center-right. Make first 2 lines carry the key message.
- Use clear zones: Header (10-15% height), Content body (70-75%), Footer/CTA (10-15%).
- Respect whitespace: avoid edge-to-edge text blocks and avoid clutter.
- Bullets: 3-5 concise points, parallel wording, no wall-of-text paragraphs.
- TWO_COLUMN: left = context/problem, right = approach/outcome.
- QUOTE: short emotional pause, author line mandatory.
- CLOSING: single call-to-action or memorable takeaway.

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
- Only attach image-driven backgrounds where meaningful (TITLE, QUOTE, CLOSING, and rare key section slides).
- Prefer specific context words from the topic; avoid generic stock-photo words.

Design Variation Rules:
- Do NOT repeat same design settings across consecutive slides.
- Mix styles: minimal -> bold -> futuristic -> clean -> dramatic.

Speaker Notes:
- Add short (1 sentence), natural, presenter-friendly guidance.

Tone:
- Confident, bold, slightly dramatic.
- Think: TED Talk + Apple + YC pitch deck.

Style Direction:
- Deck style preset: ${style}
- If style is Executive: prioritize clean hierarchy, restrained accents, and boardroom readability.
- If style is Bold: prioritize strong contrast, bigger headlines, and energetic visual rhythm.
- If style is Magazine: prioritize editorial spacing, refined typography, and story-first pacing.

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
  layoutVariant: "asymmetric" | "centered" | "split" | "editorial" | "grid";
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

function extractKeywords(text: string, limit = 6) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "your",
    "our",
    "their",
    "about",
    "slide",
    "slides",
    "presentation",
    "business",
    "general",
    "audience",
    "impact",
    "solution",
    "problem",
  ]);

  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));

  const unique: string[] = [];
  for (const token of tokens) {
    if (!unique.includes(token)) {
      unique.push(token);
    }
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}

function buildContextAwareImageQuery(slide: Record<string, unknown>, deckKeywords: string[], index: number) {
  const slideTitle = asNonEmptyString(slide.title) ?? "";
  const slideSubtitle = asNonEmptyString(slide.subtitle) ?? "";
  const candidate = asNonEmptyString(slide.imageQuery) ?? `${slideTitle} ${slideSubtitle}`;
  const candidateKeywords = extractKeywords(candidate, 4);
  const titleKeywords = extractKeywords(slideTitle, 3);

  const merged = [...candidateKeywords, ...titleKeywords, ...deckKeywords].filter(Boolean);
  const unique: string[] = [];
  for (const token of merged) {
    if (!unique.includes(token)) {
      unique.push(token);
    }
    if (unique.length >= 5) {
      break;
    }
  }

  if (unique.length === 0) {
    return `professional keynote story ${index + 1}`;
  }

  return unique.join(" ");
}

function shouldUseImageForSlide(slide: Record<string, unknown>, index: number, total: number) {
  const layout = typeof slide.layout === "string" ? slide.layout : "BULLETS";
  if (layout === "TITLE" || layout === "QUOTE" || layout === "CLOSING") {
    return true;
  }

  const middle = Math.max(1, Math.floor(total / 2));
  return layout === "TWO_COLUMN" && index === middle;
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
  const variantToken = normalizeToken(design.layoutVariant);

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

  const variantMap: Record<string, NormalizedDesign["layoutVariant"]> = {
    asymmetric: "asymmetric",
    left_heavy: "asymmetric",
    centered: "centered",
    center: "centered",
    split: "split",
    split_screen: "split",
    editorial: "editorial",
    magazine: "editorial",
    grid: "grid",
    cards: "grid",
  };

  const fallbackTheme: NormalizedDesign["theme"] = index % 2 === 0 ? "dark" : "light";

  return {
    theme: themeMap[themeToken] ?? fallbackTheme,
    accentColor: asNonEmptyString(design.accentColor) ?? "blue",
    backgroundStyle: backgroundMap[bgToken] ?? "minimal",
    visualStyle: visualMap[visualToken] ?? "modern",
    emphasis: emphasisMap[emphasisToken] ?? "contrast",
    layoutVariant: variantMap[variantToken] ?? "asymmetric",
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

  const stripContinuationSuffix = (value: string) =>
    value
      .replace(/\s*\(cont\.\)\s*/gi, " ")
      .replace(/\s+part\s+\d+$/i, "")
      .replace(/\s+/g, " ")
      .trim();

  while (expandedSlides.length < minimum) {
    const source = expandedSlides[expandedSlides.length - 1] ?? expandedSlides[0] ?? {};
    const nextIndex = expandedSlides.length + 1;
    const sourceTitle = asNonEmptyString(source.title) ?? `Slide ${nextIndex}`;
    const baseTitle = stripContinuationSuffix(sourceTitle) || `Slide ${nextIndex}`;

    expandedSlides.push({
      ...source,
      layout: nextIndex === minimum ? "CLOSING" : "BULLETS",
      title: `${baseTitle} Part ${nextIndex}`,
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

function ensureLayoutContentRequirements(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  const sanitizeText = (value: string) => {
    const compact = value.replace(/\s+/g, " ").trim();
    if (!compact) {
      return "";
    }

    const lower = compact.toLowerCase();
    const banned = new Set(["n/a", "na", "none", "tbd", "lorem ipsum", "placeholder", "-"]);
    if (banned.has(lower)) {
      return "";
    }

    return compact;
  };

  const toStringArray = (value: unknown) =>
    Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === "string")
          .map((item) => sanitizeText(item))
          .filter(Boolean)
      : [];

  const cleanTitleForFallback = (value: string) =>
    value
      .replace(/\s*\(cont\.\)\s*/gi, " ")
      .replace(/\s+part\s+\d+$/i, "")
      .replace(/\bpart\s+\d+\b(?=.*\bpart\s+\d+\b)/gi, "")
      .replace(/\s*[:|-]\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const slides = deck.slides.map((slide, index) => {
    const layout = typeof slide.layout === "string" ? slide.layout : "BULLETS";
    const rawTitle = sanitizeText(asNonEmptyString(slide.title) ?? `Slide ${index + 1}`) || `Slide ${index + 1}`;
    const title = cleanTitleForFallback(rawTitle) || `Slide ${index + 1}`;
    const content = sanitizeText(asNonEmptyString(slide.content) ?? "");
    const subtitle = sanitizeText(asNonEmptyString(slide.subtitle) ?? "");

    if (layout === "BULLETS") {
      const bullets = toStringArray(slide.bullets);
      while (bullets.length < 4) {
        bullets.push(
          bullets.length === 0
            ? "Core insight"
            : bullets.length === 1
              ? "Supporting evidence or metric"
              : bullets.length === 2
                ? "Implication for the audience"
                : "Recommended next step",
        );
      }
      return {
        ...slide,
        title,
        subtitle: subtitle || undefined,
        content: content || undefined,
        bullets,
      };
    }

    if (layout === "TWO_COLUMN") {
      const leftBullets = toStringArray(slide.leftBullets);
      const rightBullets = toStringArray(slide.rightBullets);

      while (leftBullets.length < 3) {
        leftBullets.push(
          leftBullets.length === 0
            ? "Current state"
            : leftBullets.length === 1
              ? "Current challenge"
              : "Observed impact",
        );
      }
      while (rightBullets.length < 3) {
        rightBullets.push(
          rightBullets.length === 0
            ? "Target state"
            : rightBullets.length === 1
              ? "Solution approach"
              : "Expected result",
        );
      }

      return {
        ...slide,
        title,
        leftTitle: sanitizeText(asNonEmptyString(slide.leftTitle) ?? "") || "Current",
        rightTitle: sanitizeText(asNonEmptyString(slide.rightTitle) ?? "") || "Future",
        leftBullets,
        rightBullets,
      };
    }

    if (layout === "QUOTE") {
      return {
        ...slide,
        title,
        quote: sanitizeText(asNonEmptyString(slide.quote) ?? "") || `${title} drives measurable impact.`,
        quoteAuthor: sanitizeText(asNonEmptyString(slide.quoteAuthor) ?? "") || "Presenter",
      };
    }

    if (layout === "TITLE" || layout === "CLOSING") {
      return {
        ...slide,
        title,
        subtitle: subtitle || undefined,
        content: content || subtitle || `${title} with clear narrative flow and actionable outcomes.`,
      };
    }

    return {
      ...slide,
      title,
      subtitle: subtitle || undefined,
      content: content || undefined,
    };
  });

  return {
    ...deck,
    slides,
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function enforceDesignDirection(raw: unknown, seed: number) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides) || deck.slides.length === 0) {
    return raw;
  }

  const profiles = [
    {
      themeCycle: ["light", "gradient", "light", "light", "gradient", "light"] as NormalizedDesign["theme"][],
      backgroundCycle: ["minimal", "glassmorphism", "gradient", "abstract"] as NormalizedDesign["backgroundStyle"][],
      visualCycle: ["modern", "futuristic", "startup", "corporate"] as NormalizedDesign["visualStyle"][],
      emphasisCycle: ["title", "contrast", "numbers", "minimal"] as NormalizedDesign["emphasis"][],
      variantCycle: ["asymmetric", "centered", "split", "editorial", "grid"] as NormalizedDesign["layoutVariant"][],
      accentCycle: ["blue", "orange", "teal", "indigo", "red", "cyan", "gold"],
    },
    {
      themeCycle: ["gradient", "light", "light", "gradient", "light", "light"] as NormalizedDesign["theme"][],
      backgroundCycle: ["glassmorphism", "abstract", "minimal", "gradient"] as NormalizedDesign["backgroundStyle"][],
      visualCycle: ["startup", "corporate", "futuristic", "modern"] as NormalizedDesign["visualStyle"][],
      emphasisCycle: ["contrast", "title", "minimal", "numbers"] as NormalizedDesign["emphasis"][],
      variantCycle: ["split", "editorial", "grid", "asymmetric", "centered"] as NormalizedDesign["layoutVariant"][],
      accentCycle: ["indigo", "gold", "teal", "blue", "orange", "purple", "red"],
    },
    {
      themeCycle: ["light", "light", "gradient", "light", "gradient", "light"] as NormalizedDesign["theme"][],
      backgroundCycle: ["gradient", "minimal", "abstract", "glassmorphism"] as NormalizedDesign["backgroundStyle"][],
      visualCycle: ["futuristic", "modern", "corporate", "startup"] as NormalizedDesign["visualStyle"][],
      emphasisCycle: ["numbers", "contrast", "title", "minimal"] as NormalizedDesign["emphasis"][],
      variantCycle: ["grid", "asymmetric", "centered", "split", "editorial"] as NormalizedDesign["layoutVariant"][],
      accentCycle: ["cyan", "red", "blue", "gold", "indigo", "teal", "orange"],
    },
  ] as const;

  const profile = profiles[seed % profiles.length];
  const themeOffset = seed % profile.themeCycle.length;
  const bgOffset = (seed >> 2) % profile.backgroundCycle.length;
  const visualOffset = (seed >> 4) % profile.visualCycle.length;
  const emphasisOffset = (seed >> 6) % profile.emphasisCycle.length;
  const variantOffset = (seed >> 7) % profile.variantCycle.length;
  const accentOffset = (seed >> 8) % profile.accentCycle.length;

  const slides: Array<Record<string, unknown>> = [];

  for (let index = 0; index < deck.slides.length; index += 1) {
    const slide = deck.slides[index];
    const total = deck.slides.length;
    const layout = typeof slide.layout === "string" ? slide.layout : "BULLETS";

    const design: NormalizedDesign = {
      theme: profile.themeCycle[(index + themeOffset) % profile.themeCycle.length],
      accentColor: profile.accentCycle[(index + accentOffset) % profile.accentCycle.length],
      backgroundStyle: profile.backgroundCycle[(index + bgOffset) % profile.backgroundCycle.length],
      visualStyle: profile.visualCycle[(index + visualOffset) % profile.visualCycle.length],
      emphasis: profile.emphasisCycle[(index + emphasisOffset) % profile.emphasisCycle.length],
      layoutVariant: profile.variantCycle[(index + variantOffset) % profile.variantCycle.length],
    };

    if (layout === "TITLE") {
      design.theme = "gradient";
      design.backgroundStyle = seed % 3 === 0 ? "gradient" : "glassmorphism";
      design.visualStyle = seed % 2 === 0 ? "startup" : "futuristic";
      design.emphasis = "title";
      design.layoutVariant = seed % 2 === 0 ? "centered" : "editorial";
    }

    if (layout === "CLOSING" || index === total - 1) {
      design.theme = "gradient";
      design.backgroundStyle = seed % 3 === 1 ? "abstract" : "gradient";
      design.visualStyle = seed % 2 === 0 ? "futuristic" : "startup";
      design.emphasis = "contrast";
      design.layoutVariant = seed % 2 === 0 ? "split" : "centered";
    }

    const previous = index > 0 ? (slides[index - 1].design as Partial<NormalizedDesign> | undefined) : undefined;
    if (
      previous &&
      previous.theme === design.theme &&
      previous.backgroundStyle === design.backgroundStyle &&
      previous.visualStyle === design.visualStyle &&
      previous.layoutVariant === design.layoutVariant
    ) {
      design.visualStyle = profile.visualCycle[(index + visualOffset + 1) % profile.visualCycle.length];
      design.backgroundStyle = profile.backgroundCycle[(index + bgOffset + 1) % profile.backgroundCycle.length];
      design.emphasis = profile.emphasisCycle[(index + emphasisOffset + 1) % profile.emphasisCycle.length];
      design.layoutVariant = profile.variantCycle[(index + variantOffset + 1) % profile.variantCycle.length];
    }

    slides.push({
      ...slide,
      design,
    });
  }

  return {
    ...deck,
    slides,
  };
}

function ensureDesignSchemaSafety(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  const fallbackThemes: NormalizedDesign["theme"][] = ["dark", "light", "gradient", "neon"];
  const fallbackBackgrounds: NormalizedDesign["backgroundStyle"][] = ["minimal", "glassmorphism", "gradient", "abstract"];
  const fallbackVisuals: NormalizedDesign["visualStyle"][] = ["modern", "futuristic", "corporate", "startup"];
  const fallbackEmphasis: NormalizedDesign["emphasis"][] = ["title", "numbers", "contrast", "minimal"];
  const fallbackVariants: NormalizedDesign["layoutVariant"][] = ["asymmetric", "centered", "split", "editorial", "grid"];
  const fallbackAccents = ["blue", "orange", "teal", "indigo"];

  const slides = deck.slides.map((slide, index) => {
    const normalized = normalizeDesign(slide.design, index);

    const design: NormalizedDesign = {
      theme: normalized?.theme ?? fallbackThemes[index % fallbackThemes.length],
      accentColor: normalized?.accentColor ?? fallbackAccents[index % fallbackAccents.length],
      backgroundStyle: normalized?.backgroundStyle ?? fallbackBackgrounds[index % fallbackBackgrounds.length],
      visualStyle: normalized?.visualStyle ?? fallbackVisuals[index % fallbackVisuals.length],
      emphasis: normalized?.emphasis ?? fallbackEmphasis[index % fallbackEmphasis.length],
      layoutVariant: normalized?.layoutVariant ?? fallbackVariants[index % fallbackVariants.length],
    };

    return {
      ...slide,
      design,
    };
  });

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

function sanitizeQueryForFallback(query: string) {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .join(",");
}

function getFallbackImageUrl(query: string, index: number) {
  const tags = sanitizeQueryForFallback(query) || "business,presentation";
  const seed = `${tags}-${index + 1}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`;
}

async function enrichDeckWithImages(raw: unknown, prompt: string) {
  if (!raw || typeof raw !== "object") {
    return raw;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  const deck = raw as { slides?: Array<Record<string, unknown>> };
  if (!Array.isArray(deck.slides)) {
    return raw;
  }

  const deckKeywords = extractKeywords(prompt, 5);
  const totalSlides = deck.slides.length;

  const cache = new Map<string, string | null>();

  const slides = await Promise.all(
    deck.slides.map(async (slide, index) => {
      if (!shouldUseImageForSlide(slide, index, totalSlides)) {
        return slide;
      }

      const imageQuery = buildContextAwareImageQuery(slide, deckKeywords, index);

      if (!cache.has(imageQuery)) {
        let imageUrl: string | null = null;

        if (accessKey) {
          imageUrl = await fetchUnsplashImage(imageQuery, accessKey);
        }

        if (!imageUrl) {
          imageUrl = getFallbackImageUrl(imageQuery, index);
        }

        cache.set(imageQuery, imageUrl);
      }

      const imageUrl = cache.get(imageQuery) ?? null;
      if (!imageUrl) {
        return slide;
      }

      return {
        ...slide,
        imageQuery,
        imageUrl,
      };
    }),
  );

  return {
    ...deck,
    slides,
  };
}

async function generateWithGemini(prompt: string, tone: string, slideCount: number, style: string) {
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
        parts: [{ text: buildSystemPrompt(slideCount, style) }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Topic: ${prompt}\nTone: ${tone}\nStyle: ${style}\nSlide count: ${slideCount}\nAudience: General business audience.`,
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

async function generateWithSarvam(prompt: string, tone: string, slideCount: number, style: string) {
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
        { role: "system", content: buildSystemPrompt(slideCount, style) },
        {
          role: "user",
          content: `Topic: ${prompt}\nTone: ${tone}\nStyle: ${style}\nSlide count: ${slideCount}\nAudience: General business audience.`,
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
    const style = body.style?.trim() ?? "Executive";
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

    const parsedStyle = PptStyleSchema.safeParse(style);
    if (!parsedStyle.success) {
      return NextResponse.json(
        { error: "Style must be Executive, Bold, or Magazine." },
        { status: 400 },
      );
    }

    const slideCount =
      typeof requestedSlideCount === "number" && Number.isFinite(requestedSlideCount)
        ? Math.max(4, Math.min(30, Math.round(requestedSlideCount)))
        : 8;

    let content: string;
    if (parsedProvider.data === "sarvam") {
      content = await generateWithSarvam(prompt, parsedTone.data, slideCount, parsedStyle.data);
    } else {
      content = await generateWithGemini(prompt, parsedTone.data, slideCount, parsedStyle.data);
    }

    const parsedJson = parseJsonFromModelOutput(content);
    const normalizedJson = normalizeDeckShape(parsedJson);
    const exactCountJson = ensureExactSlides(normalizedJson, slideCount);
    const boundaryLayoutsJson = enforceBoundaryLayouts(exactCountJson);
    const repairedLayoutsJson = ensureLayoutContentRequirements(boundaryLayoutsJson);
    const repairedJson = ensureMinimumSlides(repairedLayoutsJson, 4);
    const designSeed = hashString(`${prompt}|${parsedTone.data}|${slideCount}|${Date.now()}|${Math.random()}`);
    const designDirectedJson = enforceDesignDirection(repairedJson, designSeed);
    const designSafeJson = ensureDesignSchemaSafety(designDirectedJson);
    const enrichedJson = await enrichDeckWithImages(designSafeJson, prompt);
    const validated = DeckResponseSchema.parse(enrichedJson);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return NextResponse.json({ error: `Unable to generate deck. ${message}` }, { status: 500 });
  }
}
