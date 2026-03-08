import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './services/api';
import wsService from './services/websocket';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

// ── Auth Context ─────────────────────────────────────────────
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ── Swarm Store Context ──────────────────────────────────────
const SwarmContext = createContext(null);
export const useSwarm = () => useContext(SwarmContext);

function SwarmProvider({ children }) {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const agentsRef = useRef(agents);
  const tasksRef = useRef(tasks);

  useEffect(() => { agentsRef.current = agents; }, [agents]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);

  // WebSocket event handlers
  useEffect(() => {
    const unsubs = [
      wsService.on('connected', () => setWsConnected(true)),
      wsService.on('disconnected', () => setWsConnected(false)),

      wsService.on('initial_state', (msg) => {
        setAgents(msg.agents || []);
        setTasks(msg.tasks || []);
      }),

      wsService.on('agent_registered', (msg) => {
        setAgents(prev => [...prev, msg.agent]);
      }),

      wsService.on('agent_removed', (msg) => {
        setAgents(prev => prev.filter(a => a.id !== msg.agentId));
        setSelectedAgent(prev => prev?.id === msg.agentId ? null : prev);
      }),

      wsService.on('agent_status_update', (msg) => {
        setAgents(prev => prev.map(a => a.id === msg.agent.id ? msg.agent : a));
        setSelectedAgent(prev => prev?.id === msg.agent.id ? msg.agent : prev);
      }),

      wsService.on('agent_heartbeat', (msg) => {
        setAgents(prev => prev.map(a => a.id === msg.agent.id ? msg.agent : a));
        setSelectedAgent(prev => prev?.id === msg.agent.id ? msg.agent : prev);
      }),

      wsService.on('task_created', (msg) => {
        setTasks(prev => [msg.task, ...prev]);
      }),

      wsService.on('task_assigned', (msg) => {
        setTasks(prev => prev.map(t => t.id === msg.task.id ? msg.task : t));
        setAgents(prev => {
          const updated = [...prev];
          msg.agent_ids?.forEach(aid => {
            const idx = updated.findIndex(a => a.id === aid);
            if (idx >= 0) updated[idx] = { ...updated[idx], status: 'working', current_task_id: msg.task.id };
          });
          return updated;
        });
      }),

      wsService.on('task_update', (msg) => {
        setTasks(prev => prev.map(t => t.id === msg.task.id ? msg.task : t));
      }),

      wsService.on('task_removed', (msg) => {
        setTasks(prev => prev.filter(t => t.id !== msg.taskId));
        setSelectedTask(prev => prev?.id === msg.taskId ? null : prev);
      }),

      wsService.on('communication_event', (msg) => {
        setCommunications(prev => [msg, ...prev].slice(0, 100));
      }),

      wsService.on('swarm_paused', () => {
        setAgents(prev => prev.map(a =>
          ['active', 'working'].includes(a.status) ? { ...a, status: 'paused' } : a
        ));
      }),

      wsService.on('swarm_resumed', () => {
        setAgents(prev => prev.map(a =>
          a.status === 'paused' ? { ...a, status: a.current_task_id ? 'working' : 'active' } : a
        ));
      }),

      wsService.on('swarm_scaled', (msg) => {
        setAgents(prev => [...prev, ...msg.agents]);
      }),
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data.stats);
      } catch (err) { console.error('Stats error:', err); }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    agents, setAgents,
    tasks, setTasks,
    stats,
    communications,
    selectedAgent, setSelectedAgent,
    selectedTask, setSelectedTask,
    wsConnected,
  };

  return <SwarmContext.Provider value={value}>{children}</SwarmContext.Provider>;
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      try {
        const data = api.getMe();
        setUser(data.user);
        wsService.connect(token);
      } catch (e) {
        api.logout();
      }
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = useCallback((userData, token) => {
    setUser(userData);
    wsService.connect(token);
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    wsService.disconnect();
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 font-orbitron text-lg tracking-wider">INITIALIZING SWARM</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout }}>
      {user ? (
        <SwarmProvider>
          <Dashboard />
        </SwarmProvider>
      ) : (
        <AuthScreen onLogin={handleLogin} />
      )}
    </AuthContext.Provider>
  );
}
