import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SpaceStation = ({ position = [150, 50, -100] }) => {
    const stationRef = useRef();
    const rotationSpeed = 0.05;

    useFrame((state, delta) => {
        if (stationRef.current) {
            // Slowly rotate the station
            stationRef.current.rotation.y += delta * rotationSpeed;
        }
    });

    return (
        <group ref={stationRef} position={position}>
            {/* Main station body */}
            <mesh>
                <cylinderGeometry args={[5, 5, 15, 16]} />
                <meshStandardMaterial
                    color="#888888"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Solar panels */}
            <group position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh position={[15, 0, 0]}>
                    <boxGeometry args={[20, 0.5, 10]} />
                    <meshStandardMaterial
                        color="#3388ff"
                        metalness={0.5}
                        roughness={0.3}
                    />
                </mesh>
                <mesh position={[-15, 0, 0]}>
                    <boxGeometry args={[20, 0.5, 10]} />
                    <meshStandardMaterial
                        color="#3388ff"
                        metalness={0.5}
                        roughness={0.3}
                    />
                </mesh>
            </group>

            {/* Antenna */}
            <mesh position={[0, 10, 0]}>
                <cylinderGeometry args={[0.5, 0.1, 10, 8]} />
                <meshStandardMaterial
                    color="#aaaaaa"
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>
        </group>
    );
};

export default SpaceStation; 