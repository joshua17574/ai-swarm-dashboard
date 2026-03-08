import React, { useState } from 'react';
import { useSwarm } from '../App';
import api from '../services/api';

const STATUS_ICONS = { pending: '○', in_progress: '◐', completed: '●', failed: '✕' };
const STATUS_COLORS = { pending: '#64748b', in_progress: '#00f0ff', completed: '#10b981', failed: '#ef4444' };
const PRIORITY_COLORS = { high: '#ef4444', medium: '#f97316', low: '#10b981' };

export default function TaskPanel({ onClose }) {
  const { tasks, agents } = useSwarm();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [filter, setFilter] = useState('all');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createTask(title, description, priority);
      setTitle(''); setDescription(''); setPriority('medium'); setShowCreate(false);
    } catch (err) { console.error(err); }
  };

  const handleAssign = async () => {
    if (!assignModal || selectedAgents.length === 0) return;
    try {
      await api.assignTask(assignModal.id, selectedAgents);
      setAssignModal(null); setSelectedAgents([]);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteTask(id); } catch (err) { console.error(err); }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="h-full glass-panel-purple rounded-xl flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
        <h3 className="text-sm font-bold tracking-wider text-purple-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          TASKS
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(!showCreate)} className="btn-neon-purple text-[10px] py-1 px-2">
            + NEW
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 flex gap-1" style={{ borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
        {['all', 'pending', 'in_progress', 'completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[9px] px-2 py-1 rounded tracking-wider uppercase transition-all ${filter === f ? 'text-purple-300' : 'text-gray-500 hover:text-gray-400'}`}
            style={filter === f ? { background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' } : { border: '1px solid transparent' }}>
            {f === 'in_progress' ? 'ACTIVE' : f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} className="input-neon text-xs py-2" placeholder="Task title" required />
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-neon text-xs py-2 resize-none" rows={2} placeholder="Description (optional)" />
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 text-[10px] py-1.5 rounded tracking-wider uppercase transition-all`}
                style={{
                  background: priority === p ? `${PRIORITY_COLORS[p]}20` : 'transparent',
                  border: `1px solid ${priority === p ? PRIORITY_COLORS[p] + '50' : 'rgba(100,116,139,0.2)'}`,
                  color: priority === p ? PRIORITY_COLORS[p] : '#64748b',
                }}>
                {p}
              </button>
            ))}
          </div>
          <button type="submit" className="btn-neon-purple w-full text-[10px]">CREATE TASK</button>
        </form>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-8">No tasks found</p>
        )}
        {filtered.map(task => {
          const sColor = STATUS_COLORS[task.status];
          const pColor = PRIORITY_COLORS[task.priority];
          return (
            <div key={task.id} className="p-3 rounded-lg transition-all hover:bg-white/[0.02]"
              style={{ background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(168,85,247,0.1)' }}>
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: sColor }}>{STATUS_ICONS[task.status]}</span>
                    <span className="text-xs font-semibold text-white truncate">{task.title}</span>
                  </div>
                  {task.description && (
                    <p className="text-[10px] text-gray-500 mt-0.5 pl-5 truncate">{task.description}</p>
                  )}
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded tracking-wider uppercase flex-shrink-0 ml-2"
                  style={{ background: `${pColor}15`, color: pColor, border: `1px solid ${pColor}30` }}>
                  {task.priority}
                </span>
              </div>

              {/* Progress */}
              {task.status === 'in_progress' && (
                <div className="mt-2 pl-5">
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-500 mt-0.5 block">{Math.round(task.progress)}% complete</span>
                </div>
              )}

              {/* Assigned agents */}
              {task.assigned_agents?.length > 0 && (
                <div className="mt-2 pl-5 flex flex-wrap gap-1">
                  {task.assigned_agents.map(aid => {
                    const ag = agents.find(a => a.id === aid);
                    return ag ? (
                      <span key={aid} className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.2)', color: '#00f0ff' }}>
                        {ag.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-1.5 mt-2 pl-5">
                {task.status === 'pending' && (
                  <button onClick={() => { setAssignModal(task); setSelectedAgents([]); }}
                    className="text-[9px] px-2 py-0.5 rounded text-purple-400 hover:bg-purple-500/10 transition-all"
                    style={{ border: '1px solid rgba(168,85,247,0.3)' }}>
                    ASSIGN
                  </button>
                )}
                <button onClick={() => handleDelete(task.id)}
                  className="text-[9px] px-2 py-0.5 rounded text-red-400 hover:bg-red-500/10 transition-all"
                  style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                  DELETE
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <div className="glass-panel-purple rounded-xl p-4 w-64">
            <h4 className="text-xs font-bold text-purple-400 tracking-wider mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              ASSIGN AGENTS
            </h4>
            <p className="text-[10px] text-gray-400 mb-3">Select agents for: {assignModal.title}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-3">
              {agents.filter(a => ['idle', 'active'].includes(a.status)).map(a => (
                <label key={a.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5 transition-all">
                  <input type="checkbox" checked={selectedAgents.includes(a.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAgents([...selectedAgents, a.id]);
                      else setSelectedAgents(selectedAgents.filter(id => id !== a.id));
                    }}
                    className="accent-purple-500" />
                  <span className="text-xs text-white">{a.name}</span>
                  <span className="text-[9px] text-gray-500 ml-auto">{a.role}</span>
                </label>
              ))}
              {agents.filter(a => ['idle', 'active'].includes(a.status)).length === 0 && (
                <p className="text-[10px] text-gray-600 text-center py-4">No available agents</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAssignModal(null)} className="btn-danger flex-1 text-[10px] py-1.5">CANCEL</button>
              <button onClick={handleAssign} className="btn-neon-purple flex-1 text-[10px] py-1.5" disabled={selectedAgents.length === 0}>ASSIGN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
