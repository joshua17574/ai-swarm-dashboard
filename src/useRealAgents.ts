import { useCallback, useEffect, useRef, useState } from 'react';
import { Agent, AgentStatus, ActivityEvent } from './types';
import { AGENTS } from './agents';

/* ------------------------------------------------------------------ */
/*  Types for the sync-data.json produced by the Nebula sync recipe    */
/* ------------------------------------------------------------------ */
interface SyncAgent {
  slug: string;
  name: string;
  description: string;
  tools: string[];
  is_disabled: boolean;
}

interface SyncTrigger {
  slug: string;
  name: string;
  description: string;
  trigger_type: string;
  cron_expression: string | null;
  is_active: boolean;
  run_count: number;
  last_run_at: string;
  next_run_at: string;
}

interface SyncTask {
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  description_preview: string;
}

interface SyncData {
  synced_at: string;
  agents: SyncAgent[];
  triggers: SyncTrigger[];
  recent_tasks: SyncTask[];
}

/* ------------------------------------------------------------------ */
/*  Map trigger slugs to the agent they most likely invoke             */
/* ------------------------------------------------------------------ */
const TRIGGER_AGENT_MAP: Record<string, string> = {
  'youtube-short-1000-utc': 'youtube-shorts-creator',
  'youtube-short-1300-utc': 'youtube-shorts-creator',
  'youtube-short-1700-utc': 'youtube-shorts-creator',
  'youtube-short-1900-utc': 'youtube-shorts-creator',
  'youtube-short-2200-utc': 'youtube-shorts-creator',
  'youtube-shorts-creator-check': 'youtube-shorts-creator',
  'hourly-airdrop-digest': 'telegram-notifier',
  'github-repo-manager-check': 'github-repo-manager',
  'crypto-news-to-kwen-net': 'kwen-net-page-manager',
  'kwen-net-page-manager-check': 'kwen-net-page-manager',
  'daily-news-digest': 'research-intelligence-agent',
  'x-twitter-engagement-agent-check': 'x-twitter-engagement-agent',
  'weekly-review': 'nebula',
  'pr-monitor-check': 'pr-monitor',
  'dashboard-sync': 'github-repo-manager',
};

/* ------------------------------------------------------------------ */
/*  Map task title keywords to agents for activity feed                */
/* ------------------------------------------------------------------ */
function guessAgentFromTask(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('youtube') || t.includes('short')) return 'youtube-shorts-creator';
  if (t.includes('airdrop')) return 'telegram-notifier';
  if (t.includes('kwen') || t.includes('facebook')) return 'kwen-net-page-manager';
  if (t.includes('crypto news') || t.includes('twitter') || t.includes('x ')) return 'x-twitter-engagement-agent';
  if (t.includes('github') || t.includes('repo') || t.includes('pr ')) return 'github-repo-manager';
  if (t.includes('news digest') || t.includes('research')) return 'research-intelligence-agent';
  if (t.includes('spotify')) return 'spotify-music-manager';
  if (t.includes('drive')) return 'google-drive-manager';
  if (t.includes('review')) return 'nebula';
  return 'nebula';
}

/* ------------------------------------------------------------------ */
/*  Parse relative time strings like "3 hours ago" to epoch ms         */
/* ------------------------------------------------------------------ */
function parseRelativeTime(str: string, syncedAt: number): number {
  if (!str || str === 'Never') return 0;
  // Try ISO parse first
  const iso = Date.parse(str);
  if (!isNaN(iso)) return iso;
  // Parse relative: "X minutes/hours/days ago" or "X minutes/hours from now"
  const agoMatch = str.match(/(\d+)\s+(second|minute|hour|day|week)s?\s+ago/);
  if (agoMatch) {
    const n = parseInt(agoMatch[1]);
    const unit = agoMatch[2];
    const ms = { second: 1000, minute: 60000, hour: 3600000, day: 86400000, week: 604800000 };
    return syncedAt - n * (ms[unit as keyof typeof ms] || 60000);
  }
  const fromNowMatch = str.match(/(\d+)\s+(second|minute|hour|day|week)s?\s+from now/);
  if (fromNowMatch) {
    const n = parseInt(fromNowMatch[1]);
    const unit = fromNowMatch[2];
    const ms = { second: 1000, minute: 60000, hour: 3600000, day: 86400000, week: 604800000 };
    return syncedAt + n * (ms[unit as keyof typeof ms] || 60000);
  }
  // "an hour ago", "a minute ago"
  if (str.includes('an hour ago') || str.includes('a hour ago')) return syncedAt - 3600000;
  if (str.includes('a minute ago')) return syncedAt - 60000;
  return syncedAt;
}

