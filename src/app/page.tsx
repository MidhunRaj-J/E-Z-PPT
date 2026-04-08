"use client";

import { useMemo, useState } from "react";
import { Download, Sparkles, WandSparkles } from "lucide-react";
import { LoadingDeck } from "@/components/loading-deck";
import { SlidePreview } from "@/components/slide-preview";
import { downloadDeck } from "@/lib/pptx";
import type { DeckResponse, Slide, Tone } from "@/types/slides";

const tones: Tone[] = ["Professional", "Creative", "Minimalist"];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
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
        body: JSON.stringify({ prompt: cleanedPrompt, tone }),
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
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
      <section className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_30px_60px_rgba(30,41,59,0.08)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <WandSparkles size={14} />
              E-Z-PPT
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Prompt to polished presentation.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600 sm:text-lg">
              Generate structured slides, preview instantly, then download a real PowerPoint file.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {deckSummary}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_220px_auto]">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A pitch deck for a coffee startup expanding to airport locations"
            className="min-h-36 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />

          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="h-12 rounded-2xl border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          >
            {tones.map((toneOption) => (
              <option key={toneOption} value={toneOption}>
                {toneOption}
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-sky-600 px-6 text-base font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            <Sparkles size={18} />
            {isLoading ? "Generating..." : "Generate Presentation"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownload}
            disabled={!slides.length || isLoading}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Download .pptx
          </button>
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        </div>
      </section>

      <section className="mt-8">
        {isLoading && <LoadingDeck />}

        {!isLoading && slides.length > 0 && (
          <div className="grid gap-6">
            {slides.map((slide, index) => (
              <SlidePreview key={`${slide.layout}-${index}`} slide={slide} index={index} />
            ))}
          </div>
        )}

        {!isLoading && slides.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500">
            Your generated slides will appear here.
          </div>
        )}
      </section>
    </main>
  );
}
