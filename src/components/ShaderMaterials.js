// src/App.js

import {
  shaderMaterial
} from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";
import glsl from "babel-plugin-glsl/macro";

// Import Logo Textures

// 1. OutlinesMaterial for object outlines
export const OutlinesMaterial = shaderMaterial(
  {
    thickness: 0.05,
    color: new THREE.Color("white"),
    opacity: 1.0,
    time: 0.0,
    pulseSpeed: 0.5,
    pulseIntensity: 0.2,
    pulseEnabled: false,
  },
  // Vertex shader
  glsl`
      uniform float thickness;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec3 pos = position + normal * thickness;
            vec4 modelViewPosition = modelViewMatrix * vec4(pos, 1.0);
            vViewPosition = -modelViewPosition.xyz;
            gl_Position = projectionMatrix * modelViewPosition;
        }
    `,
  // Fragment shader
  glsl`
      uniform vec3 color;
      uniform float opacity;
        uniform float time;
        uniform float pulseSpeed;
        uniform float pulseIntensity;
        uniform bool pulseEnabled;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        void main() {
            // Enhanced edge detection
            float edgeStrength = 1.0 - max(0.0, dot(normalize(vNormal), normalize(vViewPosition)));
            edgeStrength = pow(edgeStrength, 2.0);
            
            // Optional pulsing effect
            float pulse = pulseEnabled ? sin(time * pulseSpeed) * pulseIntensity + 1.0 : 1.0;
            
            // Apply glow and edge effects
            vec3 finalColor = color * (1.0 + 0.5 * edgeStrength) * pulse;
            
            // Enhanced edge lighting on silhouette
            float edge = smoothstep(0.4, 0.5, edgeStrength);
            finalColor += color * edge * 2.0;
            
            // Apply final opacity
            float finalOpacity = opacity * (0.7 + 0.3 * edgeStrength);
            
            gl_FragColor = vec4(finalColor, finalOpacity);
      }
    `
);

