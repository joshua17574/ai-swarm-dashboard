export type AgentStatus = 'active' | 'idle' | 'busy' | 'error';

export interface Agent {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  color: string;
  description: string;
  status: AgentStatus;
  lastAction: string;
  lastActionTime: number;
  taskCount: number;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  emoji: string;
  action: string;
  timestamp: number;
}
