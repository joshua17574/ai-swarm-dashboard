import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Billboard, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSwarm } from '../App';

// ── Status Colors ───────────────────────────────────────────
const STATUS_COLORS = {
  active: '#10b981',
  working: '#00f0ff',
  idle: '#64748b',
  paused: '#f97316',
  stopped: '#ef4444',
  error: '#ef4444',
};

const ROLE_COLORS = {
  planner: '#a855f7',
  executor: '#00f0ff',
  researcher: '#10b981',
  monitor: '#f97316',
  communicator: '#ec4899',
  default: '#06b6d4',
};

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f97316',
  low: '#10b981',
};

// ── Glowing Agent Node ───────────────────────────────────────
function AgentNode({ agent, onClick, isSelected }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const ringRef = useRef();
  const [hovered, setHovered] = useState(false);

  const color = STATUS_COLORS[agent.status] || STATUS_COLORS.idle;
  const roleColor = ROLE_COLORS[agent.role] || ROLE_COLORS.default;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth position lerp
    meshRef.current.position.lerp(
      new THREE.Vector3(agent.position_x || 0, agent.position_y || 0, agent.position_z || 0),
      0.05
    );

    // Pulse effect for active agents
    if (['active', 'working'].includes(agent.status)) {
      const scale = 1 + Math.sin(t * 3 + agent.position_x) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }

    // Rotate ring
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.sin(t * 0.3) * 0.3;
    }

    // Glow pulse
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.08;
    }
  });

  return (
    <group ref={meshRef} position={[agent.position_x || 0, agent.position_y || 0, agent.position_z || 0]}>
      {/* Core sphere */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(agent); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <icosahedronGeometry args={[0.4, 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 2 : 0.8}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Outer glow sphere */}
      <mesh ref={glowRef} scale={1.8}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>

      {/* Orbital ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.7, 0.02, 8, 64]} />
        <meshBasicMaterial color={roleColor} transparent opacity={0.6} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.03, 8, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}

      {/* Name label */}
      <Billboard position={[0, 0.9, 0]}>
        <Text
          fontSize={0.2}
          color={hovered ? '#ffffff' : '#94a3b8'}
          anchorX="center"
          anchorY="bottom"
          font={undefined}
        >
          {agent.name}
        </Text>
        <Text
          fontSize={0.12}
          color={color}
          anchorX="center"
          anchorY="top"
          position={[0, -0.05, 0]}
        >
          {agent.status.toUpperCase()}
        </Text>
      </Billboard>

      {/* Point light for active agents */}
      {['active', 'working'].includes(agent.status) && (
        <pointLight color={color} intensity={1} distance={5} decay={2} />
      )}
    </group>
  );
}

// ── Task Hologram ───────────────────────────────────────────
function TaskNode({ task, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const color = task.status === 'completed' ? '#10b981'
    : task.status === 'in_progress' ? '#00f0ff'
    : PRIORITY_COLORS[task.priority] || '#f97316';

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    meshRef.current.position.lerp(
      new THREE.Vector3(task.position_x || 0, task.position_y || 0, task.position_z || 0),
      0.03
    );

    meshRef.current.rotation.y = t * 0.5;
    meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.2;

    // Float effect
    meshRef.current.position.y += Math.sin(t * 1.5 + task.position_x) * 0.003;

    // Fade out completed tasks
    if (task.status === 'completed') {
      meshRef.current.scale.lerp(new THREE.Vector3(0.3, 0.3, 0.3), 0.02);
    }
  });

  if (task.status === 'completed' && task.progress >= 100) return null;

  return (
    <group ref={meshRef} position={[task.position_x || 0, task.position_y || 0, task.position_z || 0]}>
      {/* Holographic cube */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(task); }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : 0.6}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner solid */}
      <mesh scale={0.5}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, 0.7, 0]}>
        <Text fontSize={0.15} color={color} anchorX="center" anchorY="bottom">
          {task.title.length > 20 ? task.title.slice(0, 20) + '...' : task.title}
        </Text>
        {task.status === 'in_progress' && (
          <Text fontSize={0.1} color="#94a3b8" anchorX="center" anchorY="top" position={[0, -0.03, 0]}>
            {Math.round(task.progress)}%
          </Text>
        )}
      </Billboard>

      <pointLight color={color} intensity={0.5} distance={3} decay={2} />
    </group>
  );
}

