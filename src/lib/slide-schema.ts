import { z } from "zod";

export const ToneSchema = z.enum(["Professional", "Creative", "Minimalist"]);
export const ProviderSchema = z.enum(["gemini", "sarvam"]);
export const PptStyleSchema = z.enum(["Executive", "Bold", "Magazine"]);

export const SlideSchema = z
  .object({
    layout: z.enum(["TITLE", "BULLETS", "TWO_COLUMN", "QUOTE", "CLOSING"]),
    title: z.string().min(1).max(120),
    subtitle: z.string().max(180).optional(),
    content: z.string().max(400).optional(),
    imageQuery: z.string().max(120).optional(),
    imageUrl: z.string().url().max(500).optional(),
    bullets: z.array(z.string().max(180)).max(8).optional(),
    leftTitle: z.string().max(80).optional(),
    leftBullets: z.array(z.string().max(120)).max(6).optional(),
    rightTitle: z.string().max(80).optional(),
    rightBullets: z.array(z.string().max(120)).max(6).optional(),
    quote: z.string().max(280).optional(),
    quoteAuthor: z.string().max(80).optional(),
    speakerNotes: z.string().max(500).optional(),
    design: z
      .object({
        theme: z.enum(["dark", "light", "gradient", "neon"]),
        accentColor: z.string().max(40),
        backgroundStyle: z.enum(["minimal", "glassmorphism", "gradient", "abstract"]),
        visualStyle: z.enum(["modern", "futuristic", "corporate", "startup"]),
        emphasis: z.enum(["title", "numbers", "contrast", "minimal"]),
        layoutVariant: z.enum(["asymmetric", "centered", "split", "editorial", "grid"]).optional(),
      })
      .optional(),
  })
  .superRefine((slide, ctx) => {
    if (slide.layout === "BULLETS" && (!slide.bullets || slide.bullets.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "BULLETS layout requires at least 2 bullet points.",
      });
    }

    if (
      slide.layout === "TWO_COLUMN" &&
      (!slide.leftBullets?.length || !slide.rightBullets?.length)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TWO_COLUMN layout requires bullets for both columns.",
      });
    }

    if (slide.layout === "QUOTE" && !slide.quote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "QUOTE layout requires a quote field.",
      });
    }
  });

export const DeckResponseSchema = z.object({
  slides: z.array(SlideSchema).min(4).max(30),
});

export type ToneInput = z.infer<typeof ToneSchema>;
export type ProviderInput = z.infer<typeof ProviderSchema>;
export type PptStyleInput = z.infer<typeof PptStyleSchema>;
export type SlideInput = z.infer<typeof SlideSchema>;
export type DeckResponseInput = z.infer<typeof DeckResponseSchema>;
