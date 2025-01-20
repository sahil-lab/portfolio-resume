// src/App.js

import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import React, {
    useEffect, useMemo, useRef, useState
} from "react";
import * as THREE from "three";

// Import Logo Textures

// 4. Comet component representing individual comets with a glowing tail
const Comet = ({ position, direction, speed, size, color }) => {
    const cometRef = useRef();
    const trailRef = useRef();
    const [positions, setPositions] = useState([new THREE.Vector3(...position)]);
    const maxTrailLength = 20; // Number of points in the trail
  
    // Initialize the trail geometry
    const trailGeometry = useMemo(() => {
      const geometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(maxTrailLength * 3);
      geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
      return geometry;
    }, [maxTrailLength]);
  
    // Initialize the trail material
    const trailMaterial = useMemo(
      () =>
        new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7, // Increased opacity for better visibility
          linewidth: 2,
        }),
      [color]
    );
  
    useFrame((state, delta) => {
      if (cometRef.current) {
        // Update comet position
        cometRef.current.position.addScaledVector(direction, speed * delta);
  
        // Update trail positions
        const newPos = cometRef.current.position.clone();
        setPositions((prev) => {
          const updated = [newPos, ...prev];
          return updated.slice(0, maxTrailLength);
        });
  
        // Update trail geometry
        const posArray = trailGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
          posArray[i * 3] = positions[i].x;
          posArray[i * 3 + 1] = positions[i].y;
          posArray[i * 3 + 2] = positions[i].z;
        }
        trailGeometry.attributes.position.needsUpdate = true;
      }
    });
  
    return (
      <>
        {/* Comet Head */}
        <mesh ref={cometRef} position={position}>
          <sphereGeometry args={[size, 16, 16]} />
          <meshBasicMaterial color={color} emissiveColor={color} emissiveIntensity={1.5} />
        </mesh>
        {/* Comet Trail */}
        <line ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
      </>
    );
  };
  
  // 5. Comets component to manage multiple comets
  const Comets = () => {
    const [comets, setComets] = useState([]);
  
    // Control comet parameters
    const { cometCount, cometSpeed, cometSize, cometColor } = useControls({
      cometCount: { value: 5, min: 1, max: 20, step: 1 }, // Increased max count for more visibility
      cometSpeed: { value: 20, min: 5, max: 50, step: 1 },
      cometSize: { value: 0.8, min: 0.1, max: 2, step: 0.1 }, // Increased size for better visibility
      cometColor: { value: "#ffffff" }, // White comets
    });
  
    useEffect(() => {
      // Spawn comets at random intervals
      const interval = setInterval(() => {
        if (comets.length < cometCount) {
          const spawnPosition = [
            THREE.MathUtils.randFloatSpread(100), // Adjusted spawn range to intersect the camera's view
            THREE.MathUtils.randFloatSpread(100),
            THREE.MathUtils.randFloatSpread(100),
          ];
          const direction = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(1),
            THREE.MathUtils.randFloatSpread(1),
            THREE.MathUtils.randFloatSpread(1)
          ).normalize();
          setComets((prev) => [
            ...prev,
            {
              id: Date.now(),
              position: spawnPosition,
              direction: direction,
              speed: cometSpeed,
              size: cometSize,
              color: cometColor,
            },
          ]);
        }
      }, 2000); // Spawn every 2 seconds for increased frequency
  
      return () => clearInterval(interval);
    }, [comets, cometCount, cometSpeed, cometSize, cometColor]);
  
    // Remove comets that move out of bounds
    useFrame(() => {
      setComets((prev) =>
        prev.filter(
          (comet) =>
            comet.position[0] < 300 &&
            comet.position[0] > -300 &&
            comet.position[1] < 300 &&
            comet.position[1] > -300 &&
            comet.position[2] < 300 &&
            comet.position[2] > -300
        )
      );
    });
  
    return (
      <>
        {comets.map((comet) => (
          <Comet
            key={comet.id}
            position={comet.position}
            direction={comet.direction}
            speed={comet.speed}
            size={comet.size}
            color={comet.color}
          />
        ))}
      </>
    );
  };

  export  { Comet, Comets };