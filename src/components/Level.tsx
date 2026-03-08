import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { DoubleSide, FrontSide } from 'three';
import { LevelConfig } from '../game/types';

/** Realistic building with windows, doors, and architectural detail */
function Building({ position, scale, levelId }: { position: number[]; scale: number[]; levelId: number }) {
  const [w, h, d] = scale;
  const floors = Math.max(1, Math.floor(h / 3));
  const windowsPerFloor = Math.max(1, Math.floor(w / 1.5));

  // Colors based on level
  const wallColor = levelId === 1 ? '#9a9a9a' : levelId === 2 ? '#6b6b6b' : '#1a1a2e';
  const windowColor = levelId === 3 ? '#ffcc44' : levelId === 2 ? '#aabbcc' : '#334455';
  const windowEmissive = levelId === 3 ? '#ffaa22' : levelId === 2 ? '#445566' : '#000000';
  const windowEmissiveInt = levelId === 3 ? 1.5 : levelId === 2 ? 0.3 : 0;
  const trimColor = levelId === 1 ? '#777' : levelId === 2 ? '#555' : '#0a0a1a';

  return (
    <group position={position as any}>
      {/* Main building body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} metalness={0.05} />
      </mesh>
      
      {/* Roof ledge */}
      <mesh position={[0, h / 2 + 0.1, 0]}>
        <boxGeometry args={[w + 0.3, 0.2, d + 0.3]} />
        <meshStandardMaterial color={trimColor} roughness={0.7} />
      </mesh>
      
      {/* Foundation */}
      <mesh position={[0, -h / 2 + 0.15, 0]}>
        <boxGeometry args={[w + 0.15, 0.3, d + 0.15]} />
        <meshStandardMaterial color={trimColor} roughness={0.9} />
      </mesh>

      {/* Windows on front face */}
      {Array.from({ length: floors }).map((_, floor) =>
        Array.from({ length: windowsPerFloor }).map((_, win) => {
          const wx = -w / 2 + (w / (windowsPerFloor + 1)) * (win + 1);
          const wy = -h / 2 + 2 + floor * 3;
          if (wy > h / 2 - 0.5) return null;
          const lit = Math.random() > 0.3; // 70% windows lit
          return (
            <mesh key={`fw-${floor}-${win}`} position={[wx, wy, d / 2 + 0.01]}>
              <planeGeometry args={[0.6, 0.9]} />
              <meshStandardMaterial
                color={lit ? windowColor : '#222'}
                emissive={lit ? windowEmissive : '#000'}
                emissiveIntensity={lit ? windowEmissiveInt : 0}
                side={FrontSide}
              />
            </mesh>
          );
        })
      )}

      {/* Windows on back face */}
      {Array.from({ length: floors }).map((_, floor) =>
        Array.from({ length: windowsPerFloor }).map((_, win) => {
          const wx = -w / 2 + (w / (windowsPerFloor + 1)) * (win + 1);
          const wy = -h / 2 + 2 + floor * 3;
          if (wy > h / 2 - 0.5) return null;
          const lit = Math.random() > 0.4;
          return (
            <mesh key={`bw-${floor}-${win}`} position={[wx, wy, -d / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.6, 0.9]} />
              <meshStandardMaterial
                color={lit ? windowColor : '#222'}
                emissive={lit ? windowEmissive : '#000'}
                emissiveIntensity={lit ? windowEmissiveInt : 0}
                side={FrontSide}
              />
            </mesh>
          );
        })
      )}

      {/* Door on ground floor (front) */}
      <mesh position={[0, -h / 2 + 1, d / 2 + 0.01]}>
        <planeGeometry args={[1.0, 2.0]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} side={FrontSide} />
      </mesh>

      {/* AC unit(s) on side */}
      {h > 5 && (
        <mesh position={[w / 2 + 0.2, -h / 2 + 3, 0]}>
          <boxGeometry args={[0.4, 0.3, 0.5]} />
          <meshStandardMaterial color="#888" metalness={0.5} roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

/** Street props: barriers, debris, lamp posts */
function StreetProps({ levelId }: { levelId: number }) {
  const props = useMemo(() => {
    const items: { type: string; pos: [number, number, number]; rot?: number }[] = [];
    
    if (levelId === 2 || levelId === 3) {
      // Lamp posts along streets
      for (let i = 0; i < 12; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
        items.push({ type: 'lamp', pos: [x, 0, z], rot: Math.random() * Math.PI * 2 });
      }
      // Barriers / jersey walls
      for (let i = 0; i < 8; i++) {
        const x = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        items.push({ type: 'barrier', pos: [x, 0, z], rot: Math.random() * Math.PI });
      }
      // Dumpsters
      for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 70;
        const z = (Math.random() - 0.5) * 70;
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        items.push({ type: 'dumpster', pos: [x, 0, z], rot: Math.random() * Math.PI });
      }
    }
    
    if (levelId === 1) {
      // Snow-covered rocks
      for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        if (Math.abs(x) < 6 && Math.abs(z) < 6) continue;
        items.push({ type: 'rock', pos: [x, 0, z] });
      }
      // Dead trees
      for (let i = 0; i < 10; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
        items.push({ type: 'tree', pos: [x, 0, z] });
      }
    }
    
    return items;
  }, [levelId]);

  return (
    <group>
      {props.map((p, i) => {
        if (p.type === 'lamp') return (
          <group key={i} position={p.pos}>
            {/* Lamp pole */}
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 5, 8]} />
              <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Lamp arm */}
            <mesh position={[0.4, 4.8, 0]} rotation={[0, 0, Math.PI / 4]}>
              <cylinderGeometry args={[0.03, 0.03, 1, 6]} />
              <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Light fixture */}
            <mesh position={[0.7, 4.95, 0]}>
              <boxGeometry args={[0.3, 0.1, 0.15]} />
              <meshStandardMaterial color="#888" metalness={0.5} roughness={0.4} />
            </mesh>
            <pointLight position={[0.7, 4.8, 0]} color="#ffa544" intensity={2} distance={12} />
          </group>
        );
        if (p.type === 'barrier') return (
          <group key={i} position={p.pos} rotation={[0, p.rot || 0, 0]}>
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[2.5, 0.8, 0.5]} />
              <meshStandardMaterial color="#888" roughness={0.8} />
            </mesh>
            {/* Warning stripe */}
            <mesh position={[0, 0.5, 0.26]}>
              <planeGeometry args={[2.4, 0.2]} />
              <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.2} side={FrontSide} />
            </mesh>
          </group>
        );
        if (p.type === 'dumpster') return (
          <group key={i} position={p.pos} rotation={[0, p.rot || 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[1.8, 1.2, 1.0]} />
              <meshStandardMaterial color="#2a5a2a" roughness={0.9} />
            </mesh>
            {/* Lid */}
            <mesh position={[0, 1.25, 0]} castShadow>
              <boxGeometry args={[1.9, 0.08, 1.1]} />
              <meshStandardMaterial color="#1a4a1a" roughness={0.8} />
            </mesh>
          </group>
        );
        if (p.type === 'rock') return (
          <mesh key={i} position={p.pos} castShadow>
            <dodecahedronGeometry args={[0.5 + Math.random() * 1.5, 1]} />
            <meshStandardMaterial color="#ccc" roughness={0.95} />
          </mesh>
        );
        if (p.type === 'tree') return (
          <group key={i} position={p.pos}>
            {/* Dead tree trunk */}
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.2, 4, 6]} />
              <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
            </mesh>
            {/* Bare branches */}
            <mesh position={[0.3, 3.5, 0]} rotation={[0, 0, -0.6]}>
              <cylinderGeometry args={[0.02, 0.05, 1.5, 4]} />
              <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
            </mesh>
            <mesh position={[-0.2, 3.2, 0.2]} rotation={[0.3, 0, 0.5]}>
              <cylinderGeometry args={[0.02, 0.04, 1.2, 4]} />
              <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
            </mesh>
            {/* Snow on trunk */}
            <mesh position={[0, 3.8, 0.08]}>
              <boxGeometry args={[0.3, 0.05, 0.2]} />
              <meshStandardMaterial color="#fff" roughness={0.9} />
            </mesh>
          </group>
        );
        return null;
      })}
    </group>
  );
}