// 2. ProceduralSphereMaterial for dynamic planet surfaces with emissive properties
export const ProceduralSphereMaterial = shaderMaterial(
  {
    metalness: 0.6,
    roughness: 0.4,
    baseColor: new THREE.Color("#ffffff"), // Default color (white)
    emissiveColor: new THREE.Color("#000000"), // Default emissive color (black - no emission)
    time: 0,
    seed: 0,
  },
  // Vertex Shader
  `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
  
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  // Fragment Shader
  `
      uniform float metalness;
      uniform float roughness;
      uniform vec3 baseColor; // Single base color
      uniform vec3 emissiveColor; // Emissive color for glow
      uniform float time;
      uniform float seed;
  
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
  
      // Improved Perlin noise and fBM for texture generation
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
  
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i + vec3(0.0, 0.0, 0.0)),
                           hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                       mix(hash(i + vec3(0.0, 1.0, 0.0)),
                           hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0.0, 0.0, 1.0)),
                           hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                       mix(hash(i + vec3(0.0, 1.0, 1.0)),
                           hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
                   f.z);
      }
  
      float fbm(vec3 p) {
        float value = 0.0;
        float scale = 1.0;
        for (int i = 0; i < 6; i++) { // Increased iterations for finer detail
          value += noise(p * scale) / scale;
          scale *= 2.0;
        }
        return value;
      }
  
      void main() {
        // Ambient light strength
        float ambientStrength = 0.7;
  
        // Light direction
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.75));
  
        // Generate surface textures using fBM noise
        float terrain = fbm(vPosition * 3.0 + vec3(0.0, time * 0.05, seed));
        float fineDetail = fbm(vPosition * 15.0 + vec3(0.0, time * 0.1, seed));
  
        // Blend base terrain with fine detail
        float surface = mix(terrain, fineDetail, 0.5);
  
        // Apply surface noise to modulate base color
        vec3 colorVariation = baseColor * (0.8 + 0.2 * surface); // Slight variation
  
        // Diffuse lighting
        float diffuse = max(dot(normalize(vNormal), lightDir), 0.3);
  
        // Ambient lighting component for uniform illumination
        vec3 ambient = ambientStrength * colorVariation;
  
        // Emissive component for internal glow
        vec3 emissive = emissiveColor * 0.7; // Adjust multiplier for desired glow
  
        // Final color composition with ambient, diffuse, and emissive lighting
        vec3 finalColor = ambient + colorVariation * diffuse + emissive;
  
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `
);

// 3. Enhanced NebulaeMaterial for more intricate textures and lighting
export const EnhancedNebulaeMaterial = shaderMaterial(
  {
    time: 0.0,
    color1: new THREE.Color("#ff0080"),
    color2: new THREE.Color("#7700ff"),
    color3: new THREE.Color("#0050ff"),
    resolution: new THREE.Vector2(1024, 1024),
    density: 0.35,
    turbulence: 2.2,
    speed: 0.05,
  },
  // Vertex shader
  glsl`
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  // Fragment shader
  glsl`
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        uniform vec2 resolution;
        uniform float density;
        uniform float turbulence;
        uniform float speed;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Advanced 3D fbm noise for volumetric effect
        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        
        float noise(vec3 x) {
            vec3 p = floor(x);
            vec3 f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = p.x + p.y * 157.0 + 113.0 * p.z;
            return mix(
                mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                    mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                    mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
        }
        
        float fbm(vec3 p) {
            float f = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;
            
            for (int i = 0; i < 8; i++) {
                f += amplitude * noise(p * frequency);
                amplitude *= 0.5;
                frequency *= 2.0;
            }
            
            return f;
        }
        
        // Volumetric ray marching through noise
        vec4 volumetricNebulae(vec3 p) {
            float density = 0.0;
            vec3 pos = p * turbulence;
            
            // Animate the nebula
            pos.x += time * speed;
            pos.z += sin(time * speed * 0.5) * 2.0;
            
            // Accumulate density with noise layers
            density += fbm(pos) * 0.5;
            density += fbm(pos * 2.0) * 0.25;
            density += fbm(pos * 4.0) * 0.125;
            
            // Increase density contrast
            density = smoothstep(0.1, 0.6, density);
            
            // Dynamic color mixing based on density
            vec3 color = mix(
                color1,
                mix(color2, color3, density),
                clamp(density * 2.0 - 0.5, 0.0, 1.0)
            );
            
            // Add some sparkling stars
            float stars = smoothstep(0.9, 0.92, noise(p * 50.0));
            color += vec3(1.0) * stars;
            
            // Non-linear opacity to create cloud-like appearance
            float alpha = smoothstep(0.05, 0.5, density);
            alpha *= clamp(1.0 - length(p) * 0.5, 0.0, 1.0); // Fade at the edges
            
            return vec4(color, alpha);
        }
        
        void main() {
            // Convert UVs to position in nebula space
            vec3 p = vPosition * density;
            
            // Get volumetric color and opacity
            vec4 nebulaColor = volumetricNebulae(p);
            
            // Add subtle edge glow
            float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
            edge *= 1.0 - abs(vUv.y - 0.5) * 2.0;
            edge = pow(edge, 3.0);
            
            // Combine everything
            gl_FragColor = vec4(nebulaColor.rgb, nebulaColor.a * edge);
        }
    `
);

// New Atmosphere Material for gas planets
export const AtmosphereMaterial = shaderMaterial(
  {
    time: 0.0,
    color: new THREE.Color(0x3388ff),
    atmosphereColor: new THREE.Color(0x8ec4ff),
    opacity: 0.5,
    glowPower: 2.5,
    planetRadius: 10.0,
  },
  // Vertex shader
  glsl`
        uniform float time;
        uniform float planetRadius;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
      varying vec2 vUv;
  
      void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
        vUv = uv;
            
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
  // Fragment shader
  glsl`
        uniform vec3 color;
        uniform vec3 atmosphereColor;
        uniform float opacity;
        uniform float glowPower;
        uniform float time;
        uniform float planetRadius;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
            // Calculate view direction
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            
            // Fresnel effect for atmosphere edge glow
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), glowPower);
            
            // Animate subtle atmospheric patterns
            float pattern = sin(vUv.x * 20.0 + time * 0.2) * sin(vUv.y * 20.0 + time * 0.3) * 0.1;
            
            // Combine colors with fresnel factor
            vec3 finalColor = mix(color, atmosphereColor, fresnel + pattern);
            
            // Apply opacity that increases at the edges
            float finalOpacity = opacity * (0.5 + 0.5 * fresnel);
            
            gl_FragColor = vec4(finalColor, finalOpacity);
        }
    `
);

// Pulsating Material for interactive objects
export const PulsatingMaterial = shaderMaterial(
  {
    time: 0.0,
    color: new THREE.Color(0x00ffff),
    pulseFrequency: 2.0,
    pulseAmplitude: 0.2,
    glowIntensity: 1.5,
  },
  // Vertex shader
  glsl`
        uniform float time;
        uniform float pulseFrequency;
        uniform float pulseAmplitude;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            
            // Apply subtle vertex displacement for pulse effect
            float pulse = sin(time * pulseFrequency) * pulseAmplitude;
            vec3 pulsedPosition = position * (1.0 + pulse * 0.03);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pulsedPosition, 1.0);
        }
    `,
  // Fragment shader
  glsl`
        uniform vec3 color;
        uniform float time;
        uniform float pulseFrequency;
        uniform float pulseAmplitude;
        uniform float glowIntensity;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        
        void main() {
            // Calculate view direction for Fresnel effect
            vec3 viewDirection = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 2.0);
            
            // Create pulsating glow
            float pulse = sin(time * pulseFrequency) * pulseAmplitude + 1.0;
            
            // Add subtle patterns
            float pattern = sin(vUv.x * 20.0 + time) * sin(vUv.y * 20.0 + time * 0.7) * 0.1;
            
            // Combine for final color
            vec3 finalColor = color * (1.0 + fresnel) * pulse * glowIntensity + pattern;
            
            // Create energy-like opacity
            float alpha = 0.7 + 0.3 * fresnel * pulse;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
);

