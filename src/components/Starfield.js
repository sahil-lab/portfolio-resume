// src/App.js

import React, {
    useMemo
} from "react";
import * as THREE from "three";

// Import Logo Textures

// 14. Starfield component for additional stars
const Starfield = () => {
    const count = 10000; // Number of stars
    const positions = useMemo(() => {
      const posArray = [];
      for (let i = 0; i < count; i++) {
        const theta = THREE.MathUtils.degToRad(
          THREE.MathUtils.randFloatSpread(360)
        );
        const phi = THREE.MathUtils.degToRad(
          THREE.MathUtils.randFloatSpread(360)
        );
        const distance = THREE.MathUtils.randFloat(0, 500);
        const x = distance * Math.sin(theta) * Math.cos(phi);
        const y = distance * Math.sin(theta) * Math.sin(phi);
        const z = distance * Math.cos(theta);
        posArray.push(x, y, z);
      }
      return new Float32Array(posArray);
    }, [count]);
  
    const colors = useMemo(() => {
      const cols = [];
      for (let i = 0; i < count; i++) {
        const color = new THREE.Color(
          THREE.MathUtils.randFloat(0.8, 1.0),
          THREE.MathUtils.randFloat(0.8, 1.0),
          THREE.MathUtils.randFloat(0.8, 1.0)
        );
        cols.push(color.r, color.g, color.b);
      }
      return new Float32Array(cols);
    }, [count]);
  
    return (
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={count}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={colors}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors
          size={0.7}
          sizeAttenuation
          transparent
          opacity={1}
        />
      </points>
    );
  };
  
  export  default  Starfield ;
