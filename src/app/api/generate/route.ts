import { NextResponse } from "next/server";
import { DeckResponseSchema, ToneSchema } from "@/lib/slide-schema";

type GeneratePayload = {
  prompt?: string;
  tone?: string;
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

function extractJsonText(response: GeminiResponse) {
  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  const trimmed = text.trim();

  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  return trimmed;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing GEMINI_API_KEY. Add it to your .env.local file." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GeneratePayload;
    const prompt = body.prompt?.trim();
    const tone = body.tone?.trim();

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
                text: `Topic: ${prompt}\nTone: ${parsedTone.data}\nAudience: General business audience.`,
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
      return NextResponse.json(
        {
          error: `Gemini request failed with status ${response.status}. ${errorBody}`,
        },
        { status: 502 },
      );
    }

    const result = (await response.json()) as GeminiResponse;
    const content = extractJsonText(result);

    if (!content) {
      return NextResponse.json(
        { error: "The model returned an empty response." },
        { status: 502 },
      );
    }

    const json = JSON.parse(content);
    const validated = DeckResponseSchema.parse(json);

    return NextResponse.json(validated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error.";
    return NextResponse.json({ error: `Unable to generate deck. ${message}` }, { status: 500 });
  }
}
