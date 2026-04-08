export type Tone = "Professional" | "Creative" | "Minimalist";

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
  bullets?: string[];
  leftTitle?: string;
  leftBullets?: string[];
  rightTitle?: string;
  rightBullets?: string[];
  quote?: string;
  quoteAuthor?: string;
  speakerNotes?: string;
};

export type DeckResponse = {
  slides: Slide[];
};
