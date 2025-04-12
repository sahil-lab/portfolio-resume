import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SpaceJunk = ({ count = 100, radius = 200 }) => {
    const junkRef = useRef();

    // Generate random junk positions in a sphere
    const junkData = useMemo(() => {
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
            scale: THREE.MathUtils.randFloat(0.5, 2),
            speed: THREE.MathUtils.randFloat(0.2, 0.8)
        }));
    }, [count, radius]);

    // Animate the junk
    useFrame((state, delta) => {
        if (junkRef.current) {
            junkRef.current.children.forEach((junk, i) => {
                const data = junkData[i];

                // Rotate each piece of junk
                junk.rotation.x += delta * data.speed * 0.5;
                junk.rotation.y += delta * data.speed * 0.3;
                junk.rotation.z += delta * data.speed * 0.1;
            });
        }
    });

    return (
        <group ref={junkRef}>
            {junkData.map((data, i) => (
                <mesh
                    key={i}
                    position={data.position}
                    rotation={data.rotation}
                    scale={data.scale}
                >
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial
                        color={new THREE.Color().setHSL(Math.random(), 0.5, 0.5)}
                        roughness={0.7}
                        metalness={0.3}
                    />
                </mesh>
            ))}
        </group>
    );
};

export default SpaceJunk; 