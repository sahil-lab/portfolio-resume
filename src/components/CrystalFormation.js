import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const CrystalFormation = ({
    position = [300, -100, -100],
    count = 8,
    radius = 50,
    height = 100
}) => {
    const groupRef = useRef();
    const crystalRefs = useRef([]);
    const glowRefs = useRef([]);

    // Generate crystal data
    const crystalData = useMemo(() => {
        const crystals = [];

        // Create main central crystal
        crystals.push({
            position: [0, height * 0.25, 0],
            rotation: [0, 0, 0],
            scale: [1, 2, 1],
            size: height * 0.3,
            color: new THREE.Color("#88ccff"),
            glowColor: new THREE.Color("#55aaff"),
            glowIntensity: 2,
            pulseSpeed: 0.5,
            isMainCrystal: true
        });

        // Create surrounding crystals
        for (let i = 1; i < count; i++) {
            // Position in circle with random variation
            const angle = (i / (count - 1)) * Math.PI * 2;
            const distanceFromCenter = radius * (0.6 + Math.random() * 0.4);
            const x = Math.cos(angle) * distanceFromCenter;
            const z = Math.sin(angle) * distanceFromCenter;

            // Random height
            const y = Math.random() * height * 0.3;

            // Random rotation
            const rotationY = Math.random() * Math.PI * 2;

            // Random inclination (tilt the crystal)
            const tiltX = (Math.random() - 0.5) * 0.6;
            const tiltZ = (Math.random() - 0.5) * 0.6;

            // Random size variation
            const sizeVariation = 0.5 + Math.random() * 1;

            // Color variation from blue to purple
            const hue = 0.6 + Math.random() * 0.15;
            const saturation = 0.6 + Math.random() * 0.4;
            const lightness = 0.5 + Math.random() * 0.3;
            const crystalColor = new THREE.Color().setHSL(hue, saturation, lightness);

            // Glow color (slightly shifted hue)
            const glowHue = hue + (Math.random() * 0.1 - 0.05);
            const glowColor = new THREE.Color().setHSL(glowHue, saturation, lightness + 0.2);

            crystals.push({
                position: [x, y, z],
                rotation: [tiltX, rotationY, tiltZ],
                scale: [1, sizeVariation, 1],
                size: 10 + Math.random() * 15,
                color: crystalColor,
                glowColor: glowColor,
                glowIntensity: 1 + Math.random(),
                pulseSpeed: 0.2 + Math.random() * 0.6
            });
        }

        return crystals;
    }, [count, radius, height]);

    // Crystal material with refraction and internal glow
    const crystalMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color("#88ccff") },
                glowColor: { value: new THREE.Color("#55aaff") },
                time: { value: 0 },
                glowIntensity: { value: 1.5 },
                refractionRatio: { value: 0.985 },
                fresnelBias: { value: 0.1 },
                fresnelScale: { value: 1.0 },
                fresnelPower: { value: 2.0 }
            },
            vertexShader: `
        uniform float time;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 mvPosition = viewMatrix * worldPosition;
          vViewPosition = -mvPosition.xyz;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        uniform vec3 color;
        uniform vec3 glowColor;
        uniform float time;
        uniform float glowIntensity;
        uniform float refractionRatio;
        uniform float fresnelBias;
        uniform float fresnelScale;
        uniform float fresnelPower;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        float fresnel(vec3 viewDirection, vec3 normal) {
          return fresnelBias + fresnelScale * pow(1.0 + dot(viewDirection, normal), fresnelPower);
        }
        
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }
        
        void main() {
          // Normalize view and normal vectors
          vec3 viewDirection = normalize(vViewPosition);
          vec3 normal = normalize(vNormal);
          
          // Calculate fresnel term for edge glow
          float fresnelTerm = fresnel(viewDirection, normal);
          
          // Internal energy effect
          vec3 energyPos = vec3(vUv * 20.0, time * 0.2);
          float energyNoise = noise(energyPos);
          
          // Energy veins inside crystal
          float veins = smoothstep(0.4, 0.6, 
            sin(vUv.x * 20.0 + time) * 
            sin(vUv.y * 20.0 + time * 0.7)
          );
          
          // Combine base color with fresnel effect
          vec3 finalColor = mix(color, glowColor, fresnelTerm);
          
          // Add energy patterns inside
          finalColor += glowColor * energyNoise * 0.2 * (1.0 - fresnelTerm);
          finalColor += glowColor * veins * 0.3;
          
          // Pulse intensity
          float pulse = 0.8 + 0.2 * sin(time * 1.5);
          
          // Final color with fresnel-based alpha for transparency at edges
          float alpha = min(0.95, mix(0.6, 0.95, 1.0 - fresnelTerm));
          
          gl_FragColor = vec4(finalColor * pulse * glowIntensity, alpha);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }, []);

    // Create outer glow material
    const glowMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color("#55aaff") },
                time: { value: 0 },
                intensity: { value: 1.0 }
            },
            vertexShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 glowColor;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;
        
        void main() {
          // Radial gradient for glow effect
          float dist = distance(vUv, vec2(0.5, 0.5));
          float radialGradient = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Pulsating effect
          float pulse = 0.7 + 0.3 * sin(time * 2.0);
          
          // Final color
          vec3 finalColor = glowColor * radialGradient * pulse * intensity;
          float alpha = radialGradient * 0.7 * pulse;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });
    }, []);

    // Animate crystals
    useFrame((state, delta) => {
        // Rotate the entire formation slowly
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05;
        }

        // Update crystal materials
        crystalRefs.current.forEach((crystal, i) => {
            if (crystal && crystal.material.uniforms) {
                const data = crystalData[i];

                // Update time uniform for animation
                crystal.material.uniforms.time.value += delta * data.pulseSpeed;

                // Apply breathing scale effect
                const pulseFactor = 1 + Math.sin(state.clock.elapsedTime * data.pulseSpeed) * 0.03;
                crystal.scale.x = data.scale[0] * pulseFactor;
                crystal.scale.y = data.scale[1] * pulseFactor;
                crystal.scale.z = data.scale[2] * pulseFactor;
            }
        });

        // Update glow materials
        glowRefs.current.forEach((glow, i) => {
            if (glow && glow.material.uniforms) {
                const data = crystalData[i];
                glow.material.uniforms.time.value += delta * data.pulseSpeed;
            }
        });
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Base surface - a metallic reflective disc */}
            <mesh position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[radius * 1.2, radius * 1.5, 20, 32]} />
                <meshStandardMaterial
                    color="#335577"
                    metalness={0.9}
                    roughness={0.2}
                    envMapIntensity={0.8}
                />
            </mesh>

            {/* Crystal formations */}
            {crystalData.map((crystal, i) => {
                // Create a clone of the material for this crystal
                const material = crystalMaterial.clone();
                material.uniforms.color.value = crystal.color;
                material.uniforms.glowColor.value = crystal.glowColor;
                material.uniforms.glowIntensity.value = crystal.glowIntensity;

                const glowMat = glowMaterial.clone();
                glowMat.uniforms.glowColor.value = crystal.glowColor;
                glowMat.uniforms.intensity.value = crystal.glowIntensity;

                return (
                    <group key={i} position={crystal.position} rotation={crystal.rotation}>
                        {/* Crystal */}
                        <mesh
                            ref={el => crystalRefs.current[i] = el}
                            scale={crystal.scale}
                        >
                            <octahedronGeometry args={[crystal.size, 0]} />
                            <primitive object={material} attach="material" />
                        </mesh>

                        {/* Outer glow */}
                        <mesh
                            ref={el => glowRefs.current[i] = el}
                            scale={[crystal.scale[0] * 1.2, crystal.scale[1] * 1.2, crystal.scale[2] * 1.2]}
                        >
                            <octahedronGeometry args={[crystal.size, 0]} />
                            <primitive object={glowMat} attach="material" />
                        </mesh>

                        {/* Point light for each major crystal */}
                        {(crystal.isMainCrystal || Math.random() > 0.5) && (
                            <pointLight
                                color={crystal.glowColor}
                                intensity={crystal.glowIntensity * 3}
                                distance={100}
                                decay={2}
                            />
                        )}
                    </group>
                );
            })}

            {/* Sparkles around crystals */}
            <Sparkles
                count={100}
                scale={[radius * 2, height, radius * 2]}
                size={1.5}
                speed={0.2}
                opacity={0.7}
                color="#aaddff"
            />

            {/* Additional light sources */}
            <pointLight
                position={[0, height * 0.5, 0]}
                color="#88ccff"
                intensity={5}
                distance={200}
                decay={2}
            />
        </group>
    );
};

export default CrystalFormation; 