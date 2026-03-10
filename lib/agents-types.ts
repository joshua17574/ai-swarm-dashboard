// Client-safe types and utilities — no Node.js imports

export interface Agent {
  slug: string;
  name: string;
  description: string;
  color: string;
  category: string;
  content: string;
}

export interface CategoryInfo {
  name: string;
  count: number;
  slug: string;
}

const colorMap: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  cyan: { border: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'hover:shadow-cyan-500/20' },
  green: { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400', glow: 'hover:shadow-green-500/20' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'hover:shadow-purple-500/20' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', glow: 'hover:shadow-orange-500/20' },
  red: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', glow: 'hover:shadow-red-500/20' },
  blue: { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'hover:shadow-blue-500/20' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', glow: 'hover:shadow-yellow-500/20' },
  pink: { border: 'border-pink-500', bg: 'bg-pink-500/10', text: 'text-pink-400', glow: 'hover:shadow-pink-500/20' },
};

export function getColorClasses(color: string) {
  return colorMap[color] || colorMap['blue'];
}
