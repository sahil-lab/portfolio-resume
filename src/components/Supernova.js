import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, useTexture } from "@react-three/drei";
import * as THREE from "three";

const Supernova = ({ position = [-300, 100, -200], size = 30, interval = 60 }) => {
    const [exploding, setExploding] = useState(false);
    const [explosionTime, setExplosionTime] = useState(0);
    const [nextExplosion, setNextExplosion] = useState(Math.random() * interval);

    const coreRef = useRef();
    const waveRef = useRef();
    const particlesRef = useRef();
    const glowRef = useRef();

    // Create explosion effect
    useFrame((state, delta) => {
        // Countdown to next explosion
        setNextExplosion(prev => prev - delta);

        // Start explosion when timer reaches zero
        if (nextExplosion <= 0 && !exploding) {
            setExploding(true);
            setExplosionTime(0);
            setNextExplosion(interval + Math.random() * 20);
        }

        // Handle explosion animation
        if (exploding) {
            setExplosionTime(prev => prev + delta);

            // Core animation
            if (coreRef.current) {
                // Start small, rapidly expand, then contract
                const scaleFactor = explosionTime < 1
                    ? explosionTime * 4
                    : Math.max(4 - (explosionTime - 1) * 0.5, 0.5);

                coreRef.current.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Brightness increases then decreases
                if (coreRef.current.material) {
                    const intensity = explosionTime < 1.5
                        ? explosionTime * 3
                        : Math.max(5 - explosionTime, 0.2);

                    coreRef.current.material.emissiveIntensity = intensity;

                    // Change color over time (white hot -> yellow -> orange -> red)
                    const hue = THREE.MathUtils.lerp(0.1, 0, Math.min(explosionTime / 8, 1));
                    const saturation = THREE.MathUtils.lerp(0.5, 1, Math.min(explosionTime / 4, 1));
                    const lightness = THREE.MathUtils.lerp(0.9, 0.5, Math.min(explosionTime / 6, 1));

                    coreRef.current.material.color.setHSL(hue, saturation, lightness);
                    coreRef.current.material.emissive.setHSL(hue, saturation, lightness);
                }
            }

            // Shockwave animation
            if (waveRef.current) {
                // Expand outward
                const waveScale = explosionTime * 5;
                waveRef.current.scale.set(waveScale, waveScale, waveScale);

                // Fade out over time
                if (waveRef.current.material) {
                    waveRef.current.material.opacity = Math.max(1 - explosionTime / 3, 0);
                }
            }

            // End explosion after certain duration
            if (explosionTime > 8) {
                setExploding(false);
            }
        } else {
            // Idle state pulsing
            if (coreRef.current) {
                const pulseFactor = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1;
                coreRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
            }
        }
    });

    return (
        <group position={position}>
            {/* Dormant/explosive core */}
            <mesh ref={coreRef}>
                <sphereGeometry args={[size, 32, 32]} />
                <meshPhysicalMaterial
                    color={exploding ? "white" : "#ff4400"}
                    emissive={exploding ? "white" : "#ff2200"}
                    emissiveIntensity={exploding ? 3 : 0.8}
                    toneMapped={false}
                    metalness={0.2}
                    roughness={0.3}
                />
            </mesh>

            {/* Shockwave - only visible during explosion */}
            {exploding && (
                <mesh ref={waveRef}>
                    <sphereGeometry args={[size, 32, 32]} />
                    <meshPhysicalMaterial
                        color="#ffffff"
                        emissive="#ffaa77"
                        transparent={true}
                        opacity={0.7}
                        side={THREE.BackSide}
                        depthWrite={false}
                    />
                </mesh>
            )}

            {/* Particle effects */}
            <Sparkles
                ref={particlesRef}
                count={exploding ? 500 : 100}
                scale={exploding ? size * 10 : size * 2}
                size={exploding ? 4 : 2}
                speed={exploding ? 1 : 0.2}
                opacity={exploding ? 0.8 : 0.3}
                color={exploding ? "#ffddaa" : "#ff6622"}
            />

            {/* Outer glow */}
            <mesh ref={glowRef}>
                <sphereGeometry args={[size * 1.5, 32, 32]} />
                <meshBasicMaterial
                    color={exploding ? "#ffaa00" : "#ff4400"}
                    transparent={true}
                    opacity={exploding ? 0.4 : 0.1}
                    side={THREE.BackSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Extra light source during explosion */}
            {exploding && (
                <pointLight
                    color="#ffddaa"
                    intensity={10}
                    distance={500}
                    decay={2}
                />
            )}
        </group>
    );
};

export default Supernova; 