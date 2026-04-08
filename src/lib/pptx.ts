import pptxgen from "pptxgenjs";
import type { Slide, Tone } from "@/types/slides";

type Theme = {
  bg: string;
  text: string;
  accent: string;
  muted: string;
  surface: string;
  panel: string;
  inverseText: string;
};

const themes: Record<Tone, Theme> = {
  Professional: {
    bg: "EEF3FB",
    text: "0B1220",
    accent: "0A4CD8",
    muted: "51617A",
    surface: "FFFFFF",
    panel: "E7EFFD",
    inverseText: "F8FAFC",
  },
  Creative: {
    bg: "FFF2E8",
    text: "3B1205",
    accent: "E35B12",
    muted: "8A3B1D",
    surface: "FFFFFF",
    panel: "FFE5D4",
    inverseText: "FFF8F3",
  },
  Minimalist: {
    bg: "F7F9FC",
    text: "111827",
    accent: "111827",
    muted: "5F6878",
    surface: "FFFFFF",
    panel: "EEF2F7",
    inverseText: "F3F4F6",
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
    const hasImage = Boolean(slideData.imageUrl);

    slide.background = { color: theme.bg };
    if (slideData.imageUrl) {
      try {
        slide.addImage({
          path: slideData.imageUrl,
          x: 0,
          y: 0,
          w: 13.33,
          h: 7.5,
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 13.33,
          h: 7.5,
          fill: { color: "0F172A", transparency: 56 },
          line: { color: "0F172A", pt: 0 },
        });
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 13.33,
          h: 7.5,
          fill: { color: theme.bg, transparency: 70 },
          line: { color: theme.bg, pt: 0 },
        });
      } catch {
        // Keep plain theme background if a remote image cannot be embedded.
      }
    } else {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: -0.7,
        y: -0.4,
        w: 3.2,
        h: 3.2,
        fill: { color: theme.accent, transparency: 88 },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 10.85,
        y: 5.2,
        w: 2.8,
        h: 2.8,
        fill: { color: theme.accent, transparency: 90 },
        line: { color: theme.accent, pt: 0 },
      });
    }

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 4.44,
      h: 0.16,
      fill: { color: theme.accent },
      line: { color: theme.accent, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 4.44,
      y: 0,
      w: 4.44,
      h: 0.16,
      fill: { color: theme.text },
      line: { color: theme.text, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 8.88,
      y: 0,
      w: 4.45,
      h: 0.16,
      fill: { color: theme.muted },
      line: { color: theme.muted, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.line, {
      x: 0.6,
      y: 0.4,
      w: 2,
      h: 0,
      line: { color: theme.accent, pt: 2 },
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 10.75,
      y: 0.2,
      w: 1.95,
      h: 0.36,
      fill: { color: theme.surface, transparency: 8 },
      line: { color: "CDD7E7", pt: 1 },
    });
    slide.addText(`SLIDE ${index + 1}`, {
      x: 10.82,
      y: 0.29,
      w: 1.82,
      h: 0.18,
      align: "center",
      fontSize: 10,
      bold: true,
      color: theme.text,
      charSpace: 1,
    });

    const heading = slideData.title || `Slide ${index + 1}`;

    if (slideData.layout === "TITLE") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.05,
        y: 1,
        w: 11.2,
        h: 5.75,
        fill: { color: theme.surface, transparency: hasImage ? 18 : 4 },
        line: { color: "CED8E9", pt: 1 },
      });
      slide.addText("OPENING FRAME", {
        x: 1.35,
        y: 1.35,
        w: 2.8,
        h: 0.24,
        align: "left",
        bold: true,
        fontSize: 10,
        color: theme.accent,
        charSpace: 1,
      });
      slide.addText(heading, {
        x: 1.35,
        y: 1.95,
        w: 10.5,
        h: 1.95,
        align: "left",
        bold: true,
        fontSize: 46,
        color: theme.text,
        breakLine: true,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.35,
        y: 4.58,
        w: 8.35,
        h: 1.2,
        fill: { color: theme.panel, transparency: 8 },
        line: { color: "D3DDEC", pt: 1 },
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 1.65,
        y: 4.9,
        w: 7.95,
        h: 0.78,
        align: "left",
        fontSize: 18,
        color: theme.muted,
        breakLine: true,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.95,
        y: 4.58,
        w: 2.05,
        h: 1.2,
        fill: { color: theme.accent, transparency: 4 },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addText("CONTEXT\nOBJECTIVE\nOUTCOME", {
        x: 10.09,
        y: 4.73,
        w: 1.77,
        h: 0.98,
        align: "center",
        fontSize: 9,
        bold: true,
        color: theme.inverseText,
        breakLine: true,
      });
    }

    if (slideData.layout === "BULLETS") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 0.95,
        w: 8.85,
        h: 5.95,
        fill: { color: theme.surface, transparency: hasImage ? 16 : 3 },
        line: { color: "CFD9E8", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.95,
        y: 0.95,
        w: 2.35,
        h: 5.95,
        fill: { color: theme.panel, transparency: hasImage ? 16 : 2 },
        line: { color: "CFD9E8", pt: 1 },
      });
      slide.addText(heading, {
        x: 1.2,
        y: 1.18,
        w: 8.2,
        h: 0.8,
        bold: true,
        fontSize: 30,
        color: theme.text,
      });
      const bullets = (slideData.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 } } }));
      slide.addText(bullets, {
        x: 1.2,
        y: 2.13,
        w: 8.2,
        h: 4.4,
        fontSize: 16,
        color: theme.text,
        breakLine: true,
        paraSpaceAfter: 9,
      });

      slide.addText("KEY TAKEAWAY", {
        x: 10.17,
        y: 1.25,
        w: 1.95,
        h: 0.28,
        bold: true,
        fontSize: 10,
        color: theme.accent,
        charSpace: 0.8,
      });
      slide.addText(slideData.bullets?.[0] ?? "Primary insight", {
        x: 10.17,
        y: 1.67,
        w: 1.95,
        h: 1.5,
        fontSize: 12,
        color: theme.text,
        breakLine: true,
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 10.17,
        y: 3.45,
        w: 1.9,
        h: 0,
        line: { color: "C7D2E5", pt: 1 },
      });
      slide.addText("PRESENTER NOTE", {
        x: 10.17,
        y: 3.62,
        w: 1.95,
        h: 0.25,
        bold: true,
        fontSize: 9,
        color: theme.muted,
      });
      slide.addText(slideData.speakerNotes ?? "Share one short example to make this point concrete.", {
        x: 10.17,
        y: 3.9,
        w: 1.95,
        h: 1.9,
        fontSize: 10,
        color: theme.muted,
        breakLine: true,
      });
    }

    if (slideData.layout === "TWO_COLUMN") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 1.72,
        w: 5.74,
        h: 5,
        fill: { color: theme.surface, transparency: hasImage ? 16 : 3 },
        line: { color: "CCD8E8", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 6.69,
        y: 1.72,
        w: 5.74,
        h: 5,
        fill: { color: theme.surface, transparency: hasImage ? 16 : 3 },
        line: { color: "CCD8E8", pt: 1 },
      });
      slide.addText(heading, {
        x: 0.9,
        y: 0.85,
        w: 11.2,
        h: 0.8,
        bold: true,
        fontSize: 31,
        color: theme.text,
      });

      slide.addText(slideData.leftTitle ?? "Column A", {
        x: 1.2,
        y: 2.03,
        w: 5,
        h: 0.45,
        fontSize: 17,
        bold: true,
        color: theme.accent,
        charSpace: 0.5,
      });
      slide.addText(
        (slideData.leftBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 1.2,
          y: 2.58,
          w: 5,
          h: 3.95,
          fontSize: 15,
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
        },
      );

      slide.addText(slideData.rightTitle ?? "Column B", {
        x: 7.1,
        y: 2.03,
        w: 5,
        h: 0.45,
        fontSize: 17,
        bold: true,
        color: theme.accent,
        charSpace: 0.5,
      });
      slide.addText(
        (slideData.rightBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 7.1,
          y: 2.58,
          w: 5,
          h: 3.95,
          fontSize: 15,
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
        },
      );

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.8,
        y: 6.93,
        w: 3.74,
        h: 0.45,
        fill: { color: theme.panel, transparency: 8 },
        line: { color: "CCD7E8", pt: 1 },
      });
      slide.addText("Compare  |  Evaluate  |  Decide", {
        x: 5.0,
        y: 7.05,
        w: 3.35,
        h: 0.2,
        align: "center",
        fontSize: 10,
        color: theme.text,
      });
    }

    if (slideData.layout === "QUOTE") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 1.02,
        w: 11.9,
        h: 5.96,
        fill: { color: theme.surface, transparency: hasImage ? 22 : 3 },
        line: { color: "D1DBEA", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.18,
        y: 1.56,
        w: 0.18,
        h: 4.56,
        fill: { color: theme.accent },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addText("\u201C", {
        x: 1.52,
        y: 1.62,
        w: 0.8,
        h: 0.8,
        fontSize: 52,
        color: theme.accent,
      });
      slide.addText(slideData.quote ?? "", {
        x: 2.2,
        y: 2.14,
        w: 9.7,
        h: 2.85,
        fontSize: 34,
        italic: true,
        color: theme.text,
        breakLine: true,
      });
      slide.addText(slideData.quoteAuthor ? `- ${slideData.quoteAuthor}` : "", {
        x: 2.2,
        y: 5.2,
        w: 9.2,
        h: 0.5,
        fontSize: 19,
        bold: true,
        color: theme.muted,
      });
      slide.addText("Strategic message slide", {
        x: 2.2,
        y: 5.7,
        w: 4.5,
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
        fill: { color: theme.surface, transparency: hasImage ? 18 : 2 },
        line: { color: "CFD9E8", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.58,
        y: 1.88,
        w: 4.16,
        h: 0.5,
        fill: { color: theme.accent, transparency: 4 },
        line: { color: theme.accent, pt: 0 },
      });
      slide.addText("FINAL FRAME", {
        x: 4.73,
        y: 2.03,
        w: 3.85,
        h: 0.18,
        align: "center",
        fontSize: 10,
        bold: true,
        color: theme.inverseText,
        charSpace: 1,
      });
      slide.addText(heading, {
        x: 1.5,
        y: 2.66,
        w: 10.3,
        h: 1,
        align: "center",
        fontSize: 40,
        bold: true,
        color: theme.text,
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 2.2,
        y: 3.86,
        w: 8.9,
        h: 0.9,
        align: "center",
        fontSize: 19,
        color: theme.muted,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.7,
        y: 4.98,
        w: 3.9,
        h: 0.9,
        fill: { color: theme.panel, transparency: 7 },
        line: { color: "CFD9E8", pt: 1 },
      });
      slide.addText("Q&A  |  Next Steps  |  Contact", {
        x: 4.95,
        y: 5.26,
        w: 3.4,
        h: 0.25,
        align: "center",
        fontSize: 11,
        color: theme.text,
      });
    }

    if (slideData.speakerNotes) {
      slide.addNotes(`\n[Notes]\n${slideData.speakerNotes}`);
    }
  });

  await pptx.writeFile({ fileName: "E-Z-PPT_Deck.pptx" });
}
