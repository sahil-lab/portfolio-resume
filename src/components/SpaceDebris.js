import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SpaceDebris = ({ count = 200, radius = 150 }) => {
    const debrisRef = useRef();

    // Generate random debris data
    const debrisData = useMemo(() => {
        return Array.from({ length: count }, () => ({
            position: new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(radius * 2),
                THREE.MathUtils.randFloatSpread(radius * 2),
                THREE.MathUtils.randFloatSpread(radius * 2)
            ),
            rotation: [
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            ],
            scale: THREE.MathUtils.randFloat(0.1, 0.5),
            speed: THREE.MathUtils.randFloat(0.1, 0.3)
        }));
    }, [count, radius]);

    // Animate the debris
    useFrame((state, delta) => {
        if (debrisRef.current) {
            debrisRef.current.children.forEach((debris, i) => {
                // Simple rotation animation
                debris.rotation.x += delta * debrisData[i].speed;
                debris.rotation.y += delta * debrisData[i].speed * 0.5;
            });
        }
    });

    return (
        <group ref={debrisRef}>
            {debrisData.map((data, i) => (
                <mesh
                    key={i}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                >
                    <tetrahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial
                        color={new THREE.Color().setHSL(0.05, 0.5, 0.5)}
                        roughness={0.7}
                        metalness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
};

export default SpaceDebris; 