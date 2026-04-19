import pptxgen from "pptxgenjs";
import type { PptStyle, Slide, Tone } from "@/types/slides";

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
  surface: string;
  text: string;
  muted: string;
  inverseText: string;
  emphasis: "title" | "numbers" | "contrast" | "minimal";
  layoutVariant: "asymmetric" | "centered" | "split" | "editorial" | "grid";
  backgroundStyle: BackgroundStyle;
  concept: "editorial" | "tech_grid" | "bold_impact" | "clean_airy";
  titleScale: number;
  bodyScale: number;
  titleAllCaps: boolean;
  titleItalic: boolean;
  titleCharSpace: number;
};

type StylePreset = {
  titleBoost: number;
  bodyBoost: number;
  headlineWeight: "clean" | "bold" | "editorial";
  accentIntensity: number;
};

const stylePresets: Record<PptStyle, StylePreset> = {
  Executive: {
    titleBoost: 0.94,
    bodyBoost: 1.02,
    headlineWeight: "clean",
    accentIntensity: 0.6,
  },
  Bold: {
    titleBoost: 1.16,
    bodyBoost: 1,
    headlineWeight: "bold",
    accentIntensity: 1,
  },
  Magazine: {
    titleBoost: 1.04,
    bodyBoost: 1.03,
    headlineWeight: "editorial",
    accentIntensity: 0.75,
  },
  Reference: {
    titleBoost: 1.08,
    bodyBoost: 1,
    headlineWeight: "bold",
    accentIntensity: 1,
  },
};

const referencePalette = {
  charcoal: "383738",
  cream: "EAE4D4",
  rust: "C84427",
  rustDeep: "B53F25",
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

function resolveSlideLook(slide: Slide, theme: Theme, index: number, pptStyle: PptStyle): SlideLook {
  const visualStyle = slide.design?.visualStyle ?? (index % 2 === 0 ? "modern" : "startup");
  const fonts = visualStyleFonts[visualStyle];
  const preset = stylePresets[pptStyle];
  const requestedTheme = slide.design?.theme;
  const isReferenceStyle = pptStyle === "Reference";
  const referenceDarkLayout = slide.layout === "TITLE" || slide.layout === "QUOTE" || slide.layout === "CLOSING" || index % 2 === 0;

  const bg =
    isReferenceStyle
      ? referenceDarkLayout
        ? referencePalette.charcoal
        : referencePalette.cream
      : requestedTheme === "dark"
      ? "0B1220"
      : requestedTheme === "neon"
        ? "071019"
        : requestedTheme === "gradient"
          ? "EAF1FF"
          : theme.bg;

  const isDarkTheme = isReferenceStyle ? referenceDarkLayout : requestedTheme === "dark" || requestedTheme === "neon";
  const panel = isReferenceStyle ? (isDarkTheme ? "4A4748" : "D9D0BE") : isDarkTheme ? "1E293B" : theme.panel;
  const surface = isReferenceStyle ? (isDarkTheme ? "4A4748" : "F5EFE4") : isDarkTheme ? "0F172A" : theme.surface;
  const text = isReferenceStyle ? (isDarkTheme ? referencePalette.cream : referencePalette.charcoal) : isDarkTheme ? "E2E8F0" : theme.text;
  const muted = isReferenceStyle ? (isDarkTheme ? "D3CDBF" : "5A5551") : isDarkTheme ? "94A3B8" : theme.muted;
  const inverseText = isReferenceStyle ? (isDarkTheme ? referencePalette.charcoal : referencePalette.cream) : isDarkTheme ? "0B1220" : theme.inverseText;

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
  const titleFont =
    isReferenceStyle
      ? "Bahnschrift"
      : preset.headlineWeight === "editorial"
        ? "Georgia"
        : preset.headlineWeight === "bold"
          ? "Bahnschrift"
          : cfg.titleFont || fonts.title;
  const bodyFont = isReferenceStyle ? "Calibri" : preset.headlineWeight === "editorial" ? "Cambria" : cfg.bodyFont || fonts.body;
  const accent = isReferenceStyle
    ? resolveAccentColor(slide.design?.accentColor, referencePalette.rust)
    : preset.accentIntensity >= 0.95
      ? resolveAccentColor(slide.design?.accentColor, theme.accent)
      : preset.accentIntensity <= 0.65
        ? "3B82F6"
        : resolveAccentColor(slide.design?.accentColor, theme.accent);

  return {
    accent,
    titleFont,
    bodyFont,
    bg,
    panel,
    surface,
    text,
    muted,
    inverseText,
    emphasis: slide.design?.emphasis ?? "contrast",
    layoutVariant: slide.design?.layoutVariant ?? (isReferenceStyle ? "editorial" : "asymmetric"),
    backgroundStyle: slide.design?.backgroundStyle ?? (isReferenceStyle ? "minimal" : "minimal"),
    concept,
    titleScale: cfg.titleScale * preset.titleBoost,
    bodyScale: cfg.bodyScale * preset.bodyBoost,
    titleAllCaps: isReferenceStyle ? true : cfg.titleAllCaps,
    titleItalic: isReferenceStyle ? false : cfg.titleItalic,
    titleCharSpace: isReferenceStyle ? 1 : cfg.titleCharSpace,
  };
}

function addBackgroundEffects(
  pptx: pptxgen,
  slide: pptxgen.Slide,
  look: SlideLook,
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
      fill: { color: look.surface, transparency: 74 },
      line: { color: look.surface, pt: 0 },
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

function addReferenceScaffold(pptx: pptxgen, slide: pptxgen.Slide, look: SlideLook, index: number) {
  slide.addShape(pptx.ShapeType.line, {
    x: 12.28,
    y: 0.8,
    w: 0,
    h: 5.9,
    line: { color: look.text, pt: 1, transparency: 12 },
  });

  for (let i = 0; i < 7; i += 1) {
    const y = 1.1 + i * 0.85;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: 12.13,
      y,
      w: 0.28,
      h: 0.28,
      fill: { color: i === index % 7 ? look.accent : look.text, transparency: i === index % 7 ? 0 : 14 },
      line: { color: i === index % 7 ? look.accent : look.text, pt: 0 },
    });
  }

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.58,
    y: 0.55,
    w: 0.38,
    h: 0.38,
    fill: { color: look.bg, transparency: 100 },
    line: { color: look.accent, pt: 1.5 },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 11.52,
    y: 6.46,
    w: 0.38,
    h: 0.38,
    fill: { color: look.bg, transparency: 100 },
    line: { color: look.accent, pt: 1.5 },
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.9,
    y: 6.92,
    w: 11.1,
    h: 0.05,
    fill: { color: look.text, transparency: 26 },
    line: { color: look.text, pt: 0 },
  });
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

