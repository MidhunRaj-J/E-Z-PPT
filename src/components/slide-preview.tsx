import type { Slide } from "@/types/slides";

type SlidePreviewProps = {
  slide: Slide;
  index: number;
};

export function SlidePreview({ slide, index }: SlidePreviewProps) {
  const title = slide.title || `Slide ${index + 1}`;

  return (
    <article className="group w-full">
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-slate-500">
        <span>Slide {index + 1}</span>
        <span>{slide.layout.replace("_", " ")}</span>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_46px_rgba(15,23,42,0.12)]">
        {slide.layout === "TITLE" && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-4 max-w-3xl text-xl text-slate-500">
              {slide.content ?? slide.subtitle ?? ""}
            </p>
          </div>
        )}

        {slide.layout === "BULLETS" && (
          <div className="h-full">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <ul className="mt-5 space-y-3 text-lg text-slate-700">
              {(slide.bullets ?? []).map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 leading-relaxed">
                  <span className="mt-2 h-2 w-2 rounded-full bg-sky-600" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {slide.layout === "TWO_COLUMN" && (
          <div className="h-full">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <div className="mt-5 grid h-[72%] grid-cols-2 gap-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  {slide.leftTitle ?? "Column A"}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {(slide.leftBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  {slide.rightTitle ?? "Column B"}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                  {(slide.rightBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}

        {slide.layout === "QUOTE" && (
          <div className="flex h-full flex-col justify-center">
            <p className="text-4xl leading-tight tracking-tight text-slate-900">“{slide.quote ?? ""}”</p>
            <p className="mt-5 text-xl text-slate-500">{slide.quoteAuthor ? `- ${slide.quoteAuthor}` : ""}</p>
          </div>
        )}

        {slide.layout === "CLOSING" && (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-4 text-xl text-slate-500">{slide.content ?? slide.subtitle ?? ""}</p>
          </div>
        )}
      </div>
    </article>
  );
}
