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
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 0.35,
      w: 1.6,
      h: 0,
      line: { color: theme.accent, pt: 2 },
    });

    const heading = slideData.title || `Slide ${index + 1}`;

    if (slideData.layout === "TITLE") {
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
        w: 10.8,
        h: 4.8,
        fontSize: 20,
        color: theme.text,
        breakLine: true,
        paraSpaceAfter: 10,
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
    }

    if (slideData.layout === "QUOTE") {
      slide.addText("\u201C", {
        x: 1,
        y: 1.5,
        w: 0.7,
        h: 0.9,
        fontSize: 56,
        color: theme.accent,
      });
      slide.addText(slideData.quote ?? "", {
        x: 1.8,
        y: 2.0,
        w: 9.8,
        h: 2.4,
        fontSize: 34,
        italic: true,
        color: theme.text,
        breakLine: true,
      });
      slide.addText(slideData.quoteAuthor ? `- ${slideData.quoteAuthor}` : "", {
        x: 1.8,
        y: 4.7,
        w: 9,
        h: 0.5,
        fontSize: 20,
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
    }

    if (slideData.speakerNotes) {
      slide.addNotes(`\n[Notes]\n${slideData.speakerNotes}`);
    }
  });

  await pptx.writeFile({ fileName: "E-Z-PPT_Deck.pptx" });
}
