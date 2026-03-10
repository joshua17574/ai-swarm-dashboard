'use client';

import { useState, useMemo } from 'react';
import { Agent, CategoryInfo } from '@/lib/agents-types';
import HeroSection from '@/components/HeroSection';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import AgentGrid from '@/components/AgentGrid';

interface DashboardClientProps {
  agents: Agent[];
  categories: CategoryInfo[];
}

export default function DashboardClient({ agents, categories }: DashboardClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredAgents = useMemo(() => {
    let filtered = agents;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((a) => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [agents, searchQuery, selectedCategory]);

  return (
    <div>
      <HeroSection totalAgents={agents.length} totalCategories={categories.length} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-6">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            totalAgents={agents.length}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {filteredAgents.length} of {agents.length} agents
            </p>
          </div>
          <AgentGrid agents={filteredAgents} />
        </div>
      </div>
    </div>
  );
}