async function blobToDataUrl(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new Error("Unable to convert image blob to data URL."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Failed reading image blob."));
    reader.readAsDataURL(blob);
  });
}

async function fetchImageAsDataUrl(url: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, {
      signal: controller.signal,
      mode: "cors",
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return null;
    }

    const blob = await response.blob();
    if (!blob.size) {
      return null;
    }

    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

export async function downloadDeck(slides: Slide[], tone: Tone, pptStyle: PptStyle) {
  const pptx = new pptxgen();
  const theme = themes[tone];
  const imageDataCache = new Map<string, string | null>();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "E-Z-PPT";
  pptx.company = "E-Z-PPT";
  pptx.subject = "AI generated deck";
  pptx.title = "E-Z-PPT Deck";

  for (const [index, slideData] of slides.entries()) {
    const slide = pptx.addSlide();
    const isReferenceStyle = pptStyle === "Reference";
    const allowHeroImage = slideData.layout === "TITLE" || slideData.layout === "QUOTE" || slideData.layout === "CLOSING";
    const hasHeroImage = Boolean(slideData.imageUrl && allowHeroImage && !isReferenceStyle);
    const look = resolveSlideLook(slideData, theme, index, pptStyle);
    let imageData: string | null = null;

    if (slideData.imageUrl) {
      const imageUrl = slideData.imageUrl;
      if (!imageDataCache.has(imageUrl)) {
        imageDataCache.set(imageUrl, await fetchImageAsDataUrl(imageUrl));
      }
      imageData = imageDataCache.get(imageUrl) ?? null;
    }

    const heading = slideData.title || `Slide ${index + 1}`;
    const headingText = look.titleAllCaps ? heading.toUpperCase() : heading;
    const titleSize = (base: number) => Math.max(12, Math.round(base * look.titleScale));
    const bodySize = (base: number) => Math.max(9, Math.round(base * look.bodyScale));
    const centeredHeadings = look.layoutVariant === "centered" || look.concept === "clean_airy" || look.emphasis === "contrast";
    const splitLayout = look.layoutVariant === "split";
    const editorialLayout = look.layoutVariant === "editorial";
    const titleHeadingX = centeredHeadings ? 1.1 : 1.35;
    const titleHeadingW = centeredHeadings ? 11.1 : 10.5;
    const titleHeadingAlign: "left" | "center" = centeredHeadings ? "center" : "left";

    slide.background = { color: look.bg };
    if (hasHeroImage) {
      if (imageData) {
        slide.addImage({
          data: imageData,
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

    addBackgroundEffects(pptx, slide, look);
    if (isReferenceStyle) {
      addReferenceScaffold(pptx, slide, look, index);
    }

    if (look.layoutVariant === "asymmetric") {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: 5.9,
        h: 0.16,
        fill: { color: look.accent },
        line: { color: look.accent, pt: 0 },
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 5.9,
        y: 0,
        w: 7.43,
        h: 0.16,
        fill: { color: look.text },
        line: { color: look.text, pt: 0 },
      });
    } else if (look.layoutVariant === "centered") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 5.16,
        y: 0.2,
        w: 3,
        h: 0.18,
        fill: { color: look.accent, transparency: 12 },
        line: { color: look.accent, pt: 0 },
      });
    } else if (look.layoutVariant === "split") {
      slide.addShape(pptx.ShapeType.rect, {
        x: 6.61,
        y: 0,
        w: 0.11,
        h: 7.5,
        fill: { color: look.accent, transparency: 22 },
        line: { color: look.accent, pt: 0 },
      });
    } else if (look.layoutVariant === "editorial") {
      slide.addShape(pptx.ShapeType.rect, {
        x: 0.32,
        y: 0.26,
        w: 0.07,
        h: 6.95,
        fill: { color: look.accent, transparency: 0 },
        line: { color: look.accent, pt: 0 },
      });
      slide.addShape(pptx.ShapeType.line, {
        x: 0.6,
        y: 0.5,
        w: 2.4,
        h: 0,
        line: { color: look.accent, pt: 1.6 },
      });
    } else {
      for (let i = 0; i < 4; i += 1) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6 + i * 0.34,
          y: 0.24,
          w: 0.2,
          h: 0.2,
          fill: { color: i % 2 === 0 ? look.accent : look.text, transparency: 18 },
          line: { color: i % 2 === 0 ? look.accent : look.text, pt: 0 },
        });
      }
    }

    if (slideData.layout === "TITLE") {
      if (isReferenceStyle && imageData) {
        slide.addImage({
          data: imageData,
          x: 0.72,
          y: 1.15,
          w: 4.65,
          h: 5.55,
        });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: isReferenceStyle ? 5.6 : 1.05,
        y: isReferenceStyle ? 1.02 : 1,
        w: isReferenceStyle ? 6.2 : 11.2,
        h: isReferenceStyle ? 5.7 : 5.75,
        fill: { color: look.surface, transparency: hasHeroImage ? 18 : isReferenceStyle ? 12 : 4 },
        line: { color: isReferenceStyle ? look.accent : "CED8E9", pt: 1 },
      });
      slide.addText(headingText, {
        x: titleHeadingX + 0.04,
        y: 1.99,
        w: titleHeadingW,
        h: 1.95,
        align: titleHeadingAlign,
        bold: true,
        fontSize: titleSize(46),
        color: look.accent,
        breakLine: true,
        fontFace: look.titleFont,
        transparency: 78,
      });
      slide.addText(headingText, {
        x: titleHeadingX,
        y: 1.95,
        w: titleHeadingW,
        h: 1.95,
        align: titleHeadingAlign,
        bold: true,
        fontSize: titleSize(46),
        color: look.text,
        breakLine: true,
        fontFace: look.titleFont,
        italic: look.titleItalic,
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: isReferenceStyle ? 5.95 : splitLayout ? 1.0 : 1.35,
        y: 4.58,
        w: isReferenceStyle ? 5.45 : splitLayout ? 11.2 : 8.35,
        h: 1.2,
        fill: { color: look.panel, transparency: 8 },
        line: { color: isReferenceStyle ? look.text : "D3DDEC", pt: 1 },
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: isReferenceStyle ? 6.2 : splitLayout ? 1.3 : centeredHeadings ? 1.4 : 1.65,
        y: 4.9,
        w: isReferenceStyle ? 4.85 : splitLayout ? 10.6 : centeredHeadings ? 7.8 : 7.95,
        h: 0.78,
        align: isReferenceStyle ? "left" : centeredHeadings ? "center" : "left",
        fontSize: bodySize(18),
        color: look.muted,
        breakLine: true,
        fontFace: look.bodyFont,
      });
    }

    if (slideData.layout === "BULLETS") {
      if (isReferenceStyle && imageData) {
        slide.addImage({
          data: imageData,
          x: 8.58,
          y: 1.2,
          w: 3.2,
          h: 4.55,
        });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 0.95,
        w: isReferenceStyle ? 7.25 : 8.85,
        h: 5.95,
        fill: { color: look.surface, transparency: hasHeroImage ? 16 : isReferenceStyle ? 10 : 3 },
        line: { color: isReferenceStyle ? look.text : "CFD9E8", pt: 1 },
      });
      slide.addText(headingText, {
        x: 1.2,
        y: 1.18,
        w: 10.8,
        h: 0.8,
        bold: true,
        fontSize: titleSize(30),
        color: look.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        align: centeredHeadings ? "center" : "left",
      });
      const bullets = (slideData.bullets ?? []).map((b) => ({ text: b, options: { bullet: { indent: 18 } } }));
      slide.addText(bullets, {
        x: 1.2,
        y: 2.13,
        w: isReferenceStyle ? 6.5 : 10.8,
        h: 4.4,
        fontSize: bodySize(16),
        color: look.text,
        breakLine: true,
        paraSpaceAfter: 9,
        fontFace: look.bodyFont,
      });
    }

    if (slideData.layout === "TWO_COLUMN") {
      if (isReferenceStyle && imageData) {
        slide.addImage({
          data: imageData,
          x: 0.92,
          y: 0.95,
          w: 2.45,
          h: 1.15,
        });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: editorialLayout ? 0.7 : 0.9,
        y: 1.72,
        w: editorialLayout ? 5.94 : 5.74,
        h: 5,
        fill: { color: look.surface, transparency: hasHeroImage ? 16 : isReferenceStyle ? 8 : 3 },
        line: { color: isReferenceStyle ? look.text : "CCD8E8", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: editorialLayout ? 6.64 : 6.69,
        y: 1.72,
        w: editorialLayout ? 5.94 : 5.74,
        h: 5,
        fill: { color: look.surface, transparency: hasHeroImage ? 16 : isReferenceStyle ? 8 : 3 },
        line: { color: isReferenceStyle ? look.text : "CCD8E8", pt: 1 },
      });
      slide.addText(headingText, {
        x: 0.9,
        y: 0.85,
        w: 11.2,
        h: 0.8,
        bold: true,
        fontSize: titleSize(31),
        color: look.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
        align: centeredHeadings ? "center" : "left",
      });

      slide.addText(slideData.leftTitle ?? "Column A", {
        x: 1.2,
        y: 2.03,
        w: 5,
        h: 0.45,
        fontSize: 17,
        bold: true,
        color: look.accent,
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
          color: look.text,
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
          color: look.text,
          breakLine: true,
          paraSpaceAfter: 8,
          fontFace: look.bodyFont,
        },
      );

      slide.addShape(pptx.ShapeType.line, {
        x: 6.665,
        y: 1.95,
        w: 0,
        h: 4.7,
        line: { color: "D5DFEC", pt: 1 },
      });
    }

    if (slideData.layout === "QUOTE") {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: 1.02,
        w: 11.9,
        h: 5.96,
        fill: { color: look.surface, transparency: hasHeroImage ? 22 : isReferenceStyle ? 14 : 3 },
        line: { color: isReferenceStyle ? look.text : "D1DBEA", pt: 1 },
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
        color: look.text,
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
        color: look.muted,
        fontFace: look.bodyFont,
      });
    }

    if (slideData.layout === "CLOSING") {
      if (isReferenceStyle && imageData) {
        slide.addImage({
          data: imageData,
          x: 8.82,
          y: 1.88,
          w: 2.95,
          h: 3.62,
        });
      }
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 1,
        y: 1.5,
        w: 11.3,
        h: 4.6,
        fill: { color: look.surface, transparency: hasHeroImage ? 18 : isReferenceStyle ? 12 : 2 },
        line: { color: isReferenceStyle ? look.text : "CFD9E8", pt: 1 },
      });
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 4.58,
        y: 1.88,
        w: 4.16,
        h: 0.5,
        fill: { color: look.accent, transparency: 4 },
        line: { color: look.accent, pt: 0 },
      });
      slide.addText(headingText, {
        x: 1.5,
        y: 2.66,
        w: 10.3,
        h: 1,
        align: splitLayout ? "left" : centeredHeadings ? "center" : "left",
        fontSize: titleSize(40),
        bold: true,
        color: look.text,
        fontFace: look.titleFont,
        italic: look.titleItalic,
      });
      slide.addText(slideData.content ?? slideData.subtitle ?? "", {
        x: splitLayout ? 1.8 : centeredHeadings ? 2.2 : 1.8,
        y: 3.86,
        w: splitLayout ? 9.8 : centeredHeadings ? 8.9 : 9.8,
        h: 0.9,
        align: splitLayout ? "left" : centeredHeadings ? "center" : "left",
        fontSize: bodySize(19),
        color: look.muted,
        fontFace: look.bodyFont,
      });
    }

    if (slideData.speakerNotes) {
      slide.addNotes(`\n[Notes]\n${slideData.speakerNotes}`);
    }
  }

  await pptx.writeFile({ fileName: "E-Z-PPT_Deck.pptx" });
}
