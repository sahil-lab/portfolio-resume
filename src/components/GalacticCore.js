import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const GalacticCore = ({ position = [0, 0, -300], size = 100 }) => {
    const coreRef = useRef();
    const glowRef = useRef();

    // Animate the galactic core
    useFrame((state, delta) => {
        if (coreRef.current) {
            // Slow rotation
            coreRef.current.rotation.z += delta * 0.05;
        }

        if (glowRef.current) {
            // Pulse the glow
            const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1;
            glowRef.current.scale.set(pulse, pulse, pulse);
        }
    });

    return (
        <group position={position}>
            {/* Core sphere */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[size * 0.3, 32, 32]} />
                <meshBasicMaterial
                    color={new THREE.Color(1, 0.7, 0.3)}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Outer glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[size * 0.8, 32, 32]} />
                <meshBasicMaterial
                    color={new THREE.Color(1, 0.5, 0.2)}
                    transparent
                    opacity={0.2}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Star particles */}
            <Sparkles
                count={500}
                scale={size * 1.5}
                size={4}
                speed={0.3}
                opacity={0.7}
                color={new THREE.Color(1, 0.8, 0.5)}
            />

            {/* Dense core particles */}
            <Sparkles
                count={300}
                scale={size * 0.5}
                size={3}
                speed={1}
                opacity={0.9}
                color={new THREE.Color(1, 0.9, 0.7)}
            />
        </group>
    );
};

export default GalacticCore; 