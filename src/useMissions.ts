import { useEffect, useRef, useState } from 'react';
import { Mission, MissionPriority } from './types';

interface MissionTemplate {
  title: string;
  description: string;
  agentId: string;
  priority: MissionPriority;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  // Nebula orchestrator
  { title: 'Coordinate swarm deployment', description: 'Orchestrate a multi-agent pipeline to deploy the latest dashboard build across staging and production.', agentId: 'nebula', priority: 'critical' },
  { title: 'Rebalance agent workloads', description: 'Analyze current agent utilization and redistribute queued tasks for optimal throughput.', agentId: 'nebula', priority: 'high' },
  { title: 'Run hourly airdrop digest', description: 'Search, compile, and publish the latest crypto airdrop opportunities to Kwen Net.', agentId: 'nebula', priority: 'normal' },

  // Code Agent
  { title: 'Analyze sales CSV dataset', description: 'Process sales_q1.csv with pandas — generate pivot tables, trend charts, and export summary report.', agentId: 'code-agent', priority: 'high' },
  { title: 'Build matplotlib dashboard charts', description: 'Generate 6 visualization charts from the latest analytics data for the weekly report.', agentId: 'code-agent', priority: 'normal' },
  { title: 'Run TypeScript compilation', description: 'Compile and type-check the ai-swarm-dashboard project, fix any build errors.', agentId: 'code-agent', priority: 'normal' },

  // Web Agent
  { title: 'Scrape competitor pricing data', description: 'Extract pricing tables from 5 competitor websites and compile into structured JSON.', agentId: 'web-agent', priority: 'high' },
  { title: 'Crawl API documentation site', description: 'Map and extract all endpoint docs from the new API provider for agent integration.', agentId: 'web-agent', priority: 'normal' },
  { title: 'Monitor site uptime check', description: 'Verify all 12 monitored URLs are responding with 200 status codes.', agentId: 'web-agent', priority: 'low' },

  // Media Agent
  { title: 'Transcribe team meeting audio', description: 'Convert 45-minute meeting recording to text with speaker labels using Whisper.', agentId: 'media-agent', priority: 'high' },
  { title: 'Generate YouTube thumbnail', description: 'Create an eye-catching 1280x720 thumbnail for the latest YouTube Short using Gemini.', agentId: 'media-agent', priority: 'normal' },
  { title: 'OCR scan receipt documents', description: 'Extract text and amounts from 8 uploaded receipt images for expense tracking.', agentId: 'media-agent', priority: 'low' },

  // Inbox Agent
  { title: 'Send weekly digest email', description: 'Compile this week\'s agent activity summary and email it to joshua.daquipil17@gmail.com.', agentId: 'inbox-agent', priority: 'normal' },
  { title: 'Process verification codes', description: 'Monitor inbox for incoming verification emails and extract OTP codes.', agentId: 'inbox-agent', priority: 'critical' },
  { title: 'Archive old email threads', description: 'Clean up inbox by archiving threads older than 30 days with no recent replies.', agentId: 'inbox-agent', priority: 'low' },

  // Agent Creator
  { title: 'Build Notion integration agent', description: 'Create a new specialized agent with Notion OAuth, database tools, and page management skills.', agentId: 'agent-creator', priority: 'high' },
  { title: 'Install skill from registry', description: 'Browse community skill registry and install "advanced-data-viz" skill onto code-agent.', agentId: 'agent-creator', priority: 'normal' },

  // PR Monitor
  { title: 'Scan stale pull requests', description: 'Check all joshua17574 repos for PRs open longer than 48 hours and flag for review.', agentId: 'pr-monitor', priority: 'high' },
  { title: 'CI failure triage report', description: 'Analyze failing GitHub Actions across all repos and generate root cause summary.', agentId: 'pr-monitor', priority: 'critical' },

  // GitHub Repo Manager
  { title: 'Deploy dashboard update', description: 'Push latest code changes to ai-swarm-dashboard main branch and verify Vercel deployment.', agentId: 'github-repo-manager', priority: 'critical' },
  { title: 'Create feature branch for missions', description: 'Branch off main, scaffold mission-board feature files, and open draft PR.', agentId: 'github-repo-manager', priority: 'high' },
  { title: 'Merge approved pull requests', description: 'Review and merge 3 approved PRs that passed CI checks.', agentId: 'github-repo-manager', priority: 'normal' },

  // Kwen Net Page Manager
  { title: 'Publish crypto news post', description: 'Draft and publish today\'s top 3 crypto news stories to the Kwen Net Facebook page.', agentId: 'kwen-net-page-manager', priority: 'high' },
  { title: 'Reply to page comments', description: 'Respond to 12 unanswered comments on recent Kwen Net posts with helpful engagement.', agentId: 'kwen-net-page-manager', priority: 'normal' },
  { title: 'Check page insights analytics', description: 'Pull this week\'s reach, engagement, and follower growth metrics from Kwen Net.', agentId: 'kwen-net-page-manager', priority: 'low' },

