import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, Trail } from "@react-three/drei";
import * as THREE from "three";

const CelestialBridge = ({
    startPoint = [-350, 50, -300],
    endPoint = [350, 100, -400],
    width = 20,
    segments = 100,
    flowSpeed = 0.5,
    colorIntensity = 0.8
}) => {
    const bridgeRef = useRef();
    const pathRef = useRef();
    const energyRef = useRef();

    // Calculate a smooth curve between start and end points
    const { curve, points } = useMemo(() => {
        // Add control points to create a graceful arc
        const midPoint = [
            (startPoint[0] + endPoint[0]) / 2,
            Math.max(startPoint[1], endPoint[1]) + 150, // Arc upward
            (startPoint[2] + endPoint[2]) / 2
        ];

        // Create control points for a more natural curve
        const ctrlPoint1 = [
            startPoint[0] * 0.7 + midPoint[0] * 0.3,
            startPoint[1] * 0.3 + midPoint[1] * 0.7,
            startPoint[2] * 0.7 + midPoint[2] * 0.3
        ];

        const ctrlPoint2 = [
            midPoint[0] * 0.3 + endPoint[0] * 0.7,
            midPoint[1] * 0.7 + endPoint[1] * 0.3,
            midPoint[2] * 0.3 + endPoint[2] * 0.7
        ];

        // Create a cubic bezier curve
        const curvePoints = [
            new THREE.Vector3(...startPoint),
            new THREE.Vector3(...ctrlPoint1),
            new THREE.Vector3(...ctrlPoint2),
            new THREE.Vector3(...endPoint)
        ];

        const curve = new THREE.CubicBezierCurve3(...curvePoints);

        // Sample points along the curve
        const points = curve.getPoints(segments);

        return { curve, points };
    }, [startPoint, endPoint, segments]);

    // Create material for the flowing energy effect
    const energyMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color("#ff00ff").multiplyScalar(colorIntensity) },
                color2: { value: new THREE.Color("#00ffff").multiplyScalar(colorIntensity) },
                color3: { value: new THREE.Color("#ffff00").multiplyScalar(colorIntensity) }
            },
            vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        
        varying vec2 vUv;
        
        // Simple noise function
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Flow animation along the bridge
          float flowOffset = mod(vUv.x - time * 0.2, 1.0);
          
          // Multiple color bands flowing with softer, more circular transitions
          float band1 = smoothstep(0.05, 0.3, flowOffset) * (1.0 - smoothstep(0.3, 0.55, flowOffset));
          float band2 = smoothstep(0.35, 0.6, flowOffset) * (1.0 - smoothstep(0.6, 0.85, flowOffset));
          float band3 = smoothstep(0.65, 0.9, flowOffset) * (1.0 - smoothstep(0.9, 1.15, flowOffset));
          
          // Add some noise for texture - reduced for smoother appearance
          float noiseValue = noise(vUv * 8.0 + time * 0.05) * 0.1;
          
          // Create a more circular/rounded edge glow effect instead of rectangular
          float distFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
          float edgeGlow = 1.0 - smoothstep(0.5, 1.0, distFromCenter);
          edgeGlow = pow(edgeGlow, 3.0) + 0.03;
          
          // Combine colors
          vec3 finalColor = 
            color1 * band1 +
            color2 * band2 +
            color3 * band3;
          
          // Add noise and apply edge glow with reduced intensity
          finalColor += noiseValue * edgeGlow * 0.6;
          
          // Fade at the ends of the bridge with smoother transition
          float fadeEnds = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x));
          
          // Further reduced overall opacity for more transparency
          gl_FragColor = vec4(finalColor, edgeGlow * fadeEnds * 0.4);
        }
      `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
    }, [colorIntensity]);

    // Animate the energy flow
    useFrame((state, delta) => {
        if (energyRef.current) {
            energyRef.current.material.uniforms.time.value += delta * flowSpeed;
        }

        if (bridgeRef.current) {
            // Subtle movement
            bridgeRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.02;
            bridgeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.03) * 0.01;
        }
    });

    // Create a tube geometry along the curve
    const tubeGeometry = useMemo(() => {
        return new THREE.TubeGeometry(curve, segments, width / 75, 8, false);
    }, [curve, segments, width]);

    return (
        <group ref={bridgeRef}>
            {/* Main energy stream */}
            <mesh ref={energyRef} geometry={tubeGeometry}>
                <primitive object={energyMaterial} attach="material" />
            </mesh>

            {/* Path points for reference - reduced opacity */}
            <line ref={pathRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                        count={points.length}
                        itemSize={3}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </line>

            {/* Particle effects along the bridge - reduced count and opacity */}
            <group>
                {[0.2, 0.4, 0.6, 0.8].map((pos, i) => {
                    const point = curve.getPointAt(pos);
                    return (
                        <Sparkles
                            key={i}
                            position={[point.x, point.y, point.z]}
                            count={20}
                            scale={width * 0.15}
                            size={0.09}
                            speed={0.3}
                            noise={0.5}
                            opacity={0.3}
                            color={i % 2 === 0 ? "#ff88ff" : "#88ffff"}
                        />
                    );
                })}
            </group>

            {/* Energy pulses moving along the bridge */}
            <EnergyPulses curve={curve} width={width} count={3} />

            {/* Light sources at key points - further reduced intensity for softer effect */}
            <pointLight position={curve.getPointAt(0.2).toArray()} color="#ff00ff" intensity={1} distance={300} decay={3} />
            <pointLight position={curve.getPointAt(0.5).toArray()} color="#00ffff" intensity={1} distance={300} decay={3} />
            <pointLight position={curve.getPointAt(0.8).toArray()} color="#ffff00" intensity={1} distance={300} decay={3} />
        </group>
    );
};

// Energy pulses that travel along the bridge
const EnergyPulses = ({ curve, width, count }) => {
    const pulsesRef = useRef([]);
    const pulseData = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            position: i / count,
            speed: 0.2 + Math.random() * 0.3,
            size: width * (0.015 + Math.random() * 0.025),
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.7)
        }));
    }, [count, width]);

    useFrame((state, delta) => {
        pulseData.forEach((pulse, i) => {
            // Move pulse along the curve
            pulse.position = (pulse.position + delta * pulse.speed) % 1;

            // Update pulse mesh position
            if (pulsesRef.current[i]) {
                const point = curve.getPointAt(pulse.position);
                pulsesRef.current[i].position.copy(point);
            }
        });
    });

    return (
        <>
            {pulseData.map((pulse, i) => (
                <Trail
                    key={i}
                    width={pulse.size}
                    length={8}
                    color={pulse.color.getStyle()}
                    attenuation={(t) => t * t}
                >
                    <mesh ref={el => pulsesRef.current[i] = el}>
                        <sphereGeometry args={[pulse.size / 2, 16, 16]} />
                        <meshBasicMaterial color={pulse.color} transparent opacity={0.6} />
                    </mesh>
                </Trail>
            ))}
        </>
    );
};

export default CelestialBridge; 