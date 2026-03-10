import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import type { Agent, CategoryInfo } from './agents-types';

// Re-export types and client-safe utilities so server components
// can still import everything from '@/lib/agents' if they want.
export type { Agent, CategoryInfo };
export { getColorClasses } from './agents-types';

const contentDirectory = path.join(process.cwd(), 'content');

function getAllMdFiles(dir: string, category?: string): { filePath: string; category: string }[] {
  const results: { filePath: string; category: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const cat = category || entry.name;
      results.push(...getAllMdFiles(fullPath, cat));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
      const cat = category || path.basename(path.dirname(fullPath));
      results.push({ filePath: fullPath, category: cat });
    }
  }
  return results;
}

export function getAllAgents(): Agent[] {
  const mdFiles = getAllMdFiles(contentDirectory);
  const agents: Agent[] = [];

  for (const { filePath, category } of mdFiles) {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      const slug = path.basename(filePath, '.md');
      const name = data.name || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const description = data.description || '';
      const color = data.color || 'blue';

      agents.push({
        slug,
        name,
        description,
        color,
        category,
        content,
      });
    } catch {
      // Skip files that can't be parsed
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentBySlug(slug: string): Agent | undefined {
  const agents = getAllAgents();
  return agents.find((a) => a.slug === slug);
}

export function getCategories(): CategoryInfo[] {
  const agents = getAllAgents();
  const categoryMap = new Map<string, number>();

  for (const agent of agents) {
    categoryMap.set(agent.category, (categoryMap.get(agent.category) || 0) + 1);
  }

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count, slug: name }))
    .sort((a, b) => b.count - a.count);
}

export function getAgentsByCategory(category: string): Agent[] {
  return getAllAgents().filter((a) => a.category === category);
}

export async function getAgentContent(content: string): Promise<string> {
  const result = await remark().use(html, { sanitize: false }).process(content);
  return result.toString();
}
