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

type VisualStyle = "modern" | "futuristic" | "corporate" | "startup";
type BackgroundStyle = "minimal" | "glassmorphism" | "gradient" | "abstract";

type SlideLook = {
  accent: string;
  titleFont: string;
  bodyFont: string;
  bg: string;
  panel: string;
  backgroundStyle: BackgroundStyle;
  concept: "editorial" | "tech_grid" | "bold_impact" | "clean_airy";
  titleScale: number;
  bodyScale: number;
  titleAllCaps: boolean;
  titleItalic: boolean;
  titleCharSpace: number;
};

const accentColorMap: Record<string, string> = {
  blue: "0A4CD8",
  cyan: "0891B2",
  teal: "0F766E",
  green: "0F766E",
  orange: "E35B12",
  red: "BE123C",
  pink: "DB2777",
  purple: "7C3AED",
  indigo: "4338CA",
  yellow: "CA8A04",
  gold: "B7791F",
  slate: "334155",
  gray: "4B5563",
  black: "111827",
};

const visualStyleFonts: Record<VisualStyle, { title: string; body: string }> = {
  modern: { title: "Aptos Display", body: "Aptos" },
  futuristic: { title: "Bahnschrift", body: "Segoe UI" },
  corporate: { title: "Cambria", body: "Calibri" },
  startup: { title: "Trebuchet MS", body: "Arial" },
};

