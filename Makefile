clean:
	rm -f src/App.jsx src/index.css src/main.jsx
	rm -f src/components/AgentPanel.jsx src/components/AuthScreen.jsx src/components/ControlPanel.jsx
	rm -f src/components/Dashboard.jsx src/components/StatsBar.jsx src/components/SwarmScene.jsx src/components/TaskPanel.jsx
	rm -f src/services/api.js src/services/simulation.js src/services/websocket.js
	rm -f tailwind.config.js postcss.config.js vite.config.js

build: clean
	npx tsc && npx vite build
