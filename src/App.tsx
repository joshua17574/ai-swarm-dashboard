import { useState, useMemo, useEffect, useRef } from 'react';
import { useSimulatedAgents } from './useSimulatedAgents';
import { useMissions } from './useMissions';
import { Agent, AgentStatus, Mission, MissionPriority, MissionStatus } from './types';
import { AGENTS } from './agents';

type ViewMode = 'swarm' | 'missions';

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: '#4ade80',
  idle: '#64748b',
  busy: '#fbbf24',
  error: '#f87171',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  active: 'ACTIVE',
  idle: 'IDLE',
  busy: 'BUSY',
  error: 'ERROR',
};

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  critical: '#f87171',
  high: '#fb923c',
  normal: '#60a5fa',
  low: '#64748b',
};

const PRIORITY_LABELS: Record<MissionPriority, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  normal: 'NORMAL',
  low: 'LOW',
};

const COLUMN_CONFIG: { key: MissionStatus; label: string; icon: string; color: string }[] = [
  { key: 'queued', label: 'Queued', icon: '\u23F3', color: '#64748b' },
  { key: 'in_progress', label: 'In Progress', icon: '\u26A1', color: '#fbbf24' },
  { key: 'completed', label: 'Completed', icon: '\u2705', color: '#4ade80' },
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getAgent(id: string): Agent | undefined {
  return AGENTS.find(a => a.id === id);
}

/* ========== Particle Background ========== */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.offsetWidth;
        if (p.x > canvas.offsetWidth) p.x = 0;
        if (p.y < 0) p.y = canvas.offsetHeight;
        if (p.y > canvas.offsetHeight) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
}

/* ========== SVG Connection Lines ========== */
function ConnectionLines({
  agents,
  radius,
  centerX,
  centerY,
  activeIds,
}: {
  agents: Agent[];
  radius: number;
  centerX: number;
  centerY: number;
  activeIds: Set<string>;
}) {
  return (
    <svg className="connection-svg" viewBox={`0 0 ${centerX * 2} ${centerY * 2}`}>
      <defs>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {agents.map((agent, i) => {
        const angle = (2 * Math.PI * i) / agents.length - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const isActive = activeIds.has(agent.id);
        return (
          <line
            key={agent.id}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke={isActive ? agent.color : 'rgba(167,139,250,0.08)'}
            strokeWidth={isActive ? 1.5 : 0.5}
            strokeDasharray={isActive ? 'none' : '4 4'}
            className={isActive ? 'connection-active' : ''}
          />
        );
      })}
    </svg>
  );
}

