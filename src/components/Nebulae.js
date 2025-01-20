/* ------------------------------- Nebulae ------------------------------ */
import { useFrame } from "@react-three/fiber";
import React, {
    useEffect, useMemo, useRef
} from "react";
import * as THREE from "three";

// Import Logo Textures
import { EnhancedNebulaeMaterial } from "../components/ShaderMaterials";
// 15. Enhanced Nebulae component for more intricate textures and lighting
const Nebulae = () => {
    const nebulaeMaterial1 = useMemo(() => new EnhancedNebulaeMaterial(), []);
    const nebulaeMaterial2 = useMemo(() => new EnhancedNebulaeMaterial(), []);
    const nebulaeMaterial3 = useMemo(() => new EnhancedNebulaeMaterial(), []); // Additional nebula for diversity
  
    const materialRef1 = useRef();
    const materialRef2 = useRef();
    const materialRef3 = useRef();
  
    useEffect(() => {
      if (materialRef1.current) {
        materialRef1.current.blending = THREE.AdditiveBlending;
        materialRef1.current.transparent = true;
        materialRef1.current.depthWrite = false;
      }
      if (materialRef2.current) {
        materialRef2.current.blending = THREE.AdditiveBlending;
        materialRef2.current.transparent = true;
        materialRef2.current.depthWrite = false;
      }
      if (materialRef3.current) {
        materialRef3.current.blending = THREE.AdditiveBlending;
        materialRef3.current.transparent = true;
        materialRef3.current.depthWrite = false;
      }
    }, []);
  
    useFrame((state, delta) => {
      if (nebulaeMaterial1.uniforms.time.value !== undefined) {
        nebulaeMaterial1.uniforms.time.value += delta * 0.1;
      }
      if (nebulaeMaterial2.uniforms.time.value !== undefined) {
        nebulaeMaterial2.uniforms.time.value += delta * 0.1;
      }
      if (nebulaeMaterial3.uniforms.time.value !== undefined) {
        nebulaeMaterial3.uniforms.time.value += delta * 0.1;
      }
    });
  
    return (
      <>
        {/* First Nebula */}
        <mesh position={[150, -50, -100]} scale={[50, 50, 50]}>
          <sphereGeometry args={[1, 64, 64]} />
          <enhancedNebulaeMaterial ref={materialRef1} />
        </mesh>
  
        {/* Second Nebula */}
        <mesh position={[-150, 70, 50]} scale={[60, 60, 60]}>
          <sphereGeometry args={[1, 64, 64]} />
          <enhancedNebulaeMaterial ref={materialRef2} />
        </mesh>
  
        {/* Third Nebula for added complexity */}
        <mesh position={[80, 100, 120]} scale={[40, 40, 40]}>
          <sphereGeometry args={[1, 64, 64]} />
          <enhancedNebulaeMaterial ref={materialRef3} />
        </mesh>
      </>
    );
  };
  export  default Nebulae;