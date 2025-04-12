import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const AlienCharacter = ({ position = [0, 0, -500], scale = 50 }) => {
    const groupRef = useRef();
    const headRef = useRef();
    const leftArmRef = useRef();
    const rightArmRef = useRef();

    // Waving animation state
    const wavePhase = useRef(0);
    const blinkTime = useRef(0);
    const eyesOpen = useRef(true);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Gentle floating animation for the entire alien
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.05;

        // Head gentle rotation
        if (headRef.current) {
            headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
            headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
        }

        // Waving hands animation
        wavePhase.current += delta * 5;
        if (leftArmRef.current) {
            leftArmRef.current.rotation.z = Math.sin(wavePhase.current) * 0.4 + 0.3;
            leftArmRef.current.rotation.x = Math.sin(wavePhase.current * 0.8) * 0.2;
        }
        if (rightArmRef.current) {
            rightArmRef.current.rotation.z = Math.sin(wavePhase.current + Math.PI) * 0.4 - 0.3;
            rightArmRef.current.rotation.x = Math.sin(wavePhase.current * 0.8 + Math.PI) * 0.2;
        }

        // Blinking animation
        blinkTime.current += delta;
        if (blinkTime.current > 3) {
            eyesOpen.current = false;
            if (blinkTime.current > 3.15) {
                eyesOpen.current = true;
                blinkTime.current = 0;
            }
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Alien Head */}
            <group ref={headRef}>
                {/* Main head - large oval */}
                <mesh position={[0, 3, 0]}>
                    <sphereGeometry args={[2.5, 32, 32]} />
                    <meshPhysicalMaterial
                        color="#8cd9c9"
                        metalness={0.2}
                        roughness={0.3}
                        transmission={0.4}
                        thickness={2}
                        envMapIntensity={1.5}
                        clearcoat={1}
                    />
                </mesh>

                {/* Large Eyes */}
                <group position={[0, 3.5, 1.5]}>
                    {/* Left Eye */}
                    <mesh position={[-0.8, 0, 0]}>
                        <sphereGeometry args={[0.6, 32, 32]} />
                        <meshStandardMaterial color={eyesOpen.current ? "#000000" : "#444444"} />
                    </mesh>

                    {/* Right Eye */}
                    <mesh position={[0.8, 0, 0]}>
                        <sphereGeometry args={[0.6, 32, 32]} />
                        <meshStandardMaterial color={eyesOpen.current ? "#000000" : "#444444"} />
                    </mesh>

                    {/* Eyebrows */}
                    <mesh position={[-0.8, 0.7, 0.3]} rotation={[0, 0, Math.PI * 0.1]}>
                        <boxGeometry args={[0.7, 0.1, 0.1]} />
                        <meshStandardMaterial color="#000000" />
                    </mesh>

                    <mesh position={[0.8, 0.7, 0.3]} rotation={[0, 0, -Math.PI * 0.1]}>
                        <boxGeometry args={[0.7, 0.1, 0.1]} />
                        <meshStandardMaterial color="#000000" />
                    </mesh>
                </group>

                {/* Mouth - smiling curve */}
                <mesh position={[0, 2.2, 1.5]}>
                    <torusGeometry args={[0.8, 0.1, 16, 16, Math.PI]} />
                    <meshStandardMaterial color="#ff5555" />
                </mesh>

                {/* Alien antennas */}
                <group position={[0, 5, 0]}>
                    <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI * 0.1]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
                        <meshStandardMaterial color="#8cd9c9" />
                    </mesh>

                    <mesh position={[-0.7, 1.4, 0]}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
                    </mesh>

                    <mesh position={[0.7, 0, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
                        <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
                        <meshStandardMaterial color="#8cd9c9" />
                    </mesh>

                    <mesh position={[0.7, 1.4, 0]}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
                    </mesh>
                </group>
            </group>

            {/* Alien Body */}
            <mesh position={[0, 0, 0]}>
                <capsuleGeometry args={[1.5, 3, 16, 16]} />
                <meshPhysicalMaterial
                    color="#8cd9c9"
                    metalness={0.2}
                    roughness={0.3}
                    transmission={0.4}
                    thickness={2}
                    envMapIntensity={1.5}
                    clearcoat={1}
                />
            </mesh>

            {/* Left Arm */}
            <group ref={leftArmRef} position={[-1.8, 1, 0]}>
                <mesh position={[-0.8, 0, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
                    <capsuleGeometry args={[0.4, 2, 8, 8]} />
                    <meshPhysicalMaterial
                        color="#8cd9c9"
                        metalness={0.2}
                        roughness={0.3}
                        transmission={0.4}
                        thickness={1}
                        envMapIntensity={1.5}
                        clearcoat={1}
                    />
                </mesh>

                {/* Left Hand */}
                <mesh position={[-1.8, 0, 0]}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshPhysicalMaterial
                        color="#8cd9c9"
                        metalness={0.2}
                        roughness={0.3}
                        transmission={0.4}
                        thickness={1}
                        envMapIntensity={1.5}
                        clearcoat={1}
                    />
                </mesh>
            </group>

            {/* Right Arm */}
            <group ref={rightArmRef} position={[1.8, 1, 0]}>
                <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI * 0.1]}>
                    <capsuleGeometry args={[0.4, 2, 8, 8]} />
                    <meshPhysicalMaterial
                        color="#8cd9c9"
                        metalness={0.2}
                        roughness={0.3}
                        transmission={0.4}
                        thickness={1}
                        envMapIntensity={1.5}
                        clearcoat={1}
                    />
                </mesh>

                {/* Right Hand */}
                <mesh position={[1.8, 0, 0]}>
                    <sphereGeometry args={[0.5, 16, 16]} />
                    <meshPhysicalMaterial
                        color="#8cd9c9"
                        metalness={0.2}
                        roughness={0.3}
                        transmission={0.4}
                        thickness={1}
                        envMapIntensity={1.5}
                        clearcoat={1}
                    />
                </mesh>
            </group>

            {/* Legs */}
            <mesh position={[-0.7, -2.5, 0]}>
                <capsuleGeometry args={[0.4, 2, 8, 8]} />
                <meshPhysicalMaterial
                    color="#8cd9c9"
                    metalness={0.2}
                    roughness={0.3}
                    transmission={0.4}
                    thickness={1}
                    envMapIntensity={1.5}
                    clearcoat={1}
                />
            </mesh>

            <mesh position={[0.7, -2.5, 0]}>
                <capsuleGeometry args={[0.4, 2, 8, 8]} />
                <meshPhysicalMaterial
                    color="#8cd9c9"
                    metalness={0.2}
                    roughness={0.3}
                    transmission={0.4}
                    thickness={1}
                    envMapIntensity={1.5}
                    clearcoat={1}
                />
            </mesh>
        </group>
    );
};

export default AlienCharacter; 