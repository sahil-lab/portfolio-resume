/* ---------------------------- Milky Way Background --------------------------- */
// src/App.js

import { useFrame } from "@react-three/fiber";
import React, {
    useMemo
} from "react";

// Import Logo Textures
import { EnhancedNebulaeMaterial } from "../components/ShaderMaterials";

// 13. MilkyWay component for the galaxy background
const MilkyWay = () => {
    const milkyWayMaterial = useMemo(() => new EnhancedNebulaeMaterial(), []);
  
    useFrame((state, delta) => {
      if (milkyWayMaterial) {
        milkyWayMaterial.uniforms.time.value += delta * 0.1;
      }
    });
  
    return (
      <mesh scale={[1000, 1000, 1000]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <enhancedNebulaeMaterial />
      </mesh>
    );
  };

  export default MilkyWay;