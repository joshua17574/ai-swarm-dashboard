export type AgentStatus = 'active' | 'idle' | 'busy' | 'error';

export type MissionStatus = 'queued' | 'in_progress' | 'completed';
export type MissionPriority = 'critical' | 'high' | 'normal' | 'low';

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

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: MissionStatus;
  assignedAgentId: string;
  priority: MissionPriority;
  progress: number;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
}

export interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  emoji: string;
  action: string;
  timestamp: number;
}
