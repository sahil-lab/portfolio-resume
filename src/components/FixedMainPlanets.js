/* ------------------------------- Fixed Main Planets ------------------------------ */
// src/App.js

import React from "react";
import * as THREE from "three";
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
      },
      {
        name: "BluePlanet",
        position: [-200, 0, 0],
        size: 8,
        color: new THREE.Color("#0000ff"), // Blue
      },
      {
        name: "GreenPlanet",
        position: [0, 200, 0],
        size: 8,
        color: new THREE.Color("#00ff00"), // Green
      },
    ];
  
    return (
      <>
        {mainPlanets.map((planet) => (
          <mesh key={planet.name} position={planet.position}>
            <sphereGeometry args={[planet.size, 64, 64]} />
            <meshStandardMaterial
              color={planet.color}
              emissiveColor={"white"}
              emissiveIntensity={1}
              roughness={0.3}
              metalness={0.5}
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