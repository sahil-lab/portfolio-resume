/* ------------------------------- Fixed Main Planets ------------------------------ */
// src/App.js

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { CustomOutlines } from "../App"; // Ensure the path to App.js is correct

// Import Logo Textures
/* ------------------------------- Shader Materials (Continued) ------------------------------- */

// 17. FixedMainPlanets component to render three main planets: Purple, Blue, Green
const FixedMainPlanets = () => {
  // Define fixed positions for the main planets
  const mainPlanets = [
    {
      name: "PurplePlanet",
      position: [200, 0, 0],
      size: 8,
      color: new THREE.Color("#800080"), // Purple
      glowColor: new THREE.Color("#d070d0"), // Lighter purple for glow
    },
    {
      name: "BluePlanet",
      position: [-200, 0, 0],
      size: 8,
      color: new THREE.Color("#0000ff"), // Blue
      glowColor: new THREE.Color("#70a0ff"), // Lighter blue for glow
    },
    {
      name: "GreenPlanet",
      position: [0, 200, 0],
      size: 8,
      color: new THREE.Color("#00ff00"), // Green
      glowColor: new THREE.Color("#80ff80"), // Lighter green for glow
    },
  ];

  // Create refs for each planet to update time uniform
  const planetRefs = useRef(mainPlanets.map(() => React.createRef()));

  // Update the time uniform for the glass materials
  useFrame(({ clock }) => {
    planetRefs.current.forEach(ref => {
      if (ref.current && ref.current.material) {
        ref.current.material.time = clock.getElapsedTime();
      }
    });
  });

  return (
    <>
      {mainPlanets.map((planet, index) => (
        <mesh
          key={planet.name}
          position={planet.position}
          ref={planetRefs.current[index]}
        >
          <sphereGeometry args={[planet.size, 64, 64]} />
          <glassPlanetMaterial
            color={planet.color}
            glowColor={planet.glowColor}
            glowIntensity={0.8}
            transmission={0.9}
            thickness={planet.size * 2}
            envMapIntensity={3.0}
            roughness={0.1}
            clearcoat={1.0}
            time={0}
          />
          {/* Add white outlines */}
          <CustomOutlines
            color="white"
            opacity={0.9}
            transparent={true}
            thickness={0.03}
          />
        </mesh>
      ))}
    </>
  );
};

export default FixedMainPlanets;