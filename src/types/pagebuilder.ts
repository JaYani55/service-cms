// Content Block Types
export type ContentBlock = TextBlock | HeadingBlock | ImageBlock | QuoteBlock | ListBlock | VideoBlock;

export interface BaseBlock {
  id: string;
  type: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading';
  content: string;
  level: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6';
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  text: string;
  author?: string;
  source?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'list';
  style: 'ordered' | 'unordered';
  items: string[];
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  src: string;
  provider: 'youtube' | 'vimeo' | 'other';
  caption?: string;
}

// Page Builder Data Interfaces
export interface Cta {
  title: string;
  description: string;
  primaryButton: string;
}

export interface FaqItem {
  question: string;
  answer: ContentBlock[];
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface Hero {
  image: string;
  stats: HeroStat[];
  title: string;
  description: ContentBlock[];
}

export interface CardItem {
  icon: string;
  color: string;
  items?: string[];
  content?: Array<ContentBlock | { type: 'bullet-point'; id: string; text: string }>;
  title: string;
  description: string;
}

export interface Feature {
  title: string;
  description: ContentBlock[];
  reverse?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface PageBuilderData {
  cta: Cta;
  faq: FaqItem[];
  hero: Hero;
  cards: CardItem[];
  features: Feature[];
  subtitle: string;
  'trainer-module': boolean;
}
