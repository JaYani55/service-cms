import BlogTemplate from '@/default-schemas/blog.json';

export const SCHEMA_TEMPLATES = [
  {
    id: 'blog',
    name: 'Blog Post',
    nameDe: 'Blog-Beitrag',
    description: 'A standard blog post schema with hero, content blocks, cards, and FAQ.',
    descriptionDe: 'Ein Standard-Blog-Post-Schema mit Hero, Content-Blöcken, Karten und FAQ.',
    icon: '📝',
    schema: BlogTemplate
  }
];

export type SchemaTemplate = typeof SCHEMA_TEMPLATES[number];
