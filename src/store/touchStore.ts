/**
 * Touch input state store.
 * Manages all mobile touch control state that the Player, Weapon, and HUD components read from.
 */

type Listener = () => void;

class TouchStore {
  private listeners: Set<Listener> = new Set();

  // --- Joystick (movement) ---
  joystickX = 0; // -1 to 1 (left/right)
  joystickY = 0; // -1 to 1 (backward/forward)
  joystickActive = false;

  // --- Camera look ---
  lookDeltaX = 0; // pixels moved since last read
  lookDeltaY = 0;

  // --- Buttons ---
  isFiring = false;
  jumpRequested = false;
  reloadRequested = false;

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify() {
    this.listeners.forEach((l) => l());
  }

  setJoystick(x: number, y: number, active: boolean) {
    this.joystickX = x;
    this.joystickY = y;
    this.joystickActive = active;
  }

  addLookDelta(dx: number, dy: number) {
    this.lookDeltaX += dx;
    this.lookDeltaY += dy;
  }

  consumeLookDelta(): { dx: number; dy: number } {
    const dx = this.lookDeltaX;
    const dy = this.lookDeltaY;
    this.lookDeltaX = 0;
    this.lookDeltaY = 0;
    return { dx, dy };
  }

  setFiring(val: boolean) {
    this.isFiring = val;
    this.notify();
  }

  requestJump() {
    this.jumpRequested = true;
  }

  consumeJump(): boolean {
    if (this.jumpRequested) {
      this.jumpRequested = false;
      return true;
    }
    return false;
  }

  requestReload() {
    this.reloadRequested = true;
  }

  consumeReload(): boolean {
    if (this.reloadRequested) {
      this.reloadRequested = false;
      return true;
    }
    return false;
  }
}

export const touchStore = new TouchStore();
