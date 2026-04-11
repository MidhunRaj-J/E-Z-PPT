"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowRight, Download, Orbit, Sparkles, WandSparkles } from "lucide-react";
import { LoadingDeck } from "../components/loading-deck";
import { SlidePreview } from "../components/slide-preview";
import { downloadDeck } from "../lib/pptx";
import type { ApiProvider, DeckResponse, Slide, Tone } from "../types/slides";

const tones: Tone[] = ["Professional", "Creative", "Minimalist"];
const providers: Array<{ label: string; value: ApiProvider }> = [
  { label: "Google Gemini", value: "gemini" },
  { label: "Sarvam", value: "sarvam" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [provider, setProvider] = useState<ApiProvider>("gemini");
  const [slideCount, setSlideCount] = useState(8);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deckSummary = useMemo(() => {
    if (!slides.length) {
      return "No deck generated yet";
    }
    return `${slides.length} slides ready`;
  }, [slides]);

  const handleGenerate = async () => {
    const cleanedPrompt = prompt.trim();
    if (!cleanedPrompt) {
      setError("Please enter a topic before generating.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanedPrompt, tone, provider, slideCount }),
      });

      const data = (await res.json()) as DeckResponse | { error?: string };

      if (!res.ok) {
        const errorMessage =
          typeof data === "object" && data && "error" in data
            ? data.error || "Failed to generate slides."
            : "Failed to generate slides.";
        throw new Error(errorMessage);
      }

      setSlides((data as DeckResponse).slides);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!slides.length) {
      return;
    }

    setError(null);
    try {
      await downloadDeck(slides, tone);
    } catch {
      setError("Unable to create .pptx file. Try generating again.");
    }
  };

  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute left-[5%] top-20 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl anim-float" />
      <div className="pointer-events-none absolute right-[6%] top-36 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl anim-float" style={{ animationDelay: "1.1s" }} />
      <div className="pointer-events-none absolute bottom-10 right-1/3 h-44 w-44 rounded-full bg-indigo-300/18 blur-3xl anim-drift" />

      <section className="surface-panel anim-reveal rounded-[2rem] p-6 sm:p-8" data-delay="0">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              <WandSparkles size={14} />
              Presentation Builder
            </div>

            <Image
              src="/ez-ppt-wordmark.svg"
              alt="E-Z-PPT"
              width={712}
              height={164}
              priority
              className="mt-4 h-10 w-auto sm:h-12"
            />

            <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-[3.4rem] sm:leading-[1.02]">
              Build presentation decks
              <br />
              in minutes.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Describe your topic once. E-Z-PPT creates a structured slide deck, lets you preview every slide,
              and exports a ready-to-share PowerPoint file.
            </p>
          </div>

          <div className="grid gap-3 text-sm anim-reveal" data-delay="1">
            <div className="card-lift rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Deck status</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{deckSummary}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="card-lift rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-center">
                <p className="font-mono text-sm font-bold text-slate-800">{slideCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Slides</p>
              </div>
              <div className="card-lift rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-center">
                <p className="font-mono text-sm font-bold text-slate-800">AI</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Generated</p>
              </div>
              <div className="card-lift rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-center">
                <p className="font-mono text-sm font-bold text-slate-800">PPTX</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Export</p>
              </div>
            </div>
          </div>
        </div>

        <div className="anim-reveal mt-8 rounded-3xl border border-slate-200 bg-white/92 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.07)] sm:p-5" data-delay="2">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="soft-chip">
              <Orbit size={14} />
              Guided workflow
            </span>
            <span className="soft-chip">Slide preview</span>
            <span className="soft-chip">Fast generation</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px_auto]">
            <div className="flex flex-col gap-2">
              <label htmlFor="deck-prompt" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Presentation Topic
              </label>
              <textarea
                id="deck-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Growth strategy deck for a premium coffee chain entering airport retail spaces"
                className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:-translate-y-0.5 focus:border-blue-500 focus:shadow-[0_10px_24px_rgba(37,99,235,0.16)]"
              />
              <p className="text-xs text-slate-500">
                Include audience, objective, and constraints for better results.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="tone" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Presentation Style
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              >
                {tones.map((toneOption) => (
                  <option key={toneOption} value={toneOption}>
                    {toneOption}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="provider" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                AI Provider
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as ApiProvider)}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              >
                {providers.map((providerOption) => (
                  <option key={providerOption.value} value={providerOption.value}>
                    {providerOption.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slideCount" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Slide Count
              </label>
              <select
                id="slideCount"
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              >
                {Array.from({ length: 27 }, (_, index) => {
                  const count = index + 4;
                  return (
                    <option key={count} value={count}>
                      {count} slides
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="btn-animated inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 px-6 text-base font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={18} />
              {isLoading ? "Generating..." : "Generate Deck"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={!slides.length || isLoading}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_10px_18px_rgba(15,23,42,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Download PowerPoint (.pptx)
            </button>

            {!error && (
              <p className="inline-flex items-center gap-1 text-sm text-slate-500">
                Tip: include audience, goal, and desired outcome
                <ArrowRight size={15} />
              </p>
            )}

            {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          </div>
        </div>
      </section>

      <section className="anim-reveal mt-8" data-delay="3">
        {isLoading && <LoadingDeck />}

        {!isLoading && slides.length > 0 && (
          <div className="grid gap-6">
            {slides.map((slide, index) => (
              <SlidePreview key={`${slide.layout}-${index}`} slide={slide} index={index} />
            ))}
          </div>
        )}

        {!isLoading && slides.length === 0 && (
          <div className="surface-panel rounded-3xl p-10 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Preview canvas</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">Your generated slides will appear here</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Enter a topic above and click Generate Deck.
              You can review each slide here before downloading your PowerPoint file.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
