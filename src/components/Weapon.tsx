import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame, createPortal } from '@react-three/fiber';
import { Vector3, Raycaster, Mesh, Group, Scene, Vector2 } from 'three';
import { useGameStore, actions } from '../store/gameStore';
import { WEAPONS, WeaponType } from '../game/types';
import { soundManager } from '../game/SoundManager';

export function Weapon() {
  const { camera, scene } = useThree();
  const weaponGroup = useRef<Group>(null);
  const flashRef = useRef<Mesh>(null);
  const currentWeaponType = useGameStore((state) => state.currentWeapon);
  const isGameRunning = useGameStore((state) => state.isGameRunning);
  const weaponStats = WEAPONS[currentWeaponType];
  
  const [isFiring, setIsFiring] = useState(false);
  const lastFireTime = useRef(0);
  const raycaster = useRef(new Raycaster());

  // We use a separate scene for the weapon to prevent clipping, 
  // but for simplicity here we just attach to camera.
  // Actually, createPortal to camera is tricky because camera is not a scene.
  // We will just position it relative to camera every frame or add it to camera.
  // Adding to camera is better.

  useEffect(() => {
    if (weaponGroup.current) {
      camera.add(weaponGroup.current);
    }
    return () => {
      if (weaponGroup.current) {
        camera.remove(weaponGroup.current);
      }
    };
  }, [camera]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && isGameRunning) setIsFiring(true);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) setIsFiring(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isGameRunning]);

  useFrame((state) => {
    if (!weaponGroup.current) return;

    // Weapon Sway
    const time = state.clock.getElapsedTime();
    // We need to reset position relative to camera
    // Since it's a child of camera, 0,0,0 is camera position.
    // We want it at 0.3, -0.3, -0.5 relative to camera.
    
    const swayX = Math.cos(time * 1.5) * 0.005;
    const swayY = Math.sin(time * 2) * 0.005;

    weaponGroup.current.position.set(0.3 + swayX, -0.3 + swayY, -0.5);

    // Firing Logic
    if (isFiring && isGameRunning) {
      const now = performance.now();
      if (now - lastFireTime.current > weaponStats.fireRate) {
        if (actions.shoot()) {
          lastFireTime.current = now;
          fireWeapon();
        }
      }
    }
  });

  const fireWeapon = () => {
    soundManager.playShoot(currentWeaponType === 'SNIPER' ? 'sniper' : currentWeaponType === 'SMG' ? 'smg' : 'rifle');

    if (flashRef.current) {
      flashRef.current.visible = true;
      setTimeout(() => {
        if (flashRef.current) flashRef.current.visible = false;
      }, 50);
    }

    if (weaponGroup.current) {
      weaponGroup.current.position.z += 0.1;
      setTimeout(() => {
        if (weaponGroup.current) weaponGroup.current.position.z -= 0.1;
      }, 50);
    }

    // Raycast from camera center
    raycaster.current.setFromCamera(new Vector2(0, 0), camera);
    
    // Intersect with scene children (enemies)
    // We need to filter out the weapon itself and the player (if any)
    // Since weapon is child of camera, and camera is not in scene.children usually (unless added), 
    // we should be fine intersecting scene.children.
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      if (intersects[i].distance > weaponStats.range) continue;

      let target: any = obj;
      // Traverse up to find userData.hit
      while (target) {
        if (target.userData && target.userData.hit) {
          target.userData.hit(weaponStats.damage);
          return; // Hit first valid target
        }
        target = target.parent;
      }
    }
  };

  const WeaponModel = ({ type }: { type: WeaponType }) => {
      switch (type) {
        case 'SNIPER':
            return (
            <group>
                <mesh position={[0, 0, 0.2]}>
                <boxGeometry args={[0.05, 0.1, 0.8]} />
                <meshStandardMaterial color="#111" />
                </mesh>
                <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.01, 0.01, 0.3, 8]} />
                <meshStandardMaterial color="#333" />
                </mesh>
            </group>
            );
        case 'SMG':
            return (
            <group>
                <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.06, 0.1, 0.4]} />
                <meshStandardMaterial color="#333" />
                </mesh>
            </group>
            );
        case 'MINIGUN':
            return (
            <group>
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
                <meshStandardMaterial color="#222" />
                </mesh>
            </group>
            );
        case 'SHOTGUN':
             return (
            <group>
                <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.08, 0.12, 0.5]} />
                <meshStandardMaterial color="#444" />
                </mesh>
                 <mesh position={[0, 0.05, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
                <meshStandardMaterial color="#111" />
                </mesh>
            </group>
            );
        default: // AK47
            return (
            <group>
                <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.08, 0.12, 0.6]} />
                <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[0, 0.08, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
                <meshStandardMaterial color="#111" />
                </mesh>
            </group>
            );
        }
  };

  return (
    <group ref={weaponGroup}>
       <WeaponModel type={currentWeaponType} />
       <mesh ref={flashRef} position={[0, 0.05, -0.6]} visible={false}>
         <sphereGeometry args={[0.05, 8, 8]} />
         <meshBasicMaterial color="#ffcc00" />
       </mesh>
    </group>
  );
}