/* ------------------------------------------------------------------ */
/*  Simulated fallback actions (used when sync-data.json unavailable)  */
/* ------------------------------------------------------------------ */
const FALLBACK_ACTIONS: Record<string, string[]> = {
  'nebula': ['Orchestrating swarm operations', 'Routing tasks to agents', 'Coordinating pipeline'],
  'youtube-shorts-creator': ['Producing YouTube Short', 'Uploading to YouTube', 'Rendering video'],
  'telegram-notifier': ['Sending digest to @joshua761', 'Delivering alert', 'Posting notification'],
  'kwen-net-page-manager': ['Publishing to Kwen Net', 'Checking page insights', 'Replying to comments'],
  'github-repo-manager': ['Pushing commit', 'Checking CI status', 'Updating repo files'],
  'research-intelligence-agent': ['Researching trending topics', 'Building intelligence brief', 'Scanning news'],
  'x-twitter-engagement-agent': ['Monitoring mentions', 'Posting tweet', 'Engaging with content'],
  'pr-monitor': ['Scanning PRs', 'Checking for stale PRs', 'Reviewing CI status'],
  'content-strategist-agent': ['Planning content calendar', 'Coordinating posts', 'Analyzing performance'],
  'code-agent': ['Running Python script', 'Executing build', 'Processing data'],
  'web-agent': ['Scraping web page', 'Extracting data', 'Crawling site'],
  'media-agent': ['Generating TTS audio', 'Analyzing image', 'Creating thumbnail'],
  'inbox-agent': ['Checking inbox', 'Sending email', 'Managing senders'],
  'agent-creator': ['Configuring agent tools', 'Installing skill', 'Building agent'],
  'google-drive-manager': ['Uploading to Drive', 'Organizing files', 'Sharing document'],
  'google-drive-file-manager': ['Syncing files', 'Downloading from Drive', 'Creating folder'],
  'spotify-music-manager': ['Checking recently played', 'Fetching recommendations', 'Updating playlist'],
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ------------------------------------------------------------------ */
/*  The main hook                                                      */
/* ------------------------------------------------------------------ */
export function useRealAgents() {
  const [agents, setAgents] = useState<Agent[]>(() => AGENTS.map(a => ({ ...a })));
  const [feed, setFeed] = useState<ActivityEvent[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const idCounter = useRef(0);
  const lastSyncRef = useRef<string | null>(null);

  /* -- Fetch and process sync data -- */
  const fetchSync = useCallback(async () => {
    try {
      const res = await fetch('/sync-data.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SyncData = await res.json();

      // Skip if same sync timestamp
      if (data.synced_at === lastSyncRef.current) return;
      lastSyncRef.current = data.synced_at;

      const syncTime = Date.parse(data.synced_at) || Date.now();
      setSyncedAt(data.synced_at);
      setIsLive(true);

      // Build a set of agent slugs that are currently "active"
      // An agent is active if a trigger that maps to it ran within the last hour
      const activeAgents = new Set<string>();
      const busyAgents = new Set<string>();
      const errorAgents = new Set<string>();

      for (const trigger of data.triggers) {
        const agentSlug = TRIGGER_AGENT_MAP[trigger.slug];
        if (!agentSlug) continue;
        const lastRun = parseRelativeTime(trigger.last_run_at, syncTime);
        if (lastRun > 0) {
          const hourAgo = syncTime - 3600000;
          const twoHoursAgo = syncTime - 7200000;
          if (lastRun > hourAgo) {
            busyAgents.add(agentSlug);
          } else if (lastRun > twoHoursAgo) {
            activeAgents.add(agentSlug);
          }
        }
      }

      // Check recent tasks for errors
      for (const task of data.recent_tasks) {
        if (task.status === 'failed') {
          const agentSlug = guessAgentFromTask(task.title);
          errorAgents.add(agentSlug);
        }
      }

      // Merge sync agents into static agent list
      const syncAgentMap = new Map(data.agents.map(a => [a.slug, a]));

      const updatedAgents: Agent[] = AGENTS.map(staticAgent => {
        const syncAgent = syncAgentMap.get(staticAgent.slug);
        let status: AgentStatus = 'idle';
        if (staticAgent.slug === 'nebula') {
          status = 'active'; // Nebula is always active
        } else if (errorAgents.has(staticAgent.slug)) {
          status = 'error';
        } else if (busyAgents.has(staticAgent.slug)) {
          status = 'busy';
        } else if (activeAgents.has(staticAgent.slug)) {
          status = 'active';
        }

        return {
          ...staticAgent,
          description: syncAgent?.description || staticAgent.description,
          status,
          lastAction: findLastAction(staticAgent.slug, data) || staticAgent.lastAction,
          lastActionTime: findLastActionTime(staticAgent.slug, data, syncTime) || staticAgent.lastActionTime,
          taskCount: countTasks(staticAgent.slug, data),
        };
      });

      // Add any agents from sync that aren't in the static list
      for (const syncAgent of data.agents) {
        if (!AGENTS.find(a => a.slug === syncAgent.slug) && syncAgent.slug !== 'useragent') {
          updatedAgents.push({
            id: syncAgent.slug,
            name: syncAgent.name,
            slug: syncAgent.slug,
            emoji: '\u2699\uFE0F',
            color: '#94a3b8',
            description: syncAgent.description,
            status: syncAgent.is_disabled ? 'idle' : 'active',
            lastAction: 'Discovered via sync',
            lastActionTime: syncTime,
            taskCount: 0,
          });
        }
      }

      setAgents(updatedAgents);

      // Convert recent tasks to activity feed events
      const newFeedEvents: ActivityEvent[] = data.recent_tasks
        .slice(0, 30)
        .map((task, i) => {
          const agentSlug = guessAgentFromTask(task.title);
          const staticAgent = AGENTS.find(a => a.slug === agentSlug);
          idCounter.current += 1;
          return {
            id: `sync-${idCounter.current}`,
            agentId: agentSlug,
            agentName: staticAgent?.name || agentSlug,
            emoji: staticAgent?.emoji || '\u2699\uFE0F',
            action: formatTaskAction(task),
            timestamp: parseRelativeTime(task.updated_at || task.created_at, syncTime),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);

      // Also add trigger run events
      for (const trigger of data.triggers) {
        if (trigger.last_run_at === 'Never') continue;
        const agentSlug = TRIGGER_AGENT_MAP[trigger.slug] || 'nebula';
        const staticAgent = AGENTS.find(a => a.slug === agentSlug);
        idCounter.current += 1;
        newFeedEvents.push({
          id: `trig-${idCounter.current}`,
          agentId: agentSlug,
          agentName: staticAgent?.name || agentSlug,
          emoji: staticAgent?.emoji || '\u2728',
          action: `Trigger: ${trigger.name} (run #${trigger.run_count})`,
          timestamp: parseRelativeTime(trigger.last_run_at, syncTime),
        });
      }

      newFeedEvents.sort((a, b) => b.timestamp - a.timestamp);
      setFeed(newFeedEvents.slice(0, 50));

    } catch {
      // sync-data.json not available yet -- fall back to simulation
      setIsLive(false);
    }
  }, []);

  /* -- Initial fetch + polling every 60s -- */
  useEffect(() => {
    fetchSync();
    const interval = setInterval(fetchSync, 60000);
    return () => clearInterval(interval);
  }, [fetchSync]);

  /* -- Fallback simulation when not live -- */
  useEffect(() => {
    if (isLive) return;

    const interval = setInterval(() => {
      setAgents(prev => {
        const next = prev.map(a => ({ ...a }));
        const count = Math.floor(Math.random() * 3) + 1;
        const newEvents: ActivityEvent[] = [];

        for (let i = 0; i < count; i++) {
          const idx = Math.floor(Math.random() * next.length);
          const agent = next[idx];
          const r = Math.random();
          const status: AgentStatus = agent.id === 'nebula'
            ? 'active'
            : r < 0.35 ? 'active' : r < 0.65 ? 'busy' : r < 0.97 ? 'idle' : 'error';
          const actions = FALLBACK_ACTIONS[agent.id] || ['Processing...'];
          const action = randomChoice(actions);

          agent.status = status;
          agent.lastAction = action;
          agent.lastActionTime = Date.now();
          agent.taskCount += (status === 'active' || status === 'busy') ? 1 : 0;

          idCounter.current += 1;
          newEvents.push({
            id: `sim-${idCounter.current}`,
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
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive]);

  return { agents, feed, syncedAt, isLive };
}

/* ------------------------------------------------------------------ */
/*  Helper: find the last action text for an agent from task history    */
/* ------------------------------------------------------------------ */
function findLastAction(slug: string, data: SyncData): string | null {
  for (const task of data.recent_tasks) {
    const taskAgent = guessAgentFromTask(task.title);
    if (taskAgent === slug) {
      return formatTaskAction(task);
    }
  }
  // Check triggers
  for (const trigger of data.triggers) {
    if (TRIGGER_AGENT_MAP[trigger.slug] === slug && trigger.last_run_at !== 'Never') {
      return `${trigger.name} (run #${trigger.run_count})`;
    }
  }
  return null;
}

function findLastActionTime(slug: string, data: SyncData, syncTime: number): number | null {
  for (const task of data.recent_tasks) {
    const taskAgent = guessAgentFromTask(task.title);
    if (taskAgent === slug) {
      return parseRelativeTime(task.updated_at, syncTime);
    }
  }
  for (const trigger of data.triggers) {
    if (TRIGGER_AGENT_MAP[trigger.slug] === slug && trigger.last_run_at !== 'Never') {
      return parseRelativeTime(trigger.last_run_at, syncTime);
    }
  }
  return null;
}

function countTasks(slug: string, data: SyncData): number {
  return data.recent_tasks.filter(t => guessAgentFromTask(t.title) === slug).length;
}

function formatTaskAction(task: SyncTask): string {
  const statusIcon = task.status === 'completed' ? '[OK]'
    : task.status === 'failed' ? '[FAIL]'
    : task.status === 'in_progress' ? '[RUN]'
    : '';
  // Trim long titles
  const title = task.title.length > 60 ? task.title.substring(0, 57) + '...' : task.title;
  return `${statusIcon} ${title}`.trim();
}
