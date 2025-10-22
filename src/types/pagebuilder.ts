export interface Cta {
  title: string;
  description: string;
  primaryButton: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface Hero {
  image: string;
  stats: HeroStat[];
  title: string;
  description: string;
}

export interface CardItem {
  icon: string;
  color: string;
  items: string[];
  title: string;
  description: string;
}

export interface Feature {
  title: string;
  description: string;
  reverse?: boolean;
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
