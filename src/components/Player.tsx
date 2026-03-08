import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { useGameStore, actions, gameStore } from '../store/gameStore';
import { soundManager } from '../game/SoundManager';

const SPEED = 5;
const JUMP_FORCE = 5;
const GRAVITY = 9.8;

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

  const isGameRunning = useGameStore((state) => state.isGameRunning);

  useEffect(() => {
    if (hasInitializedView.current) return;

    camera.position.set(0, 2.4, 14);
    camera.lookAt(0, 1.7, -34);
    hasInitializedView.current = true;
  }, [camera]);

  useEffect(() => {
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
  }, [isGameRunning]);

  useFrame((state, delta) => {
    if (!isGameRunning) return;

    // Movement logic
    const moveSpeed = SPEED * delta;
    
    velocity.current.x -= velocity.current.x * 10.0 * delta;
    velocity.current.z -= velocity.current.z * 10.0 * delta;
    velocity.current.y -= GRAVITY * delta;

    direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
    direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
    direction.current.normalize();

    if (moveForward.current || moveBackward.current) velocity.current.z -= direction.current.z * 400.0 * delta;
    if (moveLeft.current || moveRight.current) velocity.current.x -= direction.current.x * 400.0 * delta;

    controlsRef.current.moveRight(-velocity.current.x * delta);
    controlsRef.current.moveForward(-velocity.current.z * delta);

    camera.position.y += velocity.current.y * delta;

    if (camera.position.y < 1.6) {
      velocity.current.y = 0;
      camera.position.y = 1.6;
      isJumping.current = false;
    }

    camera.getWorldDirection(viewDirection.current);
    const playerHeading = Math.atan2(viewDirection.current.x, viewDirection.current.z);
    actions.updatePlayerRadar(camera.position.x, camera.position.z, playerHeading);
  });

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
