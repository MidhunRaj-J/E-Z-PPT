import Image from "next/image";
import type { Slide } from "@/types/slides";

type SlidePreviewProps = {
  slide: Slide;
  index: number;
};

export function SlidePreview({ slide, index }: SlidePreviewProps) {
  const title = slide.title || `Slide ${index + 1}`;
  const bulletCount = slide.bullets?.length ?? 0;
  const leftCount = slide.leftBullets?.length ?? 0;
  const rightCount = slide.rightBullets?.length ?? 0;

  return (
    <article className="group w-full anim-reveal" data-delay={String((index % 3) + 1)}>
      <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-slate-500">
        <span>Slide {index + 1}</span>
        <span>{slide.layout.replace("_", " ")}</span>
      </div>

      <div className="card-lift relative aspect-video w-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
        {slide.imageUrl && (
          <>
            <Image
              src={slide.imageUrl}
              alt={slide.imageQuery ? `${slide.imageQuery} background` : "Slide background"}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.65),transparent_44%)]" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/72 via-white/80 to-white/68" />
          </>
        )}
        <div className="absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
        {slide.imageQuery && (
          <div className="absolute bottom-3 right-3 z-10 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            {slide.imageQuery}
          </div>
        )}

        {slide.layout === "TITLE" && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <div className="anim-float absolute left-8 top-8 h-24 w-24 rounded-full bg-blue-100/80 blur-2xl" />
            <div className="anim-float absolute bottom-8 right-12 h-20 w-20 rounded-full bg-cyan-100/80 blur-2xl" style={{ animationDelay: "1.2s" }} />
            <p className="soft-chip">Opening slide</p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-4 max-w-3xl text-xl text-slate-600">{slide.content ?? slide.subtitle ?? ""}</p>
            <div className="mt-6 flex gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Context</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Objective</span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Outcome</span>
            </div>
          </div>
        )}

        {slide.layout === "BULLETS" && (
          <div className="relative z-10 h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {bulletCount} points
              </span>
            </div>

            <div className="mt-5 grid h-[74%] grid-cols-[1fr_280px] gap-4">
              <ul className="space-y-3 text-base text-slate-700">
                {(slide.bullets ?? []).map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 leading-relaxed">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-blue-600" aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <aside className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Key takeaway</p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">
                  {slide.bullets?.[0] ?? "Highlight your strongest idea here."}
                </p>
                <div className="mt-4 h-px bg-slate-200" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Presenter cue</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {slide.speakerNotes ?? "Add one concrete example or quick metric while presenting this slide."}
                </p>
              </aside>
            </div>
          </div>
        )}

        {slide.layout === "TWO_COLUMN" && (
          <div className="relative z-10 h-full">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
              <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{leftCount} left</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{rightCount} right</span>
              </div>
            </div>

            <div className="mt-5 grid h-[72%] grid-cols-2 gap-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">{slide.leftTitle ?? "Column A"}</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                  {(slide.leftBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700">{slide.rightTitle ?? "Column B"}</h3>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
                  {(slide.rightBullets ?? []).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Compare</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Trade-offs</span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Decision</span>
            </div>
          </div>
        )}

        {slide.layout === "QUOTE" && (
          <div className="relative z-10 flex h-full items-center">
            <div className="mr-5 h-[72%] w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
            <div>
              <p className="text-4xl leading-tight tracking-tight text-slate-900">“{slide.quote ?? ""}”</p>
              <p className="mt-5 text-xl text-slate-500">{slide.quoteAuthor ? `- ${slide.quoteAuthor}` : ""}</p>
              <p className="mt-4 text-sm text-slate-500">Use this moment to reinforce the strategic core of your narrative.</p>
            </div>
          </div>
        )}

        {slide.layout === "CLOSING" && (
          <div className="relative z-10 flex h-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center">
            <div className="anim-float absolute inset-x-0 top-4 mx-auto h-14 w-56 rounded-full bg-blue-100/70 blur-2xl" />
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-4 max-w-3xl text-xl text-slate-600">{slide.content ?? slide.subtitle ?? ""}</p>
            <div className="mt-6 flex gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Q&A</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Next Steps</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Contact</span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