/* ========== Agent Node ========== */
function AgentNode({
  agent,
  angle,
  radius,
  onClick,
  isSelected,
}: {
  agent: Agent;
  angle: number;
  radius: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const statusColor = STATUS_COLORS[agent.status];
  const isActive = agent.status === 'active' || agent.status === 'busy';

  return (
    <div
      className={`agent-node ${isSelected ? 'selected' : ''} ${isActive ? 'is-active' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        '--agent-color': agent.color,
        '--status-color': statusColor,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="agent-ring">
        <div className="agent-avatar">
          <span className="agent-emoji">{agent.emoji}</span>
        </div>
        {isActive && <div className="agent-pulse-ring" />}
      </div>
      <div className="agent-label">{agent.name.replace(' Agent', '').replace(' Manager', '')}</div>
      <div className="agent-status-indicator" style={{ background: statusColor }} />
    </div>
  );
}

/* ========== Detail Panel ========== */
function DetailPanel({ agent }: { agent: Agent }) {
  const statusColor = STATUS_COLORS[agent.status];

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-avatar-wrap">
          <span className="detail-emoji">{agent.emoji}</span>
        </div>
        <div className="detail-info">
          <h2 className="detail-name">{agent.name}</h2>
          <span className="detail-slug">@{agent.slug}</span>
        </div>
      </div>
      <div
        className="detail-status-badge"
        style={{ background: statusColor + '18', color: statusColor, borderColor: statusColor + '40' }}
      >
        <span className="status-pulse" style={{ background: statusColor }} />
        {STATUS_LABELS[agent.status]}
      </div>
      <p className="detail-desc">{agent.description}</p>
      <div className="detail-metrics">
        <div className="metric">
          <span className="metric-value">{agent.taskCount}</span>
          <span className="metric-label">Tasks Run</span>
        </div>
        <div className="metric-divider" />
        <div className="metric">
          <span className="metric-value">{timeAgo(agent.lastActionTime)}</span>
          <span className="metric-label">Last Active</span>
        </div>
      </div>
      <div className="detail-latest">
        <span className="latest-label">Latest Action</span>
        <span className="latest-value">{agent.lastAction}</span>
      </div>
    </div>
  );
}

/* ========== Mission Card ========== */
function MissionCard({ mission }: { mission: Mission }) {
  const agent = getAgent(mission.assignedAgentId);
  const priorityColor = PRIORITY_COLORS[mission.priority];

  return (
    <div className={`mission-card mission-card-${mission.status}`}>
      <div className="mission-card-top">
        <span
          className="mission-priority-badge"
          style={{ background: priorityColor + '20', color: priorityColor, borderColor: priorityColor + '50' }}
        >
          {PRIORITY_LABELS[mission.priority]}
        </span>
        {mission.status === 'completed' && (
          <span className="mission-complete-check">\u2713</span>
        )}
      </div>
      <h4 className="mission-card-title">{mission.title}</h4>
      <p className="mission-card-desc">{mission.description}</p>

      {mission.status === 'in_progress' && (
        <div className="mission-progress-wrap">
          <div className="mission-progress-bar">
            <div
              className="mission-progress-fill"
              style={{ width: `${mission.progress}%`, background: agent?.color || '#a78bfa' }}
            />
          </div>
          <span className="mission-progress-pct">{mission.progress}%</span>
        </div>
      )}

      <div className="mission-card-footer">
        <div className="mission-agent-tag">
          <span className="mission-agent-emoji">{agent?.emoji || '\u2728'}</span>
          <span className="mission-agent-name">{agent?.name || 'Unknown'}</span>
        </div>
        <span className="mission-time">
          {mission.status === 'completed' && mission.completedAt
            ? timeAgo(mission.completedAt)
            : mission.status === 'in_progress' && mission.startedAt
            ? timeAgo(mission.startedAt)
            : timeAgo(mission.createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ========== Mission Board (Kanban) ========== */
function MissionBoard({ missions }: { missions: Mission[] }) {
  const grouped = useMemo(() => {
    const g: Record<MissionStatus, Mission[]> = { queued: [], in_progress: [], completed: [] };
    missions.forEach(m => g[m.status].push(m));
    // Sort: critical first within each column
    const priorityOrder: Record<MissionPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    Object.values(g).forEach(arr => arr.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]));
    // Completed: most recent first
    g.completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    return g;
  }, [missions]);

  return (
    <div className="kanban-board">
      {COLUMN_CONFIG.map(col => (
        <div key={col.key} className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-col-icon">{col.icon}</span>
            <span className="kanban-col-label">{col.label}</span>
            <span className="kanban-col-count" style={{ background: col.color + '25', color: col.color }}>
              {grouped[col.key].length}
            </span>
          </div>
          <div className="kanban-column-body">
            {grouped[col.key].map(mission => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
            {grouped[col.key].length === 0 && (
              <div className="kanban-empty">No missions</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== Main App ========== */
export default function App() {
  const { agents, feed } = useSimulatedAgents();
  const missions = useMissions();
  const [selectedId, setSelectedId] = useState<string>('nebula');
  const [viewMode, setViewMode] = useState<ViewMode>('swarm');
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const nebula = agents.find((a) => a.id === 'nebula')!;
  const orbitAgents = agents.filter((a) => a.id !== 'nebula');
  const selected = agents.find((a) => a.id === selectedId) || nebula;

  const activeIds = useMemo(
    () => new Set(agents.filter((a) => a.status === 'active' || a.status === 'busy').map((a) => a.id)),
    [agents]
  );

  const counts = useMemo(() => {
    const c = { active: 0, idle: 0, busy: 0, error: 0 };
    agents.forEach((a) => c[a.status]++);
    return c;
  }, [agents]);

  const missionCounts = useMemo(() => {
    const c = { queued: 0, in_progress: 0, completed: 0 };
    missions.forEach(m => c[m.status]++);
    return c;
  }, [missions]);

  const orbitRadius = 200;
  const centerXY = 300;

  return (
    <div className="app">
      <ParticleField />

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">N</div>
          <div className="header-title">
            <h1>NEBULA SWARM</h1>
            <span className="header-sub">{agents.length} agents online</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'swarm' ? 'active' : ''}`}
            onClick={() => setViewMode('swarm')}
          >
            <span className="view-toggle-icon">&#x1F30C;</span>
            Swarm
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'missions' ? 'active' : ''}`}
            onClick={() => setViewMode('missions')}
          >
            <span className="view-toggle-icon">&#x1F4CB;</span>
            Missions
            <span className="view-toggle-badge">{missionCounts.in_progress}</span>
          </button>
        </div>

        <div className="header-stats">
          {viewMode === 'swarm'
            ? (Object.keys(counts) as AgentStatus[]).map((s) => (
                <div key={s} className="header-stat">
                  <span className="header-stat-dot" style={{ background: STATUS_COLORS[s] }} />
                  <span className="header-stat-count">{counts[s]}</span>
                  <span className="header-stat-label">{s}</span>
                </div>
              ))
            : COLUMN_CONFIG.map((col) => (
                <div key={col.key} className="header-stat">
                  <span className="header-stat-dot" style={{ background: col.color }} />
                  <span className="header-stat-count">{missionCounts[col.key]}</span>
                  <span className="header-stat-label">{col.label}</span>
                </div>
              ))}
        </div>
      </header>

      {/* ===== SWARM VIEW ===== */}
      {viewMode === 'swarm' && (
        <div className="main-layout">
          <div className="orbit-container">
            <ConnectionLines
              agents={orbitAgents}
              radius={orbitRadius}
              centerX={centerXY}
              centerY={centerXY}
              activeIds={activeIds}
            />
            <div className="orbit-ring ring-1" />
            <div className="orbit-ring ring-2" />

            <div
              className={`nebula-center ${selectedId === 'nebula' ? 'selected' : ''}`}
              onClick={() => setSelectedId('nebula')}
            >
              <div className="nebula-core-glow" />
              <div className="nebula-core">
                <span className="nebula-emoji">{nebula.emoji}</span>
              </div>
              <div className="nebula-label">NEBULA</div>
              <div className="nebula-sub">orchestrator</div>
            </div>

            {orbitAgents.map((agent, i) => {
              const angle = (2 * Math.PI * i) / orbitAgents.length - Math.PI / 2;
              return (
                <AgentNode
                  key={agent.id}
                  agent={agent}
                  angle={angle}
                  radius={orbitRadius}
                  onClick={() => setSelectedId(agent.id)}
                  isSelected={selectedId === agent.id}
                />
              );
            })}
          </div>

          <div className="sidebar">
            <DetailPanel agent={selected} />
            <div className="feed-section">
              <div className="feed-header">
                <h3 className="feed-title">LIVE ACTIVITY</h3>
                <span className="feed-badge">{feed.length}</span>
              </div>
              <div className="feed-list">
                {feed.slice(0, 20).map((evt) => (
                  <div
                    key={evt.id}
                    className={`feed-item ${evt.agentId === selectedId ? 'feed-highlight' : ''}`}
                    onClick={() => setSelectedId(evt.agentId)}
                  >
                    <div className="feed-icon">
                      <span>{evt.emoji}</span>
                    </div>
                    <div className="feed-body">
                      <span className="feed-agent-name">{evt.agentName}</span>
                      <span className="feed-action-text">{evt.action}</span>
                    </div>
                    <span className="feed-time">{timeAgo(evt.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MISSIONS VIEW ===== */}
      {viewMode === 'missions' && (
        <div className="missions-layout">
          <MissionBoard missions={missions} />
        </div>
      )}
    </div>
  );
}
