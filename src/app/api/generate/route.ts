import OpenAI from "openai";
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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing OPENAI_API_KEY. Add it to your .env.local file." },
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

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Topic: ${prompt}\nTone: ${parsedTone.data}\nAudience: General business audience.`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

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
