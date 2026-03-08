import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Color, MeshStandardMaterial } from 'three';
import { EnemyType } from '../game/types';

/**
 * Procedural ultra-detailed 3D zombie character models.
 * Each enemy type has a unique zombie variant with realistic proportions,
 * tattered/decayed appearance, and animated limbs.
 */

// Shared zombie skin tones
const ZOMBIE_COLORS: Record<string, string> = {
  skin: '#5a6e4a',       // Greenish dead skin
  skinDark: '#3d4a32',   // Darker patches
  skinPale: '#8b9d7a',   // Pale dead skin
  flesh: '#8b3a3a',      // Exposed flesh/wounds
  bone: '#d4c9a8',       // Bone color
  cloth: '#3a3a3a',      // Tattered clothing
  clothDark: '#1a1a1a',  // Dark clothing
  eyes: '#ccff00',       // Glowing zombie eyes
  blood: '#4a0000',      // Dried blood
  metal: '#555555',      // Metal armor/gear
};

// Boss-specific colors
const BOSS_COLORS = {
  skin: '#2d3a1f',
  flesh: '#6b1a1a',
  eyes: '#ff0000',
  armor: '#1a0a0a',
};

interface ZombieProps {
  type: EnemyType;
  animPhase?: number;
}

/** Standard zombie grunt - shambling undead soldier */
function GruntZombie({ animPhase = 0 }: { animPhase: number }) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    // Shambling walk animation
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 2) * 0.6;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2) * 0.6;
    if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * 2) * 0.4;
    if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 2) * 0.4;
    if (headRef.current) headRef.current.rotation.z = Math.sin(t * 1.5) * 0.15;
  });

  return (
    <group>
      {/* Torso - upper body */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.3]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.cloth} roughness={0.9} />
      </mesh>
      {/* Exposed ribs/flesh on torso */}
      <mesh position={[0.15, 1.2, 0.16]}>
        <boxGeometry args={[0.15, 0.3, 0.02]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.flesh} roughness={0.7} />
      </mesh>
      {/* Lower torso / hips */}
      <mesh position={[0, 0.65, 0]} castShadow>
        <boxGeometry args={[0.45, 0.3, 0.25]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.clothDark} roughness={0.9} />
      </mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 1.65, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.32, 0.28]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skin} roughness={0.8} />
        </mesh>
        {/* Jaw / lower face */}
        <mesh position={[0, -0.12, 0.05]}>
          <boxGeometry args={[0.22, 0.1, 0.2]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinDark} roughness={0.8} />
        </mesh>
        {/* Glowing eyes */}
        <mesh position={[-0.07, 0.04, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.eyes} emissive={ZOMBIE_COLORS.eyes} emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.07, 0.04, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.eyes} emissive={ZOMBIE_COLORS.eyes} emissiveIntensity={2} />
        </mesh>
        {/* Missing chunk from skull */}
        <mesh position={[0.12, 0.1, 0.05]}>
          <boxGeometry args={[0.08, 0.08, 0.1]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.flesh} roughness={0.6} />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.38, 1.25, 0]}>
        {/* Upper arm */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skin} roughness={0.8} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0, -0.55, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinPale} roughness={0.8} />
        </mesh>
        {/* Exposed bone on forearm */}
        <mesh position={[0, -0.5, 0.07]}>
          <cylinderGeometry args={[0.015, 0.015, 0.15, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.5} />
        </mesh>
        {/* Hand/claw */}
        <mesh position={[0, -0.75, 0.05]}>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinDark} roughness={0.9} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.38, 1.25, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinDark} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.55, 0.05]} castShadow>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skin} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.75, 0.05]}>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinDark} roughness={0.9} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.clothDark} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skin} roughness={0.8} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.8, 0.03]}>
          <boxGeometry args={[0.15, 0.1, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.clothDark} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.6, 0]} castShadow>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.skinDark} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.8, 0.03]}>
          <boxGeometry args={[0.15, 0.1, 0.2]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** Rusher zombie - fast, hunched crawler with elongated limbs */
function RusherZombie({ animPhase = 0 }: { animPhase: number }) {
  const bodyRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (bodyRef.current) bodyRef.current.rotation.x = Math.sin(t * 4) * 0.1;
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 4) * 0.8 - 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 4) * 0.8 - 0.5;
  });

  return (
    <group rotation={[0.3, 0, 0]}>
      <group ref={bodyRef}>
        {/* Hunched torso */}
        <mesh position={[0, 0.8, 0]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.45, 0.55, 0.25]} />
          <meshStandardMaterial color="#4a5a3a" roughness={0.85} />
        </mesh>
        {/* Spine ridges showing */}
        {[0, 0.1, 0.2].map((y, i) => (
          <mesh key={i} position={[0, 0.65 + y, -0.13]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.5} />
          </mesh>
        ))}
        {/* Head - tilted forward */}
        <group position={[0, 1.15, 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.26, 0.24]} />
            <meshStandardMaterial color="#5a6a4a" roughness={0.8} />
          </mesh>
          {/* Wide open mouth */}
          <mesh position={[0, -0.08, 0.12]}>
            <boxGeometry args={[0.15, 0.08, 0.05]} />
            <meshStandardMaterial color="#2a0000" roughness={0.6} />
          </mesh>
          {/* Glowing eyes */}
          <mesh position={[-0.06, 0.04, 0.12]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={3} />
          </mesh>
          <mesh position={[0.06, 0.04, 0.12]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={3} />
          </mesh>
        </group>
      </group>
      
      {/* Elongated arms */}
      <group ref={leftArmRef} position={[-0.32, 0.9, 0.1]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#4a5a3a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.09, 0.35, 0.09]} />
          <meshStandardMaterial color="#5a6a4a" roughness={0.8} />
        </mesh>
        {/* Claws */}
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.85, 0.02]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.01, 0.06, 4]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
          </mesh>
        ))}
      </group>
      <group ref={rightArmRef} position={[0.32, 0.9, 0.1]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#5a6a4a" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[0.09, 0.35, 0.09]} />
          <meshStandardMaterial color="#4a5a3a" roughness={0.8} />
        </mesh>
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.85, 0.02]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.01, 0.06, 4]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
          </mesh>
        ))}
      </group>
      
      {/* Crouched legs */}
      <mesh position={[-0.12, 0.3, 0]} castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.3, 0]} castShadow>
        <boxGeometry args={[0.14, 0.5, 0.14]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Tank zombie - massive bloated undead with armor plating */
function TankZombie({ animPhase = 0 }: { animPhase: number }) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.3;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.2) * 0.3;
  });

  return (
    <group>
      {/* Massive torso */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.55]} />
        <meshStandardMaterial color="#2a3520" roughness={0.85} />
      </mesh>
      {/* Armor plates */}
      <mesh position={[0, 1.3, 0.28]}>
        <boxGeometry args={[0.7, 0.7, 0.05]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.metal} metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.3, -0.28]}>
        <boxGeometry args={[0.7, 0.7, 0.05]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.metal} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Bloated belly */}
      <mesh position={[0, 0.85, 0.08]} castShadow>
        <sphereGeometry args={[0.4, 12, 12]} />
        <meshStandardMaterial color="#3d4a2e" roughness={0.8} />
      </mesh>
      {/* Exposed intestines on belly */}
      <mesh position={[0.1, 0.75, 0.35]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={ZOMBIE_COLORS.flesh} roughness={0.6} />
      </mesh>
      
      {/* Small head on massive body */}
      <group position={[0, 2.0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#3d4a2e" roughness={0.8} />
        </mesh>
        {/* Helmet */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.34, 0.15, 0.34]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.metal} metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.08, 0.02, 0.15]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.15]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Massive arms */}
      <group ref={leftArmRef} position={[-0.6, 1.5, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />
          <meshStandardMaterial color="#2a3520" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.2]} />
          <meshStandardMaterial color="#3d4a2e" roughness={0.8} />
        </mesh>
        {/* Fist */}
        <mesh position={[0, -0.9, 0]}>
          <boxGeometry args={[0.18, 0.15, 0.15]} />
          <meshStandardMaterial color="#2a3520" roughness={0.9} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.6, 1.5, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, 0.22]} />
          <meshStandardMaterial color="#2a3520" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.65, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.2]} />
          <meshStandardMaterial color="#3d4a2e" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.9, 0]}>
          <boxGeometry args={[0.18, 0.15, 0.15]} />
          <meshStandardMaterial color="#2a3520" roughness={0.9} />
        </mesh>
      </group>
      
      {/* Thick legs */}
      <mesh position={[-0.2, 0.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.35, 0]} castShadow>
        <boxGeometry args={[0.22, 0.65, 0.22]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Sniper zombie - tall, gaunt, with one glowing eye */
function SniperZombie({ animPhase = 0 }: { animPhase: number }) {
  const armRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (armRef.current) armRef.current.rotation.x = Math.sin(t) * 0.1 - 0.3;
  });

  return (
    <group>
      {/* Tall thin torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.35, 0.7, 0.2]} />
        <meshStandardMaterial color="#3a4a5a" roughness={0.85} />
      </mesh>
      {/* Tattered cloak */}
      <mesh position={[0, 0.9, -0.12]}>
        <boxGeometry args={[0.5, 0.9, 0.05]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.9} transparent opacity={0.8} />
      </mesh>
      
      {/* Gaunt head */}
      <group position={[0, 1.65, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.3, 0.22]} />
          <meshStandardMaterial color="#5a6a7a" roughness={0.8} />
        </mesh>
        {/* Hood */}
        <mesh position={[0, 0.08, -0.02]}>
          <boxGeometry args={[0.28, 0.25, 0.28]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
        </mesh>
        {/* One glowing sniper eye */}
        <mesh position={[0.05, 0.02, 0.11]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={4} />
        </mesh>
        {/* Empty eye socket */}
        <mesh position={[-0.05, 0.02, 0.11]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#0a0a0a" />
        </mesh>
      </group>

      {/* Arms holding sniper position */}
      <group ref={armRef} position={[-0.28, 1.2, 0.1]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.1, 0.45, 0.1]} />
          <meshStandardMaterial color="#5a6a7a" roughness={0.8} />
        </mesh>
      </group>
      <group position={[0.28, 1.2, 0.1]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.1, 0.45, 0.1]} />
          <meshStandardMaterial color="#5a6a7a" roughness={0.8} />
        </mesh>
      </group>

      {/* Thin legs */}
      <mesh position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.65, 0.1]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.1, 0.65, 0.1]} />
        <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Drone zombie - floating spectral undead */
