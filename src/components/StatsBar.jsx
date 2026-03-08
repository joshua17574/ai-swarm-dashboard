import React from 'react';
import { useSwarm } from '../App';

function StatBox({ label, value, color, icon }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <span className="text-xs" style={{ color: `${color}` }}>{icon}</span>
      <div>
        <div className="text-xs font-bold" style={{ color, fontFamily: 'Orbitron, sans-serif' }}>{value}</div>
        <div className="text-[9px] text-gray-500 tracking-wider uppercase">{label}</div>
      </div>
    </div>
  );
}

export default function StatsBar() {
  const { stats, agents } = useSwarm();
  if (!stats) return null;

  const healthColor = stats.systemHealth === 'operational' ? '#10b981' : stats.systemHealth === 'idle' ? '#f97316' : '#64748b';

  return (
    <div className="hidden md:flex items-center gap-2">
      <StatBox label="Agents" value={stats.totalAgents} color="#00f0ff" icon="&#9679;" />
      <StatBox label="Active" value={stats.activeAgents} color="#10b981" icon="&#9650;" />
      <StatBox label="Running" value={stats.runningTasks} color="#a855f7" icon="&#9654;" />
      <StatBox label="Done" value={stats.completedTasks} color="#06b6d4" icon="&#10003;" />
      <StatBox label="CPU" value={`${stats.avgCpuUsage}%`} color="#f97316" icon="&#9632;" />
      <StatBox label="MEM" value={`${stats.avgMemoryUsage}%`} color="#ec4899" icon="&#9644;" />
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: `${healthColor}10`, border: `1px solid ${healthColor}30` }}>
        <span className="w-2 h-2 rounded-full" style={{ background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
        <span className="text-[9px] tracking-wider uppercase" style={{ color: healthColor }}>
          {stats.systemHealth === 'operational' ? 'NOMINAL' : stats.systemHealth === 'idle' ? 'STANDBY' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}
