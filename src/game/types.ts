export type WeaponType = 'AK47' | 'SMG' | 'SNIPER' | 'SHOTGUN' | 'MINIGUN';

export interface WeaponStats {
  name: string;
  ammo: number;
  maxAmmo: number;
  fireRate: number; // ms between shots
  damage: number;
  spread: number;
  range: number;
}

export const WEAPONS: Record<WeaponType, WeaponStats> = {
  AK47: { name: 'AK-47', ammo: 30, maxAmmo: 30, fireRate: 100, damage: 25, spread: 0.02, range: 100 },
  SMG: { name: 'Viper SMG', ammo: 50, maxAmmo: 50, fireRate: 60, damage: 15, spread: 0.05, range: 50 },
  SNIPER: { name: 'Falcon Sniper', ammo: 5, maxAmmo: 5, fireRate: 1000, damage: 100, spread: 0.001, range: 200 },
  SHOTGUN: { name: 'Breacher', ammo: 8, maxAmmo: 8, fireRate: 800, damage: 10, spread: 0.1, range: 20 }, // Per pellet
  MINIGUN: { name: 'Obliterator', ammo: 100, maxAmmo: 100, fireRate: 40, damage: 12, spread: 0.08, range: 80 },
};

export type EnemyType = 
  | 'GRUNT' | 'RUSHER' | 'TANK' | 'SNIPER' | 'DRONE' 
  | 'HEAVY' | 'STEALTH' | 'GRENADIER' | 'ELITE' | 'BOSS';

export interface EnemyStats {
  type: EnemyType;
  health: number;
  speed: number;
  color: string;
  scale: [number, number, number];
  attackRange: number;
  damage: number;
  scoreValue: number;
}

export const ENEMIES: Record<EnemyType, EnemyStats> = {
  GRUNT: { type: 'GRUNT', health: 100, speed: 3, color: '#ef4444', scale: [1, 1.8, 1], attackRange: 20, damage: 10, scoreValue: 100 },
  RUSHER: { type: 'RUSHER', health: 60, speed: 6, color: '#f97316', scale: [0.8, 1.6, 0.8], attackRange: 10, damage: 5, scoreValue: 150 },
  TANK: { type: 'TANK', health: 300, speed: 1.5, color: '#1e293b', scale: [1.5, 2.2, 1.5], attackRange: 15, damage: 20, scoreValue: 300 },
  SNIPER: { type: 'SNIPER', health: 80, speed: 2, color: '#06b6d4', scale: [0.9, 1.7, 0.9], attackRange: 60, damage: 40, scoreValue: 200 },
  DRONE: { type: 'DRONE', health: 40, speed: 5, color: '#eab308', scale: [0.5, 0.5, 0.5], attackRange: 25, damage: 8, scoreValue: 120 },
  HEAVY: { type: 'HEAVY', health: 200, speed: 2, color: '#7f1d1d', scale: [1.3, 2.0, 1.3], attackRange: 20, damage: 15, scoreValue: 250 },
  STEALTH: { type: 'STEALTH', health: 70, speed: 4, color: '#94a3b8', scale: [1, 1.7, 1], attackRange: 5, damage: 30, scoreValue: 180 }, // Transparent
  GRENADIER: { type: 'GRENADIER', health: 110, speed: 2.5, color: '#166534', scale: [1.1, 1.8, 1.1], attackRange: 30, damage: 25, scoreValue: 220 },
  ELITE: { type: 'ELITE', health: 250, speed: 3.5, color: '#6366f1', scale: [1.2, 1.9, 1.2], attackRange: 25, damage: 18, scoreValue: 350 },
  BOSS: { type: 'BOSS', health: 2000, speed: 2, color: '#dc2626', scale: [3, 5, 3], attackRange: 40, damage: 50, scoreValue: 5000 },
};

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  fogColor: string;
  groundColor: string;
  skyColor: string;
  enemyTypes: EnemyType[];
  enemyCount: number;
  gravity: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Moscow Mountains',
    description: 'High altitude snowy peaks. Visibility low.',
    fogColor: '#e2e8f0',
    groundColor: '#f8fafc',
    skyColor: '#cbd5e1',
    enemyTypes: ['GRUNT', 'SNIPER', 'DRONE'],
    enemyCount: 15,
    gravity: 9.8
  },
  {
    id: 2,
    name: 'London City',
    description: 'Urban combat in heavy rain.',
    fogColor: '#475569',
    groundColor: '#334155',
    skyColor: '#1e293b',
    enemyTypes: ['GRUNT', 'RUSHER', 'STEALTH', 'GRENADIER'],
    enemyCount: 20,
    gravity: 9.8
  },
  {
    id: 3,
    name: 'Hong Kong Peak',
    description: 'Night operations above the skyline.',
    fogColor: '#0f172a',
    groundColor: '#020617',
    skyColor: '#000000',
    enemyTypes: ['ELITE', 'HEAVY', 'TANK', 'BOSS'],
    enemyCount: 25,
    gravity: 9.8
  }
];
