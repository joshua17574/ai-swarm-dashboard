import React, { useState } from 'react';
import { useSwarm } from '../App';
import api from '../services/api';

const ROLES = ['executor', 'planner', 'researcher', 'monitor', 'communicator'];

export default function ControlPanel({ onClose }) {
  const { agents, stats } = useSwarm();
  const [tab, setTab] = useState('overview');
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('executor');
  const [scaleCount, setScaleCount] = useState(3);
  const [scaleRole, setScaleRole] = useState('executor');
  const [scalePrefix, setScalePrefix] = useState('Agent');
  const [creating, setCreating] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!agentName.trim()) return;
    setCreating(true);
    try {
      const data = await api.createAgent(agentName, agentRole);
      setNewApiKey(data.api_key);
      setAgentName('');
    } catch (err) { console.error(err); }
    setCreating(false);
  };

  const handleScale = async () => {
    try { await api.scaleSwarm(scaleCount, scaleRole, scalePrefix); } catch (err) { console.error(err); }
  };

  const handlePause = async () => { try { await api.pauseSwarm(); } catch (err) { console.error(err); } };
  const handleResume = async () => { try { await api.resumeSwarm(); } catch (err) { console.error(err); } };

  const handleDeleteAgent = async (id) => {
    try { await api.deleteAgent(id); } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'create', label: 'NEW AGENT' },
    { id: 'scale', label: 'SCALE' },
    { id: 'manage', label: 'MANAGE' },
  ];

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in-up mx-4">
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,240,255,0.15)' }}>
          <div>
            <h2 className="text-lg font-bold tracking-wider text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              COMMAND CENTER
            </h2>
            <p className="text-[10px] text-gray-500 tracking-wider mt-0.5">SWARM MANAGEMENT INTERFACE</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-[10px] tracking-wider rounded-t-lg transition-all ${tab === t.id ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
              style={tab === t.id ? { background: 'rgba(0,240,255,0.08)', borderTop: '2px solid rgba(0,240,255,0.5)' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Overview Tab */}
          {tab === 'overview' && stats && (
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-3">
                <button onClick={handlePause} className="btn-neon-purple flex-1 text-xs py-3">
                  <span className="block text-lg mb-1">&#10074;&#10074;</span> PAUSE SWARM
                </button>
                <button onClick={handleResume} className="btn-neon flex-1 text-xs py-3">
                  <span className="block text-lg mb-1">&#9654;</span> RESUME SWARM
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Agents', value: stats.totalAgents, color: '#00f0ff' },
                  { label: 'Active', value: stats.activeAgents, color: '#10b981' },
                  { label: 'Idle', value: stats.idleAgents, color: '#64748b' },
                  { label: 'Stopped', value: stats.stoppedAgents, color: '#ef4444' },
                  { label: 'Running Tasks', value: stats.runningTasks, color: '#a855f7' },
                  { label: 'Completed', value: stats.completedTasks, color: '#10b981' },
                  { label: 'Avg CPU', value: `${stats.avgCpuUsage}%`, color: '#f97316' },
                  { label: 'Avg Memory', value: `${stats.avgMemoryUsage}%`, color: '#ec4899' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-lg" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                    <div className="text-xl font-bold" style={{ color: s.color, fontFamily: 'Orbitron, sans-serif' }}>{s.value}</div>
                    <div className="text-[9px] text-gray-500 tracking-wider mt-1 uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* System Health */}
              <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,240,255,0.1)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-3 h-3 rounded-full"
                    style={{ background: stats.systemHealth === 'operational' ? '#10b981' : '#f97316', boxShadow: `0 0 8px ${stats.systemHealth === 'operational' ? '#10b981' : '#f97316'}` }} />
                  <span className="text-sm font-bold tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif', color: stats.systemHealth === 'operational' ? '#10b981' : '#f97316' }}>
                    SYSTEM {stats.systemHealth === 'operational' ? 'NOMINAL' : stats.systemHealth === 'idle' ? 'STANDBY' : 'OFFLINE'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-xs text-gray-400">Uptime</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>99.97%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Latency</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>12ms</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Throughput</div>
                    <div className="text-sm text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>1.2k/s</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Agent Tab */}
          {tab === 'create' && (
            <div className="space-y-4">
              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 tracking-wider uppercase mb-1.5">Agent Name</label>
                  <input value={agentName} onChange={e => setAgentName(e.target.value)} className="input-neon text-sm" placeholder="e.g. Sentinel-Alpha" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 tracking-wider uppercase mb-1.5">Role</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setAgentRole(r)}
                        className={`py-2 rounded-lg text-[10px] tracking-wider uppercase transition-all`}
                        style={{
                          background: agentRole === r ? 'rgba(0,240,255,0.15)' : 'rgba(15,23,42,0.5)',
                          border: `1px solid ${agentRole === r ? 'rgba(0,240,255,0.4)' : 'rgba(100,116,139,0.2)'}`,
                          color: agentRole === r ? '#00f0ff' : '#64748b',
                        }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={creating} className="btn-neon w-full py-3 text-xs tracking-wider">
                  {creating ? 'INITIALIZING...' : 'DEPLOY AGENT'}
                </button>
              </form>

              {newApiKey && (
                <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <h4 className="text-[10px] text-green-400 tracking-wider uppercase mb-2">Agent Deployed Successfully</h4>
                  <p className="text-[10px] text-gray-400 mb-2">API Key (save this — shown only once):</p>
                  <div className="p-2 rounded bg-gray-900/50 flex items-center gap-2">
                    <code className="text-xs text-green-300 flex-1 break-all" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{newApiKey}</code>
                    <button onClick={() => { navigator.clipboard.writeText(newApiKey); }}
                      className="text-gray-500 hover:text-white transition-colors flex-shrink-0 p-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scale Tab */}
          {tab === 'scale' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">Deploy multiple agents at once to scale your swarm.</p>
              <div>
                <label className="block text-[10px] text-gray-400 tracking-wider uppercase mb-1.5">Number of Agents</label>
                <input type="range" min="1" max="20" value={scaleCount} onChange={e => setScaleCount(parseInt(e.target.value))}
                  className="w-full accent-cyan-500" />
                <div className="text-center text-2xl font-bold text-cyan-400 mt-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>{scaleCount}</div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 tracking-wider uppercase mb-1.5">Name Prefix</label>
                <input value={scalePrefix} onChange={e => setScalePrefix(e.target.value)} className="input-neon text-sm" placeholder="Agent" />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 tracking-wider uppercase mb-1.5">Role</label>
                <div className="grid grid-cols-5 gap-2">
                  {ROLES.map(r => (
                    <button key={r} type="button" onClick={() => setScaleRole(r)}
                      className="py-2 rounded-lg text-[10px] tracking-wider uppercase transition-all"
                      style={{
                        background: scaleRole === r ? 'rgba(168,85,247,0.15)' : 'rgba(15,23,42,0.5)',
                        border: `1px solid ${scaleRole === r ? 'rgba(168,85,247,0.4)' : 'rgba(100,116,139,0.2)'}`,
                        color: scaleRole === r ? '#a855f7' : '#64748b',
                      }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleScale} className="btn-neon-purple w-full py-3 text-xs tracking-wider">
                SCALE SWARM (+{scaleCount} AGENTS)
              </button>
            </div>
          )}

          {/* Manage Tab */}
          {tab === 'manage' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-gray-500 tracking-wider">{agents.length} AGENTS REGISTERED</span>
              </div>
              {agents.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-8">No agents deployed yet</p>
              )}
              {agents.map(agent => {
                const sColor = { active: '#10b981', working: '#00f0ff', idle: '#64748b', paused: '#f97316', stopped: '#ef4444' }[agent.status] || '#64748b';
                return (
                  <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/[0.02]"
                    style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(0,240,255,0.08)' }}>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: sColor, boxShadow: `0 0 6px ${sColor}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{agent.name}</div>
                      <div className="text-[9px] text-gray-500">{agent.role} | CPU: {(agent.cpu_usage || 0).toFixed(0)}% | MEM: {(agent.memory_usage || 0).toFixed(0)}%</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => api.controlAgent(agent.id, 'start')}
                        className="text-[9px] px-2 py-1 rounded text-green-400 hover:bg-green-500/10 transition-all" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
                        ON
                      </button>
                      <button onClick={() => api.controlAgent(agent.id, 'stop')}
                        className="text-[9px] px-2 py-1 rounded text-red-400 hover:bg-red-500/10 transition-all" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                        OFF
                      </button>
                      <button onClick={() => handleDeleteAgent(agent.id)}
                        className="text-[9px] px-2 py-1 rounded text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all" style={{ border: '1px solid rgba(100,116,139,0.2)' }}>
                        DEL
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
