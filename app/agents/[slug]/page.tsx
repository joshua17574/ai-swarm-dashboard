import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllAgents, getAgentBySlug, getAgentContent } from '@/lib/agents';
import { getColorClasses } from '@/lib/agents-types';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const agents = getAllAgents();
  return agents.map((agent) => ({ slug: agent.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) return { title: 'Agent Not Found' };
  return {
    title: `${agent.name} - The Agency`,
    description: agent.description,
  };
}

export default async function AgentPage({ params }: PageProps) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) notFound();

  const contentHtml = await getAgentContent(agent.content);
  const colors = getColorClasses(agent.color);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${colors.bg} ${colors.text}`}>
            {agent.category.replace(/-/g, ' ')}
          </span>
        </div>
        <h1 className={`text-4xl font-bold text-white ${colors.text} mb-3`}>{agent.name}</h1>
        <p className="text-lg text-gray-400 leading-relaxed">{agent.description}</p>
      </div>

      <div className={`border-t ${colors.border} pt-8`}>
        <div className="prose-dark" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </div>
    </div>
  );
}
