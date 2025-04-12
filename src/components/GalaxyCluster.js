import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const GalaxyCluster = ({ position = [0, 0, -800], count = 5, size = 200 }) => {
    const clusterRef = useRef();

    // Create individual galaxies
    const galaxies = useMemo(() => {
        return Array.from({ length: count }, (_, i) => {
            const angle = (i / count) * Math.PI * 2;
            const distance = size * 0.5;

            // Calculate position in a circular arrangement
            const x = Math.cos(angle) * distance;
            const y = (Math.random() - 0.5) * distance * 0.4; // Some vertical spread
            const z = Math.sin(angle) * distance;

            return {
                position: [x, y, z],
                rotation: [
                    Math.random() * Math.PI * 0.3,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 0.3
                ],
                scale: THREE.MathUtils.randFloat(0.6, 1.2) * size * 0.3,
                color: new THREE.Color().setHSL(
                    Math.random() * 0.1 + 0.6, // Blue-ish hue
                    0.5,
                    0.6
                ),
                rotationSpeed: THREE.MathUtils.randFloat(0.02, 0.05),
                particleCount: Math.floor(THREE.MathUtils.randFloat(200, 400))
            };
        });
    }, [count, size]);

    // Animate the galaxy cluster
    useFrame((state, delta) => {
        if (clusterRef.current) {
            // Subtle overall rotation of the cluster
            clusterRef.current.rotation.y += delta * 0.01;

            // Rotate individual galaxies
            clusterRef.current.children.forEach((galaxy, i) => {
                if (i < galaxies.length) {
                    galaxy.rotation.y += delta * galaxies[i].rotationSpeed;
                }
            });
        }
    });

    return (
        <group position={position} ref={clusterRef}>
            {/* Connecting filaments between galaxies */}
            {galaxies.map((galaxy, i) => (
                <group
                    key={`galaxy-${i}`}
                    position={galaxy.position}
                    rotation={galaxy.rotation}
                >
                    {/* Galaxy disk */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0, galaxy.scale, 32]} />
                        <meshBasicMaterial
                            color={galaxy.color}
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.5}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>

                    {/* Galaxy core */}
                    <mesh>
                        <sphereGeometry args={[galaxy.scale * 0.1, 16, 16]} />
                        <meshBasicMaterial color={galaxy.color} />
                    </mesh>

                    {/* Galaxy stars */}
                    <Sparkles
                        count={galaxy.particleCount}
                        scale={galaxy.scale * 0.8}
                        size={1.5}
                        speed={0.3}
                        opacity={0.7}
                        color={galaxy.color}
                    />
                </group>
            ))}

            {/* Dark matter halo */}
            <Sparkles
                count={500}
                scale={size}
                size={2}
                speed={0.1}
                opacity={0.3}
                color="#aabbff"
            />
        </group>
    );
};

export default GalaxyCluster; 