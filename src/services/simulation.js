// ── Local Simulation Engine ────────────────────────────────────
// Replaces Express + SQLite + WebSocket with pure client-side logic
// All state lives in memory + localStorage for persistence

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'swarm_dashboard';
const AGENT_NAMES = ['Nova', 'Cipher', 'Helix', 'Pulse', 'Vortex', 'Zenith', 'Apex', 'Nexus', 'Flux', 'Echo', 'Prism', 'Quark', 'Bolt', 'Drift', 'Ember'];
const ROLES = ['executor', 'planner', 'researcher', 'monitor', 'communicator'];
const ACTIONS = {
  executor: ['Processing data batch', 'Executing pipeline', 'Running inference', 'Deploying model', 'Optimizing weights'],
  planner: ['Analyzing task queue', 'Scheduling resources', 'Planning execution path', 'Coordinating agents', 'Evaluating priorities'],
  researcher: ['Searching knowledge base', 'Analyzing patterns', 'Mining datasets', 'Cross-referencing data', 'Generating insights'],
  monitor: ['Scanning metrics', 'Checking health status', 'Monitoring throughput', 'Detecting anomalies', 'Logging performance'],
  communicator: ['Syncing with peers', 'Broadcasting updates', 'Relaying instructions', 'Aggregating reports', 'Distributing tasks'],
};
const TASK_TITLES = [
  'Train neural network on dataset v3',
  'Optimize inference pipeline latency',
  'Analyze user behavior patterns',
  'Deploy updated model to production',
  'Generate weekly performance report',
  'Scan for security vulnerabilities',
  'Migrate database to new cluster',
  'Process incoming data stream',
  'Update recommendation engine',
  'Run A/B test analysis',
];

class SimulationEngine {
  constructor() {
    this.listeners = new Map();
    this.simulationInterval = null;
    this.state = this._loadState();
  }

