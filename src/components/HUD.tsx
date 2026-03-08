import { useGameStore, actions } from '../store/gameStore';
import { WEAPONS } from '../game/types';
import { useState, useEffect } from 'react';

export function HUD() {
  const { 
    health, maxHealth, ammo, maxAmmo, currentWeapon, 
    score, level, isGameRunning, message, difficulty, isStealthMode,
    volume, bossSpawned, bossHealth, bossMaxHealth, levelComplete, gameStartTime
  } = useGameStore();

  const weaponName = WEAPONS[currentWeapon].name;
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Timer
  useEffect(() => {
    if (!isGameRunning || !gameStartTime) return;
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - gameStartTime) / 1000));
    }, 250);
    return () => clearInterval(timer);
  }, [isGameRunning, gameStartTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  // Volume icon based on level
  const volumeIcon = volume === 0 ? '🔇' : volume < 0.35 ? '🔈' : volume < 0.7 ? '🔉' : '🔊';

  return (
    <div className="absolute inset-0 pointer-events-none select-none font-mono">
      {/* Crosshair */}
      {isGameRunning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-6 h-6 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400 opacity-80" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-400 opacity-80" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400 opacity-80" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-400 opacity-80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full border border-green-400 opacity-60" />
          </div>
        </div>
      )}

      {/* Damage Vignette */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          boxShadow: `inset 0 0 100px rgba(255, 0, 0, ${1 - health / maxHealth})`,
          pointerEvents: 'none'
        }}
      />

      {/* Top Left: Level Info + Timer */}
      <div className="absolute top-5 left-5 text-white drop-shadow-md">
        <h1 className="text-2xl font-bold">LEVEL {level}</h1>
        <p className="text-sm opacity-80">SCORE: {score}</p>
        {isGameRunning && <p className="text-sm opacity-60 mt-1">TIME: {timeStr}</p>}
        {isGameRunning && elapsed < 30 && !bossSpawned && (
          <p className="text-xs opacity-50 mt-1 text-yellow-400">BOSS IN: {30 - elapsed}s</p>
        )}
      </div>

      {/* Top Right: Volume Control */}
      <div className="absolute top-5 right-5 pointer-events-auto">
        <button 
          className="text-white bg-black/40 hover:bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-lg transition-colors"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          title="Sound Volume"
        >
          {volumeIcon}
        </button>
        {showVolumeSlider && (
          <div className="mt-2 bg-black/80 border border-white/20 rounded-lg p-3 w-48 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-xs font-bold">VOLUME</span>
              <span className="text-yellow-400 text-xs font-bold">{Math.round(volume * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={Math.round(volume * 100)}
              className="w-full accent-yellow-400 cursor-pointer"
              onChange={(e) => actions.setVolume(parseInt(e.target.value) / 100)}
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>MUTE</span>
              <span>MAX</span>
            </div>
          </div>
        )}
      </div>

      {/* Boss Health Bar - large prominent gauge */}
      {isGameRunning && bossSpawned && bossHealth > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] max-w-[80vw]">
          <div className="text-center mb-1">
            <span className="text-red-500 font-bold text-lg tracking-widest drop-shadow-lg animate-pulse">
              ☠ LEVEL BOSS ☠
            </span>
          </div>
          <div className="w-full h-6 bg-black/70 border-2 border-red-600 rounded overflow-hidden relative">
            <div 
              className="h-full transition-all duration-300 relative"
              style={{
                width: `${(bossHealth / bossMaxHealth) * 100}%`,
                background: 'linear-gradient(to right, #dc2626, #ef4444, #f97316)',
              }}
            >
              {/* Animated shine */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                animation: 'shimmer 2s infinite',
              }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-bold drop-shadow-md">
                {bossHealth} / {bossMaxHealth}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Boss warning flash */}
      {isGameRunning && message && message.includes('BOSS') && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="text-red-500 text-4xl font-bold animate-pulse tracking-widest drop-shadow-lg">
            {message}
          </div>
        </div>
      )}

      {/* Bottom Left: Health */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2">
        <div className="w-64 h-6 bg-black/50 border-2 border-white rounded overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${(health / maxHealth) * 100}%` }}
          />
        </div>
        <span className="text-white font-bold">UNIT INTEGRITY</span>
      </div>

      {/* Bottom Right: Ammo & Weapon */}
      <div className="absolute bottom-5 right-5 text-right text-white">
        <div className="text-4xl font-bold text-yellow-400">
          {ammo} <span className="text-xl text-white">/ {maxAmmo}</span>
        </div>
        <div className="text-xl font-bold">{weaponName}</div>
        <div className="text-xs opacity-70 mt-1">KEYS [1-5] TO SWITCH</div>
      </div>

      {/* Level Complete Overlay */}
      {levelComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto z-30">
          <div className="bg-white/10 p-10 rounded-2xl border border-yellow-400/40 text-center text-white max-w-md w-full">
            <h1 className="text-5xl font-bold mb-4 text-yellow-400">LEVEL COMPLETE!</h1>
            <p className="text-2xl mb-2">☠ BOSS DEFEATED ☠</p>
            <p className="text-lg mb-6 opacity-80">Score: <span className="text-yellow-400 font-bold">{score}</span></p>
            <p className="text-sm mb-6 opacity-60">Time: {timeStr}</p>
            <button 
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded transition-colors"
              onClick={() => {
                actions.resetGame();
                const canvas = document.querySelector('canvas');
                if (canvas) canvas.requestPointerLock();
              }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Center Message / Menu */}
      {!isGameRunning && !levelComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white/10 p-10 rounded-2xl border border-white/20 text-center text-white max-w-md w-full">
            <h1 className="text-4xl font-bold mb-4 text-yellow-400">TRAINING SIMULATOR</h1>
            <p className="mb-6 opacity-80">
              {message || "Enemies will engage on sight. Stay alert."}
            </p>
            
            {/* Difficulty Selector */}
            <div className="mb-6 bg-black/30 p-4 rounded">
              <label className="block text-sm font-bold mb-2 text-yellow-400">DIFFICULTY: {difficulty}</label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={difficulty}
                className="w-full accent-yellow-400 cursor-pointer"
                onChange={(e) => actions.setDifficulty(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs opacity-50 mt-1">
                <span>EASY</span>
                <span>HARDCORE</span>
              </div>
            </div>

            {/* Volume Control in Menu */}
            <div className="mb-6 bg-black/30 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-yellow-400">VOLUME: {Math.round(volume * 100)}%</label>
                <span className="text-lg">{volumeIcon}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={Math.round(volume * 100)}
                className="w-full accent-yellow-400 cursor-pointer"
                onChange={(e) => actions.setVolume(parseInt(e.target.value) / 100)}
              />
            </div>

            {/* Stealth Mode Toggle */}
            <div className="mb-6 bg-black/30 p-4 rounded flex items-center justify-between">
              <label className="text-sm font-bold text-yellow-400">STEALTH MODE (IMMORTAL)</label>
              <button 
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isStealthMode ? 'bg-green-500' : 'bg-gray-600'}`}
                onClick={() => actions.toggleStealthMode()}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isStealthMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="space-y-2 text-sm opacity-70 mb-6 text-left bg-black/30 p-4 rounded">
              <p>WASD - Move</p>
              <p>SPACE - Jump</p>
              <p>LMB - Fire</p>
              <p>1-5 - Switch Weapons</p>
              <p className="text-yellow-400 mt-2">⚠ BOSS spawns at 0:30</p>
            </div>

            <button 
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded transition-colors"
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    canvas.requestPointerLock();
                    if (health <= 0) {
                        actions.resetGame();
                    }
                    actions.startGame();
                }
              }}
            >
              {health <= 0 ? "RESTART MISSION" : "ENTER SIMULATION"}
            </button>
          </div>
        </div>
      )}

      {/* CSS animation for boss health bar */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
