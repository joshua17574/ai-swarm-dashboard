import { useEffect, useRef, useState } from 'react';
import { Agent, AgentStatus, ActivityEvent } from './types';
import { AGENTS } from './agents';

/* ------------------------------------------------------------------ */
/*  Actions map — based on real Nebula triggers, recipes & task history */
/* ------------------------------------------------------------------ */
const ACTIONS: Record<string, string[]> = {
  'nebula': [
    'Routing YouTube Short production to pipeline',
    'Delegating PR scan to pr-monitor',
    'Triggering hourly airdrop digest',
    'Dispatching crypto news digest to Kwen Net',
    'Coordinating daily news digest pipeline',
    'Scheduling YouTube Short for 10:00 UTC',
    'Running weekly self-improvement review',
    'Orchestrating cross-platform content strategy',
    'Dispatching to github-repo-manager',
    'Composing multi-agent pipeline',
  ],
  'code-agent': [
    'Running v3.0 factory: TTS narration pass',
    'Executing bash: npm run build',
    'Processing pending_script.json for Shorts',
    'Building cinematic animation frames',
    'Compositing video with FFmpeg',
    'Running TypeScript compilation',
    'Analyzing JSON dataset with pandas',
    'Installing dependencies via pip',
  ],
  'web-agent': [
    'Scraping trending topics for YouTube Shorts',
    'Extracting crypto airdrop data from web',
    'Crawling news sources for daily digest',
    'Searching web for AI trending topics',
    'Extracting structured data from CoinGecko',
    'Mapping URLs on news aggregator',
    'Scraping Philippines gas price updates',
    'Reading GMA News headlines',
  ],
  'media-agent': [
    'Generating TTS narration for YouTube Short',
    'Creating cinematic thumbnail for Short',
    'Analyzing uploaded image with vision',
    'Generating image from content prompt',
    'Converting script to speech audio',
    'Extracting text from screenshot (OCR)',
    'Editing thumbnail background for YouTube',
    'Rendering animation overlay for Short',
  ],
  'inbox-agent': [
    'Sending email digest to joshua',
    'Reading inbox for verification codes',
    'Waiting for verification email',
    'Drafting reply to sender',
    'Forwarding notification to joshua',
    'Checking for urgent emails',
    'Managing trusted senders list',
    'Archiving old threads',
  ],
  'agent-creator': [
    'Configuring API tools for new agent',
    'Installing skill from registry',
    'Setting up OAuth integration',
    'Updating agent prompt sections',
    'Adding webhook tool to agent',
    'Provisioning new custom agent',
    'Building specialized research agent',
    'Configuring trigger for new agent',
  ],
  'pr-monitor': [
    'Scanning joshua17574 repos for open PRs',
    'Checking CI status on ai-swarm-dashboard',
    'Found stale PR open >2 days',
    'Detecting merge conflicts on PRs',
    'Generating PR summary report',
    'Flagging failing CI on open PR',
    'Delivering smart PR digest',
    'Monitoring weekday PRs at 9AM & 2PM',
  ],
  'github-repo-manager': [
    'Pushing commit to ai-swarm-dashboard',
    'Checking Actions workflow on main branch',
    'Listing open issues on joshua17574 repos',
    'Updating file contents via API',
    'Creating pull request for feature branch',
    'Reviewing code diff on latest PR',
    'Periodic repo health check (every 4h)',
    'Merging approved pull request',
  ],
  'kwen-net-page-manager': [
    'Publishing crypto news digest to Kwen Net',
    'Replying to comment on latest post',
    'Checking Kwen Net page insights',
    'Scheduling crypto news post (every 6h)',
    'Reading Kwen Net inbox messages',
    'Monitoring page activity (4h check)',
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
    'Checking recently played tracks',
    'Fetching top artists this month',
    'Running hourly Spotify check',
    'Getting personalized recommendations',
    'Searching tracks for playlist',
    'Saving album to library',
    'Checking playback status',
    'Updating playlist metadata',
  ],
  'x-twitter-engagement-agent': [
    'Posting crypto news tweet',
    'Monitoring mentions for @joshua761',
    'Searching #airdrop tweets',
    'Retweeting relevant crypto content',
    'Replying to follower mention',
    'Running 6-hour engagement check',
    'Posting tweet with media attachment',
    'Fetching latest timeline updates',
  ],
  'google-drive-file-manager': [
    'Uploading generated Short to Drive',
    'Searching for project files',
    'Organizing shorts output folder',
    'Downloading script template',
    'Sharing video file with collaborator',
    'Creating backup folder structure',
    'Moving processed files to archive',
    'Syncing workspace files to Drive',
  ],
  'telegram-notifier': [
    'Sending airdrop digest to @joshua761',
    'Delivering daily news summary via Telegram',
    'Sending YouTube Short upload confirmation',
    'Alerting: trigger execution failed',
    'Posting task completion notification',
    'Sending weekly review summary',
    'Delivering crypto news digest alert',
    'Sending error report to Telegram',
  ],
  'research-intelligence-agent': [
    'Researching trending topics for Shorts',
    'Analyzing top 10 crypto airdrops',
    'Gathering AI industry news sources',
    'Compiling Israel-Iran conflict updates',
    'Fact-checking crypto project claims',
    'Researching Philippines gas prices',
    'Building intelligence brief on trending topic',
    'Scanning GMA News for top stories',
  ],
  'content-strategist-agent': [
    'Generating weekly content calendar',
    'Planning YouTube Shorts topic schedule',
    'Coordinating cross-platform post timing',
    'Reviewing Kwen Net engagement metrics',
    'Scheduling Twitter/X content queue',
    'Aligning YouTube + Facebook + Twitter posts',
    'Analyzing content performance this week',
    'Drafting content brief for next Short',
  ],
  'youtube-shorts-creator': [
    'Producing YouTube Short at 10:00 UTC',
    'Running v3.0 factory: TTS + animations',
    'Uploading Short to YouTube channel',
    'Producing YouTube Short at 13:00 UTC',
    'Compositing cinematic video from script',
    'Producing YouTube Short at 17:00 UTC',
    'Rendering final Short with effects',
    'Producing YouTube Short at 22:00 UTC',
  ],
};

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
