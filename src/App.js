// src/App.js

import * as THREE from "three";
import React, {
  useRef,
  useMemo,
  useLayoutEffect,
  useState,
  useEffect,
} from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import {
  shaderMaterial,
  Environment,
  OrbitControls,
  Html,
  useTexture,
} from "@react-three/drei";
import { Physics, useSphere } from "@react-three/cannon";
import {
  EffectComposer,
  SSAO, // Screen Space Ambient Occlusion
  SMAA,
  Bloom,
} from "@react-three/postprocessing";
import { useControls } from "leva";

// Import Logo Textures
import githubLogo from "./assets/github.png";
import whatsappLogo from "./assets/whatsapp.png";
import gmailLogo from "./assets/gmail.png";
import linkedinLogo from "./assets/linkedin.png";
import mediumLogo from "./assets/medium.png";
import resumeLogo from "./assets/resume.png";

/* ------------------------------- Shader Materials ------------------------------- */

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

/* ----------------------------- Custom Components ------------------------------ */

// 4. Comet component representing individual comets with a glowing tail
const Comet = ({ position, direction, speed, size, color }) => {
  const cometRef = useRef();
  const trailRef = useRef();
  const [positions, setPositions] = useState([new THREE.Vector3(...position)]);
  const maxTrailLength = 20; // Number of points in the trail

  // Initialize the trail geometry
  const trailGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(maxTrailLength * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    return geometry;
  }, [maxTrailLength]);

  // Initialize the trail material
  const trailMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7, // Increased opacity for better visibility
        linewidth: 2,
      }),
    [color]
  );

  useFrame((state, delta) => {
    if (cometRef.current) {
      // Update comet position
      cometRef.current.position.addScaledVector(direction, speed * delta);

      // Update trail positions
      const newPos = cometRef.current.position.clone();
      setPositions((prev) => {
        const updated = [newPos, ...prev];
        return updated.slice(0, maxTrailLength);
      });

      // Update trail geometry
      const posArray = trailGeometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        posArray[i * 3] = positions[i].x;
        posArray[i * 3 + 1] = positions[i].y;
        posArray[i * 3 + 2] = positions[i].z;
      }
      trailGeometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Comet Head */}
      <mesh ref={cometRef} position={position}>
        <sphereGeometry args={[size, 16, 16]} />
        <meshBasicMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      {/* Comet Trail */}
      <line ref={trailRef} geometry={trailGeometry} material={trailMaterial} />
    </>
  );
};

// 5. Comets component to manage multiple comets
const Comets = () => {
  const [comets, setComets] = useState([]);

  // Control comet parameters
  const { cometCount, cometSpeed, cometSize, cometColor } = useControls({
    cometCount: { value: 5, min: 1, max: 20, step: 1 }, // Increased max count for more visibility
    cometSpeed: { value: 20, min: 5, max: 50, step: 1 },
    cometSize: { value: 0.8, min: 0.1, max: 2, step: 0.1 }, // Increased size for better visibility
    cometColor: { value: "#ffffff" }, // White comets
  });

  useEffect(() => {
    // Spawn comets at random intervals
    const interval = setInterval(() => {
      if (comets.length < cometCount) {
        const spawnPosition = [
          THREE.MathUtils.randFloatSpread(100), // Adjusted spawn range to intersect the camera's view
          THREE.MathUtils.randFloatSpread(100),
          THREE.MathUtils.randFloatSpread(100),
        ];
        const direction = new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(1),
          THREE.MathUtils.randFloatSpread(1),
          THREE.MathUtils.randFloatSpread(1)
        ).normalize();
        setComets((prev) => [
          ...prev,
          {
            id: Date.now(),
            position: spawnPosition,
            direction: direction,
            speed: cometSpeed,
            size: cometSize,
            color: cometColor,
          },
        ]);
      }
    }, 2000); // Spawn every 2 seconds for increased frequency

    return () => clearInterval(interval);
  }, [comets, cometCount, cometSpeed, cometSize, cometColor]);

  // Remove comets that move out of bounds
  useFrame(() => {
    setComets((prev) =>
      prev.filter(
        (comet) =>
          comet.position[0] < 300 &&
          comet.position[0] > -300 &&
          comet.position[1] < 300 &&
          comet.position[1] > -300 &&
          comet.position[2] < 300 &&
          comet.position[2] > -300
      )
    );
  });

  return (
    <>
      {comets.map((comet) => (
        <Comet
          key={comet.id}
          position={comet.position}
          direction={comet.direction}
          speed={comet.speed}
          size={comet.size}
          color={comet.color}
        />
      ))}
    </>
  );
};

