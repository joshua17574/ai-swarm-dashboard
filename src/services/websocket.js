// ── WebSocket Service (Client-Side Bridge) ───────────────────
// Routes simulation events through the same interface the app expects
import simulation from './simulation';

class WebSocketService {
  constructor() {
    this.listeners = new Map();
    this.isAuthenticated = false;
  }

  connect(token) {
    // Start the simulation loop instead of opening a WebSocket
    this.isAuthenticated = true;
    simulation.startSimulation();

    // Emit connected event
    setTimeout(() => {
      this.emit('connected', { type: 'auth_success' });
      this.emit('auth_success', { type: 'auth_success' });

      // Send initial state
      this.emit('initial_state', {
        type: 'initial_state',
        agents: simulation.getAgents(),
        tasks: simulation.getTasks(),
      });
    }, 100);

    // Bridge all simulation events to our listeners
    const events = [
      'agent_registered', 'agent_removed', 'agent_status_update',
      'agent_heartbeat', 'task_created', 'task_assigned', 'task_update',
      'task_removed', 'communication_event', 'swarm_paused',
      'swarm_resumed', 'swarm_scaled',
    ];
    events.forEach(evt => {
      simulation.on(evt, (data) => {
        this.emit(evt, data);
      });
    });
  }

  disconnect() {
    simulation.stopSimulation();
    this.isAuthenticated = false;
    this.listeners.clear();
    this.emit('disconnected', {});
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }

  off(event, callback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => {
      try { cb(data); } catch (err) { console.error('[WS Bridge] Listener error:', err); }
    });
  }
}

export const wsService = new WebSocketService();
export default wsService;