function sanitizeHexColor(input: string | undefined) {
  if (!input) {
    return null;
  }
  const normalized = input.replace("#", "").trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

function resolveAccentColor(input: string | undefined, fallback: string) {
  const sanitized = sanitizeHexColor(input);
  if (sanitized) {
    return sanitized;
  }
  const token = input?.trim().toLowerCase();
  if (token && accentColorMap[token]) {
    return accentColorMap[token];
  }
  return fallback;
}

function resolveSlideLook(slide: Slide, theme: Theme, index: number): SlideLook {
  const visualStyle = slide.design?.visualStyle ?? (index % 2 === 0 ? "modern" : "startup");
  const fonts = visualStyleFonts[visualStyle];
  const accent = resolveAccentColor(slide.design?.accentColor, theme.accent);
  const requestedTheme = slide.design?.theme;

  const bg =
    requestedTheme === "dark"
      ? "0B1220"
      : requestedTheme === "neon"
        ? "071019"
        : requestedTheme === "gradient"
          ? "EAF1FF"
          : theme.bg;

  const panel = requestedTheme === "dark" || requestedTheme === "neon" ? "1E293B" : theme.panel;

  const concept = ((): SlideLook["concept"] => {
    if (slide.design?.visualStyle === "futuristic") {
      return "tech_grid";
    }
    if (slide.design?.visualStyle === "corporate") {
      return "clean_airy";
    }
    if (slide.design?.visualStyle === "startup") {
      return "bold_impact";
    }
    return (["editorial", "tech_grid", "bold_impact", "clean_airy"] as const)[index % 4];
  })();

  const conceptConfig: Record<
    SlideLook["concept"],
    Pick<SlideLook, "titleFont" | "bodyFont" | "titleScale" | "bodyScale" | "titleAllCaps" | "titleItalic" | "titleCharSpace">
  > = {
    editorial: {
      titleFont: "Georgia",
      bodyFont: "Calibri",
      titleScale: 1.08,
      bodyScale: 0.98,
      titleAllCaps: false,
      titleItalic: false,
      titleCharSpace: 0,
    },
    tech_grid: {
      titleFont: "Bahnschrift",
      bodyFont: "Segoe UI",
      titleScale: 1.02,
      bodyScale: 1.0,
      titleAllCaps: true,
      titleItalic: false,
      titleCharSpace: 3,
    },
    bold_impact: {
      titleFont: "Franklin Gothic Medium",
      bodyFont: "Trebuchet MS",
      titleScale: 1.14,
      bodyScale: 1.03,
      titleAllCaps: true,
      titleItalic: false,
      titleCharSpace: 1,
    },
    clean_airy: {
      titleFont: "Cambria",
      bodyFont: "Aptos",
      titleScale: 0.96,
      bodyScale: 1.04,
      titleAllCaps: false,
      titleItalic: true,
      titleCharSpace: 0,
    },
  };

  const cfg = conceptConfig[concept];

  return {
    accent,
    titleFont: cfg.titleFont || fonts.title,
    bodyFont: cfg.bodyFont || fonts.body,
    bg,
    panel,
    backgroundStyle: slide.design?.backgroundStyle ?? "minimal",
    concept,
    titleScale: cfg.titleScale,
    bodyScale: cfg.bodyScale,
    titleAllCaps: cfg.titleAllCaps,
    titleItalic: cfg.titleItalic,
    titleCharSpace: cfg.titleCharSpace,
  };
}

function addBackgroundEffects(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  look: SlideLook,
  theme: Theme,
) {
  if (look.backgroundStyle === "gradient") {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 2.6,
      fill: { color: look.accent, transparency: 86 },
      line: { color: look.accent, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 2.6,
      w: 13.33,
      h: 2.4,
      fill: { color: theme.surface, transparency: 74 },
      line: { color: theme.surface, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 5,
      w: 13.33,
      h: 2.5,
      fill: { color: look.accent, transparency: 92 },
      line: { color: look.accent, pt: 0 },
    });
  }

  if (look.backgroundStyle === "glassmorphism") {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.55,
      y: 0.55,
      w: 12.2,
      h: 6.35,
      fill: { color: "FFFFFF", transparency: 78 },
      line: { color: "FFFFFF", pt: 1, transparency: 36 },
      radius: 0.14,
    });
  }

  if (look.backgroundStyle === "abstract") {
    slide.addShape(pptx.ShapeType.chevron, {
      x: 10.7,
      y: 0.65,
      w: 2.2,
      h: 1.3,
      fill: { color: look.accent, transparency: 85 },
      line: { color: look.accent, pt: 0 },
    });
    slide.addShape(pptx.ShapeType.donut, {
      x: 0.35,
      y: 5.55,
      w: 1.3,
      h: 1.3,
      fill: { color: look.accent, transparency: 80 },
      line: { color: look.accent, pt: 0 },
    });
  }

  if (look.concept === "tech_grid") {
    for (let x = 0.8; x <= 12.6; x += 1.1) {
      slide.addShape(pptx.ShapeType.line, {
        x,
        y: 0.4,
        w: 0,
        h: 6.6,
        line: { color: look.accent, pt: 0.3, transparency: 86 },
      });
    }
    for (let y = 0.8; y <= 6.8; y += 0.9) {
      slide.addShape(pptx.ShapeType.line, {
        x: 0.35,
        y,
        w: 12.7,
        h: 0,
        line: { color: look.accent, pt: 0.3, transparency: 88 },
      });
    }
  }

  if (look.concept === "bold_impact") {
    slide.addShape(pptx.ShapeType.chevron, {
      x: 9.9,
      y: -0.25,
      w: 3.9,
      h: 2.2,
      fill: { color: look.accent, transparency: 82 },
      line: { color: look.accent, pt: 0 },
    });
  }

  if (look.concept === "editorial") {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.12,
      y: 0.45,
      w: 0.12,
      h: 6.5,
      fill: { color: look.accent, transparency: 20 },
      line: { color: look.accent, pt: 0 },
    });
  }
}

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
    const look = resolveSlideLook(slideData, theme, index);
    const heading = slideData.title || `Slide ${index + 1}`;
    const headingText = look.titleAllCaps ? heading.toUpperCase() : heading;
    const titleSize = (base: number) => Math.max(12, Math.round(base * look.titleScale));
    const bodySize = (base: number) => Math.max(9, Math.round(base * look.bodyScale));

    slide.background = { color: look.bg };
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
          fill: { color: look.bg, transparency: 70 },
          line: { color: look.bg, pt: 0 },
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
        fill: { color: look.accent, transparency: 88 },
        line: { color: look.accent, pt: 0 },
      });
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 10.85,
        y: 5.2,
        w: 2.8,
        h: 2.8,
        fill: { color: look.accent, transparency: 90 },
        line: { color: look.accent, pt: 0 },
      });
    }

    addBackgroundEffects(pptx, slide, look, theme);

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 4.44,
      h: 0.16,
      fill: { color: look.accent },
      line: { color: look.accent, pt: 0 },
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
      line: { color: look.accent, pt: 2 },
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
      fontSize: bodySize(10),
      bold: true,
      color: theme.text,
      charSpace: 1,
      fontFace: look.bodyFont,
    });

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
        color: look.accent,
        charSpace: 1,
        fontFace: look.bodyFont,
      });
      slide.addText(headingText, {
        x: 1.39,
        y: 1.99,
        w: 10.5,
        h: 1.95,
        align: "left",
        bold: true,
        fontSize: titleSize(46),
        color: look.accent,
        breakLine: true,
        fontFace: look.titleFont,
        transparency: 78,
        charSpace: look.titleCharSpace,
      });
      slide.addText(headingText, {
        x: 1.35,
        y: 1.95,
        w: 10.5,
        h: 1.95,
        align: "left",
        bold: true,
        fontSize: titleSize(46),
        color: theme.text,
        breakLine: true,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        charSpace: look.titleCharSpace,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1.35,
        y: 4.58,
        w: 8.35,
        h: 1.2,
        fill: { color: look.panel, transparency: 8 },
        line: { color: "D3DDEC", pt: 1 },
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 1.65,
        y: 4.9,
        w: 7.95,
        h: 0.78,
        align: "left",
        fontSize: bodySize(18),
        color: theme.muted,
        breakLine: true,
        fontFace: look.bodyFont,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 9.95,
        y: 4.58,
        w: 2.05,
        h: 1.2,
        fill: { color: look.accent, transparency: 4 },
        line: { color: look.accent, pt: 0 },
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
        fontFace: look.bodyFont,
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
        fill: { color: look.panel, transparency: hasImage ? 16 : 2 },
        line: { color: "CFD9E8", pt: 1 },
      });
      slide.addText(heading, {
        x: 1.2,
        y: 1.18,
        w: 8.2,
        h: 0.8,
        bold: true,
        fontSize: titleSize(30),
        color: theme.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        charSpace: look.titleCharSpace,
      });
      const bullets = (slideData.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 } } }));
      slide.addText(bullets, {
        x: 1.2,
        y: 2.13,
        w: 8.2,
        h: 4.4,
        fontSize: bodySize(16),
        color: theme.text,
        breakLine: true,
        paraSpaceAfter: 9,
        fontFace: look.bodyFont,
      });

      slide.addText("KEY TAKEAWAY", {
        x: 10.17,
        y: 1.25,
        w: 1.95,
        h: 0.28,
        bold: true,
        fontSize: 10,
        color: look.accent,
        charSpace: 0.8,
        fontFace: look.bodyFont,
      });
      slide.addText(slideData.bullets?.[0] ?? "Primary insight", {
        x: 10.17,
        y: 1.67,
        w: 1.95,
        h: 1.5,
        fontSize: bodySize(12),
        color: theme.text,
        breakLine: true,
        fontFace: look.bodyFont,
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
        fontFace: look.bodyFont,
      });
      slide.addText(slideData.speakerNotes ?? "Share one short example to make this point concrete.", {
        x: 10.17,
        y: 3.9,
        w: 1.95,
        h: 1.9,
        fontSize: bodySize(10),
        color: theme.muted,
        breakLine: true,
        fontFace: look.bodyFont,
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
      slide.addText(headingText, {
        x: 0.9,
        y: 0.85,
        w: 11.2,
        h: 0.8,
        bold: true,
        fontSize: titleSize(31),
        color: theme.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        charSpace: look.titleCharSpace,
      });

      slide.addText(slideData.leftTitle ?? "Column A", {
        x: 1.2,
        y: 2.03,
        w: 5,
        h: 0.45,
        fontSize: 17,
        bold: true,
        color: look.accent,
        charSpace: 0.5,
        fontFace: look.bodyFont,
      });
      slide.addText(
        (slideData.leftBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 1.2,
          y: 2.58,
          w: 5,
          h: 3.95,
          fontSize: bodySize(15),
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
          fontFace: look.bodyFont,
        },
      );

      slide.addText(slideData.rightTitle ?? "Column B", {
        x: 7.1,
        y: 2.03,
        w: 5,
        h: 0.45,
        fontSize: 17,
        bold: true,
        color: look.accent,
        charSpace: 0.5,
        fontFace: look.bodyFont,
      });
      slide.addText(
        (slideData.rightBullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 14 } } })),
        {
          x: 7.1,
          y: 2.58,
          w: 5,
          h: 3.95,
          fontSize: bodySize(15),
          color: theme.text,
          breakLine: true,
          paraSpaceAfter: 8,
          fontFace: look.bodyFont,
        },
      );

      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.8,
        y: 6.93,
        w: 3.74,
        h: 0.45,
        fill: { color: look.panel, transparency: 8 },
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
        fontFace: look.bodyFont,
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
        fill: { color: look.accent },
        line: { color: look.accent, pt: 0 },
      });
      slide.addText("\u201C", {
        x: 1.52,
        y: 1.62,
        w: 0.8,
        h: 0.8,
        fontSize: 52,
        color: look.accent,
        fontFace: look.titleFont,
      });
      slide.addText(slideData.quote ?? "", {
        x: 2.2,
        y: 2.14,
        w: 9.7,
        h: 2.85,
        fontSize: titleSize(34),
        italic: true,
        color: theme.text,
        breakLine: true,
        fontFace: look.titleFont,
      });
      slide.addText(slideData.quoteAuthor ? `- ${slideData.quoteAuthor}` : "", {
        x: 2.2,
        y: 5.2,
        w: 9.2,
        h: 0.5,
        fontSize: 19,
        bold: true,
        color: theme.muted,
        fontFace: look.bodyFont,
      });
      slide.addText("Strategic message slide", {
        x: 2.2,
        y: 5.7,
        w: 4.5,
        h: 0.3,
        fontSize: 11,
        color: theme.muted,
        fontFace: look.bodyFont,
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
        fill: { color: look.accent, transparency: 4 },
        line: { color: look.accent, pt: 0 },
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
        fontFace: look.bodyFont,
      });
      slide.addText(headingText, {
        x: 1.5,
        y: 2.66,
        w: 10.3,
        h: 1,
        align: "center",
        fontSize: titleSize(40),
        bold: true,
        color: theme.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        charSpace: look.titleCharSpace,
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: 2.2,
        y: 3.86,
        w: 8.9,
        h: 0.9,
        align: "center",
        fontSize: bodySize(19),
        color: theme.muted,
        fontFace: look.bodyFont,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.7,
        y: 4.98,
        w: 3.9,
        h: 0.9,
        fill: { color: look.panel, transparency: 7 },
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
        fontFace: look.bodyFont,
      });
    }

    if (slideData.speakerNotes) {
      slide.addNotes(`\n[Notes]\n${slideData.speakerNotes}`);
    }
  });

  await pptx.writeFile({ fileName: "E-Z-PPT_Deck.pptx" });
}
