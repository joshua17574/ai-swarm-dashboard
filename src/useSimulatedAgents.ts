import { useEffect, useRef, useState } from 'react';
import { Agent, AgentStatus, ActivityEvent } from './types';
import { AGENTS } from './agents';

const ACTIONS: Record<string, string[]> = {
  'nebula': ['Routing task to code-agent', 'Analyzing user request', 'Delegating to github-agent', 'Scheduling trigger', 'Composing workflow'],
  'github-agent': ['Creating pull request', 'Reviewing code changes', 'Merging branch', 'Listing open issues', 'Pushing commit'],
  'code-agent': ['Executing Python script', 'Running bash command', 'Installing npm packages', 'Building TypeScript', 'Analyzing data'],
  'gmail-agent': ['Sending email digest', 'Reading inbox', 'Searching messages', 'Drafting reply', 'Archiving threads'],
  'slack-agent': ['Posting to #general', 'Reading channel history', 'Sending DM', 'Updating status', 'Listing channels'],
  'notion-agent': ['Creating page', 'Updating database', 'Querying workspace', 'Adding block', 'Syncing notes'],
  'twitter-agent': ['Posting tweet', 'Searching trends', 'Reading timeline', 'Liking post', 'Fetching mentions'],
  'calendar-agent': ['Creating event', 'Checking availability', 'Sending invite', 'Updating meeting', 'Listing schedule'],
  'linear-agent': ['Creating issue', 'Updating status', 'Assigning task', 'Listing projects', 'Adding comment'],
  'discord-agent': ['Sending message', 'Reading channel', 'Managing roles', 'Creating thread', 'Posting embed'],
  'telegram-agent': ['Sending message', 'Reading updates', 'Posting to group', 'Sending photo', 'Managing bot'],
  'facebook-agent': ['Publishing post', 'Reading page feed', 'Scheduling post', 'Checking insights', 'Replying to comment'],
};

const STATUSES: AgentStatus[] = ['active', 'idle', 'busy', 'error'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useSimulatedAgents() {
  const [agents, setAgents] = useState<Agent[]>(() => AGENTS.map(a => ({ ...a })));
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const next = prev.map(a => ({ ...a }));
        // Pick 1-3 random agents to update
        const count = Math.floor(Math.random() * 3) + 1;
        const newEvents: ActivityEvent[] = [];

        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const agent = next[idx];
          const status = randomChoice(STATUSES.filter(s => s !== 'error' || Math.random() < 0.05));
          const actions = ACTIONS[agent.id] || ['Processing...'];
          const action = randomChoice(actions);

          agent.status = status;
          agent.lastAction = action;
          agent.lastActionTime = Date.now();
          agent.taskCount += status === 'active' || status === 'busy' ? 1 : 0;

          idCounter.current += 1;
          newEvents.push({
            id: `evt-${idCounter.current}`,
            agentId: agent.id,
            agentName: agent.name,
            emoji: agent.emoji,
            action,
            timestamp: Date.now(),
          });
        }

        setFeed(prev => [...newEvents, ...prev].slice(0, 50));
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { agents, feed };
}
