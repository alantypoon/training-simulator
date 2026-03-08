import { Canvas } from '@react-three/fiber';
import { Suspense, useState, useEffect } from 'react';
import { Sky, Stars, Cloud, Environment } from '@react-three/drei';
import { Player } from './Player';
import { Level } from './Level';
import { Enemies } from './Enemies';
import { Weapon } from './Weapon';
import { HUD } from './HUD';
import { useGameStore, actions } from '../store/gameStore';
import { LEVELS } from '../game/types';

export function GameScene() {
  const levelId = useGameStore((state) => state.level);
  const currentLevel = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
  const isGameRunning = useGameStore((state) => state.isGameRunning);
  const gameResetCount = useGameStore((state) => state.gameResetCount);

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas
        shadows
        camera={{ fov: 75, position: [0, 2, 0] }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <group key={gameResetCount}>
            <fog attach="fog" args={[currentLevel.fogColor, 15, 80]} />
            <ambientLight intensity={levelId === 3 ? 0.15 : levelId === 2 ? 0.42 : 0.5} />
            <directionalLight 
              position={[10, 20, 10]} 
              intensity={levelId === 3 ? 0.3 : levelId === 2 ? 1.25 : 1} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
              shadow-camera-far={100}
              shadow-camera-left={-50}
              shadow-camera-right={50}
              shadow-camera-top={50}
              shadow-camera-bottom={-50}
            />
            {/* Secondary fill light */}
            <directionalLight position={[-5, 10, -5]} intensity={levelId === 2 ? 0.45 : 0.2} color={levelId === 2 ? '#c7deff' : '#ffffff'} />
            {/* Level-specific hemisphere light for ambient coloring */}
            <hemisphereLight
              color={levelId === 1 ? '#b4c6db' : levelId === 2 ? '#90b4dd' : '#0a0a2a'}
              groundColor={levelId === 1 ? '#d4d4d4' : levelId === 2 ? '#38424a' : '#000'}
              intensity={levelId === 2 ? 0.65 : 0.4}
            />
            {levelId === 2 && <pointLight position={[0, 12, 0]} intensity={0.8} distance={90} color="#dbeafe" />}
            
            <Player />
            <Level config={currentLevel} />
            <Enemies config={currentLevel} />
            <Weapon />
            
            {/* Level 3: Night sky with stars */}
            {levelId === 3 && <Stars radius={100} depth={50} count={8000} factor={4} saturation={0} fade speed={1} />}
            
            {/* Level 1: Snowy sky with clouds */}
            {levelId === 1 && (
              <>
                <Sky sunPosition={[10, 5, 10]} turbidity={8} rayleigh={2} mieCoefficient={0.005} mieDirectionalG={0.8} />
                <Cloud position={[-20, 20, -10]} speed={0.2} opacity={0.4} />
                <Cloud position={[20, 25, 15]} speed={0.15} opacity={0.3} />
                <Cloud position={[0, 22, -25]} speed={0.25} opacity={0.35} />
              </>
            )}
            
            {/* Level 2: Rainy city atmosphere */}
            {levelId === 2 && (
              <>
                <Environment preset="city" />
                <Sky sunPosition={[6, 4, 8]} turbidity={10} rayleigh={0.8} mieCoefficient={0.02} mieDirectionalG={0.65} />
                <Cloud position={[0, 15, 0]} speed={0.4} opacity={0.6} width={40} depth={10} />
                <Cloud position={[-15, 18, 10]} speed={0.3} opacity={0.5} width={30} />
              </>
            )}
          </group>
        </Suspense>
      </Canvas>
      <HUD />
    </div>
  );
}