  _loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.agents && parsed.user) return parsed;
      }
    } catch (e) {}
    return { user: null, agents: [], tasks: [], logs: [], communications: [] };
  }

  _saveState() {
    try {
      const toSave = {
        ...this.state,
        logs: this.state.logs.slice(-200),
        communications: this.state.communications.slice(-100),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {}
  }

  _emit(type, data) {
    const msg = { type, ...data };
    this.listeners.get(type)?.forEach(cb => { try { cb(msg); } catch(e) {} });
    this.listeners.get('*')?.forEach(cb => { try { cb(msg); } catch(e) {} });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  // ── Auth ────────────────────────────────────────────────
  register(username, email, password) {
    const user = { id: uuidv4(), username, email, created_at: new Date().toISOString() };
    this.state.user = user;
    this.state.agents = [];
    this.state.tasks = [];
    this.state.logs = [];
    this.state.communications = [];
    // Seed with starter agents
    this._seedStarterAgents();
    this._seedStarterTasks();
    this._saveState();
    return { user, token: 'local-token-' + user.id };
  }

  login(username, password) {
    if (this.state.user) {
      return { user: this.state.user, token: 'local-token-' + this.state.user.id };
    }
    // Auto-create if no user exists
    return this.register(username, username + '@swarm.local', password);
  }

  getMe() {
    if (!this.state.user) throw new Error('Not authenticated');
    return { user: this.state.user };
  }

  logout() {
    this.stopSimulation();
    this.state.user = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  isAuthenticated() {
    return !!this.state.user;
  }

  // ── Seed Data ───────────────────────────────────────────
  _seedStarterAgents() {
    const starters = [
      { name: 'Nova', role: 'executor' },
      { name: 'Cipher', role: 'planner' },
      { name: 'Helix', role: 'researcher' },
      { name: 'Pulse', role: 'monitor' },
      { name: 'Vortex', role: 'communicator' },
    ];
    starters.forEach(({ name, role }) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 3 + Math.random() * 4;
      this.state.agents.push({
        id: uuidv4(),
        name,
        role,
        status: 'active',
        current_action: ACTIONS[role][Math.floor(Math.random() * ACTIONS[role].length)],
        current_task_id: null,
        cpu_usage: 20 + Math.random() * 60,
        memory_usage: 30 + Math.random() * 50,
        network_io: Math.random() * 100,
        tasks_completed: Math.floor(Math.random() * 50),
        tasks_failed: Math.floor(Math.random() * 5),
        uptime_seconds: Math.floor(Math.random() * 86400),
        position_x: Math.cos(angle) * radius,
        position_y: (Math.random() - 0.5) * 4,
        position_z: Math.sin(angle) * radius,
        last_heartbeat: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
    });
  }

  _seedStarterTasks() {
    const priorities = ['high', 'medium', 'low'];
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 3;
      this.state.tasks.push({
        id: uuidv4(),
        title: TASK_TITLES[i],
        description: 'Auto-generated starter task',
        status: i === 0 ? 'in_progress' : 'pending',
        priority: priorities[i],
        assigned_agents: i === 0 ? [this.state.agents[0]?.id] : [],
        progress: i === 0 ? Math.random() * 50 : 0,
        result: '',
        position_x: Math.cos(angle) * radius,
        position_y: 2 + Math.random() * 2,
        position_z: Math.sin(angle) * radius,
        created_at: new Date().toISOString(),
        started_at: i === 0 ? new Date().toISOString() : null,
        completed_at: null,
      });
    }
    if (this.state.agents[0] && this.state.tasks[0]) {
      this.state.agents[0].status = 'working';
      this.state.agents[0].current_task_id = this.state.tasks[0].id;
    }
  }

  // ── Agents ──────────────────────────────────────────────
  getAgents() {
    return this.state.agents;
  }

  createAgent(name, role) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 4;
    const agent = {
      id: uuidv4(),
      name: name || AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
      role: role || 'executor',
      status: 'active',
      current_action: '',
      current_task_id: null,
      cpu_usage: 10 + Math.random() * 30,
      memory_usage: 20 + Math.random() * 30,
      network_io: Math.random() * 50,
      tasks_completed: 0,
      tasks_failed: 0,
      uptime_seconds: 0,
      position_x: Math.cos(angle) * radius,
      position_y: (Math.random() - 0.5) * 4,
      position_z: Math.sin(angle) * radius,
      last_heartbeat: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    this.state.agents.push(agent);
    this._saveState();
    this._emit('agent_registered', { agent });
    return agent;
  }

  getAgent(id) {
    return this.state.agents.find(a => a.id === id);
  }

  deleteAgent(id) {
    this.state.agents = this.state.agents.filter(a => a.id !== id);
    this._saveState();
    this._emit('agent_removed', { agentId: id });
    return { success: true };
  }

  controlAgent(id, action) {
    const agent = this.state.agents.find(a => a.id === id);
    if (!agent) throw new Error('Agent not found');
    switch (action) {
      case 'start': agent.status = 'active'; break;
      case 'stop': agent.status = 'stopped'; agent.current_action = ''; break;
      case 'pause': agent.status = 'paused'; break;
      case 'restart': agent.status = 'active'; agent.uptime_seconds = 0; break;
    }
    agent.last_heartbeat = new Date().toISOString();
    this._saveState();
    this._emit('agent_status_update', { agent: { ...agent } });
    return agent;
  }

  getAgentLogs(id, limit = 50) {
    return this.state.logs.filter(l => l.agent_id === id).slice(-limit);
  }

  // ── Tasks ───────────────────────────────────────────────
  getTasks() {
    return this.state.tasks;
  }

  createTask(title, description, priority) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 2 + Math.random() * 3;
    const task = {
      id: uuidv4(),
      title,
      description: description || '',
      status: 'pending',
      priority: priority || 'medium',
      assigned_agents: [],
      progress: 0,
      result: '',
      position_x: Math.cos(angle) * radius,
      position_y: 2 + Math.random() * 2,
      position_z: Math.sin(angle) * radius,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
    };
    this.state.tasks.push(task);
    this._saveState();
    this._emit('task_created', { task });
    return task;
  }

  assignTask(taskId, agentIds) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    task.assigned_agents = agentIds;
    task.status = 'in_progress';
    task.started_at = new Date().toISOString();
    agentIds.forEach(aid => {
      const agent = this.state.agents.find(a => a.id === aid);
      if (agent) {
        agent.status = 'working';
        agent.current_task_id = taskId;
        this._emit('agent_status_update', { agent: { ...agent } });
      }
    });
    this._saveState();
    this._emit('task_assigned', { task, agent_ids: agentIds });
    return task;
  }

  updateTaskProgress(taskId, progress, status, result) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    if (progress !== undefined) task.progress = progress;
    if (status) task.status = status;
    if (result) task.result = result;
    if (status === 'completed') task.completed_at = new Date().toISOString();
    this._saveState();
    this._emit('task_update', { task });
    return task;
  }

  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this.state.agents.forEach(a => {
      if (a.current_task_id === id) {
        a.current_task_id = null;
        a.status = 'active';
      }
    });
    this._saveState();
    this._emit('task_removed', { taskId: id });
    return { success: true };
  }

  // ── Stats ───────────────────────────────────────────────
  getStats() {
    const agents = this.state.agents;
    const tasks = this.state.tasks;
    return {
      stats: {
        total_agents: agents.length,
        active_agents: agents.filter(a => ['active', 'working'].includes(a.status)).length,
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        pending_tasks: tasks.filter(t => t.status === 'pending').length,
        in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
        failed_tasks: tasks.filter(t => t.status === 'failed').length,
        avg_cpu: agents.length ? agents.reduce((s, a) => s + a.cpu_usage, 0) / agents.length : 0,
        avg_memory: agents.length ? agents.reduce((s, a) => s + a.memory_usage, 0) / agents.length : 0,
        total_tasks_completed: agents.reduce((s, a) => s + a.tasks_completed, 0),
      },
    };
  }

  // ── Swarm Control ─────────────────────────────────────────
  pauseSwarm() {
    this.state.agents.forEach(a => {
      if (['active', 'working'].includes(a.status)) a.status = 'paused';
    });
    this._saveState();
    this._emit('swarm_paused', {});
    return { success: true };
  }

  resumeSwarm() {
    this.state.agents.forEach(a => {
      if (a.status === 'paused') a.status = a.current_task_id ? 'working' : 'active';
    });
    this._saveState();
    this._emit('swarm_resumed', {});
    return { success: true };
  }

  scaleSwarm(count, role, namePrefix) {
    const newAgents = [];
    for (let i = 0; i < count; i++) {
      const name = `${namePrefix || 'Agent'}-${String(this.state.agents.length + i + 1).padStart(3, '0')}`;
      const agent = this.createAgent(name, role || ROLES[Math.floor(Math.random() * ROLES.length)]);
      newAgents.push(agent);
    }
    this._emit('swarm_scaled', { agents: newAgents });
    return { agents: newAgents };
  }

  // ── Communications ────────────────────────────────────────
  getCommunications(limit = 50) {
    return this.state.communications.slice(-limit);
  }

  // ── Simulation Loop ───────────────────────────────────────
  startSimulation() {
    if (this.simulationInterval) return;
    this.simulationInterval = setInterval(() => this._simulationTick(), 2000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  _simulationTick() {
    const activeAgents = this.state.agents.filter(a => ['active', 'working'].includes(a.status));

    activeAgents.forEach(agent => {
      // Update metrics with smooth random walk
      agent.cpu_usage = Math.max(5, Math.min(98, agent.cpu_usage + (Math.random() - 0.5) * 15));
      agent.memory_usage = Math.max(10, Math.min(95, agent.memory_usage + (Math.random() - 0.5) * 8));
      agent.network_io = Math.max(0, Math.min(100, agent.network_io + (Math.random() - 0.5) * 20));
      agent.uptime_seconds += 2;
      agent.last_heartbeat = new Date().toISOString();

      // Occasionally change action
      if (Math.random() < 0.3) {
        const roleActions = ACTIONS[agent.role] || ACTIONS.executor;
        agent.current_action = roleActions[Math.floor(Math.random() * roleActions.length)];
      }

      // Gentle position drift
      agent.position_x += (Math.random() - 0.5) * 0.3;
      agent.position_y += (Math.random() - 0.5) * 0.2;
      agent.position_z += (Math.random() - 0.5) * 0.3;

      // Add occasional log
      if (Math.random() < 0.15) {
        const levels = ['info', 'info', 'info', 'warning', 'debug'];
        const messages = [
          `Processing batch #${Math.floor(Math.random() * 9999)}`,
          `Heartbeat OK - CPU: ${agent.cpu_usage.toFixed(1)}%`,
          `Task checkpoint saved`,
          `Network sync completed`,
          `Memory pool optimized`,
          `Cache refreshed`,
          `Peer connection established`,
        ];
        this.state.logs.push({
          id: Date.now(),
          agent_id: agent.id,
          level: levels[Math.floor(Math.random() * levels.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          created_at: new Date().toISOString(),
        });
      }

      this._emit('agent_heartbeat', { agent: { ...agent } });
    });

    // Progress in-progress tasks
    this.state.tasks.forEach(task => {
      if (task.status === 'in_progress' && task.assigned_agents.length > 0) {
        task.progress = Math.min(100, task.progress + Math.random() * 5 + 1);
        if (task.progress >= 100) {
          task.status = Math.random() < 0.9 ? 'completed' : 'failed';
          task.completed_at = new Date().toISOString();
          task.result = task.status === 'completed' ? 'Task completed successfully' : 'Task failed - retrying';
          // Free up agents
          task.assigned_agents.forEach(aid => {
            const agent = this.state.agents.find(a => a.id === aid);
            if (agent) {
              if (task.status === 'completed') agent.tasks_completed++;
              else agent.tasks_failed++;
              agent.status = 'active';
              agent.current_task_id = null;
              this._emit('agent_status_update', { agent: { ...agent } });
            }
          });
          this._emit('task_update', { task });
        } else {
          this._emit('task_update', { task });
        }
      }
    });

    // Random communication events between agents
    if (activeAgents.length >= 2 && Math.random() < 0.4) {
      const from = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      let to = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      while (to.id === from.id && activeAgents.length > 1) {
        to = activeAgents[Math.floor(Math.random() * activeAgents.length)];
      }
      const types = ['data_sync', 'task_handoff', 'status_report', 'resource_request', 'heartbeat_relay'];
      const comm = {
        id: Date.now(),
        from_agent_id: from.id,
        to_agent_id: to.id,
        from_name: from.name,
        to_name: to.name,
        event_type: types[Math.floor(Math.random() * types.length)],
        created_at: new Date().toISOString(),
      };
      this.state.communications.push(comm);
      if (this.state.communications.length > 100) {
        this.state.communications = this.state.communications.slice(-100);
      }
      this._emit('communication_event', comm);
    }

    // Keep logs bounded
    if (this.state.logs.length > 500) {
      this.state.logs = this.state.logs.slice(-200);
    }

    this._saveState();
  }
}

export const simulation = new SimulationEngine();
export default simulation;