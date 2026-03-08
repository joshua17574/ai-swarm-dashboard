import { useState, useMemo } from 'react';
import { useSimulatedAgents } from './useSimulatedAgents';
import { Agent, AgentStatus } from './types';

const STATUS_COLORS: Record<AgentStatus, string> = {
  active: '#4ade80',
  idle: '#94a3b8',
  busy: '#fbbf24',
  error: '#f87171',
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

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
  const glow = STATUS_COLORS[agent.status];

  return (
    <div
      className={`agent-node ${isSelected ? 'selected' : ''}`}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        '--glow-color': glow,
      } as React.CSSProperties}
      onClick={onClick}
      title={`${agent.name} - ${agent.status}`}
    >
      <div className="agent-avatar" style={{ borderColor: glow }}>
        <span className="agent-emoji">{agent.emoji}</span>
      </div>
      <div className="agent-label">{agent.name.replace(' Agent', '')}</div>
      <div className="status-dot" style={{ background: glow }} />
    </div>
  );
}

function DetailPanel({ agent }: { agent: Agent }) {
  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span className="detail-emoji">{agent.emoji}</span>
        <div>
          <h2 className="detail-name">{agent.name}</h2>
          <p className="detail-slug">@{agent.slug}</p>
        </div>
        <div
          className="detail-status-badge"
          style={{ background: STATUS_COLORS[agent.status] + '22', color: STATUS_COLORS[agent.status] }}
        >
          {agent.status.toUpperCase()}
        </div>
      </div>
      <p className="detail-desc">{agent.description}</p>
      <div className="detail-stats">
        <div className="stat">
          <span className="stat-value">{agent.taskCount}</span>
          <span className="stat-label">Tasks</span>
        </div>
        <div className="stat">
          <span className="stat-value">{timeAgo(agent.lastActionTime)}</span>
          <span className="stat-label">Last Active</span>
        </div>
      </div>
      <div className="detail-action">
        <span className="action-label">Latest:</span> {agent.lastAction}
      </div>
    </div>
  );
}

export default function App() {
  const { agents, feed } = useSimulatedAgents();
  const [selectedId, setSelectedId] = useState<string>('nebula');

  const nebula = agents.find((a) => a.id === 'nebula')!;
  const orbitAgents = agents.filter((a) => a.id !== 'nebula');
  const selected = agents.find((a) => a.id === selectedId) || nebula;

  const counts = useMemo(() => {
    const c = { active: 0, idle: 0, busy: 0, error: 0 };
    agents.forEach((a) => c[a.status]++);
    return c;
  }, [agents]);

  return (
    <div className="app">
      {/* Status Bar */}
      <header className="status-bar">
        <div className="status-title">NEBULA SWARM</div>
        <div className="status-counts">
          {(Object.keys(counts) as AgentStatus[]).map((s) => (
            <span key={s} className="status-count" style={{ color: STATUS_COLORS[s] }}>
              <span className="status-dot-sm" style={{ background: STATUS_COLORS[s] }} />
              {counts[s]} {s}
            </span>
          ))}
        </div>
      </header>

      <div className="main-layout">
        {/* Orbit Visualization */}
        <div className="orbit-container">
          <div className="orbit-ring" />
          {/* Nebula Center */}
          <div
            className={`nebula-center ${selectedId === 'nebula' ? 'selected' : ''}`}
            onClick={() => setSelectedId('nebula')}
          >
            <div className="nebula-glow" />
            <span className="nebula-emoji">{nebula.emoji}</span>
            <div className="nebula-label">NEBULA</div>
          </div>
          {/* Orbiting Agents */}
          {orbitAgents.map((agent, i) => {
            const angle = (2 * Math.PI * i) / orbitAgents.length - Math.PI / 2;
            return (
              <AgentNode
                key={agent.id}
                agent={agent}
                angle={angle}
                radius={180}
                onClick={() => setSelectedId(agent.id)}
                isSelected={selectedId === agent.id}
              />
            );
          })}
        </div>

        {/* Right Sidebar */}
        <div className="sidebar">
          <DetailPanel agent={selected} />

          <div className="feed-panel">
            <h3 className="feed-title">LIVE ACTIVITY</h3>
            <div className="feed-list">
              {feed.slice(0, 15).map((evt) => (
                <div key={evt.id} className="feed-item">
                  <span className="feed-emoji">{evt.emoji}</span>
                  <div className="feed-content">
                    <span className="feed-agent">{evt.agentName}</span>
                    <span className="feed-action">{evt.action}</span>
                  </div>
                  <span className="feed-time">{timeAgo(evt.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
