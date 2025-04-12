import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const SpiralGalaxy = ({
    position = [-500, 200, -800],
    radius = 300,
    numStars = 10000,
    numArms = 5,
    armWidth = 0.3
}) => {
    const galaxyRef = useRef();
    const starsRef = useRef();
    const nebulaRef = useRef();
    const coreRef = useRef();
    const coreLightRef = useRef();

    // Calculate core size proportional to radius
    const coreSize = radius * 0.08;
    const coreGlowSize = coreSize * 2;

    // Generate star particles for the galaxy
    const { starPositions, starColors, starSizes } = useMemo(() => {
        const positions = new Float32Array(numStars * 3);
        const colors = new Float32Array(numStars * 3);
        const sizes = new Float32Array(numStars);

        // Enhanced color palette for more dramatic appearance
        const centerColor = new THREE.Color("#ffeecc").multiplyScalar(1.5);

        // Multiple arm colors for more variation and visual interest
        const armColors = [
            new THREE.Color("#ff8844").multiplyScalar(1.2), // Orange
            new THREE.Color("#4488ff").multiplyScalar(1.2), // Blue
            new THREE.Color("#ff44aa").multiplyScalar(1.2), // Magenta
            new THREE.Color("#44ffaa").multiplyScalar(1.2), // Teal
            new THREE.Color("#ffdd22").multiplyScalar(1.2), // Yellow
            new THREE.Color("#aa44ff").multiplyScalar(1.2), // Purple
            new THREE.Color("#22ffdd").multiplyScalar(1.2)  // Cyan
        ];

        const armAngleStep = (2 * Math.PI) / numArms;

        // Calculate spiral tightness based on number of arms
        const spiralFactor = 2.5 + (numArms * 0.1);

        for (let i = 0; i < numStars; i++) {
            // Each star has a distance from center
            // Use a non-linear distribution to create denser arms
            let dist;
            if (i % 10 === 0) {
                // 10% of stars concentrated in core
                dist = Math.random() * radius * 0.2;
            } else {
                // Power distribution concentrates more stars in interesting regions
                dist = Math.pow(Math.random(), 0.5) * radius;
            }
            const distFactor = dist / radius;

            // Random angle for spiral
            const angle = Math.random() * Math.PI * 2;

            // Choose closest arm angle
            const armIndex = Math.floor(angle / armAngleStep);
            const baseArmAngle = armIndex * armAngleStep;

            // Arm strength increases with distance from center
            const armStrength = Math.pow(distFactor, 1.5);

            // Stars closer to arm centers
            let perpOffset;
            if (Math.random() < armStrength * 0.8) {
                // Most stars close to arm centerline
                perpOffset = ((Math.random() * 2 - 1) * armWidth * 0.4 * (1 - Math.pow(armStrength, 1.5))) * dist;
            } else {
                // Some stars scattered more widely
                perpOffset = ((Math.random() * 2 - 1) * armWidth * (1 - Math.pow(armStrength, 0.8))) * dist;
            }

            // Apply spiral pattern
            const curvedArmAngle = baseArmAngle + spiralFactor * Math.pow(dist / radius, 0.8);

            // Apply position with spiral pattern and perpendicular offset
            const x = Math.cos(curvedArmAngle) * dist + Math.cos(curvedArmAngle + Math.PI / 2) * perpOffset;
            // Thin disc with slight thickness variation (thicker near arms)
            const y = (Math.random() * 2 - 1) * radius * (0.01 + 0.04 * Math.exp(-Math.abs(perpOffset) / (armWidth * dist * 0.3)));
            const z = Math.sin(curvedArmAngle) * dist + Math.sin(curvedArmAngle + Math.PI / 2) * perpOffset;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            // Color based on position in galaxy
            let starColor;

            // Enhanced coloring scheme
            if (dist < radius * 0.1) {
                // Core - yellowish white with variability
                starColor = centerColor.clone();
                const variation = 0.1 * Math.random();
                starColor.r = Math.min(1, starColor.r * (1 + variation));
                starColor.g = Math.min(1, starColor.g * (1 + variation * 0.5));
                starColor.b = Math.min(1, starColor.b * (1 - variation * 0.5));
            } else {
                // Arms - varied colors based on arm index
                const armColorIndex = armIndex % armColors.length;
                const nextArmColorIndex = (armIndex + 1) % armColors.length;

                // Positional variation within arm
                const distanceFromArmCenter = Math.abs(perpOffset) / (armWidth * dist);
                const posInArm = Math.pow(Math.max(0, 1 - distanceFromArmCenter * 2), 2);

                // Color mix between adjacent arms for smooth transitions
                const colorMix = Math.random() * 0.3 + (armIndex % 3) * 0.2;
                starColor = armColors[armColorIndex].clone().lerp(armColors[nextArmColorIndex], colorMix);

                // More saturated colors for stars in the arm center
                if (posInArm > 0.7) {
                    const saturationBoost = Math.pow(posInArm, 2) * 0.3;
                    starColor.r = Math.min(1, starColor.r * (1 + saturationBoost));
                    starColor.g = Math.min(1, starColor.g * (1 + saturationBoost));
                    starColor.b = Math.min(1, starColor.b * (1 + saturationBoost));
                }
            }

            // Intensity falls off from center, but with random variation for more natural look
            const baseIntensity = Math.max(0.2, 1 - distFactor * 0.8);
            const randomFactor = 0.7 + Math.random() * 0.6; // 70-130% random brightness
            const intensity = baseIntensity * randomFactor;
            starColor.multiplyScalar(intensity);

            colors[i * 3] = starColor.r;
            colors[i * 3 + 1] = starColor.g;
            colors[i * 3 + 2] = starColor.b;

            // Size varies - bigger in center, with size distribution based on distance and arm position
            const baseSize = 3 * (1 - Math.pow(distFactor, 1.5));
            const randomSize = 0.5 + Math.random() * 0.8;

            // Some larger stars randomly distributed
            const isBright = Math.random() < 0.01; // 1% chance
            const brightFactor = isBright ? 2 + Math.random() * 3 : 1;

            sizes[i] = Math.max(0.5, baseSize * randomSize * brightFactor);
        }

        return { starPositions: positions, starColors: colors, starSizes: sizes };
    }, [numStars, radius, numArms, armWidth]);

    // Enhanced nebula cloud material for galaxy arms
    const nebulaMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                baseColor1: { value: new THREE.Color("#ff4400").multiplyScalar(1.2) },
                baseColor2: { value: new THREE.Color("#5588ff").multiplyScalar(1.2) },
                baseColor3: { value: new THREE.Color("#ffcc00").multiplyScalar(1.2) },
            },
            vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Add subtle movement to nebulae
          float displacement = sin(position.x * 0.05 + time * 0.1) * cos(position.z * 0.05 + time * 0.1) * 2.0;
          mvPosition.y += displacement;
          
          // Dynamic size adjustment based on distance
          gl_PointSize = size * (1000.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        uniform float time;
        uniform vec3 baseColor1;
        uniform vec3 baseColor2;
        uniform vec3 baseColor3;
        varying vec3 vColor;
        
        // Simple noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Create circular points with soft edges
          float r = distance(gl_PointCoord, vec2(0.5));
          if (r > 0.5) discard;
          
          // Add dynamic texture
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float noise = random(uv * 0.5 + time * 0.1);
          
          // Create soft, glowing edge
          float alpha = 0.7 * (1.0 - smoothstep(0.2, 0.5, r));
          
          // Add internal structure to nebulae
          float pattern = 0.5 + 0.5 * sin(r * 15.0 - time * 0.2);
          
          // Mix colors for more visual interest
          vec3 finalColor = vColor + noise * 0.2 + pattern * 0.1;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, []);

    // Core glow material
    const coreGlowMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                coreColor: { value: new THREE.Color("#ffffff").multiplyScalar(1.5) },
                pulseFactor: { value: 1.0 }
            },
            vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float time;
        uniform vec3 coreColor;
        uniform float pulseFactor;
        
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
          // Radial gradient for core glow
          float dist = length(vUv - vec2(0.5, 0.5)) * 2.0;
          
          // Edge glow with soft falloff
          float edgeGlow = 1.0 - smoothstep(0.0, 1.0, dist);
          edgeGlow = pow(edgeGlow, 2.0);
          
          // Pulsating effect
          float pulse = pulseFactor * (1.0 + 0.2 * sin(time * 0.5));
          
          // Energy swirls
          float swirl = 0.5 + 0.5 * sin(dist * 20.0 - time * 0.3);
          
          // Combine effects
          vec3 finalColor = coreColor * (edgeGlow * pulse + swirl * 0.1);
          float alpha = edgeGlow * pulse;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }, []);

    // Generate enhanced nebula clouds for the arms
    const { nebulaPositions, nebulaColors, nebulaSizes } = useMemo(() => {
        // Scale number of nebulae with radius
        const numNebulae = Math.min(5000, Math.floor(radius / 10) * 20);
        const positions = new Float32Array(numNebulae * 3);
        const colors = new Float32Array(numNebulae * 3);
        const sizes = new Float32Array(numNebulae);

        // Enhanced color palette for nebulae
        const nebulaColors = [
            new THREE.Color("#ff4400").multiplyScalar(1.3), // Red-orange
            new THREE.Color("#5588ff").multiplyScalar(1.3), // Blue
            new THREE.Color("#ff44aa").multiplyScalar(1.3), // Pink
            new THREE.Color("#44ffaa").multiplyScalar(1.3), // Teal
            new THREE.Color("#ffcc22").multiplyScalar(1.3), // Yellow
            new THREE.Color("#aa44ff").multiplyScalar(1.3)  // Purple
        ];

        for (let i = 0; i < numNebulae; i++) {
            // More sophisticated placement for nebulae
            let dist, angle, offset;

            if (i % 20 === 0) {
                // Place 5% of nebulae randomly to create background structure
                dist = Math.random() * radius * 0.9 + radius * 0.1;
                angle = Math.random() * Math.PI * 2;
                offset = (Math.random() * 2 - 1) * radius * 0.2;
            } else {
                // Place nebulae mostly along spiral arms
                const armIndex = Math.floor(Math.random() * numArms);
                const armAngle = (armIndex / numArms) * Math.PI * 2;

                // Distance along arm (weighted distribution)
                dist = 0.2 * radius + Math.pow(Math.random(), 0.7) * radius * 0.8;

                // Spiral formula with proper curvature
                const spiralFactor = 2.5 + (numArms * 0.1);
                angle = armAngle + spiralFactor * Math.pow(dist / radius, 0.8);

                // Narrower distribution along arms
                const distFactor = dist / radius;
                const armWidth = 0.3 * (1 - 0.5 * Math.pow(distFactor, 0.5));
                offset = (Math.random() * 2 - 1) * armWidth * dist * 0.6;
            }

            positions[i * 3] = Math.cos(angle) * dist + Math.cos(angle + Math.PI / 2) * offset;
            // Very thin disc with slight variation
            positions[i * 3 + 1] = (Math.random() * 2 - 1) * radius * 0.015;
            positions[i * 3 + 2] = Math.sin(angle) * dist + Math.sin(angle + Math.PI / 2) * offset;

            // Enhanced color selection
            const colorChoice = Math.floor(Math.random() * nebulaColors.length);
            const nebColor = nebulaColors[colorChoice];

            // Vary the brightness more dramatically
            const brightness = 0.4 + Math.pow(Math.random(), 0.5) * 0.8;
            const color = nebColor.clone().multiplyScalar(brightness);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // More varied sizes for nebulae, larger in arms
            const baseSize = 30 + Math.random() * 70;
            const distFactor = dist / radius;

            // Larger nebulae in the arms, smaller in between
            const sizeFactor = Math.abs(offset) < dist * 0.2 ? 1.5 : 0.8;

            sizes[i] = baseSize * sizeFactor * (1 + 0.5 * Math.pow(distFactor, 0.5));
        }

        return { nebulaPositions: positions, nebulaColors: colors, nebulaSizes: sizes };
    }, [radius, numArms]);

    // Animate the galaxy with enhanced effects
    useFrame((state, delta) => {
        if (galaxyRef.current) {
            // Very slow rotation
            galaxyRef.current.rotation.y += delta * 0.01;

            // Gentle tilting animation
            const time = state.clock.elapsedTime;
            galaxyRef.current.rotation.x = Math.sin(time * 0.05) * 0.1 + 0.3;
            galaxyRef.current.rotation.z = Math.sin(time * 0.03) * 0.05;
        }

        if (nebulaRef.current?.material?.uniforms?.time) {
            nebulaRef.current.material.uniforms.time.value += delta;
        }

        // Animate core glow
        if (coreRef.current?.material?.uniforms) {
            coreRef.current.material.uniforms.time.value += delta;

            // Pulsating factor
            const pulseFactor = 1.0 + 0.1 * Math.sin(state.clock.elapsedTime * 0.3);
            coreRef.current.material.uniforms.pulseFactor.value = pulseFactor;

            // Also pulse the central light
            if (coreLightRef.current) {
                coreLightRef.current.intensity = 5 * pulseFactor;
            }
        }
    });

    // Create geometry for stars
    const starsGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        return geometry;
    }, [starPositions, starColors, starSizes]);

    // Create geometry for nebula clouds
    const nebulaGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));
        return geometry;
    }, [nebulaPositions, nebulaColors, nebulaSizes]);

    return (
        <group ref={galaxyRef} position={position} rotation={[0.3, 0, 0.1]}>
            {/* Star particles */}
            <points ref={starsRef} geometry={starsGeometry}>
                <pointsMaterial
                    size={1}
                    vertexColors
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>

            {/* Nebula clouds */}
            <points ref={nebulaRef} geometry={nebulaGeometry}>
                <primitive object={nebulaMaterial} attach="material" />
            </points>

            {/* Core glow - larger and more dramatic */}
            <mesh ref={coreRef} position={[0, 0, 0]}>
                <sphereGeometry args={[coreGlowSize, 64, 64]} />
                <primitive object={coreGlowMaterial} attach="material" />
            </mesh>

            {/* Bright core */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[coreSize, 64, 64]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.9}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Enhanced central light with greater intensity */}
            <pointLight
                ref={coreLightRef}
                position={[0, 0, 0]}
                color="#ffffff"
                intensity={5}
                distance={radius * 1.5}
                decay={2}
            />

            {/* Additional colored lights in the core */}
            <pointLight
                position={[coreSize * 0.5, 0, 0]}
                color="#ffaa44"
                intensity={2}
                distance={radius * 0.5}
                decay={2}
            />
            <pointLight
                position={[0, 0, coreSize * 0.5]}
                color="#4488ff"
                intensity={2}
                distance={radius * 0.5}
                decay={2}
            />

            {/* Additional particle effects around core */}
            <Sparkles
                count={500}
                scale={coreSize * 5}
                size={2}
                speed={0.3}
                opacity={0.7}
                color="#ffffff"
                noise={1.5}
            />

            {/* Distant background stars */}
            <Sparkles
                count={5000}
                scale={radius * 2}
                size={1}
                speed={0.1}
                opacity={0.5}
                noise={5}
            />

            {/* Colored light sources along arms */}
            {Array.from({ length: numArms }).map((_, i) => {
                const angle = (i / numArms) * Math.PI * 2;
                const distance = radius * 0.5;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                const color = new THREE.Color().setHSL(i / numArms, 0.8, 0.6);

                return (
                    <pointLight
                        key={i}
                        position={[x, 0, z]}
                        color={color}
                        intensity={1}
                        distance={radius * 0.7}
                        decay={2}
                    />
                );
            })}
        </group>
    );
};

export default SpiralGalaxy; 