function DroneZombie({ animPhase = 0 }: { animPhase: number }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 2) * 0.3 + 0.5;
      groupRef.current.rotation.y = t * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating torso remnant */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.35, 0.2]} />
        <meshStandardMaterial color="#6a7a5a" roughness={0.8} transparent opacity={0.7} />
      </mesh>
      {/* Spectral head */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshStandardMaterial color="#8a9a7a" roughness={0.8} transparent opacity={0.6} />
      </mesh>
      {/* Multiple glowing eyes */}
      <mesh position={[-0.04, 0.32, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0.04, 0.32, 0.1]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={4} />
      </mesh>
      <mesh position={[0, 0.27, 0.1]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={3} />
      </mesh>
      {/* Trailing tattered cloth */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <coneGeometry args={[0.2, 0.5, 6]} />
        <meshStandardMaterial color="#4a5a3a" roughness={0.9} transparent opacity={0.5} />
      </mesh>
      {/* Spectral glow */}
      <pointLight color="#ccff00" intensity={0.5} distance={3} />
    </group>
  );
}

/** Heavy zombie - armored brute */
function HeavyZombie({ animPhase = 0 }: { animPhase: number }) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.4;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.5) * 0.4;
  });

  return (
    <group>
      {/* Armored torso */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.4]} />
        <meshStandardMaterial color="#4a2020" roughness={0.7} />
      </mesh>
      {/* Chest armor */}
      <mesh position={[0, 1.25, 0.21]}>
        <boxGeometry args={[0.6, 0.6, 0.05]} />
        <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Shoulder pads */}
      <mesh position={[-0.42, 1.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.15, 0.25]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.42, 1.45, 0]} castShadow>
        <boxGeometry args={[0.2, 0.15, 0.25]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      
      {/* Head with cage mask */}
      <group position={[0, 1.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.3, 0.28]} />
          <meshStandardMaterial color="#4a3030" roughness={0.8} />
        </mesh>
        {/* Cage bars over face */}
        {[-0.06, 0, 0.06].map((x, i) => (
          <mesh key={i} position={[x, 0, 0.15]}>
            <cylinderGeometry args={[0.008, 0.008, 0.25, 4]} />
            <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[-0.07, 0.03, 0.13]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.07, 0.03, 0.13]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={2} />
        </mesh>
      </group>

      <group ref={leftArmRef} position={[-0.5, 1.35, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.18, 0.45, 0.18]} />
          <meshStandardMaterial color="#4a2020" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[0.16, 0.35, 0.16]} />
          <meshStandardMaterial color="#4a3030" roughness={0.8} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.5, 1.35, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.18, 0.45, 0.18]} />
          <meshStandardMaterial color="#4a2020" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[0.16, 0.35, 0.16]} />
          <meshStandardMaterial color="#4a3030" roughness={0.8} />
        </mesh>
      </group>
      
      <mesh position={[-0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[0.18, 0.65, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 0.35, 0]} castShadow>
        <boxGeometry args={[0.18, 0.65, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Stealth zombie - translucent, ghostly */
function StealthZombie({ animPhase = 0 }: { animPhase: number }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (groupRef.current) {
      // Flicker opacity
      groupRef.current.children.forEach((child: any) => {
        if (child.material) {
          child.material.opacity = 0.15 + Math.sin(t * 3) * 0.1;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Torso */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.45, 0.65, 0.25]} />
        <meshStandardMaterial color="#8899aa" transparent opacity={0.2} roughness={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[0.25, 0.28, 0.25]} />
        <meshStandardMaterial color="#99aabb" transparent opacity={0.2} roughness={0.5} />
      </mesh>
      {/* Eyes only clearly visible */}
      <mesh position={[-0.06, 1.53, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.06, 1.53, 0.13]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.32, 0.9, 0]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#8899aa" transparent opacity={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[0.32, 0.9, 0]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#8899aa" transparent opacity={0.15} roughness={0.5} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.12, 0.3, 0]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial color="#8899aa" transparent opacity={0.15} roughness={0.5} />
      </mesh>
      <mesh position={[0.12, 0.3, 0]} castShadow>
        <boxGeometry args={[0.12, 0.6, 0.12]} />
        <meshStandardMaterial color="#8899aa" transparent opacity={0.15} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Grenadier zombie - one arm replaced with explosive growth */
function GrenadierZombie({ animPhase = 0 }: { animPhase: number }) {
  const blobRef = useRef<any>(null);
  const armRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (blobRef.current) {
      blobRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
    }
    if (armRef.current) armRef.current.rotation.x = Math.sin(t * 2) * 0.4;
  });

  return (
    <group>
      {/* Torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
        <meshStandardMaterial color="#2a4a2a" roughness={0.85} />
      </mesh>
      {/* Toxic veins on torso */}
      <mesh position={[0.15, 1.2, 0.16]}>
        <boxGeometry args={[0.12, 0.4, 0.02]} />
        <meshStandardMaterial color="#44ff00" emissive="#44ff00" emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>
      
      {/* Head */}
      <group position={[0, 1.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.3, 0.26]} />
          <meshStandardMaterial color="#3a5a3a" roughness={0.8} />
        </mesh>
        <mesh position={[-0.06, 0.03, 0.13]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#44ff00" emissive="#44ff00" emissiveIntensity={3} />
        </mesh>
        <mesh position={[0.06, 0.03, 0.13]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#44ff00" emissive="#44ff00" emissiveIntensity={3} />
        </mesh>
      </group>

      {/* Normal arm */}
      <group ref={armRef} position={[-0.35, 1.2, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.12, 0.45, 0.12]} />
          <meshStandardMaterial color="#3a5a3a" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Explosive mutated arm */}
      <group position={[0.35, 1.2, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.15, 0.35, 0.15]} />
          <meshStandardMaterial color="#3a5a3a" roughness={0.8} />
        </mesh>
        {/* Pulsating explosive growth */}
        <mesh ref={blobRef} position={[0, -0.5, 0]} castShadow>
          <sphereGeometry args={[0.2, 10, 10]} />
          <meshStandardMaterial color="#66aa00" emissive="#44ff00" emissiveIntensity={0.8} roughness={0.6} />
        </mesh>
        <pointLight color="#44ff00" intensity={0.8} distance={4} position={[0, -0.5, 0]} />
      </group>
      
      {/* Legs */}
      <mesh position={[-0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.14, 0.65, 0.14]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.35, 0]} castShadow>
        <boxGeometry args={[0.14, 0.65, 0.14]} />
        <meshStandardMaterial color="#1a2a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Elite zombie - commander with glowing markings */
function EliteZombie({ animPhase = 0 }: { animPhase: number }) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 2.5) * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 2.5) * 0.5;
  });

  return (
    <group>
      {/* Torso with glowing runes */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.55, 0.75, 0.3]} />
        <meshStandardMaterial color="#2a2045" roughness={0.8} />
      </mesh>
      {/* Glowing sigils */}
      <mesh position={[0, 1.15, 0.16]}>
        <boxGeometry args={[0.3, 0.3, 0.01]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>
      
      {/* Crown/horned head */}
      <group position={[0, 1.7, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.32, 0.28]} />
          <meshStandardMaterial color="#3a3060" roughness={0.8} />
        </mesh>
        {/* Horns */}
        <mesh position={[-0.12, 0.2, 0]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.03, 0.15, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.5} />
        </mesh>
        <mesh position={[0.12, 0.2, 0]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.03, 0.15, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.5} />
        </mesh>
        {/* Glowing eyes */}
        <mesh position={[-0.07, 0.04, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#8888ff" emissive="#8888ff" emissiveIntensity={4} />
        </mesh>
        <mesh position={[0.07, 0.04, 0.14]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#8888ff" emissive="#8888ff" emissiveIntensity={4} />
        </mesh>
      </group>

      {/* Arms */}
      <group ref={leftArmRef} position={[-0.38, 1.3, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.13, 0.4, 0.13]} />
          <meshStandardMaterial color="#3a3060" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial color="#4a4070" roughness={0.8} />
        </mesh>
        {/* Glowing claws */}
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.68, 0.02]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.012, 0.08, 4]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
          </mesh>
        ))}
      </group>
      <group ref={rightArmRef} position={[0.38, 1.3, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.13, 0.4, 0.13]} />
          <meshStandardMaterial color="#3a3060" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.11, 0.3, 0.11]} />
          <meshStandardMaterial color="#4a4070" roughness={0.8} />
        </mesh>
        {[-0.03, 0, 0.03].map((x, i) => (
          <mesh key={i} position={[x, -0.68, 0.02]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.012, 0.08, 4]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
          </mesh>
        ))}
      </group>
      
      <mesh position={[-0.13, 0.35, 0]} castShadow>
        <boxGeometry args={[0.14, 0.65, 0.14]} />
        <meshStandardMaterial color="#1a1530" roughness={0.9} />
      </mesh>
      <mesh position={[0.13, 0.35, 0]} castShadow>
        <boxGeometry args={[0.14, 0.65, 0.14]} />
        <meshStandardMaterial color="#1a1530" roughness={0.9} />
      </mesh>

      {/* Aura */}
      <pointLight color="#6366f1" intensity={0.6} distance={5} />
    </group>
  );
}

