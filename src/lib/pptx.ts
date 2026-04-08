import pptxgen from "pptxgenjs";
import type { Slide, Tone } from "@/types/slides";

type Theme = {
  bg: string;
  text: string;
  accent: string;
  muted: string;
};

const themes: Record<Tone, Theme> = {
  Professional: {
    bg: "F8FAFC",
    text: "0F172A",
    accent: "1D4ED8",
    muted: "475569",
  },
  Creative: {
    bg: "FFF8F1",
    text: "431407",
    accent: "EA580C",
    muted: "7C2D12",
  },
  Minimalist: {
    bg: "FFFFFF",
    text: "111827",
    accent: "111827",
    muted: "6B7280",
  },
};

export async function downloadDeck(slides: Slide[], tone: Tone) {
  const pptx = new pptxgen();
  const theme = themes[tone];

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "E-Z-PPT";
  pptx.company = "E-Z-PPT";
  pptx.subject = "AI generated deck";
  pptx.title = "E-Z-PPT Deck";

  slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();

    slide.background = { color: theme.bg };
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.16,
      fill: { color: theme.accent },
      line: { color: theme.accent, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 0.35,
      w: 1.6,
      h: 0,
      line: { color: theme.accent, pt: 2 },
    });
    slide.addText(`Slide ${index + 1}`, {
      x: 11.55,
      y: 0.22,
      w: 1.2,
      h: 0.22,
      align: "right",
      fontSize: 10,
      color: theme.muted,
    });

    const heading = slideData.title || `Slide ${index + 1}`;

    if (slideData.layout === "TITLE") {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 0.7,
        y: 1.2,
        w: 1.1,
        h: 1.1,
        fill: { color: theme.accent, transparency: 86 },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 11.0,
        y: 4.8,
        w: 1.2,
        h: 1.2,
        fill: { color: theme.accent, transparency: 88 },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addText("OPENING", {
        x: 5.55,
        y: 1.5,
        w: 2.2,
        h: 0.3,
        align: "center",
        bold: true,
        fontSize: 11,
        color: theme.accent,
      });
      slide.addText(heading, {
        x: 0.9,
        y: 2.1,
        w: 11.6,
        h: 1,
        align: "center",
        bold: true,
        fontSize: 40,
        color: theme.text,
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 1.4,
        y: 3.2,
        w: 10.6,
        h: 1,
        align: "center",
        fontSize: 20,
        color: theme.muted,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.55,
        y: 4.45,
        w: 4.25,
        h: 0.6,
        fill: { color: "FFFFFF", transparency: 8 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText("Context  |  Objective  |  Outcome", {
        x: 4.75,
        y: 4.62,
        w: 3.85,
        h: 0.28,
        align: "center",
        fontSize: 11,
        color: theme.muted,
      });
    }

    if (slideData.layout === "BULLETS") {
      slide.addText(heading, {
        x: 0.9,
        y: 0.85,
        w: 11.2,
        h: 0.8,
        bold: true,
        fontSize: 30,
        color: theme.text,
      });
      const bullets = (slideData.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 } } }));
      slide.addText(bullets, {
        x: 1.2,
        y: 1.9,
        w: 8.2,
        h: 4.8,
        fontSize: 18,
        color: theme.text,
        breakLine: true,
        paraSpaceAfter: 10,
      });

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.6,
        y: 1.9,
        w: 2.7,
        h: 4.9,
        fill: { color: "FFFFFF", transparency: 5 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText("KEY TAKEAWAY", {
        x: 9.85,
        y: 2.15,
        w: 2.2,
        h: 0.28,
        bold: true,
        fontSize: 10,
        color: theme.accent,
      });
      slide.addText(slideData.bullets?.[0] ?? "Primary insight", {
        x: 9.85,
        y: 2.5,
        w: 2.2,
        h: 1.5,
        fontSize: 12,
        color: theme.text,
        breakLine: true,
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 9.85,
        y: 4.2,
        w: 2.1,
        h: 0,
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText("PRESENTER NOTE", {
        x: 9.85,
        y: 4.35,
        w: 2.2,
        h: 0.25,
        bold: true,
        fontSize: 9,
        color: theme.muted,
      });
      slide.addText(slideData.speakerNotes ?? "Share one short example to make this point concrete.", {
        x: 9.85,
        y: 4.62,
        w: 2.2,
        h: 1.9,
        fontSize: 10,
        color: theme.muted,
        breakLine: true,
      });
    }

    if (slideData.layout === "TWO_COLUMN") {
      slide.addText(heading, {
        x: 0.9,
        y: 0.85,
        w: 11.2,
        h: 0.8,
        bold: true,
        fontSize: 30,
        color: theme.text,
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 6.66,
        y: 1.95,
        w: 0,
        h: 4.7,
        line: { color: "E2E8F0", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 1.85,
        w: 5.7,
        h: 4.9,
        fill: { color: "FFFFFF", transparency: 4 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.8,
        y: 1.85,
        w: 5.7,
        h: 4.9,
        fill: { color: "FFFFFF", transparency: 4 },
        line: { color: "CBD5E1", pt: 1 },
      });

      slide.addText(slideData.leftTitle ?? "Column A", {
        x: 1.2,
        y: 2.05,
        w: 5,
        h: 0.45,
        fontSize: 18,
        bold: true,
        color: theme.accent,
      });
      slide.addText(
        (slideData.leftBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 1.2,
          y: 2.65,
          w: 5,
          h: 3.7,
          fontSize: 16,
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
        },
      );

      slide.addText(slideData.rightTitle ?? "Column B", {
        x: 7.1,
        y: 2.05,
        w: 5,
        h: 0.45,
        fontSize: 18,
        bold: true,
        color: theme.accent,
      });
      slide.addText(
        (slideData.rightBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 7.1,
          y: 2.65,
          w: 5,
          h: 3.7,
          fontSize: 16,
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
        },
      );

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.95,
        y: 6.93,
        w: 3.45,
        h: 0.45,
        fill: { color: "FFFFFF", transparency: 10 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText("Compare  |  Evaluate  |  Decide", {
        x: 5.1,
        y: 7.05,
        w: 3.1,
        h: 0.2,
        align: "center",
        fontSize: 10,
        color: theme.muted,
      });
    }

    if (slideData.layout === "QUOTE") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.95,
        y: 1.4,
        w: 0.14,
        h: 4.2,
        fill: { color: theme.accent },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addText("\u201C", {
        x: 1.15,
        y: 1.5,
        w: 0.7,
        h: 0.9,
        fontSize: 56,
        color: theme.accent,
      });
      slide.addText(slideData.quote ?? "", {
        x: 1.95,
        y: 2.0,
        w: 9.4,
        h: 2.5,
        fontSize: 32,
        italic: true,
        color: theme.text,
        breakLine: true,
      });
      slide.addText(slideData.quoteAuthor ? `- ${slideData.quoteAuthor}` : "", {
        x: 1.95,
        y: 4.75,
        w: 9,
        h: 0.5,
        fontSize: 20,
        color: theme.muted,
      });
      slide.addText("Strategic message slide", {
        x: 1.95,
        y: 5.4,
        w: 4,
        h: 0.3,
        fontSize: 11,
        color: theme.muted,
      });
    }

    if (slideData.layout === "CLOSING") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1,
        y: 1.5,
        w: 11.3,
        h: 4.6,
        fill: { color: "FFFFFF", transparency: 3 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText(heading, {
        x: 1.5,
        y: 2.6,
        w: 10.3,
        h: 1,
        align: "center",
        fontSize: 38,
        bold: true,
        color: theme.text,
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 2.2,
        y: 3.7,
        w: 8.9,
        h: 0.9,
        align: "center",
        fontSize: 20,
        color: theme.muted,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.7,
        y: 4.9,
        w: 3.9,
        h: 0.9,
        fill: { color: "FFFFFF", transparency: 9 },
        line: { color: "CBD5E1", pt: 1 },
      });
      slide.addText("Q&A  |  Next Steps  |  Contact", {
        x: 4.95,
        y: 5.2,
        w: 3.4,
        h: 0.25,
        align: "center",
        fontSize: 11,
        color: theme.muted,
      });
    }

    if (slideData.speakerNotes) {
      slide.addNotes(`\n[Notes]\n${slideData.speakerNotes}`);
    }
  });

  await pptx.writeFile({ fileName: "E-Z-PPT_Deck.pptx" });
}