/** Road / ground detail */
function GroundDetail({ levelId }: { levelId: number }) {
  if (levelId === 1) {
    // Snow terrain with variation
    return (
      <group>
        {/* Main snow ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
          <planeGeometry args={[200, 200, 32, 32]} />
          <meshStandardMaterial color="#e8edf2" roughness={0.95} />
        </mesh>
        {/* Snow drifts */}
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 80, 0.15, (Math.random() - 0.5) * 80]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
            <circleGeometry args={[2 + Math.random() * 3, 8]} />
            <meshStandardMaterial color="#fff" roughness={1} />
          </mesh>
        ))}
      </group>
    );
  }
  
  if (levelId === 2) {
    // Wet city streets
    return (
      <group>
        {/* Asphalt */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.1} />
        </mesh>
        {/* Road markings (center line) */}
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`mark-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -50 + i * 5]}>
            <planeGeometry args={[0.15, 3]} />
            <meshStandardMaterial color="#cccc00" roughness={0.7} />
          </mesh>
        ))}
        {/* Sidewalks */}
        <mesh position={[-8, 0.1, 0]}>
          <boxGeometry args={[3, 0.2, 200]} />
          <meshStandardMaterial color="#666" roughness={0.9} />
        </mesh>
        <mesh position={[8, 0.1, 0]}>
          <boxGeometry args={[3, 0.2, 200]} />
          <meshStandardMaterial color="#666" roughness={0.9} />
        </mesh>
        {/* Rain puddles (reflective spots) */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`puddle-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(Math.random() - 0.5) * 15, 0.02, (Math.random() - 0.5) * 80]}>
            <circleGeometry args={[0.5 + Math.random() * 1.5, 12]} />
            <meshStandardMaterial color="#1a2a3a" roughness={0.1} metalness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }
  
  // Level 3 - Hong Kong rooftop
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#0a0a0f" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Rooftop helipad markings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3, 3.3, 32]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} side={DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.5, 0.2]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.2, 1.5]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

