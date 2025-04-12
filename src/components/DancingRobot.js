import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const DancingRobot = ({ position = [500, 0, -300], scale = 40 }) => {
    const groupRef = useRef();
    const headRef = useRef();
    const leftArmRef = useRef();
    const rightArmRef = useRef();
    const leftLegRef = useRef();
    const rightLegRef = useRef();

    // Animation parameters
    const dancePhase = useRef(0);
    const headBobPhase = useRef(0);
    const eyeBlinkTime = useRef(0);
    const eyesOpen = useRef(true);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Update animation phases
        dancePhase.current += delta * 3; // Dance speed
        headBobPhase.current += delta * 2; // Head bob speed

        // Dancing motion - the robot moves up and down
        groupRef.current.position.y = position[1] + Math.sin(dancePhase.current) * 5;

        // Robot slightly rotates while dancing
        groupRef.current.rotation.y = Math.sin(dancePhase.current * 0.5) * 0.2;

        // Head bobbing motion
        if (headRef.current) {
            headRef.current.rotation.z = Math.sin(headBobPhase.current) * 0.15;
            headRef.current.rotation.x = Math.sin(headBobPhase.current * 1.5) * 0.1;
        }

        // Arm dancing motions
        if (leftArmRef.current) {
            leftArmRef.current.rotation.x = Math.sin(dancePhase.current) * 0.7 + 0.5;
            leftArmRef.current.rotation.z = Math.cos(dancePhase.current * 0.5) * 0.4 + 0.4;
        }

        if (rightArmRef.current) {
            rightArmRef.current.rotation.x = Math.sin(dancePhase.current + Math.PI) * 0.7 + 0.5;
            rightArmRef.current.rotation.z = Math.cos(dancePhase.current * 0.5 + Math.PI) * 0.4 - 0.4;
        }

        // Leg dancing motions
        if (leftLegRef.current) {
            leftLegRef.current.rotation.x = Math.sin(dancePhase.current) * 0.5;
            leftLegRef.current.position.y = -3.5 + Math.abs(Math.sin(dancePhase.current)) * 0.5;
        }

        if (rightLegRef.current) {
            rightLegRef.current.rotation.x = Math.sin(dancePhase.current + Math.PI) * 0.5;
            rightLegRef.current.position.y = -3.5 + Math.abs(Math.sin(dancePhase.current + Math.PI)) * 0.5;
        }

        // Blinking animation
        eyeBlinkTime.current += delta;
        if (eyeBlinkTime.current > 2) {
            eyesOpen.current = false;
            if (eyeBlinkTime.current > 2.15) {
                eyesOpen.current = true;
                eyeBlinkTime.current = 0;
            }
        }
    });

    return (
        <group ref={groupRef} position={position} scale={scale}>
            {/* Robot Head */}
            <group ref={headRef} position={[0, 4, 0]}>
                {/* Head Box */}
                <mesh>
                    <boxGeometry args={[2.5, 2, 2.5]} />
                    <meshPhysicalMaterial
                        color="#727272"
                        metalness={0.8}
                        roughness={0.2}
                        clearcoat={1}
                    />
                </mesh>

                {/* Robot Eyes */}
                <group position={[0, 0, 1.3]}>
                    {/* Left Eye */}
                    <mesh position={[-0.6, 0.3, 0]}>
                        <boxGeometry args={[0.4, 0.2, 0.1]} />
                        <meshStandardMaterial
                            color={eyesOpen.current ? "#ff0000" : "#660000"}
                            emissive={eyesOpen.current ? "#ff0000" : "#330000"}
                            emissiveIntensity={1}
                        />
                    </mesh>

                    {/* Right Eye */}
                    <mesh position={[0.6, 0.3, 0]}>
                        <boxGeometry args={[0.4, 0.2, 0.1]} />
                        <meshStandardMaterial
                            color={eyesOpen.current ? "#ff0000" : "#660000"}
                            emissive={eyesOpen.current ? "#ff0000" : "#330000"}
                            emissiveIntensity={1}
                        />
                    </mesh>

                    {/* Mouth - series of horizontal lines */}
                    <mesh position={[0, -0.5, 0]}>
                        <boxGeometry args={[1.2, 0.1, 0.1]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    <mesh position={[0, -0.7, 0]}>
                        <boxGeometry args={[0.8, 0.1, 0.1]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>

                {/* Antennas */}
                <group>
                    <mesh position={[-0.8, 1.2, 0]} rotation={[0, 0, Math.PI * 0.05]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    <mesh position={[-0.8, 1.7, 0]}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial
                            color="#ff0000"
                            emissive="#ff0000"
                            emissiveIntensity={0.5}
                        />
                    </mesh>

                    <mesh position={[0.8, 1.2, 0]} rotation={[0, 0, -Math.PI * 0.05]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    <mesh position={[0.8, 1.7, 0]}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial
                            color="#ff0000"
                            emissive="#ff0000"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                </group>
            </group>

            {/* Robot Body */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3, 5, 2]} />
                <meshPhysicalMaterial
                    color="#5a5a5a"
                    metalness={0.8}
                    roughness={0.2}
                    clearcoat={0.5}
                />
            </mesh>

            {/* Body Details */}
            <mesh position={[0, 1, 1.01]}>
                <boxGeometry args={[2, 1, 0.1]} />
                <meshStandardMaterial
                    color="#333333"
                />
            </mesh>

            {/* Control Buttons */}
            <group position={[0, 0, 1.01]}>
                <mesh position={[-0.7, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial
                        color="#ff0000"
                        emissive="#ff0000"
                        emissiveIntensity={0.3}
                    />
                </mesh>

                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial
                        color="#00ff00"
                        emissive="#00ff00"
                        emissiveIntensity={0.3}
                    />
                </mesh>

                <mesh position={[0.7, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} />
                    <meshStandardMaterial
                        color="#0000ff"
                        emissive="#0000ff"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            </group>

            {/* Left Arm */}
            <group ref={leftArmRef} position={[-1.8, 1.5, 0]}>
                {/* Upper Arm */}
                <mesh position={[-0.7, 0, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[1.4, 0.6, 0.6]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.9}
                        roughness={0.2}
                    />
                </mesh>

                {/* Lower Arm */}
                <mesh position={[-1.8, 0, 0]}>
                    <boxGeometry args={[1, 0.5, 0.5]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.9}
                        roughness={0.2}
                    />
                </mesh>

                {/* Hand/Claw */}
                <group position={[-2.5, 0, 0]}>
                    <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI * 0.1]}>
                        <boxGeometry args={[0.4, 0.1, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    <mesh position={[0, -0.2, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
                        <boxGeometry args={[0.4, 0.1, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>
            </group>

            {/* Right Arm */}
            <group ref={rightArmRef} position={[1.8, 1.5, 0]}>
                {/* Upper Arm */}
                <mesh position={[0.7, 0, 0]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[1.4, 0.6, 0.6]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.9}
                        roughness={0.2}
                    />
                </mesh>

                {/* Lower Arm */}
                <mesh position={[1.8, 0, 0]}>
                    <boxGeometry args={[1, 0.5, 0.5]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.9}
                        roughness={0.2}
                    />
                </mesh>

                {/* Hand/Claw */}
                <group position={[2.5, 0, 0]}>
                    <mesh position={[0, 0.2, 0]} rotation={[0, 0, -Math.PI * 0.1]}>
                        <boxGeometry args={[0.4, 0.1, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>

                    <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI * 0.1]}>
                        <boxGeometry args={[0.4, 0.1, 0.3]} />
                        <meshStandardMaterial color="#333333" />
                    </mesh>
                </group>
            </group>

            {/* Left Leg */}
            <group ref={leftLegRef} position={[-0.8, -3.5, 0]}>
                {/* Upper Leg */}
                <mesh position={[0, -1, 0]}>
                    <boxGeometry args={[0.8, 2, 0.8]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Lower Leg */}
                <mesh position={[0, -2.5, 0]}>
                    <boxGeometry args={[0.7, 1, 0.7]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Foot */}
                <mesh position={[0, -3.2, 0.3]}>
                    <boxGeometry args={[0.9, 0.4, 1.3]} />
                    <meshPhysicalMaterial
                        color="#333333"
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>
            </group>

            {/* Right Leg */}
            <group ref={rightLegRef} position={[0.8, -3.5, 0]}>
                {/* Upper Leg */}
                <mesh position={[0, -1, 0]}>
                    <boxGeometry args={[0.8, 2, 0.8]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Lower Leg */}
                <mesh position={[0, -2.5, 0]}>
                    <boxGeometry args={[0.7, 1, 0.7]} />
                    <meshPhysicalMaterial
                        color="#444444"
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Foot */}
                <mesh position={[0, -3.2, 0.3]}>
                    <boxGeometry args={[0.9, 0.4, 1.3]} />
                    <meshPhysicalMaterial
                        color="#333333"
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>
            </group>
        </group>
    );
};

export default DancingRobot; 