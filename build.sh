#!/bin/bash
# Pre-build cleanup: remove old jsx/js files that conflict with new tsx build
echo 'Cleaning up old conflicting files...'
rm -f src/App.jsx src/index.css src/main.jsx
rm -f src/components/AgentPanel.jsx src/components/AuthScreen.jsx src/components/ControlPanel.jsx
rm -f src/components/Dashboard.jsx src/components/StatsBar.jsx src/components/SwarmScene.jsx src/components/TaskPanel.jsx
rm -f src/services/api.js src/services/simulation.js src/services/websocket.js
rm -f tailwind.config.js postcss.config.js vite.config.js
rm -f cleanup-test.txt scripts/cleanup.sh
echo 'Cleanup complete. Running build...'
tsc && vite build
