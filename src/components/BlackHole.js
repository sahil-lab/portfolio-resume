import React, { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles, Trail, useCursor } from "@react-three/drei";
import { BlackHoleMaterial } from "./ShaderMaterials";
import { useSpring, animated } from "@react-spring/three";

const BlackHole = ({ position = [-400, -300, -100], size = 30, strength = 1.0 }) => {
    // References for animation and interaction
    const blackHoleRef = useRef();
    const blackHoleMaterialRef = useRef();
    const diskRef = useRef();
    const gravityFieldRef = useRef();
    const orbitalParticlesRef = useRef([]);

    // Visual and interactive states
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);
    const [showGravityField, setShowGravityField] = useState(false);

    // Floating objects that will be affected by the black hole
    const [affectedObjects, setAffectedObjects] = useState([]);

    // Use cursor change on hover
    useCursor(hovered);

    // Get scene for interaction
    const { scene, camera } = useThree();

    // Animation springs
    const { blackHoleScale, diskRotation, diskScale, gravityOpacity } = useSpring({
        blackHoleScale: hovered ? 1.1 : 1,
        diskRotation: active ? Math.PI * 4 : 0,
        diskScale: active ? 1.2 : 1,
        gravityOpacity: showGravityField ? 0.15 : 0,
        config: { mass: 2, tension: 400, friction: 40 }
    });

    // Create orbital dust particles
    const particles = useMemo(() => {
        return Array(30).fill().map(() => ({
            baseRadius: THREE.MathUtils.randFloat(size * 1.5, size * 3),
            radiusVariation: THREE.MathUtils.randFloat(0.8, 1.2),
            speed: THREE.MathUtils.randFloat(0.2, 0.5) * (Math.random() > 0.5 ? 1 : -1),
            size: THREE.MathUtils.randFloat(0.2, 0.8),
            angle: Math.random() * Math.PI * 2,
            verticalOffset: THREE.MathUtils.randFloatSpread(size * 0.5),
            color: new THREE.Color().setHSL(
                Math.random() * 0.1 + 0.05, // Orange-red hue
                0.8,
                THREE.MathUtils.randFloat(0.5, 0.8)
            ),
            trailLength: THREE.MathUtils.randInt(5, 20),
            startTime: Math.random() * 100
        }));
    }, [size]);

    // Create gravity lines for visualization (radial pattern)
    const gravityLines = useMemo(() => {
        return Array(72).fill().map((_, i) => {
            const angle = (i / 72) * Math.PI * 2;
            const startDistance = size * 0.5;
            const endDistance = size * 5;

            const startX = Math.cos(angle) * startDistance;
            const startY = Math.sin(angle) * startDistance;

            const endX = Math.cos(angle) * endDistance;
            const endY = Math.sin(angle) * endDistance;

            return {
                start: new THREE.Vector3(startX, startY, 0),
                end: new THREE.Vector3(endX, endY, 0),
                thickness: THREE.MathUtils.randFloat(0.05, 0.2),
                speed: THREE.MathUtils.randFloat(0.1, 0.3)
            };
        });
    }, [size]);

    // Toggle gravity field visualization
    const toggleGravityField = () => {
        setShowGravityField(!showGravityField);
    };

    // Initialize keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === "g") {
                toggleGravityField();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showGravityField]);

    // Find objects in the scene that can be affected by gravity
    useEffect(() => {
        // Find objects to affect with gravity within a certain range
        const objectsToAffect = [];

        scene.traverse((object) => {
            // Only select meshes that aren't part of the black hole
            if (
                object.isMesh &&
                !object.userData.isBlackHole &&
                !object.userData.isBlackHolePart
            ) {
                const distance = new THREE.Vector3(...position).distanceTo(object.position);

                // Only affect objects within range
                if (distance < size * 10) {
                    objectsToAffect.push({
                        object,
                        originalPosition: object.position.clone(),
                        distance
                    });
                }
            }
        });

        setAffectedObjects(objectsToAffect);

        // Mark black hole components to avoid self-interaction
        if (blackHoleRef.current) {
            blackHoleRef.current.userData.isBlackHole = true;
            blackHoleRef.current.traverse((child) => {
                if (child.isMesh) {
                    child.userData.isBlackHolePart = true;
                }
            });
        }
    }, [scene, position, size]);

    // Activate the black hole
    const activateBlackHole = () => {
        setActive(true);

        // Play sound effect - commented out to avoid errors
        // const blackHoleSound = new Audio("/sounds/black_hole.mp3");
        // blackHoleSound.volume = 0.7;
        // blackHoleSound.play();

        console.log("Black hole activation sound effect would play");

        // Reset after animation
        setTimeout(() => {
            setActive(false);
        }, 5000);
    };

    // Animation loop
    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();

        // Update black hole material
        if (blackHoleMaterialRef.current) {
            blackHoleMaterialRef.current.time = time;
            blackHoleMaterialRef.current.distortionStrength = active ? 5.0 : 3.0;
            blackHoleMaterialRef.current.accretionDiskSize = active ? 0.9 : 0.8;
        }

        // Animate orbital dust particles
        particles.forEach((particle, i) => {
            if (orbitalParticlesRef.current[i]) {
                // Calculate dynamic radius with time variation
                const particleTime = time + particle.startTime;
                const radiusPulse = 1 + 0.1 * Math.sin(particleTime * 0.5);
                const radius = particle.baseRadius * particle.radiusVariation * radiusPulse;

                // Accelerate during active state
                const speedMultiplier = active ? 2.5 : 1.0;

                // Update angle
                particle.angle += delta * particle.speed * speedMultiplier;

                // Calculate new position
                const x = Math.cos(particle.angle) * radius;
                const y = Math.sin(particle.angle) * radius;
                const z = particle.verticalOffset * (active ? 0.5 : 1.0); // Flatten during active state

                // Apply position
                orbitalParticlesRef.current[i].position.set(x, y, z);

                // Make particles spiral inward during active state
                if (active) {
                    particle.baseRadius = Math.max(
                        size * 0.6,
                        particle.baseRadius - delta * 10 * (1 + Math.random())
                    );
                } else {
                    // Gradually restore original radius when not active
                    particle.baseRadius += (particle.baseRadius < size * 1.5 ? 1 : -1) * delta * 2;
                }
            }
        });

        // Apply gravitational effect to nearby objects
        affectedObjects.forEach(({ object, originalPosition, distance }) => {
            if (object && object.position) {
                // Calculate direction to black hole
                const direction = new THREE.Vector3(...position).sub(object.position).normalize();

                // Base pull strength varies with distance (inverse square law)
                const distanceSquared = Math.max(1, object.position.distanceTo(new THREE.Vector3(...position)) ** 2);
                const pullStrength = (size * strength * 50) / distanceSquared;

                // Apply more force during active state
                const activeMultiplier = active ? 5 : 1;

                // Apply gravitational pull
                object.position.add(
                    direction.multiplyScalar(delta * pullStrength * activeMultiplier)
                );

                // Optional: add slight rotation to affected objects
                if (object.rotation) {
                    object.rotation.x += delta * pullStrength * 0.1;
                    object.rotation.y += delta * pullStrength * 0.1;
                }

                // If object gets too close, reset it (simulate destruction and recreation)
                if (object.position.distanceTo(new THREE.Vector3(...position)) < size * 0.8) {
                    // Teleport object far away in a random direction
                    const randomDir = new THREE.Vector3(
                        THREE.MathUtils.randFloatSpread(1),
                        THREE.MathUtils.randFloatSpread(1),
                        THREE.MathUtils.randFloatSpread(1)
                    ).normalize();

                    const resetDistance = THREE.MathUtils.randFloat(size * 8, size * 12);
                    object.position.copy(
                        new THREE.Vector3(...position).add(randomDir.multiplyScalar(resetDistance))
                    );
                }
            }
        });

        // Animate gravity visualization lines
        if (gravityFieldRef.current && showGravityField) {
            gravityFieldRef.current.children.forEach((line, i) => {
                if (line && line.scale && gravityLines[i]) {
                    // Pulse the lines
                    const pulse = (Math.sin(time * gravityLines[i].speed + i * 0.1) + 1) * 0.5;
                    const thickness = gravityLines[i].thickness * (1 + pulse);
                    line.scale.set(1, 1, thickness);

                    // Vary opacity based on black hole activity
                    line.material.opacity = 0.1 + 0.2 * pulse * (active ? 1.5 : 1);
                }
            });
        }

        // Optional: make the camera slightly affected by gravity too
        if (camera && active) {
            const camToBlackHole = new THREE.Vector3(...position).sub(camera.position);
            const distance = camToBlackHole.length();

            if (distance < size * 15) {
                const pullFactor = (size * 5) / (distance * distance) * delta;
                camera.position.add(camToBlackHole.normalize().multiplyScalar(pullFactor));
            }
        }
    });

    return (
        <animated.group
            ref={blackHoleRef}
            position={position}
            scale={blackHoleScale}
        >
            {/* Main black hole */}
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                onClick={activateBlackHole}
            >
                <sphereGeometry args={[size, 64, 64]} />
                <blackHoleMaterial
                    ref={blackHoleMaterialRef}
                    accretionColor={new THREE.Color("#ff3300")}
                    holeColor={new THREE.Color("#000000")}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Accretion disk */}
            <animated.mesh
                ref={diskRef}
                rotation-x={Math.PI / 2}
                rotation-z={diskRotation}
                scale={diskScale}
            >
                <ringGeometry args={[size * 0.8, size * 3, 64]} />
                <meshBasicMaterial
                    map={useMemo(() => {
                        // Create a procedural accretion disk texture
                        const canvas = document.createElement('canvas');
                        canvas.width = 1024;
                        canvas.height = 1024;
                        const ctx = canvas.getContext('2d');

                        // Fill with black background
                        ctx.fillStyle = 'black';
                        ctx.fillRect(0, 0, 1024, 1024);

                        // Create circular bands
                        for (let radius = 50; radius < 512; radius += 10) {
                            // Vary color based on radius
                            const brightness = Math.sin(radius * 0.05) * 0.5 + 0.5;
                            const r = Math.floor(255 * brightness);
                            const g = Math.floor(100 * brightness);
                            const b = Math.floor(50 * brightness);

                            ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                            ctx.lineWidth = 5 + Math.sin(radius * 0.1) * 2;

                            ctx.beginPath();
                            ctx.arc(512, 512, radius, 0, Math.PI * 2);
                            ctx.stroke();
                        }

                        // Add some hot spots
                        for (let i = 0; i < 200; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const dist = 100 + Math.random() * 400;
                            const x = 512 + Math.cos(angle) * dist;
                            const y = 512 + Math.sin(angle) * dist;
                            const radius = Math.random() * 15 + 5;

                            const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
                            glow.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
                            glow.addColorStop(1, 'rgba(255, 100, 50, 0)');

                            ctx.fillStyle = glow;
                            ctx.beginPath();
                            ctx.arc(x, y, radius, 0, Math.PI * 2);
                            ctx.fill();
                        }

                        // Create texture from canvas
                        const texture = new THREE.CanvasTexture(canvas);
                        texture.needsUpdate = true;
                        return texture;
                    }, [])}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                />
            </animated.mesh>

            {/* Orbital particles with trails */}
            {particles.map((particle, i) => (
                <Trail
                    key={i}
                    width={2}
                    length={particle.trailLength}
                    color={particle.color}
                    attenuation={(t) => t * t}
                >
                    <mesh
                        ref={(el) => (orbitalParticlesRef.current[i] = el)}
                        scale={particle.size}
                    >
                        <sphereGeometry args={[1, 8, 8]} />
                        <meshBasicMaterial color={particle.color} />
                    </mesh>
                </Trail>
            ))}

            {/* Central glow */}
            <Sparkles
                count={200}
                scale={size * 2}
                size={4}
                speed={1}
                opacity={0.7}
                color="#ff6600"
            />

            {/* Gravity field visualization (radial lines) */}
            <animated.group ref={gravityFieldRef} opacity={gravityOpacity}>
                {gravityLines.map((line, i) => (
                    <mesh key={i} position={[0, 0, 0]}>
                        <meshBasicMaterial
                            color="#88aaff"
                            transparent
                            opacity={0.2}
                            blending={THREE.AdditiveBlending}
                        />
                        <boxGeometry args={[
                            line.end.distanceTo(line.start),
                            0.5,
                            line.thickness
                        ]} />
                        {/* Position and orient the line */}
                        {useMemo(() => {
                            const mesh = new THREE.Mesh();
                            mesh.position.copy(line.start.clone().add(line.end).multiplyScalar(0.5));
                            mesh.lookAt(line.end);
                            return null;
                        }, [line])}
                    </mesh>
                ))}
            </animated.group>

            {/* Label */}
            {hovered && (
                <group position={[0, size * 1.5, 0]}>
                    <mesh>
                        <planeGeometry args={[size * 2, size * 0.5]} />
                        <meshBasicMaterial color="black" transparent opacity={0.7} />
                    </mesh>
                    <sprite position={[0, 0, 0.1]} scale={[size * 2, size * 0.4, 1]}>
                        <spriteMaterial color="#ff3300" transparent opacity={0.9} />
                    </sprite>
                </group>
            )}
        </animated.group>
    );
};

export default BlackHole; 