// Wormhole Material for the portal effect
export const WormholeMaterial = shaderMaterial(
  {
    time: 0.0,
    innerColor: new THREE.Color(0xffffff),
    outerColor: new THREE.Color(0x3311bb),
    vortexSpeed: 0.5,
    vortexIntensity: 8.0,
  },
  // Vertex shader
  glsl`
      uniform float time;
  
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
            vPosition = position;
            vUv = uv;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  // Fragment shader
  glsl`
        uniform float time;
        uniform vec3 innerColor;
        uniform vec3 outerColor;
        uniform float vortexSpeed;
        uniform float vortexIntensity;
        
        varying vec3 vPosition;
      varying vec2 vUv;
        
        // Noise functions for turbulence
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(123.45, 678.90))) * 43758.5453);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                f.y
            );
        }
        
        float turbulence(vec2 p) {
            float sum = 0.0;
            float amp = 1.0;
            float scale = 1.0;
            
            for(int i = 0; i < 6; i++) {
                sum += noise(p * scale) * amp;
                amp *= 0.5;
                scale *= 2.0;
            }
            
            return sum;
        }
        
        void main() {
            // Center UVs
            vec2 centeredUv = vUv * 2.0 - 1.0;
            float dist = length(centeredUv);
            
            // Calculate angle for the spiral
            float angle = atan(centeredUv.y, centeredUv.x);
            
            // Create spiral vortex effect
            float spiral = sin(angle * vortexIntensity + time * vortexSpeed) * 0.5 + 0.5;
            
            // Add turbulence
            float turb = turbulence(centeredUv * 5.0 + time * 0.1) * 0.1;
            
            // Combined distortion
            float distortion = spiral + turb;
            
            // Create wormhole tunnel effect
            float tunnel = smoothstep(0.0, 1.5, 1.0 - dist + distortion);
            
            // Make the center brighter
            float brightness = smoothstep(0.8, 0.0, dist);
            
            // Combine colors with tunnel effect
            vec3 finalColor = mix(outerColor, innerColor, tunnel * brightness);
            
            // Add subtle energy ripples
            float ripples = sin(dist * 40.0 - time * 2.0) * 0.05 * (1.0 - dist);
            finalColor += ripples * innerColor;
            
            // Create star-like center
            if (dist < 0.1) {
                float star = (0.1 - dist) / 0.1;
                finalColor += innerColor * star * 5.0;
            }
            
            // Edge glow
            float edge = smoothstep(1.0, 0.7, dist);
            
            gl_FragColor = vec4(finalColor, edge);
        }
    `
);

// Black Hole Material for gravitational distortion effects
export const BlackHoleMaterial = shaderMaterial(
  {
    time: 0.0,
    accretionColor: new THREE.Color(0xff5500),
    holeColor: new THREE.Color(0x000000),
    distortionStrength: 3.0,
    eventHorizonRadius: 0.3,
    accretionDiskSize: 0.8,
  },
  // Vertex shader
  glsl`
        uniform float time;
        
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
            vPosition = position;
            vUv = uv;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  // Fragment shader
  glsl`
        uniform float time;
        uniform vec3 accretionColor;
        uniform vec3 holeColor;
        uniform float distortionStrength;
        uniform float eventHorizonRadius;
        uniform float accretionDiskSize;
        
        varying vec3 vPosition;
        varying vec2 vUv;
        
        // Noise functions for the accretion disk
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(123.45, 678.90))) * 43758.5453);
        }
        
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            return mix(
                mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
                f.y
            );
        }
        
        void main() {
            // Center UVs
            vec2 centeredUv = vUv * 2.0 - 1.0;
            float dist = length(centeredUv);
            
            // Calculate angle for rotation
            float angle = atan(centeredUv.y, centeredUv.x);
            
            // Gravitational lensing effect (light bending)
            float lensing = 1.0 / (1.0 + dist * distortionStrength);
            
            // Event horizon (the black hole itself)
            float event = smoothstep(eventHorizonRadius, eventHorizonRadius - 0.1, dist);
            
            // Accretion disk
            float diskDist = abs(dist - accretionDiskSize);
            float disk = smoothstep(0.1, 0.0, diskDist);
            
            // Animate the disk
            float rotationSpeed = 0.2;
            float animatedAngle = angle + time * rotationSpeed;
            
            // Create swirling patterns in the disk
            float swirl = noise(vec2(animatedAngle * 5.0, diskDist * 30.0 + time * 0.5)) * disk;
            swirl += noise(vec2(animatedAngle * 10.0, diskDist * 60.0 - time * 0.3)) * disk * 0.5;
            
            // Hot spots in the disk
            float hotspots = pow(swirl, 3.0) * 2.0;
            
            // Combine for the final disk color
            vec3 diskColor = accretionColor * (disk + hotspots);
            
            // Add some variation to the disk color based on temperature
            diskColor = mix(diskColor, vec3(1.0, 0.8, 0.4), hotspots);
            
            // Combine event horizon and disk
            vec3 finalColor = mix(diskColor, holeColor, event);
            
            // Apply gravitational lensing brightness
            finalColor += vec3(1.0, 0.8, 0.6) * lensing * 0.2 * (1.0 - event);
            
            // Calculate opacity based on event horizon and disk
            float alpha = max(disk * 0.9, event);
            
            // Add faint glow around the black hole
            alpha = max(alpha, lensing * 0.3);
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
);

// Create a GlassPlanetMaterial with glass-like transparency and glow
export const GlassPlanetMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.2, 0.8, 1.0),
    transmission: 0.95,
    thickness: 5.0,
    roughness: 0.1,
    envMapIntensity: 3.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    glowColor: new THREE.Color(0.1, 0.6, 1.0),
    glowIntensity: 0.8,
    noiseScale: 0.05,
    pulseSpeed: 0.5
  },
  // Vertex shader
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vPosition = position;
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float transmission;
    uniform float thickness;
    uniform float roughness;
    uniform float envMapIntensity;
    uniform float clearcoat;
    uniform float clearcoatRoughness;
    uniform vec3 glowColor;
    uniform float glowIntensity;
    uniform float noiseScale;
    uniform float pulseSpeed;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    
    // Simple noise function
    float noise(vec3 p) {
      return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
    }
    
    void main() {
      // Fresnel effect for edge glow
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - max(0.0, dot(viewDirection, vNormal)), 3.0);
      
      // Add some noise variation
      float noiseValue = noise(vPosition * noiseScale + time * 0.2);
      
      // Pulsating glow effect
      float pulse = 0.5 + 0.5 * sin(time * pulseSpeed);
      
      // Combine glass and glow effects
      vec3 glassColor = color * (0.5 + 0.5 * noiseValue);
      vec3 glowEffect = glowColor * fresnel * glowIntensity * (0.8 + 0.2 * pulse);
      
      // Final color combines glass transparency with glow
      vec3 finalColor = mix(glassColor, glowEffect, fresnel * 0.7);
      
      gl_FragColor = vec4(finalColor, transmission * (0.7 + 0.3 * fresnel));
      }
    `
);

// Extend Three.js with custom materials
extend({
  OutlinesMaterial,
  ProceduralSphereMaterial,
  EnhancedNebulaeMaterial,
  AtmosphereMaterial,
  PulsatingMaterial,
  WormholeMaterial,
  BlackHoleMaterial,
  GlassPlanetMaterial
});