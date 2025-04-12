import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CosmicAurora = ({
  position = [0, -200, -600],
  size = 800,
  height = 400,
  intensity = 0.8,
  curtainCount = 5,
  colorScheme = "rainbow" // "rainbow", "greenblue", "purplepink"
}) => {
  const auroraRef = useRef();
  const curtainRefs = useRef([]);

  // Set up color palette based on scheme
  const colors = useMemo(() => {
    switch (colorScheme) {
      case "greenblue":
        return [
          new THREE.Color("#00ff88").multiplyScalar(intensity),
          new THREE.Color("#00ffff").multiplyScalar(intensity),
          new THREE.Color("#0088ff").multiplyScalar(intensity)
        ];
      case "purplepink":
        return [
          new THREE.Color("#ff00ff").multiplyScalar(intensity),
          new THREE.Color("#ff44aa").multiplyScalar(intensity),
          new THREE.Color("#aa00ff").multiplyScalar(intensity)
        ];
      case "rainbow":
      default:
        return [
          new THREE.Color("#ff0088").multiplyScalar(intensity),
          new THREE.Color("#ffaa00").multiplyScalar(intensity),
          new THREE.Color("#00ffaa").multiplyScalar(intensity),
          new THREE.Color("#00aaff").multiplyScalar(intensity),
          new THREE.Color("#aa00ff").multiplyScalar(intensity)
        ];
    }
  }, [colorScheme, intensity]);

  // Create the curtain shader material
  const auroraMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: colors[0] },
        color2: { value: colors[1] },
        color3: { value: colors[2] },
        noiseScale: { value: new THREE.Vector2(0.05, 0.1) },
        waveSpeed: { value: 0.2 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vElevation;
        uniform float time;
        
        // Simplex 3D Noise function
        vec4 permute(vec4 x) {
          return mod(((x*34.0)+1.0)*x, 289.0);
        }
        vec4 taylorInvSqrt(vec4 r) {
          return 1.79284291400159 - 0.85373472095314 * r;
        }
        
        float snoise(vec3 v) { 
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          // First corner
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          // Permutations
          i = mod(i, 289.0); 
          vec4 p = permute(permute(permute( 
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
          // Gradients
          float n_ = 1.0/7.0;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          // Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }
        
        void main() {
          vUv = uv;
          
          // Create vertical displacement based on noise
          float noiseValue = snoise(vec3(position.x * 0.01, position.z * 0.01, time * 0.1));
          
          // More pronounced at the top, fading to bottom
          float verticalFactor = position.y * 0.5 + 0.5; // Normalize to 0-1
          vElevation = noiseValue * verticalFactor;
          
          // Apply displacement to vertex
          vec3 newPosition = position;
          newPosition.y += vElevation * 40.0; // Vertical displacement
          
          // Sine wave movement along x
          float wave = sin(position.z * 0.02 + time * 0.5) * 10.0;
          newPosition.x += wave * verticalFactor;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform float time;
        uniform vec2 noiseScale;
        uniform float waveSpeed;
        
        varying vec2 vUv;
        varying float vElevation;
        
        // Noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          // Four corners
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          // Smooth interpolation
          vec2 u = f * f * (3.0 - 2.0 * f);
          
          return mix(a, b, u.x) +
                  (c - a) * u.y * (1.0 - u.x) +
                  (d - b) * u.x * u.y;
        }
        
        // Fractal Brownian Motion
        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          // Add several layers of noise
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(st * frequency);
            frequency *= 2.0;
            amplitude *= 0.5;
          }
          
          return value;
        }
        
        void main() {
          // Dynamic flow effect
          vec2 flowUv = vUv;
          flowUv.y -= time * waveSpeed;
          
          // Create flowing pattern with fbm
          float flow = fbm(flowUv * noiseScale.xy * 10.0);
          
          // Color based on height and flow pattern
          float t = vElevation * 0.5 + 0.5; // Normalize to 0-1
          t = clamp(t, 0.0, 1.0);
          
          // Blend between multiple colors - with softer transition
          vec3 color;
          if (t < 0.33) {
            color = mix(color1, color2, smoothstep(0.0, 0.33, t));
          } else if (t < 0.66) {
            color = mix(color2, color3, smoothstep(0.33, 0.66, t - 0.33));
          } else {
            color = mix(color3, color1, smoothstep(0.66, 1.0, t - 0.66));
          }
          
          // Add flowing effect - reduced intensity
          color += flow * 0.15;
          
          // Vary opacity based on height with more blending and lower max alpha
          float alpha = smoothstep(0.0, 0.4, vUv.y) * (0.2 + 0.6 * vElevation);
          alpha = clamp(alpha, 0.0, 0.7); // Cap max opacity lower
          
          // Add edge softening
          float edgeSoftness = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
          alpha *= edgeSoftness;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [colors]);

  // Create multiple curtains
  const curtains = useMemo(() => {
    const result = [];
    const curtainSpread = size / curtainCount;

    for (let i = 0; i < curtainCount; i++) {
      const offset = i * curtainSpread - size / 2 + curtainSpread / 2;

      // Calculate an offset to prevent identical wave patterns
      const timeOffset = i * 0.5;
      const widthVariation = 0.7 + Math.random() * 0.6; // 70-130% of standard width

      // Create a clone of the material with slightly different parameters
      const material = auroraMaterial.clone();
      material.uniforms.noiseScale.value.x *= (0.8 + Math.random() * 0.4);
      material.uniforms.waveSpeed.value = 0.1 + Math.random() * 0.2;
      material.uniforms.time.value = timeOffset;

      // Alternate between main colors for varied curtains
      const colorIndex = i % colors.length;
      material.uniforms.color1.value = colors[colorIndex];
      material.uniforms.color2.value = colors[(colorIndex + 1) % colors.length];
      material.uniforms.color3.value = colors[(colorIndex + 2) % colors.length];

      result.push({
        position: [offset, 0, 0],
        scale: [widthVariation, 1, 1],
        rotation: [0, Math.random() * 0.2 - 0.1, 0],
        material,
        timeOffset
      });
    }

    return result;
  }, [curtainCount, auroraMaterial, colors, size]);

  // Animate the aurora curtains
  useFrame((state, delta) => {
    if (auroraRef.current) {
      auroraRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.03) * 0.05;
    }

    curtainRefs.current.forEach((ref, i) => {
      if (ref && ref.material.uniforms) {
        // Update time for each curtain's shader
        ref.material.uniforms.time.value += delta * 0.5;

        // Subtle swaying motion
        const curtain = curtains[i];
        const rotationY = Math.sin(state.clock.elapsedTime * 0.1 + curtain.timeOffset) * 0.1;
        ref.rotation.y = rotationY;
      }
    });
  });

  return (
    <group ref={auroraRef} position={position}>
      {curtains.map((curtain, i) => (
        <mesh
          key={i}
          ref={el => curtainRefs.current[i] = el}
          position={curtain.position}
          rotation={curtain.rotation}
          scale={curtain.scale}
        >
          <planeGeometry args={[size / curtainCount, height, 32, 128]} />
          <primitive object={curtain.material} attach="material" />
        </mesh>
      ))}

      {/* Add central light source for the aurora */}
      <pointLight
        position={[0, height * 0.3, 0]}
        color={colors[0]}
        intensity={2}
        distance={500}
        decay={3}
      />
    </group>
  );
};

export default CosmicAurora; 