  // Google Drive Managers
  { title: 'Organize project folder structure', description: 'Create Q1 2026 folder hierarchy and move relevant documents from root.', agentId: 'google-drive-manager', priority: 'normal' },
  { title: 'Share reports with team', description: 'Set sharing permissions on 5 weekly report files for collaborator access.', agentId: 'google-drive-file-manager', priority: 'normal' },

  // Spotify Music Manager
  { title: 'Generate focus playlist', description: 'Search for top-rated lo-fi and ambient tracks, create a 2-hour "Deep Focus" playlist.', agentId: 'spotify-music-manager', priority: 'low' },
  { title: 'Analyze listening history', description: 'Pull recently played tracks and generate a genre distribution breakdown.', agentId: 'spotify-music-manager', priority: 'low' },

  // X Twitter Agent
  { title: 'Post engagement thread', description: 'Compose and publish a 4-tweet thread about AI agent swarms with relevant hashtags.', agentId: 'x-twitter-engagement-agent', priority: 'high' },
  { title: 'Monitor mentions & replies', description: 'Scan @joshua761 mentions from the last 6 hours and engage with relevant replies.', agentId: 'x-twitter-engagement-agent', priority: 'normal' },
];

let missionIdCounter = 0;

function createMission(template: MissionTemplate): Mission {
  missionIdCounter++;
  return {
    id: `mission-${missionIdCounter}-${Date.now()}`,
    title: template.title,
    description: template.description,
    status: 'queued',
    assignedAgentId: template.agentId,
    priority: template.priority,
    progress: 0,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>(() => {
    const shuffled = [...MISSION_TEMPLATES].sort(() => Math.random() - 0.5);
    const initial: Mission[] = [];

    // 2 completed
    for (let i = 0; i < 2; i++) {
      const m = createMission(shuffled[i]);
      m.status = 'completed';
      m.progress = 100;
      m.startedAt = Date.now() - 300000 - Math.random() * 600000;
      m.completedAt = Date.now() - Math.random() * 300000;
      initial.push(m);
    }

    // 3 in progress
    for (let i = 2; i < 5; i++) {
      const m = createMission(shuffled[i]);
      m.status = 'in_progress';
      m.progress = Math.floor(Math.random() * 70) + 15;
      m.startedAt = Date.now() - Math.random() * 300000;
      initial.push(m);
    }

    // 3 queued
    for (let i = 5; i < 8; i++) {
      const m = createMission(shuffled[i]);
      initial.push(m);
    }

    return initial;
  });

  const usedTemplates = useRef(new Set<string>());

  useEffect(() => {
    missions.forEach(m => usedTemplates.current.add(m.title));

    // Progress ticker: advance in_progress missions every 800ms
    const progressInterval = setInterval(() => {
      setMissions(prev => {
        let changed = false;
        const next = prev.map(m => {
          if (m.status === 'in_progress' && m.progress < 100) {
            changed = true;
            const increment = Math.floor(Math.random() * 8) + 2;
            const newProgress = Math.min(m.progress + increment, 100);
            if (newProgress >= 100) {
              return { ...m, progress: 100, status: 'completed' as const, completedAt: Date.now() };
            }
            return { ...m, progress: newProgress };
          }
          return m;
        });
        return changed ? next : prev;
      });
    }, 800);

    // Promote queued -> in_progress every 4-6s
    const promoteInterval = setInterval(() => {
      setMissions(prev => {
        const queued = prev.filter(m => m.status === 'queued');
        if (queued.length === 0) return prev;
        const target = queued[0];
        return prev.map(m =>
          m.id === target.id
            ? { ...m, status: 'in_progress' as const, startedAt: Date.now(), progress: Math.floor(Math.random() * 10) + 5 }
            : m
        );
      });
    }, 4000 + Math.random() * 2000);

    // Add new missions every 6-10s
    const addInterval = setInterval(() => {
      setMissions(prev => {
        const active = prev.filter(m => m.status !== 'completed').length;
        if (active >= 8) return prev;

        const available = MISSION_TEMPLATES.filter(t => !usedTemplates.current.has(t.title));
        if (available.length === 0) {
          usedTemplates.current.clear();
          prev.forEach(m => usedTemplates.current.add(m.title));
          return prev;
        }

        const template = pickRandom(available);
        usedTemplates.current.add(template.title);
        const newMission = createMission(template);

        let next = [...prev, newMission];
        const completed = next.filter(m => m.status === 'completed');
        if (next.length > 14 && completed.length > 0) {
          const oldestCompleted = completed.sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0))[0];
          next = next.filter(m => m.id !== oldestCompleted.id);
        }

        return next;
      });
    }, 6000 + Math.random() * 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(promoteInterval);
      clearInterval(addInterval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return missions;
}
