import { useEffect, useRef, useState } from 'react';
import { Agent, AgentStatus, ActivityEvent } from './types';
import { AGENTS } from './agents';

const ACTIONS: Record<string, string[]> = {
  'nebula': [
    'Routing task to code-agent',
    'Delegating PR scan to pr-monitor',
    'Scheduling hourly airdrop digest',
    'Composing multi-agent pipeline',
    'Analyzing user request',
    'Creating new automation trigger',
    'Coordinating swarm deployment',
    'Dispatching to github-repo-manager',
  ],
  'code-agent': [
    'Executing Python data analysis',
    'Running bash: npm run build',
    'Processing CSV with pandas',
    'Building matplotlib chart',
    'Installing dependencies via pip',
    'Running TypeScript compilation',
    'Analyzing JSON dataset',
    'Executing web scraping script',
  ],
  'web-agent': [
    'Scraping page content',
    'Extracting structured data from URL',
    'Automating form submission',
    'Crawling documentation site',
    'Taking page screenshot',
    'Mapping site URLs',
    'Extracting product prices',
    'Reading API documentation',
  ],
  'media-agent': [
    'Transcribing audio with Whisper',
    'Analyzing image with GPT-4o vision',
    'Generating image from prompt',
    'Editing product photo background',
    'Converting text to speech',
    'Extracting text from screenshot (OCR)',
    'Translating French audio to English',
    'Describing chart data from image',
  ],
  'inbox-agent': [
    'Sending email digest',
    'Reading inbox for new messages',
    'Waiting for verification code',
    'Drafting reply to sender',
    'Managing trusted senders list',
    'Forwarding message to joshua',
    'Checking for urgent emails',
    'Archiving old threads',
  ],
  'agent-creator': [
    'Building new Jira agent',
    'Configuring API tools for agent',
    'Installing skill from registry',
    'Setting up OAuth integration',
    'Creating Shopify agent',
    'Adding webhook tool to agent',
    'Updating agent prompt sections',
    'Provisioning new custom agent',
  ],
  'pr-monitor': [
    'Scanning for PRs needing review',
    'Found 2 stale PRs (open >2 days)',
    'Checking CI status on open PRs',
    'Detecting merge conflicts',
    'Generating PR summary report',
    'Monitoring joshua17574 repos',
    'Flagging failing CI on PR #47',
    'Delivering smart PR digest',
  ],
  'github-repo-manager': [
    'Pushing commit to ai-swarm-dashboard',
    'Creating pull request',
    'Listing open issues on nebula-config',
    'Merging feature branch',
    'Updating file contents via API',
    'Checking Actions workflow status',
    'Creating new repository',
    'Reviewing code diff on PR #12',
  ],
  'kwen-net-page-manager': [
    'Publishing post to Kwen Net page',
    'Replying to comment on latest post',
    'Checking page insights & analytics',
    'Scheduling crypto news post',
    'Reading inbox messages',
    'Monitoring page activity',
    'Posting airdrop digest to Kwen Net',
    'Engaging with follower comments',
  ],
  'google-drive-manager': [
    'Uploading report to Drive',
    'Searching for shared documents',
    'Creating new folder structure',
    'Sharing file with collaborator',
    'Downloading meeting notes',
    'Organizing project files',
    'Setting file permissions',
    'Moving files to archive folder',
  ],
  'spotify-music-manager': [
    'Searching tracks: "Lo-fi beats"',
    'Creating new playlist: Focus Mode',
    'Adding track to queue',
    'Fetching recommendations',
    'Checking recently played tracks',
    'Controlling playback: skip next',
    'Getting top artists this month',
    'Saving album to library',
  ],
  'x-twitter-engagement-agent': [
    'Posting tweet about crypto news',
    'Monitoring mentions for @joshua761',
    'Liking trending post',
    'Retweeting relevant content',
    'Searching #airdrop tweets',
    'Replying to follower mention',
    'Posting tweet with image attachment',
    'Fetching latest timeline updates',
  ],
};

const STATUSES: AgentStatus[] = ['active', 'idle', 'busy'];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedStatus(): AgentStatus {
  const r = Math.random();
  if (r < 0.35) return 'active';
  if (r < 0.65) return 'busy';
  if (r < 0.97) return 'idle';
  return 'error';
}

export function useSimulatedAgents() {
  const [agents, setAgents] = useState<Agent[]>(() => AGENTS.map(a => ({ ...a })));
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => {
        const next = prev.map(a => ({ ...a }));
        const count = Math.floor(Math.random() * 3) + 1;
        const newEvents: ActivityEvent[] = [];

        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const agent = next[idx];
          const status = agent.id === 'nebula' ? 'active' : weightedStatus();
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
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return { agents, feed };
}
