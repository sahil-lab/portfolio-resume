import React, { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const GalacticRadar = ({ position = [0, -150, 150], radius = 50, opacity = 0.7 }) => {
    const { scene } = useThree();
    const groupRef = useRef();
    const radarRef = useRef();
    const scanRef = useRef();
    const [celestialObjects, setCelestialObjects] = useState([]);
    const [scanning, setScanning] = useState(true);

    // Create radar line material
    const radarLineMaterial = useMemo(() => {
        return new THREE.LineBasicMaterial({
            color: "#00ff88",
            transparent: true,
            opacity: 0.8,
        });
    }, []);

    // Create radar scan material with custom shader
    const scanMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color("#00ff88") },
                time: { value: 0 },
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5);
          float dist = distance(vUv, center);
          
          // Rotating scan line
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float scanAngle = mod(time * 1.0, 6.28); // Full rotation 
          float scanWidth = 0.3;
          float scanLine = smoothstep(scanAngle - scanWidth, scanAngle, angle) * 
                          (1.0 - smoothstep(scanAngle, scanAngle + 0.05, angle));
                          
          // Grid pattern
          float gridX = mod(vUv.x * 20.0, 1.0);
          float gridY = mod(vUv.y * 20.0, 1.0);
          float grid = max(
            smoothstep(0.95, 0.98, gridX) + smoothstep(0.95, 0.98, gridY),
            0.0
          );
          
          // Circular rings
          float ring1 = smoothstep(0.32, 0.33, dist) * (1.0 - smoothstep(0.33, 0.34, dist));
          float ring2 = smoothstep(0.65, 0.66, dist) * (1.0 - smoothstep(0.66, 0.67, dist));
          float ring3 = smoothstep(0.98, 0.99, dist) * (1.0 - smoothstep(0.99, 1.0, dist));
          float rings = ring1 + ring2 + ring3;
          
          // Edge fade
          float edge = 1.0 - smoothstep(0.9, 1.0, dist);
          
          // Combine effects
          float alpha = max(scanLine * 0.5, max(grid * 0.3, rings)) * edge;
          
          gl_FragColor = vec4(color, alpha * 0.7);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
    }, []);

    // Scan for celestial objects in the scene
    const scanForObjects = () => {
        // This function would ideally discover objects dynamically
        // For demo purposes, we'll create some fixed blips
        const randomBlips = [];
        const count = 12;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 0.9;
            const x = Math.cos(angle) * dist * radius * 0.8;
            const z = Math.sin(angle) * dist * radius * 0.8;

            randomBlips.push({
                id: `blip-${i}`,
                position: new THREE.Vector3(x, 0, z),
                size: Math.random() * 2 + 1,
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.4, 0.8, 0.6),
                pulse: Math.random(),
            });
        }

        setCelestialObjects(randomBlips);
    };

    // Initialize the radar
    useMemo(() => {
        scanForObjects();

        // Set up a timer to periodically rescan
        const interval = setInterval(() => {
            if (scanning) {
                scanForObjects();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [scanning]);

    // Animate the radar
    useFrame((state, delta) => {
        if (scanRef.current) {
            // Update scan shader time
            scanRef.current.material.uniforms.time.value += delta;
        }

        if (groupRef.current) {
            // Slight floating movement
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 3;
            // Slow rotation
            groupRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Base plate */}
            <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[radius * 1.1, radius * 1.2, 10, 32]} />
                <meshStandardMaterial
                    color="#223344"
                    metalness={0.8}
                    roughness={0.3}
                />
            </mesh>

            {/* Holographic display */}
            <group position={[0, 10, 0]}>
                {/* Main radar disc */}
                <mesh ref={radarRef} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[radius, 64]} />
                    <primitive object={scanMaterial} attach="material" />
                </mesh>

                {/* Blips representing celestial objects */}
                {celestialObjects.map((obj) => (
                    <mesh
                        key={obj.id}
                        position={[obj.position.x, 1, obj.position.z]}
                    >
                        <sphereGeometry args={[obj.size, 16, 16]} />
                        <meshBasicMaterial
                            color={obj.color}
                            transparent
                            opacity={0.8}
                            blending={THREE.AdditiveBlending}
                        />
                    </mesh>
                ))}

                {/* Central indicator */}
                <mesh position={[0, 1, 0]}>
                    <sphereGeometry args={[3, 16, 16]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.9}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* Outer ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[radius * 0.98, radius, 64]} />
                    <meshBasicMaterial
                        color="#00ff88"
                        transparent
                        opacity={0.8}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>

            {/* Radar stand */}
            <mesh position={[0, -25, 0]}>
                <cylinderGeometry args={[radius * 0.1, radius * 0.2, 30, 8]} />
                <meshStandardMaterial
                    color="#334455"
                    metalness={0.7}
                    roughness={0.2}
                />
            </mesh>

            {/* Light source for effect */}
            <pointLight
                position={[0, 30, 0]}
                color="#00ff88"
                intensity={1}
                distance={100}
                decay={2}
            />
        </group>
    );
};

export default GalacticRadar; 