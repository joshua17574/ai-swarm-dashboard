import React, { useState } from 'react';
import { useAuth, useSwarm } from '../App';
import SwarmScene from './SwarmScene';
import ControlPanel from './ControlPanel';
import AgentPanel from './AgentPanel';
import TaskPanel from './TaskPanel';
import StatsBar from './StatsBar';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { wsConnected, selectedAgent, setSelectedAgent, selectedTask, setSelectedTask } = useSwarm();
  const [showControl, setShowControl] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* 3D Scene Background */}
      <SwarmScene />

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* ── Top Bar ───────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 z-20"
          style={{ background: 'linear-gradient(180deg, rgba(3,7,18,0.9) 0%, rgba(3,7,18,0) 100%)' }}>
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-[0.3em] text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                SWARM CONTROL
              </h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-400'}`} />
                {wsConnected ? 'LIVE FEED' : 'RECONNECTING'}
              </div>
            </div>
          </div>

          {/* Center: Stats Bar */}
          <StatsBar />

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <button onClick={() => setShowTasks(!showTasks)} className="btn-neon text-xs tracking-wider">
              TASKS
            </button>
            <button onClick={() => setShowControl(!showControl)} className="btn-neon-purple text-xs tracking-wider">
              CONTROL
            </button>
            <div className="flex items-center gap-2 ml-2 pl-3" style={{ borderLeft: '1px solid rgba(100,116,139,0.3)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#a855f7' }}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-400 hidden sm:block">{user?.username}</span>
              <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors ml-1" title="Logout">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom HUD ────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 py-4 z-20"
          style={{ background: 'linear-gradient(0deg, rgba(3,7,18,0.8) 0%, rgba(3,7,18,0) 100%)' }}>
          <div className="text-xs text-gray-600 tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <div>SYS.TIME: {new Date().toLocaleTimeString()}</div>
            <div>GRID: 60x60 | FOV: 60</div>
          </div>
          <div className="text-xs text-gray-600 tracking-wider text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            <div>ORBIT CAM | SCROLL TO ZOOM</div>
            <div>CLICK AGENTS/TASKS TO INSPECT</div>
          </div>
        </div>

        {/* ── Side Panels ───────────────────────────────────── */}
        {/* Agent Detail Panel (right side) */}
        {selectedAgent && (
          <div className="absolute top-16 right-4 bottom-16 w-80 z-30 overflow-hidden">
            <AgentPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
          </div>
        )}

        {/* Task Panel (left bottom) */}
        {showTasks && (
          <div className="absolute top-16 left-4 bottom-16 w-80 z-30 overflow-hidden">
            <TaskPanel onClose={() => setShowTasks(false)} />
          </div>
        )}

        {/* Control Panel (centered modal) */}
        {showControl && (
          <ControlPanel onClose={() => setShowControl(false)} />
        )}
      </div>
    </div>
  );
}
