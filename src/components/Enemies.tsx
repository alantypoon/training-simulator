import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Vector3 } from 'three';
import { EnemyStats, ENEMIES, LevelConfig } from '../game/types';
import { actions } from '../store/gameStore';
import { soundManager } from '../game/SoundManager';
import { useGameStore } from '../store/gameStore';
import { ZombieModel } from './ZombieModel';

const MAX_ACTIVE_ENEMIES = 3;
const HENCHMEN_PER_LEVEL = 10;

type EnemyMode = 'patrol' | 'chase' | 'attack';

interface BehaviorProfile {
  isRanged: boolean;
  preferredDistance: number;
  engageDistance: number;
  strafeStrength: number;
  attackStrafeStrength: number;
  weaveStrength: number;
  weaveFrequency: number;
  surgeMultiplier: number;
  surgeCooldown: number;
}

function lerpAngle(current: number, target: number, alpha: number) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * alpha;
}

function setThreatPatrolTarget(target: Vector3, playerPos: Vector3, variance = 0) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 10 + Math.random() * 18 + variance;
  target.set(
    playerPos.x + Math.cos(angle) * radius,
    0,
    playerPos.z + Math.sin(angle) * radius,
  );
}

function createOpeningSpawn(index: number, total: number) {
  const spread = total <= 1 ? 0 : (index / (total - 1) - 0.5);
  const distance = 52 + Math.random() * 18;
  const lateral = spread * 28 + (Math.random() - 0.5) * 6;

  return new Vector3(lateral, 0, -distance);
}

function getBehaviorProfile(stats: EnemyStats, isBoss: boolean): BehaviorProfile {
  if (isBoss) {
    return {
      isRanged: false,
      preferredDistance: 8,
      engageDistance: 70,
      strafeStrength: 0.42,
      attackStrafeStrength: 0.55,
      weaveStrength: 0.18,
      weaveFrequency: 2.1,
      surgeMultiplier: 1.5,
      surgeCooldown: 2.4,
    };
  }

  switch (stats.type) {
    case 'RUSHER':
      return { isRanged: false, preferredDistance: 3.5, engageDistance: 65, strafeStrength: 0.75, attackStrafeStrength: 0.55, weaveStrength: 0.42, weaveFrequency: 4.8, surgeMultiplier: 1.8, surgeCooldown: 1.5 };
    case 'TANK':
      return { isRanged: false, preferredDistance: 5, engageDistance: 58, strafeStrength: 0.14, attackStrafeStrength: 0.2, weaveStrength: 0.05, weaveFrequency: 1.2, surgeMultiplier: 1.18, surgeCooldown: 3.5 };
    case 'SNIPER':
      return { isRanged: true, preferredDistance: 22, engageDistance: 85, strafeStrength: 0.52, attackStrafeStrength: 0.85, weaveStrength: 0.12, weaveFrequency: 2.1, surgeMultiplier: 1.05, surgeCooldown: 4.5 };
    case 'DRONE':
      return { isRanged: true, preferredDistance: 16, engageDistance: 80, strafeStrength: 0.85, attackStrafeStrength: 1.1, weaveStrength: 0.26, weaveFrequency: 3.4, surgeMultiplier: 1.25, surgeCooldown: 2.2 };
    case 'HEAVY':
      return { isRanged: false, preferredDistance: 5.5, engageDistance: 62, strafeStrength: 0.24, attackStrafeStrength: 0.22, weaveStrength: 0.08, weaveFrequency: 1.6, surgeMultiplier: 1.15, surgeCooldown: 3.2 };
    case 'STEALTH':
      return { isRanged: false, preferredDistance: 2.5, engageDistance: 68, strafeStrength: 0.95, attackStrafeStrength: 0.7, weaveStrength: 0.55, weaveFrequency: 5.4, surgeMultiplier: 1.95, surgeCooldown: 1.25 };
    case 'GRENADIER':
      return { isRanged: true, preferredDistance: 18, engageDistance: 76, strafeStrength: 0.45, attackStrafeStrength: 0.72, weaveStrength: 0.14, weaveFrequency: 2.2, surgeMultiplier: 1.1, surgeCooldown: 3.8 };
    case 'ELITE':
      return { isRanged: false, preferredDistance: 5.5, engageDistance: 72, strafeStrength: 0.64, attackStrafeStrength: 0.48, weaveStrength: 0.24, weaveFrequency: 3.2, surgeMultiplier: 1.4, surgeCooldown: 1.9 };
    case 'GRUNT':
    default:
      return { isRanged: false, preferredDistance: 4.5, engageDistance: 60, strafeStrength: 0.32, attackStrafeStrength: 0.26, weaveStrength: 0.12, weaveFrequency: 2.2, surgeMultiplier: 1.12, surgeCooldown: 2.8 };
  }
}