/* ------------------------------- Shader Materials (Continued) ------------------------------- */

// Extend Three.js with custom materials
extend({
  OutlinesMaterial,
  ProceduralSphereMaterial,
  EnhancedNebulaeMaterial,
});

/* ----------------------------- Custom Components ------------------------------ */

// 6. CustomOutlines component for rendering outlines around objects
const CustomOutlines = ({
  color = "black",
  opacity = 1,
  transparent = false,
  thickness = 0.05,
  ...props
}) => {
  const ref = useRef();
  const material = useMemo(
    () => new OutlinesMaterial({ side: THREE.BackSide }),
    []
  );

  // Update material properties every frame
  useFrame(() => {
    if (material) {
      material.color.set(color);
      material.opacity = opacity;
      material.thickness = thickness;
      material.transparent = transparent;
    }
  });

  // Apply the material to the mesh
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (mesh) {
      mesh.material = material;
    }
  }, [material]);

  return <mesh ref={ref} {...props} />;
};

// 7. useFrameState hook to track elapsed time
const useFrameState = () => {
  const [time, setTime] = useState(0);
  useFrame((state, delta) => {
    setTime((prev) => prev + delta);
  });
  return time;
};

// 8. Pointer component to visualize the mouse pointer in 3D space
const Pointer = () => {
  const { camera, mouse } = useThree();
  const ref = useRef();

  // Calculate the pointer position in 3D space based on mouse movement
  useFrame(() => {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
    ref.current.position.lerp(vector, 0.1); // Smoothly interpolate to the target position
  });

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <sphereGeometry args={[0.05, 16, 16]} /> {/* Very small pointer */}
      <meshStandardMaterial
        color="white" // White color for the pointer
        emissive="white" // Emissive color for glow effect
        emissiveIntensity={5} // Strong emissive intensity
        transparent
        opacity={0.9} // Slight transparency
      />
      <CustomOutlines
        color="white" // Outline color matching emissive color
        opacity={0.7} // Semi-transparent outline
        transparent={true}
        thickness={0.01} // Very thin outline
      />
    </mesh>
  );
};

// 9. Sphere component for individual dynamic spheres with emissive glow
const Sphere = ({ position, size, outlines, seed, baseColor }) => {
  const [ref, api] = useSphere(() => ({
    mass: size, // Mass proportional to size
    position: position,
    args: [size], // Radius of the sphere
    angularDamping: 0.1, // Smooth rotation
    linearDamping: 0.0, // No damping for continuous movement
    restitution: 0.9, // Bouncier collisions
    friction: 0.3, // Smoother sliding
    collisionFilterGroup: 1, // Default group
    collisionFilterMask: 1, // Collide with default group (spheres)
    velocity: [
      THREE.MathUtils.randFloatSpread(10),
      THREE.MathUtils.randFloatSpread(10),
      THREE.MathUtils.randFloatSpread(10),
    ], // Random initial velocity
  }));

  const [hovered, setHovered] = useState(false);

  // Handle click to deflect the sphere
  const handleClick = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up

    // Get the world position of the clicked sphere
    const clickedSpherePos = new THREE.Vector3();
    ref.current.getWorldPosition(clickedSpherePos);

    // Get the click position in world space
    const pointerPos = new THREE.Vector3();
    event.ray.at(event.distance, pointerPos);

    // Calculate the direction from the click position to the sphere
    const direction = new THREE.Vector3()
      .subVectors(clickedSpherePos, pointerPos)
      .normalize();

    // Define the force magnitude
    const forceMagnitude = 500; // Adjust for desired deflection strength

    // Calculate the force vector
    const force = direction.multiplyScalar(forceMagnitude);

    // Apply the force to the sphere
    api.applyForce([force.x, force.y, force.z], [0, 0, 0]);
  };

  // Get the current time for the shader
  const time = useFrameState();

  // Determine emissive color (same as baseColor for cohesive glow)
  const emissiveColor = baseColor.clone().multiplyScalar(0.5); // Adjust multiplier as needed

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[size, 64, 64]} /> {/* High-detail sphere */}

      {/* ProceduralSphereMaterial with unique baseColor and emissiveColor */}
      <proceduralSphereMaterial
        metalness={0.6} // Metalness of the material
        roughness={0.2} // Roughness of the material
        baseColor={baseColor} // Unique base color
        emissiveColor={emissiveColor} // Emissive color for glow
        time={time} // Time uniform for animation
        seed={seed} // Seed for procedural texture
      />

      <CustomOutlines
        color="black" // Black outline
        opacity={1}
        transparent={false}
        thickness={outlines}
      />
    </mesh>
  );
};

