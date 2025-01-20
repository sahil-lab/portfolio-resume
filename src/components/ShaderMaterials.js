// src/App.js

import {
    shaderMaterial
} from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

// Import Logo Textures

// 1. OutlinesMaterial for object outlines
const OutlinesMaterial = shaderMaterial(
    { color: new THREE.Color("black"), opacity: 1, thickness: 0.05 },
    // Vertex Shader
    `
      uniform float thickness;
      #include <common>
      #include <morphtarget_pars_vertex>
      #include <skinning_pars_vertex>
      
      void main() {
        #if defined(USE_SKINNING)
          #include <beginnormal_vertex>
          #include <morphnormal_vertex>
          #include <skinbase_vertex>
          #include <skinnormal_vertex>
          #include <defaultnormal_vertex>
        #endif
        #include <begin_vertex>
        #include <morphtarget_vertex>
        #include <skinning_vertex>
        #include <project_vertex>
        
        vec4 transformedNormal = vec4(normal, 0.0);
        vec4 transformedPosition = vec4(transformed, 1.0);
        
        #ifdef USE_INSTANCING
          transformedNormal = instanceMatrix * transformedNormal;
          transformedPosition = instanceMatrix * transformedPosition;
        #endif
        
        vec3 newPosition = transformedPosition.xyz + transformedNormal.xyz * thickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0); 
      }
    `,
    // Fragment Shader
    `
      uniform vec3 color;
      uniform float opacity;
      
      void main(){
        gl_FragColor = vec4(color, opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  );
  
  // 2. ProceduralSphereMaterial for dynamic planet surfaces with emissive properties
  const ProceduralSphereMaterial = shaderMaterial(
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
  const EnhancedNebulaeMaterial = shaderMaterial(
    {
      baseColor1: new THREE.Color("#a020f0"), // Deep Purple
      baseColor2: new THREE.Color("#ff00ff"), // Magenta
      time: 0,
    },
    // Vertex Shader
    `
      varying vec2 vUv;
      varying float vNoise;
  
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    // Fragment Shader
    `
      uniform vec3 baseColor1;
      uniform vec3 baseColor2;
      uniform float time;
  
      varying vec2 vUv;
      varying float vNoise;
  
      // Improved simplex noise function
      // Source: https://thebookofshaders.com/13/
      vec3 mod289(vec3 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
  
      vec2 mod289(vec2 x) {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }
  
      vec3 permute(vec3 x) {
        return mod289(((x*34.0)+1.0)*x);
      }
  
      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                            0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                            -0.577350269189626, // -1.0 + 2.0 * C.x
                            0.024390243902439); // 1.0 / 41.0
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
  
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
  
        vec3 p = permute( permute(i.y + vec3(0.0, i1.y, 1.0 ))
              + i.x + vec3(0.0, i1.x, 1.0 ));
  
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), 
                                dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
  
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
  
        m *= 1.79284291400159 - 0.85373472095314 * 
            ( a0*a0 + h*h );
  
        vec3 g;
        g.x  = a0.x  * x0.x + h.x * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  
        return 130.0 * dot(m, g);
      }
  
      void main(){
        // Calculate noise value
        float n = snoise(vUv * 10.0 + vec2(time * 0.05, time * 0.05));
  
        // Create smooth gradients between colors based on noise
        vec3 color = mix(baseColor1, baseColor2, smoothstep(-0.2, 0.8, n));
  
        // Add soft edges using radial gradient
        float dist = distance(vUv, vec2(0.5));
        float radial = smoothstep(0.4, 0.5, dist);
  
        // Combine color with radial gradient for nebula shape
        color *= 1.0 - radial;
  
        // Add emissive glow based on color intensity
        vec3 emissive = color * 0.5;
  
        gl_FragColor = vec4(color + emissive, 1.0);
      }
    `
  );
  
  // Extend Three.js with custom materials
  extend({
    OutlinesMaterial,
    ProceduralSphereMaterial,
    EnhancedNebulaeMaterial,
  });
  
  export  { OutlinesMaterial, ProceduralSphereMaterial, EnhancedNebulaeMaterial };