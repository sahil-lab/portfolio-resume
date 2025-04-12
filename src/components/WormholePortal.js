import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { Sparkles, Trail, Float, Text } from "@react-three/drei";
import { WormholeMaterial } from "./ShaderMaterials";

const WormholePortal = ({ position = [500, 100, -200], size = 35, destination = "unknown" }) => {
    // References
    const portalRef = useRef();
    const wormholeMaterialRef = useRef();
    const sparklesRef = useRef();
    const outerRingRef = useRef();
    const innerTrailsRef = useRef([]);
    const textRef = useRef();

    // State for interaction
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);
    const [transported, setTransported] = useState(false);

    // Create procedural textures
    const portalTextures = useMemo(() => {
        // Create ring texture
        const ringCanvas = document.createElement('canvas');
        ringCanvas.width = 512;
        ringCanvas.height = 512;
        const ringCtx = ringCanvas.getContext('2d');

        // Create a gradient background
        const ringGradient = ringCtx.createLinearGradient(0, 0, 512, 512);
        ringGradient.addColorStop(0, '#553399');
        ringGradient.addColorStop(0.5, '#442288');
        ringGradient.addColorStop(1, '#331177');
        ringCtx.fillStyle = ringGradient;
        ringCtx.fillRect(0, 0, 512, 512);

        // Add some pattern to ring
        ringCtx.strokeStyle = '#8866ff';
        ringCtx.lineWidth = 2;
        for (let i = 0; i < 20; i++) {
            const y = i * 25;
            ringCtx.beginPath();
            ringCtx.moveTo(0, y);
            ringCtx.lineTo(512, y);
            ringCtx.stroke();
        }

        // Add some glowing spots
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = Math.random() * 10 + 5;

            const spotGradient = ringCtx.createRadialGradient(
                x, y, 0,
                x, y, radius
            );
            spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            spotGradient.addColorStop(1, 'rgba(136, 102, 255, 0)');

            ringCtx.fillStyle = spotGradient;
            ringCtx.beginPath();
            ringCtx.arc(x, y, radius, 0, Math.PI * 2);
            ringCtx.fill();
        }

        const ringTexture = new THREE.CanvasTexture(ringCanvas);
        ringTexture.needsUpdate = true;

        // Create energy texture
        const energyCanvas = document.createElement('canvas');
        energyCanvas.width = 512;
        energyCanvas.height = 512;
        const energyCtx = energyCanvas.getContext('2d');

        // Fill with gradient
        const energyGradient = energyCtx.createRadialGradient(
            256, 256, 0,
            256, 256, 256
        );
        energyGradient.addColorStop(0, '#ffffff');
        energyGradient.addColorStop(0.3, '#aa88ff');
        energyGradient.addColorStop(0.7, '#5522aa');
        energyGradient.addColorStop(1, '#221133');

        energyCtx.fillStyle = energyGradient;
        energyCtx.fillRect(0, 0, 512, 512);

        // Add some energy swirls
        for (let i = 0; i < 10; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const arcLength = Math.random() * Math.PI + Math.PI;
            const radius = 50 + Math.random() * 200;

            energyCtx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
            energyCtx.lineWidth = Math.random() * 5 + 2;

            energyCtx.beginPath();
            energyCtx.arc(256, 256, radius, startAngle, startAngle + arcLength);
            energyCtx.stroke();
        }

        const energyTexture = new THREE.CanvasTexture(energyCanvas);
        energyTexture.needsUpdate = true;

        return [ringTexture, energyTexture];
    }, []);

    // Camera and scene access for effects
    const { camera } = useThree();

    // Time tracking for animations
    const timeRef = useRef(0);

    // Unique particles for the wormhole effect
    const particles = useMemo(() => {
        return Array(15).fill().map(() => ({
            position: new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(size),
                THREE.MathUtils.randFloatSpread(size),
                THREE.MathUtils.randFloatSpread(size * 0.5)
            ),
            speed: THREE.MathUtils.randFloat(0.3, 1.0),
            radius: THREE.MathUtils.randFloat(0.5, 2.0),
            startAngle: Math.random() * Math.PI * 2,
        }));
    }, [size]);

    // Spring animations for interactive effects
    const { portalScale, ringRotation, glowIntensity, textOpacity } = useSpring({
        portalScale: hovered ? 1.1 : 1,
        ringRotation: active ? 10 : 0,
        glowIntensity: hovered ? 2.5 : 1.8,
        textOpacity: hovered ? 1 : 0,
        config: { mass: 2, tension: 300, friction: 30 }
    });

    // Handle portal activation
    const activatePortal = () => {
        if (!active) {
            setActive(true);

            // Delayed transportation effect
            setTimeout(() => {
                setTransported(true);

                // Reset after effect completes
                setTimeout(() => {
                    setActive(false);
                    setTransported(false);
                }, 5000);
            }, 2000);
        }
    };

    // Wormhole animation
    useFrame((state, delta) => {
        // Update time for shaders
        timeRef.current += delta;

        if (wormholeMaterialRef.current) {
            wormholeMaterialRef.current.time = timeRef.current;
            wormholeMaterialRef.current.vortexSpeed = active ? 1.5 : 0.5;
            wormholeMaterialRef.current.vortexIntensity = active ? 12.0 : 8.0;
        }

        // Animate the outer ring
        if (outerRingRef.current) {
            outerRingRef.current.rotation.z -= delta * (active ? 0.5 : 0.1);
        }

        // Particle trails movement
        particles.forEach((particle, i) => {
            if (innerTrailsRef.current[i]) {
                const angle = particle.startAngle + timeRef.current * particle.speed * (active ? 2 : 1);
                const radius = size * 0.4 * (1 - 0.2 * Math.sin(timeRef.current * 0.5));

                const x = Math.cos(angle) * radius * particle.radius;
                const y = Math.sin(angle) * radius * particle.radius;
                const z = active ? -5 - 10 * Math.cos(timeRef.current + i) : 0;

                innerTrailsRef.current[i].position.set(x, y, z);
            }
        });

        // Camera shake effect during transportation
        if (transported) {
            const shakeAmount = 0.5;
            camera.position.x += (Math.random() - 0.5) * shakeAmount;
            camera.position.y += (Math.random() - 0.5) * shakeAmount;
        }
    });

    // Sound effects
    useEffect(() => {
        // Create dummy audio objects that don't actually load files
        const dummySound = {
            loop: false,
            volume: 0.3,
            play: () => console.log("Sound would play if audio files were available"),
            pause: () => { }
        };

        // Commented out actual audio loading that was causing errors
        // const humSound = new Audio("/sounds/portal_hum.mp3");
        // humSound.loop = true;
        // humSound.volume = 0.3;

        // Activation sound
        // const activationSound = new Audio("/sounds/portal_activation.mp3");
        // activationSound.volume = 0.7;

        // No actual sounds played due to missing files
        if (hovered) {
            // humSound.play();
            console.log("Portal hover sound effect");
        }

        if (active) {
            // activationSound.play();
            console.log("Portal activation sound effect");
        }

        return () => {
            // Clean up function - would pause sounds if they existed
        };
    }, [hovered, active]);

    return (
        <group position={position}>
            {/* Main portal ring */}
            <animated.group
                ref={portalRef}
                scale={portalScale}
                onClick={activatePortal}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {/* Outer decorative ring */}
                <mesh ref={outerRingRef}>
                    <torusGeometry args={[size * 0.9, size * 0.1, 32, 100]} />
                    <meshStandardMaterial
                        map={portalTextures[0]}
                        emissive="#6600ff"
                        emissiveIntensity={1.5}
                        metalness={0.8}
                        roughness={0.2}
                    />
                </mesh>

                {/* Portal wormhole effect */}
                <animated.mesh rotation-z={ringRotation}>
                    <circleGeometry args={[size * 0.8, 64]} />
                    <wormholeMaterial
                        ref={wormholeMaterialRef}
                        innerColor={new THREE.Color("#ffffff")}
                        outerColor={new THREE.Color("#3311bb")}
                        transparent
                        side={THREE.DoubleSide}
                    />
                </animated.mesh>

                {/* Energy particles */}
                <Sparkles
                    ref={sparklesRef}
                    count={200}
                    scale={size * 1.5}
                    size={3}
                    speed={active ? 2 : 0.5}
                    opacity={0.7}
                    color="#8866ff"
                />

                {/* Swirling particle trails */}
                {particles.map((particle, i) => (
                    <Trail
                        key={i}
                        width={1.5}
                        length={20}
                        color={active ? "#ffffff" : "#9955ff"}
                        attenuation={(t) => t * t}
                    >
                        <mesh
                            ref={(el) => (innerTrailsRef.current[i] = el)}
                            position={[particle.position.x, particle.position.y, particle.position.z]}
                        >
                            <sphereGeometry args={[0.2, 8, 8]} />
                            <meshBasicMaterial color={active ? "#ffffff" : "#aa77ff"} transparent opacity={0.7} />
                        </mesh>
                    </Trail>
                ))}

                {/* Portal destination text */}
                <animated.group position={[0, size * 1.2, 0]} opacity={textOpacity}>
                    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
                        <Text
                            ref={textRef}
                            fontSize={size * 0.15}
                            color="#ffffff"
                            anchorX="center"
                            anchorY="middle"
                            outlineWidth={0.05}
                            outlineColor="#000000"
                        >
                            {destination.toUpperCase()}
                        </Text>
                    </Float>
                </animated.group>
            </animated.group>

            {/* Transportation effect */}
            {transported && (
                <mesh position={[0, 0, 50]}>
                    <planeGeometry args={[2000, 2000]} />
                    <meshBasicMaterial
                        color="white"
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    );
};

export default WormholePortal; 