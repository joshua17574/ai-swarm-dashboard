import React, { useState, useEffect } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
  active: '#10b981', working: '#00f0ff', idle: '#64748b',
  paused: '#f97316', stopped: '#ef4444', error: '#ef4444',
};

function MetricBar({ label, value, color, max = 100 }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span style={{ color }}>{typeof value === 'number' ? value.toFixed(1) : value}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${Math.min(value, max)}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AgentPanel({ agent, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agent?.id) return;
    setLoading(true);
    api.getAgentLogs(agent.id, 30)
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      api.getAgentLogs(agent.id, 30).then(data => setLogs(data.logs || [])).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [agent?.id]);

  const handleControl = async (action) => {
    try { await api.controlAgent(agent.id, action); } catch (err) { console.error(err); }
  };

  const statusColor = STATUS_COLORS[agent.status] || '#64748b';

  return (
    <div className="h-full glass-panel rounded-xl flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="p-4 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="status-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
            <h3 className="text-sm font-bold text-white truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {agent.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
              {agent.role}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider"
              style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}30`, color: statusColor }}>
              {agent.status}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="p-4 flex gap-2" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
        <button onClick={() => handleControl('start')} className="btn-neon text-[10px] flex-1 py-1.5">START</button>
        <button onClick={() => handleControl('pause')} className="btn-neon-purple text-[10px] flex-1 py-1.5">PAUSE</button>
        <button onClick={() => handleControl('stop')} className="btn-danger text-[10px] flex-1 py-1.5">STOP</button>
      </div>

      {/* Metrics */}
      <div className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
        <h4 className="text-[10px] text-gray-500 tracking-wider uppercase">Performance Metrics</h4>
        <MetricBar label="CPU Usage" value={agent.cpu_usage || 0} color="#f97316" />
        <MetricBar label="Memory" value={agent.memory_usage || 0} color="#ec4899" />
        <MetricBar label="Network I/O" value={agent.network_io || 0} color="#06b6d4" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div className="text-lg font-bold text-green-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>{agent.tasks_completed || 0}</div>
            <div className="text-[9px] text-gray-500 tracking-wider">COMPLETED</div>
          </div>
          <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="text-lg font-bold text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>{agent.tasks_failed || 0}</div>
            <div className="text-[9px] text-gray-500 tracking-wider">FAILED</div>
          </div>
        </div>
      </div>

      {/* Current Action */}
      {agent.current_action && (
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
          <h4 className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">Current Action</h4>
          <p className="text-xs text-cyan-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{agent.current_action}</p>
        </div>
      )}

      {/* Logs */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-4">
        <h4 className="text-[10px] text-gray-500 tracking-wider uppercase mb-2">Activity Log</h4>
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {loading && <p className="text-xs text-gray-600">Loading logs...</p>}
          {logs.length === 0 && !loading && <p className="text-xs text-gray-600">No logs yet</p>}
          {logs.map((log, i) => {
            const levelColor = log.level === 'error' ? '#ef4444' : log.level === 'warn' ? '#f97316' : '#64748b';
            return (
              <div key={i} className="text-[10px] py-1 px-2 rounded" style={{ background: 'rgba(15,23,42,0.5)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: levelColor }} />
                  <span className="text-gray-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-300 mt-0.5 pl-3.5">{log.message}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
