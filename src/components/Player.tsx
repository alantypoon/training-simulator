import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { Vector3, Euler } from 'three';
import { useGameStore, actions, gameStore } from '../store/gameStore';
import { soundManager } from '../game/SoundManager';
import { isMobile } from '../game/platform';
import { touchStore } from '../store/touchStore';

const SPEED = 5;
const JUMP_FORCE = 5;
const GRAVITY = 9.8;

// Touch look sensitivity (radians per pixel)
const TOUCH_LOOK_SENSITIVITY_X = 0.003;
const TOUCH_LOOK_SENSITIVITY_Y = 0.002;
const TOUCH_LOOK_PITCH_LIMIT = Math.PI / 2.5; // Limit vertical look

export function Player() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const velocity = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const viewDirection = useRef(new Vector3());
  const isJumping = useRef(false);
  
  const moveForward = useRef(false);
  const moveBackward = useRef(false);
  const moveLeft = useRef(false);
  const moveRight = useRef(false);
  const hasInitializedView = useRef(false);

  // Mobile camera euler angles
  const mobileYaw = useRef(0);   // horizontal rotation
  const mobilePitch = useRef(0); // vertical rotation

  const mobile = isMobile();
  const isGameRunning = useGameStore((state) => state.isGameRunning);

  useEffect(() => {
    if (hasInitializedView.current) return;

    camera.position.set(0, 2.4, 14);
    if (mobile) {
      // Set initial look direction (looking forward / -Z)
      camera.lookAt(0, 1.7, -34);
      // Extract yaw from the initial look-at direction
      const lookDir = new Vector3();
      camera.getWorldDirection(lookDir);
      mobileYaw.current = Math.atan2(lookDir.x, lookDir.z);
      mobilePitch.current = Math.asin(lookDir.y);
    } else {
      camera.lookAt(0, 1.7, -34);
    }
    hasInitializedView.current = true;
  }, [camera, mobile]);

  useEffect(() => {
    // Keyboard controls only on desktop
    if (mobile) return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': moveForward.current = true; break;
        case 'KeyA': moveLeft.current = true; break;
        case 'KeyS': moveBackward.current = true; break;
        case 'KeyD': moveRight.current = true; break;
        case 'KeyR':
          if (isGameRunning) {
            event.preventDefault();
            actions.reload();
          }
          break;
        case 'KeyP':
          if (document.pointerLockElement) {
            document.exitPointerLock();
            actions.stopGame();
          }
          break;
        case 'KeyM':
          actions.returnToMenu();
          break;
        case 'Space':
          if (!isJumping.current) {
            velocity.current.y = JUMP_FORCE;
            isJumping.current = true;
            soundManager.playJump();
          }
          break;
        case 'Digit1': actions.setWeapon('AK47'); break;
        case 'Digit2': actions.setWeapon('SMG'); break;
        case 'Digit3': actions.setWeapon('SNIPER'); break;
        case 'Digit4': actions.setWeapon('SHOTGUN'); break;
        case 'Digit5': actions.setWeapon('MINIGUN'); break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': moveForward.current = false; break;
        case 'KeyA': moveLeft.current = false; break;
        case 'KeyS': moveBackward.current = false; break;
        case 'KeyD': moveRight.current = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, [isGameRunning, mobile]);

  useFrame((state, delta) => {
    if (!isGameRunning) return;

    if (mobile) {
      // ======= MOBILE CONTROLS =======

      // --- Touch camera look ---
      const { dx, dy } = touchStore.consumeLookDelta();
      mobileYaw.current -= dx * TOUCH_LOOK_SENSITIVITY_X;
      mobilePitch.current -= dy * TOUCH_LOOK_SENSITIVITY_Y;
      // Clamp pitch to avoid flipping
      mobilePitch.current = Math.max(-TOUCH_LOOK_PITCH_LIMIT, Math.min(TOUCH_LOOK_PITCH_LIMIT, mobilePitch.current));

      // Apply rotation via Euler
      const euler = new Euler(mobilePitch.current, mobileYaw.current, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);

      // --- Touch jump ---
      if (touchStore.consumeJump() && !isJumping.current) {
        velocity.current.y = JUMP_FORCE;
        isJumping.current = true;
        soundManager.playJump();
      }

      // --- Touch reload ---
      if (touchStore.consumeReload()) {
        actions.reload();
      }

      // --- Joystick movement ---
      const moveSpeed = SPEED * delta;

      velocity.current.x -= velocity.current.x * 10.0 * delta;
      velocity.current.z -= velocity.current.z * 10.0 * delta;
      velocity.current.y -= GRAVITY * delta;

      const jx = touchStore.joystickX; // -1 (left) to 1 (right)
      const jy = touchStore.joystickY; // -1 (backward) to 1 (forward)

      if (touchStore.joystickActive && (Math.abs(jx) > 0.1 || Math.abs(jy) > 0.1)) {
        // Convert joystick to forward/right relative to camera yaw
        const sinYaw = Math.sin(mobileYaw.current);
        const cosYaw = Math.cos(mobileYaw.current);

        // Forward is along camera's -Z in world space (after yaw rotation)
        // Right is along camera's +X in world space
        const forwardX = sinYaw;
        const forwardZ = cosYaw;
        const rightX = cosYaw;
        const rightZ = -sinYaw;

        const moveX = (rightX * jx + forwardX * jy) * SPEED;
        const moveZ = (rightZ * jx + forwardZ * jy) * SPEED;

        camera.position.x += moveX * delta;
        camera.position.z += moveZ * delta;
      }

      // Gravity / jump
      camera.position.y += velocity.current.y * delta;

      if (camera.position.y < 1.6) {
        velocity.current.y = 0;
        camera.position.y = 1.6;
        isJumping.current = false;
      }

      // Update radar
      camera.getWorldDirection(viewDirection.current);
      const playerHeading = Math.atan2(viewDirection.current.x, viewDirection.current.z);
      actions.updatePlayerRadar(camera.position.x, camera.position.z, playerHeading);
    } else {
      // ======= DESKTOP CONTROLS =======
      const moveSpeed = SPEED * delta;
      
      velocity.current.x -= velocity.current.x * 10.0 * delta;
      velocity.current.z -= velocity.current.z * 10.0 * delta;
      velocity.current.y -= GRAVITY * delta;

      direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
      direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
      direction.current.normalize();

      if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * 400.0 * delta;
      if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * 400.0 * delta;

      controlsRef.current?.moveRight(-velocity.current.x * delta);
      controlsRef.current?.moveForward(-velocity.current.z * delta);

      camera.position.y += velocity.current.y * delta;

      if (camera.position.y < 1.6) {
        velocity.current.y = 0;
        camera.position.y = 1.6;
        isJumping.current = false;
      }

      camera.getWorldDirection(viewDirection.current);
      const playerHeading = Math.atan2(viewDirection.current.x, viewDirection.current.z);
      actions.updatePlayerRadar(camera.position.x, camera.position.z, playerHeading);
    }
  });

  // On mobile, we don't use PointerLockControls
  if (mobile) {
    return null;
  }

  return (
    <PointerLockControls 
      ref={controlsRef} 
      selector="#root" // Lock pointer to root div
      onUnlock={() => {
        if (gameStore.getState().isGameRunning) {
          actions.stopGame();
        }
      }}
      onLock={() => actions.startGame()}
    />
  );
}
