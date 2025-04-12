import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const AsteroidField = ({ count = 100, radius = 200, innerRadius = 100 }) => {
    const fieldRef = useRef();

    // Generate asteroid data
    const asteroidData = useMemo(() => {
        return Array.from({ length: count }, () => {
            // Position in a donut/torus shape
            const angle = Math.random() * Math.PI * 2;
            const distance = innerRadius + Math.random() * (radius - innerRadius);

            return {
                position: new THREE.Vector3(
                    Math.cos(angle) * distance,
                    (Math.random() - 0.5) * 50, // Some vertical spread
                    Math.sin(angle) * distance
                ),
                rotation: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                ],
                scale: THREE.MathUtils.randFloat(1, 4),
                rotationSpeed: THREE.MathUtils.randFloat(0.1, 0.3),
                orbitSpeed: THREE.MathUtils.randFloat(0.01, 0.05) * (Math.random() > 0.5 ? 1 : -1),
                orbitRadius: distance,
                orbitAngle: angle
            };
        });
    }, [count, radius, innerRadius]);

    // Animate the asteroids
    useFrame((state, delta) => {
        if (fieldRef.current) {
            fieldRef.current.children.forEach((asteroid, i) => {
                const data = asteroidData[i];

                // Rotate each asteroid on its axis
                asteroid.rotation.x += delta * data.rotationSpeed;
                asteroid.rotation.y += delta * data.rotationSpeed * 0.5;

                // Orbit around center
                data.orbitAngle += delta * data.orbitSpeed;
                asteroid.position.x = Math.cos(data.orbitAngle) * data.orbitRadius;
                asteroid.position.z = Math.sin(data.orbitAngle) * data.orbitRadius;
            });
        }
    });

    return (
        <group ref={fieldRef}>
            {asteroidData.map((data, i) => (
                <mesh
                    key={i}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                >
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color="#888888"
                        roughness={0.8}
                        metalness={0.2}
                    />
                </mesh>
            ))}
        </group>
    );
};

export default AsteroidField; 