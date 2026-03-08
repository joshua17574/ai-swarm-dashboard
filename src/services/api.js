// ── API Service Layer (Client-Side) ──────────────────────────────
// All calls route to the local simulation engine — no HTTP needed
import simulation from './simulation';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('swarm_token');
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('swarm_token', token);
    else localStorage.removeItem('swarm_token');
  }

  getToken() {
    return this.token;
  }

  // Auth
  async register(username, email, password) {
    const data = simulation.register(username, email, password);
    this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = simulation.login(username, password);
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return simulation.getMe();
  }

  logout() {
    simulation.logout();
    this.setToken(null);
  }

  // Agents
  async getAgents() { return simulation.getAgents(); }
  async createAgent(name, role) { return simulation.createAgent(name, role); }
  async getAgent(id) { return simulation.getAgent(id); }
  async deleteAgent(id) { return simulation.deleteAgent(id); }
  async controlAgent(id, action) { return simulation.controlAgent(id, action); }
  async getAgentLogs(id, limit = 50) { return simulation.getAgentLogs(id, limit); }

  // Tasks
  async getTasks() { return simulation.getTasks(); }
  async createTask(title, description, priority) { return simulation.createTask(title, description, priority); }
  async assignTask(taskId, agentIds) { return simulation.assignTask(taskId, agentIds); }
  async updateTaskProgress(taskId, progress, status, result) { return simulation.updateTaskProgress(taskId, progress, status, result); }
  async deleteTask(id) { return simulation.deleteTask(id); }

  // Dashboard
  async getStats() { return simulation.getStats(); }

  // Swarm control
  async pauseSwarm() { return simulation.pauseSwarm(); }
  async resumeSwarm() { return simulation.resumeSwarm(); }
  async scaleSwarm(count, role, namePrefix) { return simulation.scaleSwarm(count, role, namePrefix); }

  // Communications
  async getCommunications(limit = 50) { return simulation.getCommunications(limit); }
}

export const api = new ApiService();
export default api;