// 10. BlackSun component representing the central sun
const BlackSun = ({ position = [0, 0, 0], radius = 10 }) => {
  const [planets, setPlanets] = useState([]); // State to store dynamically created planets

  // Create the SunMaterial with additive blending for glowing effect
  const SunMaterial = useMemo(
    () =>
      shaderMaterial(
        {
          glowColor: new THREE.Color("yellow"),
          time: 0,
        },
        // Vertex Shader
        `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        // Fragment Shader
        `
          uniform vec3 glowColor;
          uniform float time;
      
          varying vec3 vNormal;
      
          // Simple noise function
          float noise(vec3 p){
              return fract(sin(dot(p, vec3(12.9898,78.233, 45.164))) * 43758.5453);
          }
      
          void main() {
            // Procedural variation
            float n = noise(vNormal * 10.0 + time * 2.0);
            
            // Emission with variation
            float emission = 1.0 + 0.5 * n;
            emission = clamp(emission, 0.0, 1.0);
            
            // Final color
            vec3 finalColor = glowColor * emission;
      
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      ),
    []
  );

  // Extend the material so we can use it in JSX
  extend({ SunMaterial });

  // Reference to the SunMaterial to update uniforms and blending
  const sunMaterialRef = useRef();

  useEffect(() => {
    if (sunMaterialRef.current) {
      sunMaterialRef.current.blending = THREE.AdditiveBlending;
      sunMaterialRef.current.transparent = true;
      sunMaterialRef.current.depthWrite = false;
    }
  }, []);

  // Function to generate new planets upon clicking the sun
  const generatePlanets = (event) => {
    event.stopPropagation(); // Prevent the event from propagating

    const newPlanets = [];
    const numPlanets = Math.floor(Math.random() * 5) + 3; // Generate 3-7 planets

    for (let i = 0; i < numPlanets; i++) {
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      ); // Random velocity

      // Assign a unique base color using HSL for vibrant colors
      const hue = Math.random();
      const saturation = THREE.MathUtils.randFloat(0.5, 1.0);
      const lightness = THREE.MathUtils.randFloat(0.3, 0.7);
      const baseColor = new THREE.Color().setHSL(hue, saturation, lightness);

      newPlanets.push({
        id: `${Date.now()}-${i}`, // Unique ID
        position: [...position],
        velocity,
        size: Math.random() * 1.5 + 0.5, // Random size
        seed: Math.random() * 1000, // Unique seed for procedural texture
        baseColor, // Unique base color
      });
    }

    setPlanets((prevPlanets) => [...prevPlanets, ...newPlanets]);
  };

  // Update planet positions and sun time uniform every frame
  useFrame((state, delta) => {
    setPlanets((prevPlanets) =>
      prevPlanets.map((planet) => {
        const newPos = [
          planet.position[0] + planet.velocity.x * 0.1,
          planet.position[1] + planet.velocity.y * 0.1,
          planet.position[2] + planet.velocity.z * 0.1,
        ];
        return { ...planet, position: newPos };
      })
    );

    // Update the time uniform for dynamic shader effects
    if (sunMaterialRef.current) {
      sunMaterialRef.current.uniforms.time.value += delta;
    }
  });

  const time = useFrameState(); // Hook to get the current time for procedural material

  return (
    <>
      {/* Black Sun */}
      <mesh position={position} onClick={generatePlanets}>
        <sphereGeometry args={[radius, 64, 64]} />
        <sunMaterial ref={sunMaterialRef} />
      </mesh>

      {/* Dynamically render procedurally generated planets */}
      {planets.map((planet) => (
        <mesh key={planet.id} position={planet.position}>
          <sphereGeometry args={[planet.size, 64, 64]} />
          <proceduralSphereMaterial
            metalness={0.6} // Controls the metalness of the material
            roughness={0.2} // Controls the roughness of the material
            baseColor={planet.baseColor} // Unique base color for each planet
            emissiveColor={planet.baseColor.clone().multiplyScalar(0.5)} // Emissive color based on baseColor
            time={time} // Pass time uniform for animation
            seed={planet.seed} // Unique seed for procedural texture
          />
        </mesh>
      ))}

      {/* Fixed Main Planets */}
      <FixedMainPlanets />
    </>
  );
};

