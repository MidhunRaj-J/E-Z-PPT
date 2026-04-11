import Image from "next/image";
import type { Slide } from "@/types/slides";

type SlidePreviewProps = {
  slide: Slide;
  index: number;
};

export function SlidePreview({ slide, index }: SlidePreviewProps) {
  const accentColorMap: Record<string, string> = {
    blue: "#0A4CD8",
    cyan: "#0891B2",
    teal: "#0F766E",
    green: "#0F766E",
    orange: "#E35B12",
    red: "#BE123C",
    pink: "#DB2777",
    purple: "#7C3AED",
    indigo: "#4338CA",
    yellow: "#CA8A04",
    gold: "#B7791F",
    slate: "#334155",
    gray: "#4B5563",
    black: "#111827",
  };

  const visualStyle = slide.design?.visualStyle ?? (index % 2 === 0 ? "modern" : "startup");
  const concept =
    visualStyle === "futuristic"
      ? "tech_grid"
      : visualStyle === "corporate"
        ? "clean_airy"
        : visualStyle === "startup"
          ? "bold_impact"
          : (["editorial", "tech_grid", "bold_impact", "clean_airy"] as const)[index % 4];

  const conceptConfig = {
    editorial: {
      titleFont: "Georgia, Cambria, serif",
      bodyFont: "Calibri, Arial, sans-serif",
      titleScale: 1.08,
      bodyScale: 0.98,
      titleAllCaps: false,
      titleItalic: false,
      titleSpacing: "0em",
    },
    tech_grid: {
      titleFont: "Bahnschrift, Segoe UI, sans-serif",
      bodyFont: "Segoe UI, Arial, sans-serif",
      titleScale: 1.02,
      bodyScale: 1,
      titleAllCaps: true,
      titleItalic: false,
      titleSpacing: "0.08em",
    },
    bold_impact: {
      titleFont: "Franklin Gothic Medium, Trebuchet MS, sans-serif",
      bodyFont: "Trebuchet MS, Arial, sans-serif",
      titleScale: 1.14,
      bodyScale: 1.03,
      titleAllCaps: true,
      titleItalic: false,
      titleSpacing: "0.03em",
    },
    clean_airy: {
      titleFont: "Cambria, Georgia, serif",
      bodyFont: "Aptos, Calibri, Arial, sans-serif",
      titleScale: 0.96,
      bodyScale: 1.04,
      titleAllCaps: false,
      titleItalic: true,
      titleSpacing: "0em",
    },
  } as const;

  const cfg = conceptConfig[concept];
  const hexAccent = slide.design?.accentColor?.trim().toLowerCase() ?? "";
  const accent = /^#?[0-9a-f]{6}$/i.test(hexAccent)
    ? `#${hexAccent.replace("#", "")}`
    : accentColorMap[hexAccent] ?? "#0A4CD8";

  const themeBg =
    slide.design?.theme === "dark"
      ? "#0B1220"
      : slide.design?.theme === "neon"
        ? "#071019"
        : slide.design?.theme === "gradient"
          ? "#EAF1FF"
          : "#FFFFFF";
  const textColor = slide.design?.theme === "dark" || slide.design?.theme === "neon" ? "#E5E7EB" : "#0F172A";
  const subTextColor = slide.design?.theme === "dark" || slide.design?.theme === "neon" ? "#94A3B8" : "#475569";

  const headingText = cfg.titleAllCaps ? (slide.title || `Slide ${index + 1}`).toUpperCase() : slide.title || `Slide ${index + 1}`;
  const layoutVariant = slide.design?.layoutVariant ?? "asymmetric";
  const centeredHeadings = layoutVariant === "centered" || concept === "clean_airy" || slide.design?.emphasis === "contrast";
  const splitLayout = layoutVariant === "split";
  const allowHeroImage = slide.layout === "TITLE" || slide.layout === "QUOTE" || slide.layout === "CLOSING";
  const hasImage = Boolean(slide.imageUrl && allowHeroImage);
  const titleStyle = {
    fontFamily: cfg.titleFont,
    letterSpacing: cfg.titleSpacing,
    fontStyle: cfg.titleItalic ? "italic" : "normal",
    fontSize: `${Math.round(34 * cfg.titleScale)}px`,
    lineHeight: 1.1,
    color: textColor,
    textAlign: centeredHeadings ? "center" : "left",
  } as const;
  const bodyStyle = {
    fontFamily: cfg.bodyFont,
    fontSize: `${Math.round(16 * cfg.bodyScale)}px`,
    lineHeight: 1.5,
    color: subTextColor,
  } as const;

  return (
    <article className="group w-full anim-reveal" data-delay={String((index % 3) + 1)}>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-slate-500">
        <span>Slide {index + 1}</span>
        <span>{slide.layout.replace("_", " ")}</span>
      </div>

      <div
        className="card-lift relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-slate-200 p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)]"
        style={{ backgroundColor: themeBg }}
      >
        {layoutVariant === "split" && <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2" style={{ backgroundColor: accent, opacity: 0.22 }} />}
        {layoutVariant === "centered" && <div className="absolute left-1/2 top-3 h-1 w-36 -translate-x-1/2 rounded-full" style={{ backgroundColor: accent, opacity: 0.38 }} />}
        {layoutVariant === "editorial" && <div className="absolute left-3 top-3 bottom-3 w-[3px] rounded" style={{ backgroundColor: accent, opacity: 0.8 }} />}
        {concept === "tech_grid" && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(56,189,248,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.1) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        )}
        {concept === "editorial" && <div className="absolute left-2 top-5 bottom-5 w-1 rounded" style={{ backgroundColor: accent, opacity: 0.55 }} />}
        {concept === "bold_impact" && <div className="absolute -right-10 -top-10 h-48 w-48 rotate-12" style={{ backgroundColor: accent, opacity: 0.2 }} />}
        {hasImage && (
          <>
            <Image
              src={slide.imageUrl as string}
              alt={slide.imageQuery ? `${slide.imageQuery} background` : "Slide background"}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.65),transparent_44%)]" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  slide.design?.theme === "dark" || slide.design?.theme === "neon"
                    ? "linear-gradient(to bottom right, rgba(2,6,23,0.7), rgba(15,23,42,0.78), rgba(2,6,23,0.72))"
                    : "linear-gradient(to bottom right, rgba(255,255,255,0.72), rgba(255,255,255,0.8), rgba(255,255,255,0.68))",
              }}
            />
          </>
        )}
        <div className="absolute inset-x-0 top-0 z-10 h-1.5" style={{ background: `linear-gradient(to right, ${accent}, #38BDF8, #6366F1)` }} />
        {slide.layout === "TITLE" && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <h2 className="mt-4 font-bold" style={titleStyle}>{headingText}</h2>
            <p className="mt-4 max-w-3xl" style={{ ...bodyStyle, fontSize: `${Math.round(20 * cfg.bodyScale)}px`, textAlign: splitLayout ? "left" : centeredHeadings ? "center" : "left" }}>{slide.content ?? slide.subtitle ?? ""}</p>
          </div>
        )}

        {slide.layout === "BULLETS" && (
          <div className="relative z-10 h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-bold" style={titleStyle}>{headingText}</h2>
            </div>

            <div className="mt-5 grid h-[74%] gap-4 grid-cols-1">
              <ul className="space-y-3" style={bodyStyle}>
                {(slide.bullets ?? []).map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 leading-relaxed">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {slide.layout === "TWO_COLUMN" && (
          <div className="relative z-10 h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-bold" style={titleStyle}>{headingText}</h2>
            </div>

            <div className={`mt-5 grid h-[72%] gap-4 ${layoutVariant === "editorial" ? "grid-cols-[1.08fr_0.92fr]" : "grid-cols-2"}`}>
              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: accent, fontFamily: cfg.bodyFont }}>{slide.leftTitle ?? "Column A"}</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: textColor, fontFamily: cfg.bodyFont }}>
                  {(slide.leftBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: accent, fontFamily: cfg.bodyFont }}>{slide.rightTitle ?? "Column B"}</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed" style={{ color: textColor, fontFamily: cfg.bodyFont }}>
                  {(slide.rightBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            </div>

          </div>
        )}

        {slide.layout === "QUOTE" && (
          <div className="relative z-10 flex h-full items-center">
            <div className="mr-5 h-[72%] w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
            <div>
              <p className="leading-tight tracking-tight" style={{ ...titleStyle, fontSize: `${Math.round(40 * cfg.titleScale)}px` }}>“{slide.quote ?? ""}”</p>
              <p className="mt-5" style={{ ...bodyStyle, fontWeight: 700, fontSize: `${Math.round(22 * cfg.bodyScale)}px` }}>{slide.quoteAuthor ? `- ${slide.quoteAuthor}` : ""}</p>
            </div>
          </div>
        )}

        {slide.layout === "CLOSING" && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center">
            <h2 className="font-bold" style={titleStyle}>{headingText}</h2>
            <p className="mt-4 max-w-3xl" style={{ ...bodyStyle, fontSize: `${Math.round(20 * cfg.bodyScale)}px`, textAlign: splitLayout ? "left" : centeredHeadings ? "center" : "left" }}>{slide.content ?? slide.subtitle ?? ""}</p>
          </div>
        )}
      </div>
    </article>
  );
}