// ── Communication Lines ──────────────────────────────────────
function CommLines({ agents, communications }) {
  const linesRef = useRef([]);

  const activeLines = useMemo(() => {
    const now = Date.now();
    const recent = communications.filter(c => {
      const age = now - new Date(c.created_at || now).getTime();
      return age < 10000; // Show lines for 10 seconds
    });

    return recent.map(comm => {
      const fromAgent = agents.find(a => a.id === comm.from);
      const toAgent = agents.find(a => a.id === comm.to);
      if (!fromAgent || !toAgent) return null;
      return {
        from: [fromAgent.position_x, fromAgent.position_y, fromAgent.position_z],
        to: [toAgent.position_x, toAgent.position_y, toAgent.position_z],
        key: `${comm.from}-${comm.to}-${Date.now()}`,
      };
    }).filter(Boolean);
  }, [agents, communications]);

  return (
    <>
      {activeLines.map((line, i) => (
        <Line
          key={i}
          points={[line.from, line.to]}
          color="#a855f7"
          lineWidth={1.5}
          transparent
          opacity={0.6}
          dashed
          dashScale={5}
          dashSize={0.5}
          gapSize={0.3}
        />
      ))}
    </>
  );
}

// ── Task Assignment Lines ────────────────────────────────────
function TaskLines({ agents, tasks }) {
  const lines = useMemo(() => {
    const result = [];
    tasks.forEach(task => {
      if (task.status !== 'in_progress' || !task.assigned_agents) return;
      task.assigned_agents.forEach(agentId => {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return;
        result.push({
          from: [agent.position_x, agent.position_y, agent.position_z],
          to: [task.position_x, task.position_y, task.position_z],
        });
      });
    });
    return result;
  }, [agents, tasks]);

  return (
    <>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={[line.from, line.to]}
          color="#00f0ff"
          lineWidth={1}
          transparent
          opacity={0.3}
          dashed
          dashScale={3}
          dashSize={0.3}
          gapSize={0.2}
        />
      ))}
    </>
  );
}

// ── Grid Floor ───────────────────────────────────────────────
function GridFloor() {
  return (
    <group position={[0, -6, 0]}>
      <gridHelper args={[60, 60, '#0e2a3a', '#0a1929']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#030712" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── Particle Field ──────────────────────────────────────────
function ParticleField() {
  const pointsRef = useRef();
  const count = 500;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#0e4a6a" size={0.08} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ── Camera Controller ────────────────────────────────────────
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(15, 12, 15);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

// ── Main Scene ───────────────────────────────────────────────
export default function SwarmScene() {
  const { agents, tasks, communications, selectedAgent, setSelectedAgent, setSelectedTask } = useSwarm();

  return (
    <div className="three-canvas">
      <Canvas
        camera={{ fov: 60, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: '#030712' }}
      >
        <CameraSetup />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 20, 10]} intensity={0.3} color="#e0f0ff" />
        <pointLight position={[0, 15, 0]} intensity={0.5} color="#00f0ff" distance={40} />
        <pointLight position={[-10, 5, -10]} intensity={0.3} color="#a855f7" distance={30} />
        <pointLight position={[10, 5, 10]} intensity={0.3} color="#06b6d4" distance={30} />

        {/* Environment */}
        <fog attach="fog" args={['#030712', 20, 60]} />
        <GridFloor />
        <ParticleField />

        {/* Agents */}
        {agents.map(agent => (
          <AgentNode
            key={agent.id}
            agent={agent}
            onClick={(a) => setSelectedAgent(a)}
            isSelected={selectedAgent?.id === agent.id}
          />
        ))}

        {/* Tasks */}
        {tasks.filter(t => t.status !== 'completed').map(task => (
          <TaskNode
            key={task.id}
            task={task}
            onClick={(t) => setSelectedTask(t)}
          />
        ))}

        {/* Communication lines */}
        <CommLines agents={agents} communications={communications} />
        <TaskLines agents={agents} tasks={tasks} />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2 + 0.3}
        />
      </Canvas>
    </div>
  );
}