/** BOSS zombie - massive abomination with multiple mutations */
function BossZombie({ animPhase = 0 }: { animPhase: number }) {
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime + animPhase;
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.5;
    if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 1.8) * 0.5;
    if (headRef.current) headRef.current.rotation.z = Math.sin(t) * 0.1;
    if (bodyRef.current) bodyRef.current.position.y = Math.sin(t * 0.8) * 0.05;
  });

  return (
    <group ref={bodyRef}>
      {/* Massive torso */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <boxGeometry args={[1.8, 1.6, 1.0]} />
        <meshStandardMaterial color={BOSS_COLORS.skin} roughness={0.85} />
      </mesh>
      {/* Chest armor plating */}
      <mesh position={[0, 2.6, 0.51]}>
        <boxGeometry args={[1.4, 1.2, 0.08]} />
        <meshStandardMaterial color={BOSS_COLORS.armor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Exposed ribcage */}
      {[-0.3, -0.1, 0.1, 0.3].map((y, i) => (
        <mesh key={`rib-${i}`} position={[0, 2.2 + y * 2, 0.45]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.06, 0.04]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.5} />
        </mesh>
      ))}
      {/* Pulsating flesh masses */}
      <mesh position={[-0.5, 2.8, 0.4]} castShadow>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshStandardMaterial color={BOSS_COLORS.flesh} roughness={0.6} />
      </mesh>
      <mesh position={[0.6, 2.2, 0.35]} castShadow>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color={BOSS_COLORS.flesh} roughness={0.6} />
      </mesh>
      
      {/* Lower body */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.8]} />
        <meshStandardMaterial color="#1a2a10" roughness={0.85} />
      </mesh>

      {/* Monstrous head */}
      <group ref={headRef} position={[0, 3.8, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={BOSS_COLORS.skin} roughness={0.8} />
        </mesh>
        {/* Massive jaw */}
        <mesh position={[0, -0.3, 0.15]}>
          <boxGeometry args={[0.55, 0.25, 0.4]} />
          <meshStandardMaterial color="#1a2a10" roughness={0.8} />
        </mesh>
        {/* Teeth */}
        {[-0.15, -0.05, 0.05, 0.15].map((x, i) => (
          <mesh key={`tooth-${i}`} position={[x, -0.35, 0.3]} rotation={[0.2, 0, 0]}>
            <coneGeometry args={[0.03, 0.1, 4]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
          </mesh>
        ))}
        {/* Horns */}
        <mesh position={[-0.3, 0.35, -0.1]} rotation={[0.3, 0, -0.4]}>
          <coneGeometry args={[0.06, 0.4, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
        </mesh>
        <mesh position={[0.3, 0.35, -0.1]} rotation={[0.3, 0, 0.4]}>
          <coneGeometry args={[0.06, 0.4, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
        </mesh>
        {/* Glowing red eyes */}
        <mesh position={[-0.15, 0.08, 0.35]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={BOSS_COLORS.eyes} emissive={BOSS_COLORS.eyes} emissiveIntensity={5} />
        </mesh>
        <mesh position={[0.15, 0.08, 0.35]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={BOSS_COLORS.eyes} emissive={BOSS_COLORS.eyes} emissiveIntensity={5} />
        </mesh>
        {/* Third eye */}
        <mesh position={[0, 0.25, 0.32]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff4400" emissiveIntensity={3} />
        </mesh>
      </group>
      
      {/* Spines on back */}
      {[0, 0.3, 0.6, 0.9, 1.2].map((y, i) => (
        <mesh key={`spine-${i}`} position={[0, 2.0 + y, -0.5]} rotation={[-0.4, 0, 0]}>
          <coneGeometry args={[0.05, 0.2 + i * 0.05, 6]} />
          <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
        </mesh>
      ))}

      {/* Massive left arm - mutated club */}
      <group ref={leftArmRef} position={[-1.1, 2.8, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.8, 0.35]} />
          <meshStandardMaterial color={BOSS_COLORS.skin} roughness={0.8} />
        </mesh>
        <mesh position={[0, -1.0, 0]} castShadow>
          <boxGeometry args={[0.35, 0.7, 0.3]} />
          <meshStandardMaterial color="#2a3a1a" roughness={0.8} />
        </mesh>
        {/* Oversized fist */}
        <mesh position={[0, -1.5, 0]} castShadow>
          <boxGeometry args={[0.45, 0.35, 0.35]} />
          <meshStandardMaterial color={BOSS_COLORS.skin} roughness={0.9} />
        </mesh>
        {/* Bone spikes on fist */}
        {[-0.15, 0, 0.15].map((x, i) => (
          <mesh key={`fspike-${i}`} position={[x, -1.65, 0.15]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.025, 0.12, 4]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.4} />
          </mesh>
        ))}
      </group>
      
      {/* Right arm - thinner but with long claws */}
      <group ref={rightArmRef} position={[1.1, 2.8, 0]}>
        <mesh position={[0, -0.4, 0]} castShadow>
          <boxGeometry args={[0.3, 0.8, 0.25]} />
          <meshStandardMaterial color={BOSS_COLORS.skin} roughness={0.8} />
        </mesh>
        <mesh position={[0, -1.0, 0]} castShadow>
          <boxGeometry args={[0.25, 0.7, 0.2]} />
          <meshStandardMaterial color="#2a3a1a" roughness={0.8} />
        </mesh>
        {/* Long claws */}
        {[-0.06, -0.02, 0.02, 0.06].map((x, i) => (
          <mesh key={`claw-${i}`} position={[x, -1.5, 0.05]} rotation={[0.5, 0, 0]}>
            <coneGeometry args={[0.015, 0.25, 4]} />
            <meshStandardMaterial color={ZOMBIE_COLORS.bone} roughness={0.3} />
          </mesh>
        ))}
      </group>
      
      {/* Massive legs */}
      <mesh position={[-0.4, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color="#0a1a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 0.5, 0]} castShadow>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color="#0a1a0a" roughness={0.9} />
      </mesh>
      {/* Feet */}
      <mesh position={[-0.4, -0.05, 0.1]}>
        <boxGeometry args={[0.45, 0.15, 0.5]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, -0.05, 0.1]}>
        <boxGeometry args={[0.45, 0.15, 0.5]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      
      {/* Boss aura lights */}
      <pointLight color="#ff0000" intensity={2} distance={15} position={[0, 3, 0]} />
      <pointLight color="#ff4400" intensity={1} distance={8} position={[0, 1, 2]} />
    </group>
  );
}

/** Main ZombieModel component - selects the right zombie variant */
export function ZombieModel({ type, animPhase = 0 }: ZombieProps) {
  const phase = useMemo(() => animPhase || Math.random() * Math.PI * 2, [animPhase]);

  switch (type) {
    case 'GRUNT': return <GruntZombie animPhase={phase} />;
    case 'RUSHER': return <RusherZombie animPhase={phase} />;
    case 'TANK': return <TankZombie animPhase={phase} />;
    case 'SNIPER': return <SniperZombie animPhase={phase} />;
    case 'DRONE': return <DroneZombie animPhase={phase} />;
    case 'HEAVY': return <HeavyZombie animPhase={phase} />;
    case 'STEALTH': return <StealthZombie animPhase={phase} />;
    case 'GRENADIER': return <GrenadierZombie animPhase={phase} />;
    case 'ELITE': return <EliteZombie animPhase={phase} />;
    case 'BOSS': return <BossZombie animPhase={phase} />;
    default: return <GruntZombie animPhase={phase} />;
  }
}
