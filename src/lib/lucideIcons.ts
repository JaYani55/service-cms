import * as LucideIcons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const INVALID_EXPORTS = new Set(['createLucideIcon', 'Icon']);

function isLucideIcon(component: unknown): component is LucideIcon {
  return typeof component === 'function';
}

const iconEntries = Object.entries(LucideIcons)
  .filter(([name, component]) => {
    return isLucideIcon(component) && !INVALID_EXPORTS.has(name) && name[0] === name[0]?.toUpperCase();
  })
  .sort(([a], [b]) => a.localeCompare(b));

const lucideIconMap = Object.fromEntries(iconEntries) as Record<string, LucideIcon>;

export const lucideIconNames = iconEntries.map(([name]) => name);

export function getLucideIconByName(
  iconName?: string | null,
  fallback: LucideIcon = LucideIcons.Globe,
): LucideIcon {
  const normalizedName = iconName?.trim();

  if (!normalizedName) {
    return fallback;
  }

  return lucideIconMap[normalizedName] ?? fallback;
}
