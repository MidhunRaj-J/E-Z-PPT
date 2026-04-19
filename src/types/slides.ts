export type Tone = "Professional" | "Creative" | "Minimalist";
export type PptStyle = "Executive" | "Bold" | "Magazine" | "Reference";

export type ApiProvider = "gemini" | "sarvam";

export type SlideLayout =
  | "TITLE"
  | "BULLETS"
  | "TWO_COLUMN"
  | "QUOTE"
  | "CLOSING";

export type Slide = {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  content?: string;
  imageQuery?: string;
  imageUrl?: string;
  bullets?: string[];
  leftTitle?: string;
  leftBullets?: string[];
  rightTitle?: string;
  rightBullets?: string[];
  quote?: string;
  quoteAuthor?: string;
  speakerNotes?: string;
  design?: {
    theme: "dark" | "light" | "gradient" | "neon";
    accentColor: string;
    backgroundStyle: "minimal" | "glassmorphism" | "gradient" | "abstract";
    visualStyle: "modern" | "futuristic" | "corporate" | "startup";
    emphasis: "title" | "numbers" | "contrast" | "minimal";
    layoutVariant?: "asymmetric" | "centered" | "split" | "editorial" | "grid";
  };
};

export type DeckResponse = {
  slides: Slide[];
};