export function Level({ config }: { config: LevelConfig }) {
  const { id } = config;

  const buildings = useMemo(() => {
    const items: { position: number[]; scale: number[] }[] = [];
    if (id === 2) { // London - dense urban
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        const h = 6 + Math.random() * 18;
        const w = 4 + Math.random() * 4;
        const d = 4 + Math.random() * 4;
        items.push({ position: [x, h / 2, z], scale: [w, h, d] });
      }
    } else if (id === 3) { // Hong Kong - massive skyscrapers
      // Background skyscrapers (below the rooftop platform)
      for (let i = 0; i < 80; i++) {
        const x = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
        const h = 30 + Math.random() * 80;
        const w = 5 + Math.random() * 6;
        const d = 5 + Math.random() * 6;
        items.push({ position: [x, -h / 2 + 3, z], scale: [w, h, d] });
      }
      // Nearby buildings at rooftop level
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15;
        const radius = 30 + Math.random() * 20;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const h = 20 + Math.random() * 40;
        items.push({ position: [x, h / 2 - 5, z], scale: [6, h, 6] });
      }
    }
    return items;
  }, [id]);

  const mountains = useMemo(() => {
    if (id !== 1) return [];
    const items: { position: number[]; scale: number[] }[] = [];
    // Large mountain range
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25;
      const radius = 50 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const s = 12 + Math.random() * 25;
      items.push({ position: [x, 0, z], scale: [s, s * 1.5, s] });
    }
    // Smaller peaks filling in
    for (let i = 0; i < 15; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = (Math.random() - 0.5) * 120;
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
      const s = 5 + Math.random() * 10;
      items.push({ position: [x, 0, z], scale: [s, s * 1.2, s] });
    }
    return items;
  }, [id]);

  return (
    <group>
      {/* Detailed ground with level-specific treatment */}
      <GroundDetail levelId={id} />

      {/* Level 2 & 3: Realistic buildings with windows */}
      {(id === 2 || id === 3) && buildings.map((data, i) => (
        <Building
          key={i}
          position={data.position}
          scale={data.scale}
          levelId={id}
        />
      ))}

      {/* Moscow Mountains - snow-capped */}
      {id === 1 && (
        <Instances range={mountains.length}>
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial color="#dde" roughness={0.85} />
          {mountains.map((data, i) => (
            <Instance key={i} position={data.position as any} scale={data.scale as any} />
          ))}
        </Instances>
      )}
      
      {/* Mountain snow caps */}
      {id === 1 && mountains.slice(0, 20).map((data, i) => (
        <mesh key={`cap-${i}`} position={[data.position[0], data.scale[1] * 0.65, data.position[2]]}>
          <coneGeometry args={[data.scale[0] * 0.3, data.scale[1] * 0.3, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      ))}

      {/* Street props and environmental detail */}
      <StreetProps levelId={id} />

      {/* Level-specific atmosphere */}
      {id === 2 && (
        <group>
          {/* Rain particles simulated as thin vertical lines */}
          {Array.from({ length: 50 }).map((_, i) => (
            <mesh key={`rain-${i}`} position={[(Math.random() - 0.5) * 40, 5 + Math.random() * 10, (Math.random() - 0.5) * 40]}>
              <cylinderGeometry args={[0.003, 0.003, 1.5, 3]} />
              <meshStandardMaterial color="#aabbcc" transparent opacity={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {/* Level 3 - neon signs on nearby buildings */}
      {id === 3 && (
        <group>
          {/* Neon accent lights */}
          <pointLight position={[20, 5, 15]} color="#ff0066" intensity={3} distance={20} />
          <pointLight position={[-25, 8, -10]} color="#00ccff" intensity={3} distance={20} />
          <pointLight position={[15, 3, -20]} color="#ff6600" intensity={2} distance={15} />
          <pointLight position={[-18, 6, 22]} color="#cc00ff" intensity={2} distance={18} />
          
          {/* Neon sign panels */}
          <mesh position={[22, 8, 18]} rotation={[0, -0.8, 0]}>
            <planeGeometry args={[3, 1]} />
            <meshStandardMaterial color="#ff0066" emissive="#ff0066" emissiveIntensity={3} side={DoubleSide} />
          </mesh>
          <mesh position={[-20, 10, -12]} rotation={[0, 0.5, 0]}>
            <planeGeometry args={[4, 0.8]} />
            <meshStandardMaterial color="#00ccff" emissive="#00ccff" emissiveIntensity={3} side={DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
