

type Listener = () => void;

class Store<T> {
  private state: T;
  private listeners: Set<Listener> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState = () => this.state;

  setState = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    const nextState = typeof partial === 'function' ? (partial as any)(this.state) : partial;
    this.state = { ...this.state, ...nextState };
    this.listeners.forEach(listener => listener());
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
}

// React hook for the store
import { useSyncExternalStore } from 'react';

export function useStore<T>(store: Store<T>, selector: (state: T) => any = (s) => s) {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

// Game State Definition
import { WeaponType, LEVELS } from '../game/types';
import { isMobile } from '../game/platform';

interface CutsceneStats {
  levelName: string;
  score: number;
  henchmenKilled: number;
  timeElapsed: number;
  healthRemaining: number;
  bonusPoints: number;
}

interface RadarContact {
  id: string;
  x: number;
  z: number;
  isBoss: boolean;
}

interface RadarState {
  playerX: number;
  playerZ: number;
  playerHeading: number;
  contacts: RadarContact[];
}

interface GameState {
  isGameRunning: boolean;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  currentWeapon: WeaponType;
  score: number;
  level: number;
  enemiesKilled: number;
  isMalfunctioning: boolean;
  message: string | null;
  difficulty: number;
  isStealthMode: boolean;
  gameResetCount: number;
  volume: number;
  bossSpawned: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  levelComplete: boolean;
  gameStartTime: number;
  henchmenRemaining: number;
  henchmenTotal: number;
  showCutscene: boolean;
  cutsceneStats: CutsceneStats | null;
  radar: RadarState;
}

export const gameStore = new Store<GameState>({
  isGameRunning: false,
  health: 100,
  maxHealth: 100,
  ammo: 30,
  maxAmmo: 30,
  currentWeapon: 'AK47',
  score: 0,
  level: 1,
  enemiesKilled: 0,
  isMalfunctioning: false,
  message: 'PRESS CLICK TO START',
  difficulty: 1,
  isStealthMode: false,
  gameResetCount: 0,
  volume: 0.3,
  bossSpawned: false,
  bossHealth: 2000,
  bossMaxHealth: 2000,
  levelComplete: false,
  gameStartTime: 0,
  henchmenRemaining: 10,
  henchmenTotal: 10,
  showCutscene: false,
  cutsceneStats: null,
  radar: {
    playerX: 0,
    playerZ: 0,
    playerHeading: 0,
    contacts: [],
  },
});

export const useGameStore = (selector?: (state: GameState) => any) => useStore(gameStore, selector);

// Actions
import { soundManager } from '../game/SoundManager';

const resetGame = () => {
  soundManager.stopAll();
  const { gameResetCount } = gameStore.getState();
  gameStore.setState({
    health: 100,
    ammo: 30,
    score: 0,
    level: 1,
    enemiesKilled: 0,
    isGameRunning: true,
    message: null,
    gameResetCount: gameResetCount + 1,
    bossSpawned: false,
    bossHealth: 2000,
    bossMaxHealth: 2000,
    levelComplete: false,
    gameStartTime: Date.now(),
    henchmenRemaining: 10,
    henchmenTotal: 10,
    showCutscene: false,
    cutsceneStats: null,
    radar: {
      playerX: 0,
      playerZ: 0,
      playerHeading: 0,
      contacts: [],
    },
  });
};

export const actions = {
  setDifficulty: (val: number) => gameStore.setState({ difficulty: val }),
  toggleStealthMode: () => {
    const { isStealthMode } = gameStore.getState();
    gameStore.setState({ isStealthMode: !isStealthMode });
  },
  startGame: () => {
    const { gameStartTime } = gameStore.getState();
    gameStore.setState({ isGameRunning: true, message: null, gameStartTime: gameStartTime || Date.now() });
    soundManager.playBGM();
  },
  resetGame,
  stopGame: () => {
    gameStore.setState({ isGameRunning: false, message: 'PAUSED' });
    soundManager.stopBGM();
  },
  returnToMenu: () => {
    soundManager.stopAll();
    const { gameResetCount } = gameStore.getState();
    gameStore.setState({
      isGameRunning: false,
      health: 100,
      ammo: 30,
      score: 0,
      level: 1,
      enemiesKilled: 0,
      message: isMobile() ? 'TAP TO START' : 'PRESS CLICK TO START',
      bossSpawned: false,
      bossHealth: 2000,
      bossMaxHealth: 2000,
      levelComplete: false,
      gameStartTime: 0,
      henchmenRemaining: 10,
      henchmenTotal: 10,
      showCutscene: false,
      cutsceneStats: null,
      gameResetCount: gameResetCount + 1,
      radar: {
        playerX: 0,
        playerZ: 0,
        playerHeading: 0,
        contacts: [],
      },
    });
    document.exitPointerLock();
  },
  takeDamage: (amount: number) => {
    const { health, isStealthMode } = gameStore.getState();
    if (isStealthMode) return; // Immortal in stealth mode
    
    const newHealth = Math.max(0, health - amount);
    gameStore.setState({ health: newHealth });
    if (newHealth <= 0) {
      gameStore.setState({ isGameRunning: false, message: 'GAME OVER' });
      document.exitPointerLock();
    }
  },
  shoot: () => {
    const { ammo } = gameStore.getState();
    if (ammo > 0) {
      gameStore.setState({ ammo: ammo - 1 });
      return true;
    }
    return false;
  },
  reload: () => {
    const { maxAmmo } = gameStore.getState();
    gameStore.setState({ ammo: maxAmmo, isMalfunctioning: false });
  },
  setWeapon: (weapon: WeaponType) => gameStore.setState({ currentWeapon: weapon }),
  addScore: (points: number) => {
    const { score, enemiesKilled, henchmenRemaining } = gameStore.getState();
    const newKilled = enemiesKilled + 1;
    const newHenchmenRemaining = Math.max(0, henchmenRemaining - 1);

    gameStore.setState({ 
      score: score + points, 
      enemiesKilled: newKilled,
      henchmenRemaining: newHenchmenRemaining,
    });

    // When all henchmen killed, spawn boss
    if (newHenchmenRemaining <= 0) {
      actions.spawnBoss();
    }
  },
  setMessage: (msg: string) => gameStore.setState({ message: msg }),
  setVolume: (val: number) => {
    soundManager.setVolume(val);
    gameStore.setState({ volume: val });
  },
  spawnBoss: () => {
    const { bossSpawned } = gameStore.getState();
    if (!bossSpawned) {
      gameStore.setState({ bossSpawned: true, bossHealth: 2000, bossMaxHealth: 2000 });
    }
  },
  damageBoss: (amount: number) => {
    const { bossHealth, score, henchmenTotal, gameStartTime, health, level } = gameStore.getState();
    const newHealth = Math.max(0, bossHealth - amount);
    gameStore.setState({ bossHealth: newHealth });
    if (newHealth <= 0) {
      const timeElapsed = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
      const timeBonus = Math.max(0, 300 - timeElapsed) * 10;
      const healthBonus = Math.floor(health) * 20;
      const bonusPoints = timeBonus + healthBonus;
      const levelNames = ['', 'Moscow Mountains', 'London City', 'Hong Kong Peak'];

      gameStore.setState({
        levelComplete: true,
        isGameRunning: false,
        message: 'LEVEL COMPLETE!',
        score: score + 5000 + bonusPoints,
        showCutscene: true,
        cutsceneStats: {
          levelName: levelNames[level] || `Level ${level}`,
          score: score + 5000 + bonusPoints,
          henchmenKilled: henchmenTotal,
          timeElapsed,
          healthRemaining: Math.floor(health),
          bonusPoints,
        },
      });
      document.exitPointerLock();
      soundManager.stopAll();
    }
  },
  nextLevel: () => {
    soundManager.stopAll();
    const { level, score, gameResetCount } = gameStore.getState();
    const nextLvl = level < 3 ? level + 1 : 1;
    gameStore.setState({
      health: 100,
      ammo: 30,
      level: nextLvl,
      enemiesKilled: 0,
      isGameRunning: true,
      message: null,
      gameResetCount: gameResetCount + 1,
      bossSpawned: false,
      bossHealth: 2000,
      bossMaxHealth: 2000,
      levelComplete: false,
      gameStartTime: Date.now(),
      henchmenRemaining: 10,
      henchmenTotal: 10,
      showCutscene: false,
      cutsceneStats: null,
      score,
      radar: {
        playerX: 0,
        playerZ: 0,
        playerHeading: 0,
        contacts: [],
      },
    });
  },
  dismissCutscene: () => {
    gameStore.setState({ showCutscene: false });
  },
  updatePlayerRadar: (x: number, z: number, playerHeading: number) => {
    const { radar } = gameStore.getState();
    gameStore.setState({
      radar: {
        ...radar,
        playerX: x,
        playerZ: z,
        playerHeading,
      },
    });
  },
  upsertRadarContact: (id: string, x: number, z: number, isBoss: boolean) => {
    const { radar } = gameStore.getState();
    const existingIndex = radar.contacts.findIndex((contact) => contact.id === id);
    const nextContacts = [...radar.contacts];

    if (existingIndex >= 0) {
      nextContacts[existingIndex] = { id, x, z, isBoss };
    } else {
      nextContacts.push({ id, x, z, isBoss });
    }

    gameStore.setState({
      radar: {
        ...radar,
        contacts: nextContacts,
      },
    });
  },
  removeRadarContact: (id: string) => {
    const { radar } = gameStore.getState();
    gameStore.setState({
      radar: {
        ...radar,
        contacts: radar.contacts.filter((contact) => contact.id !== id),
      },
    });
  },
};
