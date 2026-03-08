# AI Agent Swarm Dashboard

A futuristic, interactive 3D web dashboard that visualizes your personal AI agent swarm in real time. Built as a mission-control-style command center with neon-lit aesthetics and full agent management capabilities.

![Stack](https://img.shields.io/badge/React-Three.js-blue) ![Stack](https://img.shields.io/badge/Node.js-Express-green) ![Stack](https://img.shields.io/badge/WebSocket-Real--Time-purple)

## Features

### 3D Swarm Visualization
- Each agent renders as a **glowing icosahedron node** in 3D space
- Agents move dynamically based on activity status
- **Communication lines** appear between agents when they interact
- **Task holograms** float as wireframe octahedrons that agents move toward
- Particle field and grid floor create an immersive environment

### Real-Time Updates
- WebSocket connection streams all agent activity live
- Agent positions, metrics, and status update every 2 seconds
- Communication events render as animated dashed lines
- Task progress tracked visually with color transitions

### User Authentication
- JWT-based secure login/registration
- Each user sees only their own agents and tasks
- Session persistence with automatic reconnection

### Agent Management
- Register agents with name and role (planner, executor, researcher, monitor, communicator)
- Each agent gets a unique API key for external integration
- Start, stop, and pause individual agents
- View per-agent CPU, memory, network I/O metrics
- Activity logs with timestamped entries

### Task System
- Create tasks with title, description, and priority (low/medium/high)
- Assign multiple agents to collaborate on tasks
- Track real-time progress with visual indicators
- Tasks appear as floating holographic objects in 3D space

### Swarm Control
- **Pause/Resume** entire swarm with one click
- **Scale** — deploy 1-20 agents simultaneously
- Global stats: active agents, running tasks, system health
- Average CPU/memory usage across all agents

### Control Panel
- Overview with system health, uptime, latency, throughput
- Agent creation with role selection
- Swarm scaling interface with slider
- Agent management list with quick actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Three.js (via @react-three/fiber + drei) |
| Styling | TailwindCSS with custom neon theme |
| 3D Engine | Three.js with orbit controls, billboards, particle systems |
| Backend | Node.js, Express |
| Real-Time | WebSocket (ws library) |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Build | Vite |

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone and enter the project
cd ai-swarm-dashboard

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start development (backend + frontend)
npm run dev:full
```

The backend runs on `http://localhost:4000` and the frontend on `http://localhost:3000` (with API proxy).

### Production Build

```bash
# Build the frontend
npm run build

# Start production server (serves frontend + API)
npm start
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:4000
```

## Project Structure

```
ai-swarm-dashboard/
├── server.js                 # Express + WebSocket + SQLite backend
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite bundler configuration
├── tailwind.config.js        # TailwindCSS theme (neon colors, fonts)
├── postcss.config.js         # PostCSS plugins
├── Dockerfile                # Production container
├── docker-compose.yml        # Docker Compose orchestration
├── .env.example              # Environment variable template
└── src/
    ├── main.jsx              # React entry point
    ├── App.jsx               # Auth context, swarm store, routing
    ├── index.css             # Global styles, neon effects, animations
    ├── services/
    │   ├── api.js            # REST API service layer
    │   └── websocket.js      # WebSocket client with reconnection
    └── components/
        ├── AuthScreen.jsx    # Login/register with glassmorphism UI
        ├── Dashboard.jsx     # Main layout with HUD overlay
        ├── SwarmScene.jsx    # Three.js 3D visualization (agents, tasks, lines)
        ├── StatsBar.jsx      # Top bar with live statistics
        ├── AgentPanel.jsx    # Agent detail panel (metrics, logs, controls)
        ├── TaskPanel.jsx     # Task list, creation, assignment
        └── ControlPanel.jsx  # Command center modal (overview, scale, manage)
```

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Agents (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List user's agents |
| POST | `/api/agents` | Register new agent |
| GET | `/api/agents/:id` | Get agent details |
| DELETE | `/api/agents/:id` | Remove agent |
| POST | `/api/agents/:id/control` | Start/stop/pause agent |
| GET | `/api/agents/:id/logs` | Get agent activity logs |

### Agent External API (API Key Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/heartbeat` | Send status + metrics |
| POST | `/api/agent/log` | Submit log entry |
| POST | `/api/agent/communicate` | Record inter-agent communication |

### Tasks (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List user's tasks |
| POST | `/api/tasks` | Create task |
| POST | `/api/tasks/:id/assign` | Assign agents to task |
| PUT | `/api/tasks/:id/progress` | Update task progress |
| DELETE | `/api/tasks/:id` | Delete task |

### Swarm Control (JWT Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| POST | `/api/swarm/pause` | Pause all active agents |
| POST | `/api/swarm/resume` | Resume paused agents |
| POST | `/api/swarm/scale` | Deploy multiple agents |

### WebSocket
Connect to `ws://localhost:4000/ws` and send:
```json
{ "type": "auth", "token": "your-jwt-token" }
```

Events received: `agent_heartbeat`, `agent_status_update`, `agent_registered`, `agent_removed`, `task_created`, `task_assigned`, `task_update`, `communication_event`, `swarm_paused`, `swarm_resumed`, `swarm_scaled`.

## Connecting External Agents

Your real AI agents can connect to the dashboard using the API key provided during registration:

```python
import requests
import time

API_URL = "http://localhost:4000"
API_KEY = "swarm_your_agent_api_key_here"

headers = {"X-Agent-API-Key": API_KEY}

# Send heartbeat
while True:
    requests.post(f"{API_URL}/api/agent/heartbeat", json={
        "status": "active",
        "current_action": "Processing data",
        "cpu_usage": 45.2,
        "memory_usage": 62.1,
        "network_io": 12.5
    }, headers=headers)
    time.sleep(5)
```

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Neon Blue | `#00f0ff` | Primary accent, active states |
| Neon Purple | `#a855f7` | Secondary accent, task panels |
| Neon Cyan | `#06b6d4` | Tertiary accent, highlights |
| Neon Green | `#10b981` | Success, active agents |
| Neon Orange | `#f97316` | Warning, paused states |
| Neon Red | `#ef4444` | Error, stopped agents |
| Background | `#030712` | Main dark background |
| Card BG | `rgba(15,23,42,0.85)` | Glass panel backgrounds |

## License

MIT
