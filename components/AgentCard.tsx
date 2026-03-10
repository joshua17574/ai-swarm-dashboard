import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Agent, getColorClasses } from '@/lib/agents-types';

interface AgentCardProps {
  agent: Agent;
}

export default function AgentCard({ agent }: AgentCardProps) {
  const colors = getColorClasses(agent.color);

  return (
    <Link href={`/agents/${agent.slug}`}>
      <div
        className={`group relative bg-[#111111] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-300 hover:shadow-lg ${colors.glow} hover:-translate-y-0.5 border-l-2 ${colors.border}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
              {agent.name}
            </h3>
            <span
              className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium capitalize ${colors.bg} ${colors.text}`}
            >
              {agent.category.replace(/-/g, ' ')}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-all group-hover:translate-x-0.5 flex-shrink-0 mt-1" />
        </div>
        <p className="mt-3 text-sm text-gray-400 line-clamp-2 leading-relaxed">
          {agent.description || 'Specialized AI agent ready to assist with your workflow.'}
        </p>
      </div>
    </Link>
  );
}