function Enemy({ stats, initialPos, onDeath, difficulty, isBoss = false, healthMultiplier = 1 }: {
  stats: EnemyStats;
  initialPos: Vector3;
  onDeath: () => void;
  difficulty: number;
  isBoss?: boolean;
  healthMultiplier?: number;
}) {
  const groupRef = useRef<any>(null);
  const modelRef = useRef<any>(null);
  const health = useRef(stats.health * healthMultiplier * (1 + (difficulty - 1) * 0.2));
  const state = useRef<EnemyMode>('patrol');
  const targetPos = useRef(new Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40));
  const lastAttackTime = useRef(0);
  const attackWindupStart = useRef<number | null>(null);
  const lockedAttackPos = useRef(new Vector3());
  const surgeEndTime = useRef(0);
  const nextSurgeTime = useRef(0);
  const moveSpeed = useRef(0);
  const phase = useRef(Math.random() * Math.PI * 2);
  const strafeDirection = useRef(Math.random() > 0.5 ? 1 : -1);
  const scratchPlayer = useRef(new Vector3());
  const scratchToPlayer = useRef(new Vector3());
  const scratchTangent = useRef(new Vector3());
  const scratchMove = useRef(new Vector3());
  const scratchLook = useRef(new Vector3());
  const { camera, clock } = useThree();
  const isGameRunning = useGameStore((store) => store.isGameRunning);
  const gameStartTime = useGameStore((store) => store.gameStartTime);
  const behavior = getBehaviorProfile(stats, isBoss);

  useEffect(() => {
    lastAttackTime.current = clock.elapsedTime;
    nextSurgeTime.current = clock.elapsedTime + 0.8 + Math.random() * 1.5;
    if (isBoss) {
      health.current = stats.health;
    }
    setThreatPatrolTarget(targetPos.current, new Vector3(initialPos.x, 0, initialPos.z), isBoss ? 6 : 0);
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || health.current <= 0 || !isGameRunning) return;

    const playerPos = scratchPlayer.current.set(camera.position.x, 0, camera.position.z);
    const enemyPos = groupRef.current.position;
    const toPlayer = scratchToPlayer.current.subVectors(playerPos, enemyPos);
    toPlayer.y = 0;
    const distToPlayer = toPlayer.length();
    const aimDirection = distToPlayer > 0.001 ? toPlayer.multiplyScalar(1 / distToPlayer) : toPlayer.set(0, 0, 1);
    const tangent = scratchTangent.current.set(-aimDirection.z, 0, aimDirection.x).multiplyScalar(strafeDirection.current);
    const movement = scratchMove.current.set(0, 0, 0);
    const speed = stats.speed * (1 + (difficulty - 1) * 0.05);
    const rotationAlpha = 1 - Math.exp(-8 * delta);
    const missionElapsed = gameStartTime ? (Date.now() - gameStartTime) / 1000 : 0;
    const attackRamp = MathUtils.clamp(missionElapsed / 75, 0, 1);
    const attackInterval = MathUtils.lerp(
      10,
      behavior.isRanged ? 4.5 : isBoss ? 3.5 : 3,
      attackRamp,
    );
    const windupDuration = behavior.isRanged ? 1.2 : isBoss ? 1.05 : 0.9;
    const attackCharge = attackWindupStart.current === null
      ? 0
      : MathUtils.clamp((clock.elapsedTime - attackWindupStart.current) / windupDuration, 0, 1);
    let desiredSpeed = 0;
    
    if (distToPlayer < stats.attackRange * 0.92) {
      state.current = 'attack';
    } else if (distToPlayer < behavior.engageDistance) {
      state.current = 'chase';
    } else {
      state.current = 'patrol';
    }

    if (state.current !== 'attack' && attackWindupStart.current !== null) {
      attackWindupStart.current = null;
    }

    if (state.current === 'chase') {
      const spacingError = (distToPlayer - behavior.preferredDistance) / Math.max(behavior.preferredDistance, 0.001);
      const weave = Math.sin(clock.elapsedTime * behavior.weaveFrequency + phase.current) * behavior.weaveStrength;

      if (!behavior.isRanged) {
        movement.addScaledVector(aimDirection, 1 + Math.max(0, spacingError) * 0.7);
      } else {
        movement.addScaledVector(aimDirection, MathUtils.clamp(spacingError, -0.9, 1));
      }

      movement.addScaledVector(tangent, behavior.strafeStrength + weave);
      desiredSpeed = speed * (behavior.isRanged ? 0.95 : 1.05 + Math.max(0, spacingError) * 0.3);

      if (clock.elapsedTime >= nextSurgeTime.current && distToPlayer < behavior.engageDistance * 0.75) {
        surgeEndTime.current = clock.elapsedTime + 0.45;
        nextSurgeTime.current = clock.elapsedTime + behavior.surgeCooldown + Math.random() * 1.2;
        strafeDirection.current *= -1;
      }
    } else if (state.current === 'patrol') {
      if (enemyPos.distanceTo(targetPos.current) < 2 || enemyPos.distanceTo(playerPos) > behavior.engageDistance * 1.4) {
        setThreatPatrolTarget(targetPos.current, playerPos, isBoss ? 8 : 0);
      }
      movement.subVectors(targetPos.current, enemyPos).setY(0);
      if (movement.lengthSq() > 0.0001) {
        movement.normalize();
      }
      movement.addScaledVector(tangent, 0.12 * strafeDirection.current);
      desiredSpeed = speed * 0.55;
    } else if (state.current === 'attack') {
      const orbit = Math.sin(clock.elapsedTime * (behavior.weaveFrequency * 1.35) + phase.current);

      movement.addScaledVector(tangent, orbit * behavior.attackStrafeStrength);
      if (behavior.isRanged) {
        const retreat = MathUtils.clamp((behavior.preferredDistance - distToPlayer) / Math.max(behavior.preferredDistance, 0.001), 0, 1);
        movement.addScaledVector(aimDirection, -retreat * 1.1);
        desiredSpeed = speed * 0.7;
      } else {
        movement.addScaledVector(aimDirection, 0.42 + Math.abs(orbit) * 0.2);
        desiredSpeed = speed * 0.95;
      }

      if (attackWindupStart.current === null && clock.elapsedTime - lastAttackTime.current >= attackInterval) {
        attackWindupStart.current = clock.elapsedTime;
        lockedAttackPos.current.copy(playerPos);
      }

      if (attackWindupStart.current !== null) {
        desiredSpeed *= behavior.isRanged ? 0.2 : 0.4;
        movement.multiplyScalar(0.35);

        if (attackCharge >= 1) {
          attackWindupStart.current = null;
          lastAttackTime.current = clock.elapsedTime;

          let hit = false;
          if (behavior.isRanged) {
            const dodgeRadius = stats.type === 'SNIPER' ? 1.6 : stats.type === 'DRONE' ? 2.2 : 2.8;
            hit = playerPos.distanceTo(lockedAttackPos.current) <= dodgeRadius;
          } else {
            const meleeReach = isBoss
              ? 7
              : Math.min(stats.attackRange * 0.3, behavior.preferredDistance + 1.8);
            hit = enemyPos.distanceTo(playerPos) <= meleeReach;
          }

          if (hit) {
            const damage = stats.damage * (1 + (difficulty - 1) * 0.1);
            actions.takeDamage(damage);
          }

          soundManager.playShoot('rifle');
        }
      }
    }

    if (movement.lengthSq() > 0.0001) {
      movement.normalize();
      const activeSurge = clock.elapsedTime < surgeEndTime.current ? behavior.surgeMultiplier : 1;
      const appliedSpeed = desiredSpeed * activeSurge;
      enemyPos.addScaledVector(movement, appliedSpeed * delta);
      moveSpeed.current = MathUtils.lerp(moveSpeed.current, appliedSpeed, 1 - Math.exp(-10 * delta));
    } else {
      moveSpeed.current = MathUtils.lerp(moveSpeed.current, 0, 1 - Math.exp(-8 * delta));
    }

    enemyPos.y = 0;

    const lookVector = scratchLook.current.copy(
      state.current === 'patrol' && movement.lengthSq() > 0.0001 ? movement : aimDirection,
    );
    if (lookVector.lengthSq() > 0.0001) {
      const targetYaw = Math.atan2(lookVector.x, lookVector.z);
      groupRef.current.rotation.y = lerpAngle(groupRef.current.rotation.y, targetYaw, rotationAlpha);
    }

    if (modelRef.current) {
      const motionRatio = MathUtils.clamp(moveSpeed.current / Math.max(speed * 1.4, 0.001), 0, 1.4);
      const animTime = clock.elapsedTime * (2 + motionRatio * (stats.type === 'RUSHER' || stats.type === 'STEALTH' ? 4 : 2.2)) + phase.current;

      if (stats.type === 'DRONE') {
        const hover = 0.52 + Math.sin(animTime * 1.8) * 0.18 + Math.cos(animTime * 3.6) * 0.04 + attackCharge * 0.12;
        modelRef.current.position.y = MathUtils.lerp(modelRef.current.position.y, hover, 1 - Math.exp(-8 * delta));
        modelRef.current.rotation.x = MathUtils.lerp(modelRef.current.rotation.x, Math.sin(animTime * 0.9) * 0.08 - attackCharge * 0.1, 1 - Math.exp(-6 * delta));
        modelRef.current.rotation.z = MathUtils.lerp(modelRef.current.rotation.z, Math.cos(animTime * 1.5) * 0.14, 1 - Math.exp(-6 * delta));
      } else {
        const bob = Math.abs(Math.sin(animTime)) * (0.05 + motionRatio * 0.09) + (state.current === 'attack' ? 0.03 : 0) + attackCharge * 0.04;
        const leanX = 0.04 + motionRatio * 0.12 + (!behavior.isRanged && state.current === 'attack' ? 0.12 : 0) - attackCharge * 0.08;
        const leanZ = Math.sin(animTime * 0.5) * (0.03 + behavior.strafeStrength * 0.08) * strafeDirection.current;
        modelRef.current.position.y = MathUtils.lerp(modelRef.current.position.y, bob, 1 - Math.exp(-10 * delta));
        modelRef.current.rotation.x = MathUtils.lerp(modelRef.current.rotation.x, leanX, 1 - Math.exp(-8 * delta));
        modelRef.current.rotation.z = MathUtils.lerp(modelRef.current.rotation.z, leanZ, 1 - Math.exp(-8 * delta));
      }

      modelRef.current.rotation.y = MathUtils.lerp(modelRef.current.rotation.y, Math.sin(animTime * 0.35) * 0.05, 1 - Math.exp(-6 * delta));
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
      <group ref={modelRef} scale={[scaleVal, scaleVal, scaleVal]}>
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
  const henchmenRemaining = useGameStore((state) => state.henchmenRemaining);
  const bossSpawned = useGameStore((state) => state.bossSpawned);
  const totalSpawned = useRef(0);
  const types = useRef<string[]>([]);

  // Initialize on level change
  useEffect(() => {
    types.current = config.enemyTypes.filter(t => t !== 'BOSS');
    totalSpawned.current = 0;
    setBossEnemy(null);

    // Spawn initial wave
    const initialCount = Math.min(MAX_ACTIVE_ENEMIES, HENCHMEN_PER_LEVEL);
    const initialEnemies = [];
    for (let i = 0; i < initialCount; i++) {
      const type = types.current[Math.floor(Math.random() * types.current.length)] || 'GRUNT';
      const pos = createOpeningSpawn(i, initialCount);
      initialEnemies.push({ id: Math.random().toString(), type, pos });
    }
    totalSpawned.current = initialCount;
    setEnemies(initialEnemies);
  }, [config, difficulty]);

  // When boss is triggered by store, spawn boss enemy
  useEffect(() => {
    if (bossSpawned && !bossEnemy) {
      const angle = Math.random() * Math.PI * 2;
      const pos = new Vector3(Math.cos(angle) * 25, 0, Math.sin(angle) * 25);
      setEnemies([]); // Clear remaining henchmen
      setBossEnemy({ id: 'boss-' + Math.random(), pos });
    }
  }, [bossSpawned]);

  const removeEnemy = (id: string) => {
    setEnemies((prev) => {
      const next = prev.filter((e) => e.id !== id);

      // If we still have henchmen to spawn and room, add a replacement
      if (totalSpawned.current < HENCHMEN_PER_LEVEL && next.length < MAX_ACTIVE_ENEMIES) {
        const type = types.current[Math.floor(Math.random() * types.current.length)] || 'GRUNT';
        const angle = Math.random() * Math.PI * 2;
        const radius = 25 + Math.random() * 20;
        const pos = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        totalSpawned.current += 1;
        return [...next, { id: Math.random().toString(), type, pos }];
      }

      return next;
    });
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
          healthMultiplier={config.id === 1 ? 0.45 : 1}
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
