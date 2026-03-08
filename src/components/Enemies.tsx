import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { EnemyStats, ENEMIES, LevelConfig } from '../game/types';
import { actions, gameStore } from '../store/gameStore';
import { soundManager } from '../game/SoundManager';
import { useGameStore } from '../store/gameStore';
import { ZombieModel } from './ZombieModel';

function Enemy({ stats, initialPos, onDeath, difficulty, isBoss = false }: {
  stats: EnemyStats;
  initialPos: Vector3;
  onDeath: () => void;
  difficulty: number;
  isBoss?: boolean;
}) {
  const groupRef = useRef<any>(null);
  const health = useRef(stats.health * (1 + (difficulty - 1) * 0.2));
  const state = useRef<'patrol' | 'chase' | 'attack'>('patrol');
  const targetPos = useRef(new Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40));
  const lastAttackTime = useRef(0);
  const { camera, clock } = useThree();

  useEffect(() => {
    lastAttackTime.current = clock.elapsedTime + Math.random() * 2;
    if (isBoss) {
      health.current = stats.health;
    }
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || health.current <= 0) return;

    const playerPos = camera.position;
    const distToPlayer = groupRef.current.position.distanceTo(playerPos);
    
    const speed = stats.speed * (1 + (difficulty - 1) * 0.05);

    if (distToPlayer < stats.attackRange) {
      state.current = 'attack';
    } else if (distToPlayer < 50) {
      state.current = 'chase';
    } else {
      state.current = 'patrol';
    }

    if (state.current === 'chase') {
      const dir = new Vector3().subVectors(playerPos, groupRef.current.position).normalize();
      dir.y = 0;
      groupRef.current.position.addScaledVector(dir, speed * delta);
      groupRef.current.lookAt(playerPos.x, groupRef.current.position.y, playerPos.z);
    } else if (state.current === 'patrol') {
      if (groupRef.current.position.distanceTo(targetPos.current) < 1) {
        targetPos.current.set((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40);
      }
      const dir = new Vector3().subVectors(targetPos.current, groupRef.current.position).normalize();
      groupRef.current.position.addScaledVector(dir, speed * 0.5 * delta);
      groupRef.current.lookAt(targetPos.current);
    } else if (state.current === 'attack') {
      groupRef.current.lookAt(playerPos.x, groupRef.current.position.y, playerPos.z);
      const attackInterval = Math.max(0.5, 1.5 - (difficulty - 1) * 0.1);
      
      if (clock.elapsedTime - lastAttackTime.current > attackInterval) {
        lastAttackTime.current = clock.elapsedTime;
        const damage = stats.damage * (1 + (difficulty - 1) * 0.1);
        actions.takeDamage(damage);
        soundManager.playShoot('rifle');
      }
    }
  });

  const handleHit = (dmg: number) => {
    health.current -= dmg;
    if (isBoss) {
      actions.damageBoss(dmg);
    }
    if (health.current <= 0) {
      onDeath();
      if (!isBoss) {
        actions.addScore(stats.scoreValue);
      }
      soundManager.playEnemyDeath();
    } else {
      soundManager.playHit();
      if (groupRef.current) {
        groupRef.current.traverse((child: any) => {
          if (child.material && child.material.emissive) {
            child.material.emissive.setHex(0xffffff);
            setTimeout(() => {
              if (child.material && child.material.emissive) child.material.emissive.setHex(0x000000);
            }, 100);
          }
        });
      }
    }
  };

  const scaleVal = isBoss ? 1 : (stats.type === 'DRONE' ? 0.6 : 1);

  return (
    <group ref={groupRef} position={initialPos}>
      {/* Invisible hit box */}
      <mesh
        position={[0, stats.scale[1] / 2, 0]}
        userData={{ hit: handleHit }}
        visible={false}
      >
        <boxGeometry args={stats.scale as any} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      {/* 3D Zombie Model */}
      <group scale={[scaleVal, scaleVal, scaleVal]}>
        <ZombieModel type={stats.type} />
      </group>
    </group>
  );
}

export function Enemies({ config }: { config: LevelConfig }) {
  const [enemies, setEnemies] = useState<{ id: string; type: string; pos: Vector3 }[]>([]);
  const [bossEnemy, setBossEnemy] = useState<{ id: string; pos: Vector3 } | null>(null);
  const difficulty = useGameStore((state) => state.difficulty);
  const isGameRunning = useGameStore((state) => state.isGameRunning);
  const gameStartTime = useGameStore((state) => state.gameStartTime);
  const bossCheckRef = useRef(false);

  // Spawn regular enemies (exclude BOSS from random spawns)
  useEffect(() => {
    const newEnemies = [];
    const count = Math.floor(config.enemyCount * (1 + (difficulty - 1) * 0.2));
    const types = config.enemyTypes.filter(t => t !== 'BOSS');
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)] || 'GRUNT';
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 40;
      const pos = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      newEnemies.push({ id: Math.random().toString(), type, pos });
    }
    setEnemies(newEnemies);
    setBossEnemy(null);
    bossCheckRef.current = false;
  }, [config, difficulty]);

  // Check timer for boss spawn at 30 seconds
  useEffect(() => {
    if (!isGameRunning || !gameStartTime) return;
    
    const checkBossSpawn = setInterval(() => {
      const elapsed = (Date.now() - gameStartTime) / 1000;
      if (elapsed >= 30 && !bossCheckRef.current) {
        bossCheckRef.current = true;
        actions.spawnBoss();
        const angle = Math.random() * Math.PI * 2;
        const pos = new Vector3(Math.cos(angle) * 25, 0, Math.sin(angle) * 25);
        setBossEnemy({ id: 'boss-' + Math.random(), pos });
      }
    }, 500);

    return () => clearInterval(checkBossSpawn);
  }, [isGameRunning, gameStartTime]);

  const removeEnemy = (id: string) => {
    setEnemies((prev) => prev.filter((e) => e.id !== id));
  };

  const removeBoss = () => {
    setBossEnemy(null);
  };

  return (
    <group>
      {enemies.map((e) => (
        <Enemy
          key={e.id}
          stats={ENEMIES[e.type as keyof typeof ENEMIES]}
          initialPos={e.pos}
          onDeath={() => removeEnemy(e.id)}
          difficulty={difficulty}
        />
      ))}
      {bossEnemy && (
        <Enemy
          key={bossEnemy.id}
          stats={ENEMIES.BOSS}
          initialPos={bossEnemy.pos}
          onDeath={removeBoss}
          difficulty={difficulty}
          isBoss={true}
        />
      )}
    </group>
  );
}
