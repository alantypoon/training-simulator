import { useGameStore, actions } from '../store/gameStore';
import { WEAPONS } from '../game/types';
import { useState, useEffect } from 'react';
import { isMobile } from '../game/platform';

const RADAR_SIZE = 160;
const RADAR_RANGE = 90;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCompassHeading(playerHeading: number) {
  const normalized = (playerHeading + Math.PI) % (Math.PI * 2);
  const index = Math.round(normalized / (Math.PI / 4)) % 8;
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][index];
}

export function HUD() {
  const { 
    health, maxHealth, ammo, maxAmmo, currentWeapon, 
    score, level, isGameRunning, message, difficulty, isStealthMode,
    volume, bossSpawned, bossHealth, bossMaxHealth, levelComplete,
    gameStartTime, henchmenRemaining, henchmenTotal, showCutscene, cutsceneStats, radar
  } = useGameStore();

  const weaponName = WEAPONS[currentWeapon].name;
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const mobile = isMobile();

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
  const radarCenter = RADAR_SIZE / 2;
  const compassHeading = getCompassHeading(radar.playerHeading);
  const radarContacts = radar.contacts.map((contact) => {
    const dx = contact.x - radar.playerX;
    const dz = contact.z - radar.playerZ;
    const sin = Math.sin(radar.playerHeading);
    const cos = Math.cos(radar.playerHeading);
    const localX = dx * cos - dz * sin;
    const localY = dx * sin + dz * cos;
    const scaledX = (localX / RADAR_RANGE) * (radarCenter - 16);
    const scaledY = (localY / RADAR_RANGE) * (radarCenter - 16);

    return {
      ...contact,
      x: clamp(radarCenter + scaledX, 12, RADAR_SIZE - 12),
      y: clamp(radarCenter - scaledY, 12, RADAR_SIZE - 12),
    };
  });

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
        {isGameRunning && !bossSpawned && (
          <div className="mt-2 bg-black/40 border border-white/20 rounded px-3 py-1.5">
            <p className="text-yellow-400 text-sm font-bold tracking-wide">
              HENCHMEN: <span className="text-white">{henchmenRemaining}</span> / {henchmenTotal}
            </p>
            <div className="w-full h-1.5 bg-black/60 rounded mt-1 overflow-hidden">
              <div
                className="h-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${((henchmenTotal - henchmenRemaining) / henchmenTotal) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Top Right: Volume Control */}
      <div className="absolute top-5 right-5 pointer-events-auto flex items-start gap-2">
        <button
          className="text-white bg-black/55 hover:bg-black/75 border border-yellow-400/30 rounded-lg px-3 py-2 text-xs font-bold tracking-[0.2em] transition-colors"
          onClick={() => {
            document.exitPointerLock();
            actions.stopGame();
          }}
          title="Pause"
        >
          PAUSE
        </button>
        <button
          className="text-white bg-black/55 hover:bg-black/75 border border-red-400/30 rounded-lg px-3 py-2 text-xs font-bold tracking-[0.2em] transition-colors"
          onClick={() => actions.returnToMenu()}
          title="Return to menu"
        >
          MENU
        </button>
        <button 
          className="text-white bg-black/40 hover:bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-lg transition-colors"
          onClick={() => setShowVolumeSlider(!showVolumeSlider)}
          title="Sound Volume"
        >
          {volumeIcon}
        </button>
        {showVolumeSlider && (
          <div className="mt-12 -ml-48 bg-black/80 border border-white/20 rounded-lg p-3 w-48 backdrop-blur-sm">
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

      {/* Bottom Right: Radar + Ammo */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-4 text-white">
        <div className="bg-black/55 border border-green-400/30 rounded-2xl p-3 backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-[0.3em] text-green-400">RADAR</span>
            <span className="text-[10px] text-white/60">{radar.contacts.length} HOSTILES</span>
          </div>
          <div className="mb-2 flex items-center justify-between text-[10px] tracking-[0.25em]">
            <span className="text-green-300/90">FACING {compassHeading}</span>
            <span className="text-white/45">FORWARD ↑</span>
          </div>
          <div
            className="relative rounded-full border border-green-400/40 bg-black/80 overflow-hidden"
            style={{ width: `${RADAR_SIZE}px`, height: `${RADAR_SIZE}px` }}
          >
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, rgba(0,0,0,0) 65%)',
            }} />
            <div className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-green-400/20" />
            <div className="absolute top-1/2 left-2 right-2 h-px -translate-y-1/2 bg-green-400/20" />
            <div className="absolute inset-5 rounded-full border border-green-400/20" />
            <div className="absolute inset-10 rounded-full border border-green-400/15" />
            <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-green-400/40 bg-black/85 px-2 py-0.5 text-[10px] font-bold tracking-[0.28em] text-green-300">
              {compassHeading}
            </div>
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2"
              style={{
                width: '0',
                height: '0',
                borderLeft: '16px solid transparent',
                borderRight: '16px solid transparent',
                borderBottom: '52px solid rgba(34, 197, 94, 0.09)',
                transform: 'translate(-50%, -100%)',
                filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.2))',
              }}
            />
            <div className="absolute left-1/2 top-[18px] h-[52px] w-px -translate-x-1/2 bg-gradient-to-b from-green-300/90 to-transparent" />
            <div className="absolute left-1/2 top-[14px] -translate-x-1/2 text-[9px] font-bold tracking-[0.3em] text-green-300/70">
              FORWARD
            </div>

            {radarContacts.map((contact) => (
              <div
                key={contact.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${contact.x}px`,
                  top: `${contact.y}px`,
                  width: contact.isBoss ? '12px' : '8px',
                  height: contact.isBoss ? '12px' : '8px',
                  backgroundColor: contact.isBoss ? '#f97316' : '#ef4444',
                  boxShadow: contact.isBoss
                    ? '0 0 12px rgba(249, 115, 22, 0.9)'
                    : '0 0 8px rgba(239, 68, 68, 0.8)',
                }}
              />
            ))}

            <div className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-300 shadow-[0_0_10px_rgba(134,239,172,0.95)]" />
            <div
              className="absolute left-1/2 top-1/2 origin-bottom -translate-x-1/2 -translate-y-full"
              style={{
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '14px solid rgba(134, 239, 172, 0.95)',
              }}
            />
          </div>
          <div className="mt-2 text-[10px] tracking-[0.25em] text-green-400/80 text-center">LONG RANGE SCAN</div>
        </div>

        <div className="text-right text-white">
          <div className="text-4xl font-bold text-yellow-400">
            {ammo} <span className="text-xl text-white">/ {maxAmmo}</span>
          </div>
          <div className="text-xl font-bold">{weaponName}</div>
          <div className="text-xs opacity-70 mt-1">{mobile ? 'TAP WEAPONS TO SWITCH' : 'KEYS [1-5] TO SWITCH'}</div>
        </div>
      </div>

      {/* Level Complete Cutscene / Bonus Screen */}
      {levelComplete && showCutscene && cutsceneStats && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-auto z-30">
          <div className="bg-gradient-to-b from-yellow-900/30 to-black/80 p-10 rounded-2xl border-2 border-yellow-500/60 text-center text-white max-w-lg w-full shadow-2xl">
            {/* Header */}
            <div className="mb-6">
              <p className="text-yellow-500 text-sm font-bold tracking-[0.4em] uppercase mb-2">Mission Complete</p>
              <h1 className="text-5xl font-bold text-yellow-400 drop-shadow-lg">LEVEL {level}</h1>
              <p className="text-lg opacity-70 mt-1">{cutsceneStats.levelName}</p>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent mb-6" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-bold tracking-wider">HENCHMEN KILLED</p>
                <p className="text-2xl font-bold">{cutsceneStats.henchmenKilled} <span className="text-sm opacity-50">/ {cutsceneStats.henchmenKilled}</span></p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-bold tracking-wider">BOSS</p>
                <p className="text-2xl font-bold text-red-400">DEFEATED ☠</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-bold tracking-wider">TIME</p>
                <p className="text-2xl font-bold">{Math.floor(cutsceneStats.timeElapsed / 60)}:{(cutsceneStats.timeElapsed % 60).toString().padStart(2, '0')}</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-yellow-400 font-bold tracking-wider">HEALTH</p>
                <p className="text-2xl font-bold text-green-400">{cutsceneStats.healthRemaining}%</p>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="opacity-60">Boss Bonus</span>
                <span className="text-yellow-400 font-bold">+5,000</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="opacity-60">Time & Health Bonus</span>
                <span className="text-yellow-400 font-bold">+{cutsceneStats.bonusPoints.toLocaleString()}</span>
              </div>
              <div className="w-full h-px bg-white/20 my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL SCORE</span>
                <span className="text-yellow-400">{cutsceneStats.score.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              {level < 3 ? (
                <button
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-lg"
                  onClick={() => {
                    actions.nextLevel();
                    if (!mobile) {
                      const canvas = document.querySelector('canvas');
                      if (canvas) canvas.requestPointerLock();
                    } else {
                      actions.startGame();
                    }
                  }}
                >
                  NEXT LEVEL →
                </button>
              ) : (
                <button
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-lg transition-colors text-lg"
                  onClick={() => {
                    actions.resetGame();
                    if (!mobile) {
                      const canvas = document.querySelector('canvas');
                      if (canvas) canvas.requestPointerLock();
                    } else {
                      actions.startGame();
                    }
                  }}
                >
                  🏆 PLAY AGAIN
                </button>
              )}
            </div>

            {level >= 3 && (
              <p className="text-yellow-500 text-sm mt-4 animate-pulse tracking-wider">★ ALL LEVELS COMPLETE ★</p>
            )}
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

            {mobile ? (
              <div className="space-y-2 text-sm opacity-70 mb-6 text-left bg-black/30 p-4 rounded">
                <p>🕹 LEFT STICK - Move</p>
                <p>👆 DRAG SCREEN - Look around</p>
                <p>🔴 FIRE button - Shoot</p>
                <p>⬆ JUMP button - Jump</p>
                <p>↻ RELOAD button - Reload</p>
                <p>🔫 WEAPON PANEL - Switch weapons</p>
                <p className="text-yellow-400 mt-2">⚠ Kill 10 henchmen to face the BOSS</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm opacity-70 mb-6 text-left bg-black/30 p-4 rounded">
                <p>WASD - Move</p>
                <p>SPACE - Jump</p>
                <p>LMB - Fire</p>
                <p>R - Reload</p>
                <p>P - Pause</p>
                <p>M - Return to Menu</p>
                <p>1-5 - Switch Weapons</p>
                <p className="text-yellow-400 mt-2">⚠ Kill 10 henchmen to face the BOSS</p>
              </div>
            )}

            <button 
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded transition-colors"
              onClick={() => {
                if (mobile) {
                  // On mobile, request fullscreen and just start the game
                  try {
                    const root = document.documentElement;
                    if (root.requestFullscreen) {
                      root.requestFullscreen().catch(() => {});
                    } else if ((root as any).webkitRequestFullscreen) {
                      (root as any).webkitRequestFullscreen();
                    }
                  } catch (_) {}
                  if (health <= 0) {
                    actions.resetGame();
                  }
                  actions.startGame();
                } else {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    canvas.requestPointerLock();
                    if (health <= 0) {
                      actions.resetGame();
                    }
                    actions.startGame();
                  }
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
