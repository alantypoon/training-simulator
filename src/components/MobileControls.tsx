import { useRef, useCallback, useEffect, useState } from 'react';
import { touchStore } from '../store/touchStore';
import { actions, useGameStore } from '../store/gameStore';
import { WeaponType } from '../game/types';

const JOYSTICK_SIZE = 140;
const JOYSTICK_KNOB = 56;
const JOYSTICK_MAX_DIST = (JOYSTICK_SIZE - JOYSTICK_KNOB) / 2;

const WEAPON_LIST: WeaponType[] = ['AK47', 'SMG', 'SNIPER', 'SHOTGUN', 'MINIGUN'];
const WEAPON_LABELS: Record<WeaponType, string> = {
  AK47: 'AK',
  SMG: 'SMG',
  SNIPER: 'SNP',
  SHOTGUN: 'SHG',
  MINIGUN: 'MNG',
};

export function MobileControls() {
  const isGameRunning = useGameStore((state) => state.isGameRunning);
  const currentWeapon = useGameStore((state) => state.currentWeapon);
  const ammo = useGameStore((state) => state.ammo);

  // --- Joystick state ---
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  // --- Look touch state ---
  const lookTouchId = useRef<number | null>(null);
  const lookLastPos = useRef({ x: 0, y: 0 });

  // --- Fire button state ---
  const fireTouchId = useRef<number | null>(null);

  // Prevent default touch behaviors on the entire page
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      // Allow touch on UI buttons but prevent scrolling/zoom
      e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, []);

  // ========================
  // JOYSTICK handlers
  // ========================
  const handleJoystickStart = useCallback((e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchId.current = touch.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    joystickCenter.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    updateJoystick(touch.clientX, touch.clientY);
  }, []);

  const handleJoystickMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        updateJoystick(touch.clientX, touch.clientY);
      }
    }
  }, []);

  const handleJoystickEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchId.current) {
        joystickTouchId.current = null;
        touchStore.setJoystick(0, 0, false);
        setKnobOffset({ x: 0, y: 0 });
      }
    }
  }, []);

  function updateJoystick(clientX: number, clientY: number) {
    let dx = clientX - joystickCenter.current.x;
    let dy = clientY - joystickCenter.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > JOYSTICK_MAX_DIST) {
      dx = (dx / dist) * JOYSTICK_MAX_DIST;
      dy = (dy / dist) * JOYSTICK_MAX_DIST;
    }
    setKnobOffset({ x: dx, y: dy });
    // Normalize to -1..1 range; Y is inverted (up = forward = positive)
    touchStore.setJoystick(dx / JOYSTICK_MAX_DIST, -dy / JOYSTICK_MAX_DIST, true);
  }

  // ========================
  // LOOK (camera) handlers — touch anywhere on the right half of screen
  // ========================
  const handleLookArea = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Ignore if this touch is already assigned to joystick or fire
      if (
        touch.identifier === joystickTouchId.current ||
        touch.identifier === fireTouchId.current
      ) continue;

      if (lookTouchId.current === null) {
        lookTouchId.current = touch.identifier;
        lookLastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleLookMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === lookTouchId.current) {
        const dx = touch.clientX - lookLastPos.current.x;
        const dy = touch.clientY - lookLastPos.current.y;
        touchStore.addLookDelta(dx, dy);
        lookLastPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, []);

  const handleLookEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookTouchId.current) {
        lookTouchId.current = null;
      }
    }
  }, []);

  // ========================
  // FIRE button handlers
  // ========================
  const handleFireStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    fireTouchId.current = e.changedTouches[0].identifier;
    touchStore.setFiring(true);
  }, []);

  const handleFireEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === fireTouchId.current) {
        fireTouchId.current = null;
        touchStore.setFiring(false);
      }
    }
  }, []);

  if (!isGameRunning) return null;

  return (
    <div
      className="absolute inset-0 z-20 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* ========== LOOK AREA — full screen underlay ========== */}
      <div
        className="absolute inset-0"
        onTouchStart={handleLookArea}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookEnd}
      />

      {/* ========== JOYSTICK (bottom left) ========== */}
      <div
        ref={joystickRef}
        className="absolute"
        style={{
          bottom: 32,
          left: 24,
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)',
          border: '2px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
        }}
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
      >
        {/* Direction indicators */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-bold">W</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/20 text-[10px] font-bold">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-bold">A</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-bold">D</div>

        {/* Knob */}
        <div
          className="absolute"
          style={{
            width: JOYSTICK_KNOB,
            height: JOYSTICK_KNOB,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(250,204,21,0.20) 100%)',
            border: '2px solid rgba(250,204,21,0.6)',
            boxShadow: '0 0 16px rgba(250,204,21,0.3)',
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))`,
            transition: knobOffset.x === 0 && knobOffset.y === 0 ? 'transform 0.15s ease-out' : 'none',
          }}
        />
      </div>

      {/* ========== FIRE BUTTON (bottom right) ========== */}
      <div
        className="absolute"
        style={{
          bottom: 48,
          right: 32,
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.65) 0%, rgba(239,68,68,0.25) 100%)',
          border: '3px solid rgba(239,68,68,0.7)',
          boxShadow: '0 0 24px rgba(239,68,68,0.3), inset 0 0 20px rgba(239,68,68,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onTouchStart={handleFireStart}
        onTouchEnd={handleFireEnd}
        onTouchCancel={handleFireEnd}
      >
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,100,100,0.9) 0%, rgba(200,50,50,0.7) 100%)',
          boxShadow: '0 0 12px rgba(239,68,68,0.5)',
        }} />
        <span className="absolute bottom-[-20px] text-[10px] font-bold text-red-400/80 tracking-[0.2em]">FIRE</span>
      </div>

      {/* ========== JUMP BUTTON ========== */}
      <div
        className="absolute"
        style={{
          bottom: 165,
          right: 36,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          border: '2px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          touchStore.requestJump();
        }}
      >
        <span className="text-white/70 text-lg font-bold">⬆</span>
        <span className="absolute bottom-[-16px] text-[9px] font-bold text-white/40 tracking-[0.15em]">JUMP</span>
      </div>

      {/* ========== RELOAD BUTTON ========== */}
      <div
        className="absolute"
        style={{
          bottom: 165,
          right: 110,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: ammo === 0 ? 'rgba(250,204,21,0.15)' : 'rgba(255,255,255,0.08)',
          border: `2px solid ${ammo === 0 ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.2)'}`,
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: ammo === 0 ? 'pulse 1.5s infinite' : 'none',
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          touchStore.requestReload();
        }}
      >
        <span className="text-white/70 text-lg font-bold">↻</span>
        <span className="absolute bottom-[-16px] text-[9px] font-bold text-white/40 tracking-[0.15em]">RELOAD</span>
      </div>

      {/* ========== WEAPON SWITCHER (left side, above joystick) ========== */}
      <div
        className="absolute flex flex-col gap-1.5"
        style={{
          bottom: JOYSTICK_SIZE + 56,
          left: 16,
        }}
      >
        {WEAPON_LIST.map((w, i) => (
          <div
            key={w}
            className="pointer-events-auto"
            style={{
              width: 52,
              height: 34,
              borderRadius: 8,
              background: currentWeapon === w
                ? 'rgba(250,204,21,0.25)'
                : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${currentWeapon === w ? 'rgba(250,204,21,0.6)' : 'rgba(255,255,255,0.12)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backdropFilter: 'blur(2px)',
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              actions.setWeapon(w);
            }}
          >
            <span style={{
              color: currentWeapon === w ? '#facc15' : 'rgba(255,255,255,0.45)',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}>
              {i + 1}
            </span>
            <span style={{
              color: currentWeapon === w ? '#facc15' : 'rgba(255,255,255,0.5)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}>
              {WEAPON_LABELS[w]}
            </span>
          </div>
        ))}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