// 11. Saturn component with dynamic rings
const Saturn = ({ position = [120, 0, 0], radius = 15, ringRadius = 25 }) => {
  const saturnMaterial = useMemo(
    () =>
      shaderMaterial(
        { color: new THREE.Color("orange"), time: 0 },
        // Vertex Shader
        `
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal); // Normalize the normal
            vPosition = position; // Pass position to fragment shader
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        // Fragment Shader
        `
          uniform vec3 color;
          uniform float time;
      
          varying vec3 vNormal;
          varying vec3 vPosition;
      
          // Simple noise function
          float noise(vec3 p){
              return fract(sin(dot(p, vec3(12.9898,78.233, 45.164))) * 43758.5453);
          }
      
          void main() {
            // Normalize the normal vector and simulate a light direction
            vec3 normalizedNormal = normalize(vNormal);
            vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.5)); // Adjust for desired light direction
      
            // Calculate diffuse lighting (Lambertian reflectance)
            float diffuse = max(dot(normalizedNormal, lightDirection), 0.0);
      
            // Calculate specular highlights
            vec3 viewDirection = normalize(-vPosition); // Camera at the origin
            vec3 reflectDirection = reflect(-lightDirection, normalizedNormal);
            float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 16.0); // Specular exponent for shine control
      
            // Add time-based noise for dynamic surface appearance
            float n = noise(vPosition * 0.1 + time * 0.5);
      
            // Mix the base color and noise
            vec3 baseColor = mix(color, vec3(1.0, 0.8, 0.3), n);
      
            // Emissive component for glow
            vec3 emissive = baseColor * 0.3; // Adjust multiplier for desired glow
      
            // Combine diffuse, specular, and base color
            vec3 finalColor = baseColor * diffuse + specular + emissive;
      
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `
      ),
    []
  );

  // Extend the material so we can use it in JSX
  extend({ SaturnMaterial: saturnMaterial });

  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (ringRef.current) {
      // Rotate the rings over time
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Saturn Sphere */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <saturnMaterial />
      </mesh>

      {/* Saturn Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 2, ringRadius, 64, 64]} />
        <meshBasicMaterial
          color="gray"
          side={THREE.DoubleSide}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

// 12. AsteroidBelt component representing a belt of asteroids
const AsteroidBelt = ({ radius = 70, count = 5000 }) => {
  const positions = useMemo(() => {
    const posArray = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2; // Random angle
      const distance = radius + Math.random() * 10; // Randomize distance within a range
      const height = Math.random() * 2 - 1; // Small vertical variation

      const x = Math.cos(angle) * distance;
      const y = height;
      const z = Math.sin(angle) * distance;

      posArray.push(x, y, z);
    }
    return new Float32Array(posArray);
  }, [radius, count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.6} color="grey" transparent opacity={0.8} />
    </points>
  );
};

/* ---------------------------- Milky Way Background --------------------------- */

// 13. MilkyWay component for the galaxy background
const MilkyWay = () => {
  const milkyWayMaterial = useMemo(() => new EnhancedNebulaeMaterial(), []);

  useFrame((state, delta) => {
    if (milkyWayMaterial) {
      milkyWayMaterial.uniforms.time.value += delta * 0.1;
    }
  });

  return (
    <mesh scale={[1000, 1000, 1000]} rotation={[0, 0, 0]}>
      <sphereGeometry args={[1, 64, 64]} />
      <enhancedNebulaeMaterial />
    </mesh>
  );
};

/* ------------------------------- Starfield ------------------------------ */

// 14. Starfield component for additional stars
const Starfield = () => {
  const count = 10000; // Number of stars
  const positions = useMemo(() => {
    const posArray = [];
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.degToRad(
        THREE.MathUtils.randFloatSpread(360)
      );
      const phi = THREE.MathUtils.degToRad(
        THREE.MathUtils.randFloatSpread(360)
      );
      const distance = THREE.MathUtils.randFloat(0, 500);
      const x = distance * Math.sin(theta) * Math.cos(phi);
      const y = distance * Math.sin(theta) * Math.sin(phi);
      const z = distance * Math.cos(theta);
      posArray.push(x, y, z);
    }
    return new Float32Array(posArray);
  }, [count]);

  const colors = useMemo(() => {
    const cols = [];
    for (let i = 0; i < count; i++) {
      const color = new THREE.Color(
        THREE.MathUtils.randFloat(0.8, 1.0),
        THREE.MathUtils.randFloat(0.8, 1.0),
        THREE.MathUtils.randFloat(0.8, 1.0)
      );
      cols.push(color.r, color.g, color.b);
    }
    return new Float32Array(cols);
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.7}
        sizeAttenuation
        transparent
        opacity={1}
      />
    </points>
  );
};

/* ------------------------------- Nebulae ------------------------------ */

// 15. Enhanced Nebulae component for more intricate textures and lighting
const Nebulae = () => {
  const nebulaeMaterial1 = useMemo(() => new EnhancedNebulaeMaterial(), []);
  const nebulaeMaterial2 = useMemo(() => new EnhancedNebulaeMaterial(), []);
  const nebulaeMaterial3 = useMemo(() => new EnhancedNebulaeMaterial(), []); // Additional nebula for diversity

  const materialRef1 = useRef();
  const materialRef2 = useRef();
  const materialRef3 = useRef();

  useEffect(() => {
    if (materialRef1.current) {
      materialRef1.current.blending = THREE.AdditiveBlending;
      materialRef1.current.transparent = true;
      materialRef1.current.depthWrite = false;
    }
    if (materialRef2.current) {
      materialRef2.current.blending = THREE.AdditiveBlending;
      materialRef2.current.transparent = true;
      materialRef2.current.depthWrite = false;
    }
    if (materialRef3.current) {
      materialRef3.current.blending = THREE.AdditiveBlending;
      materialRef3.current.transparent = true;
      materialRef3.current.depthWrite = false;
    }
  }, []);

  useFrame((state, delta) => {
    if (nebulaeMaterial1.uniforms.time.value !== undefined) {
      nebulaeMaterial1.uniforms.time.value += delta * 0.1;
    }
    if (nebulaeMaterial2.uniforms.time.value !== undefined) {
      nebulaeMaterial2.uniforms.time.value += delta * 0.1;
    }
    if (nebulaeMaterial3.uniforms.time.value !== undefined) {
      nebulaeMaterial3.uniforms.time.value += delta * 0.1;
    }
  });

  return (
    <>
      {/* First Nebula */}
      <mesh position={[150, -50, -100]} scale={[50, 50, 50]}>
        <sphereGeometry args={[1, 64, 64]} />
        <enhancedNebulaeMaterial ref={materialRef1} />
      </mesh>

      {/* Second Nebula */}
      <mesh position={[-150, 70, 50]} scale={[60, 60, 60]}>
        <sphereGeometry args={[1, 64, 64]} />
        <enhancedNebulaeMaterial ref={materialRef2} />
      </mesh>

      {/* Third Nebula for added complexity */}
      <mesh position={[80, 100, 120]} scale={[40, 40, 40]}>
        <sphereGeometry args={[1, 64, 64]} />
        <enhancedNebulaeMaterial ref={materialRef3} />
      </mesh>
    </>
  );
};

/* ----------------------------- Spheres ------------------------------ */

// 16. Spheres component to render multiple dynamic spheres
const Spheres = ({ exclusionZones = [] }) => {
  const { outlines, numSpheres, space, minSize, maxSize } = useControls({
    outlines: {
      value: 0.02, // Outline thickness
      step: 0.01,
      min: 0.01,
      max: 0.05,
    },
    numSpheres: {
      value: 300, // Reduced number for better spacing and performance
      step: 100,
      min: 100,
      max: 2000,
    },
    space: {
      value: 500, // Increased space for better distribution in a dark background
      step: 10,
      min: 300,
      max: 1000,
    },
    minSize: {
      value: 0.5, // Minimum sphere size
      step: 0.1,
      min: 0.1,
      max: 2,
    },
    maxSize: {
      value: 2, // Maximum sphere size
      step: 0.1,
      min: 1,
      max: 5,
    },
  });

  // Predefined color palette for distinct colors
  const colorPalette = useMemo(
    () => [
      new THREE.Color("#ff6666"), // Light Red
      new THREE.Color("#66ff66"), // Light Green
      new THREE.Color("#6666ff"), // Light Blue
      new THREE.Color("#ff66ff"), // Light Magenta
      new THREE.Color("#66ffff"), // Light Cyan
      new THREE.Color("#ffff66"), // Light Yellow
      new THREE.Color("#ff9966"), // Coral
      new THREE.Color("#9966ff"), // Lavender
      new THREE.Color("#66ff99"), // Mint
      new THREE.Color("#ff66cc"), // Hot Pink
    ],
    []
  );

  // Function to check if a position is too close to exclusion zones
  const isPositionValid = (pos) => {
    for (let zone of exclusionZones) {
      const distance = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...zone.center));
      if (distance < zone.minDistance) return false;
    }
    return true;
  };

  // Generate uniformly distributed positions, random sizes, unique seeds, and base colors
  const spheres = useMemo(() => {
    const spheresArray = [];

    // Attempt to generate positions until desired count is reached or max attempts
    const maxAttempts = numSpheres * 10;
    let attempts = 0;

    while (spheresArray.length < numSpheres && attempts < maxAttempts) {
      const x = THREE.MathUtils.randFloatSpread(space);
      const y = THREE.MathUtils.randFloatSpread(space);
      const z = THREE.MathUtils.randFloatSpread(space);

      const pos = [x, y, z];

      // Check against exclusion zones
      if (!isPositionValid(pos)) {
        attempts++;
        continue;
      }

      // Assign a random size within the specified range
      const size = THREE.MathUtils.randFloat(minSize, maxSize);

      // Assign a unique seed based on random value
      const seed = Math.random() * 1000;

      // Assign a base color from the palette for distinctiveness
      const baseColor = colorPalette[THREE.MathUtils.randInt(0, colorPalette.length - 1)];

      spheresArray.push({
        position: pos,
        size,
        seed,
        baseColor,
      });
      attempts++;
    }

    return spheresArray;
  }, [numSpheres, space, minSize, maxSize, colorPalette, exclusionZones]);

  return (
    <>
      {spheres.map((sphere, index) => (
        <Sphere
          key={index}
          position={sphere.position}
          size={sphere.size}
          outlines={outlines}
          seed={sphere.seed} // Pass the unique seed to the Sphere component
          baseColor={sphere.baseColor} // Pass the unique base color
        />
      ))}
    </>
  );
};

/* ------------------------------- Fixed Main Planets ------------------------------ */

// 17. FixedMainPlanets component to render three main planets: Purple, Blue, Green
const FixedMainPlanets = () => {
  // Define fixed positions for the main planets
  const mainPlanets = [
    {
      name: "PurplePlanet",
      position: [200, 0, 0],
      size: 8,
      color: new THREE.Color("#800080"), // Purple
    },
    {
      name: "BluePlanet",
      position: [-200, 0, 0],
      size: 8,
      color: new THREE.Color("#0000ff"), // Blue
    },
    {
      name: "GreenPlanet",
      position: [0, 200, 0],
      size: 8,
      color: new THREE.Color("#00ff00"), // Green
    },
  ];

  return (
    <>
      {mainPlanets.map((planet) => (
        <mesh key={planet.name} position={planet.position}>
          <sphereGeometry args={[planet.size, 64, 64]} />
          <meshStandardMaterial
            color={planet.color}
            emissive={planet.color.clone().multiplyScalar(0.5)}
            emissiveIntensity={1}
            roughness={0.3}
            metalness={0.5}
          />
          {/* Add white outlines */}
          <CustomOutlines
            color="white"
            opacity={0.9}
            transparent={true}
            thickness={0.03}
          />
        </mesh>
      ))}
    </>
  );
};

/* ------------------------------- Logo Planets ------------------------------ */

// 18. LogoPlanet Component for clickable logo-bearing planets
const LogoPlanet = ({ logo, position, size, link, emissiveColor }) => {
  // Load the logo texture
  const texture = useTexture(logo);

  // Reference for the mesh
  const meshRef = useRef();

  // Handle click event to open the link
  const handleClick = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    window.open(link, "_blank"); // Open the link in a new tab
  };

  // Hover state for visual feedback
  const [hovered, setHovered] = useState(false);

  // Rotate the planet for animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Adjust rotation speed as desired
    }
  });

  // Change cursor on hover
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "default";
    }
  }, [hovered]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? size * 1.1 : size} // Slightly enlarge on hover
      castShadow
      receiveShadow
    >
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        metalness={0.5}
        roughness={0.3}
        transparent={true}
        emissive={emissiveColor} // Set emissive color for glow
        emissiveIntensity={hovered ? 1.5 : 1} // Increase emissive intensity on hover
      />
      {/* Add white outlines */}
      <CustomOutlines
        color="white"
        opacity={hovered ? 1 : 0.7}
        transparent={true}
        thickness={0.02}
      />
    </mesh>
  );
};

// Utility function to generate random positions with minimum distance and exclusion zones
const generateRandomPositions = (count, minDistance, range, exclusionZones = []) => {
  const positions = [];

  while (positions.length < count) {
    const x = THREE.MathUtils.randFloatSpread(range);
    const y = THREE.MathUtils.randFloatSpread(range);
    const z = THREE.MathUtils.randFloatSpread(range);

    const pos = [x, y, z];

    // Check against exclusion zones
    let valid = true;
    for (let zone of exclusionZones) {
      const distance = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...zone.center));
      if (distance < zone.minDistance) {
        valid = false;
        break;
      }
    }

    if (valid) {
      positions.push(pos);
    }
  }

  return positions;
};

// 19. LogoPlanets Component to render all LogoPlanets
const LogoPlanets = () => {
  // Define the logos and their corresponding links
  const logos = [
    { logo: githubLogo, link: "https://github.com/sahil-lab" },
    { logo: whatsappLogo, link: "https://wa.me/+918559067075" },
    { logo: gmailLogo, link: "mailto:sahil.aps2k12@gmail.com" },
    { logo: linkedinLogo, link: "https://www.linkedin.com/in/sahil-upadhyay-2921b5127/" },
    { logo: mediumLogo, link: "https://medium.com/@sahilupadhyay.work" },
    { logo: resumeLogo, link: "/resume.pdf" }, // Assuming resume is hosted
  ];

  // Define exclusion zones around main planets to prevent overlap
  const exclusionZones = [
    { center: [200, 0, 0], minDistance: 60 },  // Purple Planet
    { center: [-200, 0, 0], minDistance: 60 }, // Blue Planet
    { center: [0, 200, 0], minDistance: 60 },  // Green Planet
    { center: [120, 0, 0], minDistance: 60 },  // Saturn 1
    { center: [-120, 0, 0], minDistance: 60 }, // Saturn 2
    { center: [0, 120, 0], minDistance: 60 },  // Saturn 3
  ];

  // Generate randomized positions ensuring minimum distance between logo planets and exclusion zones
  const positions = useMemo(
    () => generateRandomPositions(logos.length, 80, 500, exclusionZones), // Increased minDistance to 80
    [logos.length]
  );

  // Define unique glowing colors for each planet
  const glowingColors = useMemo(() => {
    return logos.map(() => new THREE.Color(Math.random(), Math.random(), Math.random()));
  }, [logos.length]);

  return (
    <group>
      {logos.map((item, index) => {
        const position = positions[index];
        const size = 4; // Uniform size; adjust as needed
        const emissiveColor = glowingColors[index];

        return (
          <LogoPlanet
            key={index}
            logo={item.logo}
            position={position}
            size={size}
            link={item.link}
            emissiveColor={emissiveColor}
          />
        );
      })}
    </group>
  );
};

/* ------------------------------- Main App ------------------------------ */

export const App = () => {
  const wrapperRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (wrapperRef.current) {
      const { offsetWidth, offsetHeight } = wrapperRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
    }
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        shadows
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 300], fov: 35, near: 1, far: 1000 }} // Increased far plane for larger scenes
      >
        <OrbitControls />
        {/* Lighting Setup */}
        <ambientLight intensity={0.2} color="#ffffff" /> {/* Subtle ambient light */}
        <color attach="background" args={["#000022"]} /> {/* Dark Blue Background */}
        <spotLight
          intensity={1}
          angle={0.2}
          penumbra={1}
          position={[100, 100, 100]}
          castShadow
          shadow-mapSize={[2048, 2048]} // High-quality shadows
          color="#ffffff"
        />
        <directionalLight
          intensity={0.5}
          position={[-50, 50, 50]}
          castShadow
          color="#ffffff"
        />

        {/* Milky Way Background */}
        <MilkyWay />

        {/* Starfield */}
        <Starfield />

        {/* Nebulae */}
        <Nebulae />

        {/* Asteroid Belt */}
        <AsteroidBelt radius={70} count={5000} />

        {/* Black Sun */}
        <BlackSun position={[0, 0, 0]} radius={10} />

        {/* Saturn */}
        <Saturn position={[120, 0, 0]} radius={15} ringRadius={25} /> {/* Adjusted Position */}
        <Saturn position={[-120, 0, 0]} radius={15} ringRadius={25} /> {/* Adjusted Position */}
        <Saturn position={[0, 120, 0]} radius={15} ringRadius={25} /> {/* Adjusted Position */}

        {/* Physics World */}
        <Physics gravity={[0, 0, 0]} iterations={20}>
          {/* Existing Spheres with exclusion zones to prevent overlapping with fixed main planets */}
          <Spheres
            exclusionZones={[
              { center: [200, 0, 0], minDistance: 60 },  // Purple Planet
              { center: [-200, 0, 0], minDistance: 60 }, // Blue Planet
              { center: [0, 200, 0], minDistance: 60 },  // Green Planet
              { center: [120, 0, 0], minDistance: 60 },  // Saturn 1
              { center: [-120, 0, 0], minDistance: 60 }, // Saturn 2
              { center: [0, 120, 0], minDistance: 60 },  // Saturn 3
            ]}
          />
          {/* Pointer */}
          <Pointer />
        </Physics>

        {/* Comets */}
        <Comets />

        {/* Environment Setup */}
        <Environment preset="night" /> {/* Night preset for appropriate reflections */}

        {/* Post-processing Effects */}
        <EffectComposer disableNormalPass multisampling={0}>
          <SSAO
            samples={31}
            radius={20}
            intensity={20}
            luminanceInfluence={0.5}
            color="#000000"
          />
          <Bloom
            mipmapBlur
            levels={7}
            intensity={1.5} // Enhanced bloom for stronger glow effects
          />
          <SMAA />
        </EffectComposer>

        {/* Logo Planets */}
        <LogoPlanets />
      </Canvas>

      {/* Optional: Display Canvas Dimensions */}
      <div style={{ position: "absolute", top: 20, left: 20, color: "white" }}>
    
      </div>
    </div>
  );
};

export default App;
