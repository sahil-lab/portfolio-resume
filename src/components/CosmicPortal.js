import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const CosmicPortal = ({ position = [200, -100, -200], radius = 20, depth = 40 }) => {
    const portalRef = useRef();
    const vortexRef = useRef();
    const sparklesRef = useRef();
    const [hovered, setHovered] = useState(false);
    const [active, setActive] = useState(false);

    // Create a custom shader material for the portal vortex
    const PortalMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color("#3311bb").multiplyScalar(0.7) },
                color2: { value: new THREE.Color("#5533ff").multiplyScalar(0.7) },
                color3: { value: new THREE.Color("#aabbff").multiplyScalar(0.7) },
                intensity: { value: 0.7 }
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float intensity;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          // Calculate distance from center (0.5, 0.5)
          vec2 toCenter = vUv - vec2(0.5);
          float dist = length(toCenter);
          
          // Angle from center
          float angle = atan(toCenter.y, toCenter.x);
          
          // Create spiral pattern - use smoother sine function with less contrast
          float spiral = sin(dist * 20.0 - time * 2.0 + angle * 10.0) * 0.4 + 0.6;
          
          // Blend colors based on spiral with smoother transitions
          vec3 color = mix(color1, color2, smoothstep(0.3, 0.7, spiral));
          color = mix(color, color3, smoothstep(0.2, 0.8, pow(dist, 2.0) * 4.0));
          
          // Add subtle noise
          float noise = random(vUv * 10.0 + time * 0.1) * 0.08;
          
          // Softer center transition
          float alpha = smoothstep(0.0, 0.6, dist);
          alpha = alpha * (1.0 - smoothstep(0.4, 1.0, dist));
          
          // Apply softer edges with Gaussian-like falloff
          float edgeSoftness = exp(-dist * dist * 4.0);
          alpha = mix(alpha, alpha * edgeSoftness, 0.5);
          
          // Final alpha with reduced intensity and noise
          alpha = alpha * intensity + noise;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }, []);

    // Animation
    useFrame((state, delta) => {
        if (portalRef.current) {
            portalRef.current.rotation.z += delta * 0.2;
        }

        if (vortexRef.current) {
            // Update time uniform for shader animation
            vortexRef.current.material.uniforms.time.value += delta;

            // Increase intensity when hovered or active but with lower values
            vortexRef.current.material.uniforms.intensity.value = THREE.MathUtils.lerp(
                vortexRef.current.material.uniforms.intensity.value,
                hovered ? 1.0 : active ? 1.2 : 0.7,
                delta * 3
            );

            // Portal breathes with a slow pulse
            const pulseFactor = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1;
            vortexRef.current.scale.set(pulseFactor, pulseFactor, 1);
        }

        if (sparklesRef.current) {
            // Rotate sparkles
            sparklesRef.current.rotation.z -= delta * 0.1;
        }
    });

    // Handle interaction
    const handleClick = () => {
        setActive(!active);

        // Visual pulse effect when clicked
        if (vortexRef.current) {
            vortexRef.current.scale.set(1.5, 1.5, 1);

            // Reset scale after pulse
            setTimeout(() => {
                if (vortexRef.current) {
                    vortexRef.current.scale.set(1, 1, 1);
                }
            }, 200);
        }
    };

    return (
        <group
            position={position}
            ref={portalRef}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={handleClick}
        >
            {/* Portal ring */}
            <mesh>
                <torusGeometry args={[radius, radius * 0.1, 16, 64]} />
                <meshStandardMaterial
                    color="#6644ff"
                    emissive="#3322aa"
                    emissiveIntensity={1.5}
                    metalness={0.8}
                    roughness={0.3}
                />
            </mesh>

            {/* Vortex effect */}
            <mesh ref={vortexRef}>
                <circleGeometry args={[radius * 0.9, 64]} />
                <primitive object={PortalMaterial} attach="material" />
            </mesh>

            {/* Depth illusion - multiple layers creating depth */}
            {[...Array(5)].map((_, i) => (
                <mesh key={i} position={[0, 0, -i * (depth / 5)]}>
                    <circleGeometry args={[radius * (1 - i * 0.15), 32]} />
                    <meshBasicMaterial
                        color={new THREE.Color().setHSL(0.6 - i * 0.05, 0.8, 0.5 - i * 0.1)}
                        transparent
                        opacity={0.2}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}

            {/* Particle effects */}
            <Sparkles
                ref={sparklesRef}
                count={80}
                scale={radius * 2}
                size={1.2}
                speed={0.3}
                opacity={0.5}
                color="#aabbff"
            />

            {/* Center light */}
            <pointLight
                color="#5533ff"
                intensity={active ? 5 : hovered ? 3 : 1}
                distance={150}
                decay={2.5}
            />

            {/* Extra particles when active */}
            {active && (
                <Sparkles
                    count={200}
                    scale={radius * 3}
                    size={2}
                    speed={1}
                    opacity={0.8}
                    color="#ffffff"
                />
            )}
        </group>
    );
};

export default CosmicPortal; 