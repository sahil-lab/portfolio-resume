// src/App.js

import { Physics, useSphere, useBox } from "@react-three/cannon";
import {
  Environment,
  OrbitControls,
  shaderMaterial,
  useMatcapTexture,
  Sky,
  Stars,
  Cloud,
  Float,
  Sparkles,
  Trail,
  AdaptiveDpr,
  AdaptiveEvents,
  PerformanceMonitor,
  Preload,
  BakeShadows
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  ChromaticAberration,
  DepthOfField,
  Noise,
  Vignette,
  GodRays,
  ToneMapping,
  SMAA,
  SSAO
} from "@react-three/postprocessing";
import { BlendFunction, Resizer, KernelSize } from "postprocessing";
import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from "react";
import * as THREE from "three";

// Import Logo Textures
import { Comets } from "./components/Comets";
import FixedMainPlanets from "./components/FixedMainPlanets";
import LogoPlanets from "./components/LogoPlanets";
import MilkyWay from "./components/MilkyWay";
import Nebulae from "./components/Nebulae";
import {
  EnhancedNebulaeMaterial,
  OutlinesMaterial,
  ProceduralSphereMaterial,
  AtmosphereMaterial,
  PulsatingMaterial,
  WormholeMaterial,
  BlackHoleMaterial,
  GlassPlanetMaterial
} from "./components/ShaderMaterials";
import Spheres from "./components/Spheres";
import Starfield from "./components/Starfield";
import Popup from "./components/Popup";
import LoadingScreen from "./components/LoadingScreen";
import SpaceJunk from "./components/SpaceJunk";
import WormholePortal from "./components/WormholePortal";
import BlackHole from "./components/BlackHole";
import SpaceStation from "./components/SpaceStation";
import PlanetRings from "./components/PlanetRings";
import SpaceDebris from "./components/SpaceDebris";
import AsteroidField from "./components/AsteroidField";
import GalacticCore from "./components/GalacticCore";
import ControlPanel from "./components/ControlPanel";
import SpaceDust from "./components/SpaceDust";
import SoundScape from "./components/SoundScape";
import GalaxyCluster from "./components/GalaxyCluster";
import TimeControls from "./components/TimeControls";
import { useControls } from "leva";
import AlienCharacter from "./components/AlienCharacter";
import DancingRobot from "./components/DancingRobot";
import Supernova from "./components/Supernova";
import CosmicPortal from "./components/CosmicPortal";
import GalacticRadar from "./components/GalacticRadar";
import SpiralGalaxy from "./components/SpiralGalaxy";
import CelestialBridge from "./components/CelestialBridge";
import CrystalFormation from "./components/CrystalFormation";
import ComputerPC from "./components/ComputerPC";

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

// Enhanced popup messages with more interesting content and interactive elements
const popupMessages = [
  {
    text: "I hope you like the space you are in! Let's get in touch. Contact me at: 8559067075 / sahil.aps2k12@gmail.com",
    type: "contact",
    action: "mailto:sahil.aps2k12@gmail.com"
  },
  {
    text: "Have you tried pressing WASD for space travel? Try shift for boost and ctrl for slow motion!",
    type: "tip",
    highlight: ["W", "A", "S", "D", "SHIFT", "CTRL"]
  },
  {
    text: "Why don't you try clicking on the sun? It might show you something interesting...",
    type: "interactive",
    targetObject: "sun"
  },
  {
    text: "Did you know? A teaspoon of a neutron star would weigh about 6 billion tons!",
    type: "fact",
    image: "neutron-star.jpg"
  },
  {
    text: "Try the 'T' key to activate time distortion around celestial bodies!",
    type: "tip",
    highlight: ["T"]
  },
  {
    text: "Press 'G' to toggle gravity visualization around massive objects",
    type: "tip",
    highlight: ["G"]
  },
  {
    text: "Press 'E' near any planet to explore its surface up close",
    type: "tip",
    highlight: ["E"]
  },
  {
    text: "Did you know? Space is completely silent because there is no atmosphere to carry sound.",
    type: "fact",
    sound: "space-silence.mp3"
  },
  {
    text: "Try pressing 'C' to switch camera perspectives",
    type: "tip",
    highlight: ["C"]
  },
  {
    text: "Did you know? 99% of our solar system's mass is in the Sun.",
    type: "fact",
    visual: "sun-mass-visualization"
  },
  {
    text: "Press 'M' to toggle the ambient music tracks",
    type: "tip",
    highlight: ["M"]
  },
  {
    text: "Find all 7 hidden easter eggs throughout the universe for a special surprise!",
    type: "challenge",
    counter: "easterEggs"
  }
];

/* ----------------------------------------------------------------------------------
  1. CustomOutlines component for rendering outlines around objects
---------------------------------------------------------------------------------- */
export const CustomOutlines = ({
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

/* ----------------------------------------------------------------------------------
  2. useFrameState hook to track elapsed time - enhanced with delta time scaling
---------------------------------------------------------------------------------- */
const useFrameState = (speedFactor = 1) => {
  const [time, setTime] = useState(0);
  const speedRef = useRef(speedFactor);

  useEffect(() => {
    speedRef.current = speedFactor;
  }, [speedFactor]);

  useFrame((state, delta) => {
    setTime((prev) => prev + delta * speedRef.current);
  });
  return time;
};

/* ----------------------------------------------------------------------------------
  Enhanced Pointer component with interactive effects
---------------------------------------------------------------------------------- */
const Pointer = () => {
  const { camera, mouse } = useThree();
  const ref = useRef();
  const trailRef = useRef();
  const [active, setActive] = useState(false);
  const [color, setColor] = useState(new THREE.Color("white"));
  const colorRef = useRef(new THREE.Color("white"));

  // Mouse click handler
  useEffect(() => {
    const handleMouseDown = () => {
      setActive(true);
      // Random color on click
      colorRef.current.setHSL(Math.random(), 0.8, 0.8);
      setColor(colorRef.current);

      // Return to white after 500ms
      setTimeout(() => {
        colorRef.current.set("white");
        setColor(colorRef.current);
        setActive(false);
      }, 500);
    };

    window.addEventListener("mousedown", handleMouseDown);
    return () => window.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Calculate the pointer position in 3D space based on mouse movement
  useFrame(() => {
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera);
    ref.current.position.lerp(vector, 0.1); // Smoothly interpolate to the target position
  });

  return (
    <group>
      <Trail
        width={1}
        length={8}
        color={color.getStyle()}
        attenuation={(t) => t * t}
        visible={active}
      >
        <mesh ref={ref} position={[0, 0, 0]}>
          <sphereGeometry args={[active ? 0.08 : 0.05, 16, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
          <CustomOutlines
            color={color}
            opacity={0.7}
            transparent={true}
            thickness={0.01}
          />
        </mesh>
      </Trail>
    </group>
  );
};

/* ----------------------------------------------------------------------------------
  4. Sphere component for individual dynamic spheres with emissive glow
---------------------------------------------------------------------------------- */
export const Sphere = ({ position, size, outlines, seed, baseColor }) => {
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
      THREE.MathUtils.randFloatSpread(10)
    ] // Random initial velocity
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
      <meshPhysicalMaterial
        metalness={0.2}
        roughness={0.1}
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={0.5}
        transparent={true}
        transmission={0.9}
        thickness={size * 2}
        envMapIntensity={3.0}
        clearcoat={1.0}
        clearcoatRoughness={0.2}
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

/* ----------------------------------------------------------------------------------
  5. BlackSun component representing the central "black sun"
---------------------------------------------------------------------------------- */
const BlackSun = ({ position = [0, 0, 0], radius = 10 }) => {
  const [planets, setPlanets] = useState([]); // State to store dynamically created planets

  // Create the SunMaterial with additive blending for glowing effect
  const SunMaterial = useMemo(
    () =>
      shaderMaterial(
        {
          glowColor: new THREE.Color("yellow"),
          time: 0
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

          float noise(vec3 p){
              return fract(sin(dot(p, vec3(12.9898,78.233, 45.164))) * 43758.5453);
          }

          void main() {
            float n = noise(vNormal * 10.0 + time * 2.0);
            
            float emission = 1.0 + 0.5 * n;
            emission = clamp(emission, 0.0, 1.0);
            
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
        baseColor // Unique base color
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
          planet.position[2] + planet.velocity.z * 0.1
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

  // Add animated corona effect
  const coronaRef = useRef();
  const coronaParticlesRef = useRef();
  const sunRef = useRef();
  const [glowIntensity, setGlowIntensity] = useState(1.5);
  const [sunInteracted, setSunInteracted] = useState(false);

  // Corona animation
  useFrame((state, delta) => {
    if (coronaRef.current) {
      coronaRef.current.rotation.z += delta * 0.05;
      coronaRef.current.rotation.y += delta * 0.03;

      // Pulse the corona
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 + 1;
      coronaRef.current.scale.set(pulse, pulse, pulse);
    }

    if (coronaParticlesRef.current) {
      coronaParticlesRef.current.rotation.y -= delta * 0.02;
    }

    if (sunRef.current) {
      // Gentle pulsing effect
      const pulseFactor = Math.sin(state.clock.elapsedTime * 0.3) * 0.05 + 1;
      sunRef.current.material.emissiveIntensity = glowIntensity * pulseFactor;
    }
  });

  const handleSunClick = useCallback(() => {
    // Solar flare effect
    setGlowIntensity(prev => prev + 0.25);
    setSunInteracted(true);

    // Return to normal after animation
    setTimeout(() => {
      setGlowIntensity(1.0);
    }, 2000);
  }, []);

  return (
    <group position={position}>
      {/* Core sun sphere */}
      <mesh
        ref={sunRef}
        onClick={handleSunClick}
        onPointerOver={() => document.body.style.cursor = "pointer"}
        onPointerOut={() => document.body.style.cursor = "default"}
      >
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffcc00"
          emissive="#ffaa00"
          emissiveIntensity={0.5}
          metalness={0.2}
          roughness={0.7}
          transmission={0.5}
          thickness={2.0}
          envMapIntensity={2.0}
          clearcoat={1.0}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Corona effect */}
      <mesh ref={coronaRef} scale={1.3}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial
          color="#ffdd44"
          emissive="#ff8800"
          emissiveIntensity={0.3}
          transparent
          opacity={0.2}
          side={THREE.BackSide}
          transmission={0.9}
          thickness={5.0}
          envMapIntensity={1.5}
          roughness={0.1}
        />
      </mesh>

      {/* Solar flares */}
      <Sparkles
        ref={coronaParticlesRef}
        count={300}
        scale={radius * 2.5}
        size={3}
        speed={0.2}
        opacity={0.5}
        color="#ff7700"
      />

      {/* Volumetric light rays */}
      {sunInteracted && (
        <Sparkles
          count={500}
          scale={radius * 4}
          size={4}
          speed={0.8}
          opacity={0.3}
          color="#ffaa00"
        />
      )}

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
    </group>
  );
};

/* ----------------------------------------------------------------------------------
  6. Saturn component with dynamic rings
---------------------------------------------------------------------------------- */
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
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        // Fragment Shader
        `
          uniform vec3 color;
          uniform float time;

          varying vec3 vNormal;
          varying vec3 vPosition;

          float noise(vec3 p){
              return fract(sin(dot(p, vec3(12.9898,78.233, 45.164))) * 43758.5453);
          }

          void main() {
            vec3 normalizedNormal = normalize(vNormal);
            vec3 lightDirection = normalize(vec3(1.0, 1.0, 0.5));

            float diffuse = max(dot(normalizedNormal, lightDirection), 0.0);

            vec3 viewDirection = normalize(-vPosition);
            vec3 reflectDirection = reflect(-lightDirection, normalizedNormal);
            float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), 16.0);

            float n = noise(vPosition * 0.1 + time * 0.5);

            vec3 baseColor = mix(color, vec3(1.0, 0.8, 0.3), n);

            vec3 emissive = baseColor * 0.3; 
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
  const saturnRef = useRef();

  useFrame(({ clock }) => {
    if (ringRef.current) {
      // Rotate the rings over time
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.1;
    }

    // Update time uniform for glass material
    if (saturnRef.current && saturnRef.current.material) {
      saturnRef.current.material.time = clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      {/* Saturn Sphere */}
      <mesh ref={saturnRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <glassPlanetMaterial
          color={new THREE.Color(0.9, 0.7, 0.3)}
          glowColor={new THREE.Color(0.9, 0.6, 0.1)}
          glowIntensity={0.7}
          transmission={0.8}
          thickness={radius * 1.5}
          envMapIntensity={2.0}
          roughness={0.2}
          clearcoat={1.0}
          time={0}
        />
      </mesh>

      {/* Saturn Rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius + 2, ringRadius, 64, 64]} />
        <meshPhysicalMaterial
          color="#d2cdb8"
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          transmission={0.5}
          thickness={1.0}
          envMapIntensity={2.0}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

/* ----------------------------------------------------------------------------------
  7. AsteroidBelt component representing a belt of asteroids
---------------------------------------------------------------------------------- */
const AsteroidBelt = ({ radius = 70, count = 5000 }) => {
  const asteroidGroup = useRef();
  const instancedMeshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scales = useMemo(() => new Float32Array(count), [count]);
  const rotations = useMemo(() => new Float32Array(count * 3), [count]);
  const orbitalSpeeds = useMemo(() => new Float32Array(count), [count]);
  const orbitalAngles = useMemo(() => new Float32Array(count), [count]);
  const [matcap] = useMatcapTexture("C8D1DC_575B62_818892_6E747B", 1024);

  // Initialize asteroid positions, scales, and rotations
  useEffect(() => {
    // Random distribution of asteroids with varied parameters
    for (let i = 0; i < count; i++) {
      // Distribute within a ring (not just a circle)
      const theta = Math.random() * Math.PI * 2;
      const ringWidth = radius * 0.3;
      const distance = radius - ringWidth / 2 + Math.random() * ringWidth;

      // Slightly varied height for 3D effect
      const verticalVariance = Math.random() * radius * 0.1 - radius * 0.05;

      // Position
      const x = Math.cos(theta) * distance;
      const y = verticalVariance;
      const z = Math.sin(theta) * distance;

      // Random scale (asteroid size)
      const scale = Math.random() * 0.5 + 0.2;
      scales[i] = scale;

      // Random rotation
      rotations[i * 3] = Math.random() * Math.PI * 2;
      rotations[i * 3 + 1] = Math.random() * Math.PI * 2;
      rotations[i * 3 + 2] = Math.random() * Math.PI * 2;

      // Orbital parameters
      orbitalSpeeds[i] = (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1);
      orbitalAngles[i] = theta;

      // Set position and scale
      dummy.position.set(x, y, z);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, radius, scales, rotations, orbitalSpeeds, orbitalAngles]);

  // Animate asteroids
  useFrame((state, delta) => {
    if (!instancedMeshRef.current) return;

    // Update each asteroid's position and rotation
    for (let i = 0; i < count; i++) {
      // Update orbital angle
      orbitalAngles[i] += orbitalSpeeds[i] * delta;

      // Calculate new position
      const distance = radius - (radius * 0.15) + (radius * 0.3) * (i % 10) / 10;
      const x = Math.cos(orbitalAngles[i]) * distance;
      const z = Math.sin(orbitalAngles[i]) * distance;

      // Get vertical position (y)
      const verticalCycle = Math.sin(orbitalAngles[i] * 3 + i * 0.1) * radius * 0.05;

      // Update rotation
      rotations[i * 3] += delta * 0.1 * (i % 3 + 1);
      rotations[i * 3 + 1] += delta * 0.2 * ((i + 1) % 3 + 1);

      // Update matrix
      dummy.position.set(x, verticalCycle, z);
      dummy.scale.set(scales[i], scales[i], scales[i]);
      dummy.rotation.set(rotations[i * 3], rotations[i * 3 + 1], rotations[i * 3 + 2]);
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={asteroidGroup}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[null, null, count]}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 1]} />
        <meshMatcapMaterial matcap={matcap} roughness={0.6} />
      </instancedMesh>
    </group>
  );
};

/* ----------------------------------------------------------------------------------
  8. SolarSystem component
     - Creates a classic solar system (Sun + planets) with basic orbital rotation
---------------------------------------------------------------------------------- */
function SolarSystem() {
  // Define planet data: name, distance from sun, size, orbit speed, color
  const planetData = [
    {
      name: "Mercury",
      distance: 40,
      size: 2,
      orbitSpeed: 0.02,
      color: "#a9a9a9"
    },
    {
      name: "Venus",
      distance: 55,
      size: 3,
      orbitSpeed: 0.015,
      color: "#c2b280"
    },
    {
      name: "Earth",
      distance: 70,
      size: 3.2,
      orbitSpeed: 0.012,
      color: "#1f8ef1"
    },
    {
      name: "Mars",
      distance: 85,
      size: 2.8,
      orbitSpeed: 0.01,
      color: "#b23d3d"
    },
    {
      name: "Jupiter",
      distance: 120,
      size: 8,
      orbitSpeed: 0.008,
      color: "#e6ac70"
    },
    {
      name: "Saturn",
      distance: 150,
      size: 7,
      orbitSpeed: 0.006,
      color: "#d2b48c",
      ring: true
    },
    {
      name: "Uranus",
      distance: 180,
      size: 6,
      orbitSpeed: 0.004,
      color: "#7fffd4"
    },
    {
      name: "Neptune",
      distance: 210,
      size: 6,
      orbitSpeed: 0.003,
      color: "#4169e1"
    },
    {
      name: "Pluto",
      distance: 230,
      size: 1.5,
      orbitSpeed: 0.002,
      color: "#cccccc"
    }
  ];

  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // For each planet, rotate around the Sun
    planetData.forEach((planet, idx) => {
      // The child is planet idx + 1 because child(0) is the Sun
      const planetMesh = groupRef.current.children[idx + 1];
      if (planetMesh) {
        const angle = clock.elapsedTime * planet.orbitSpeed;
        planetMesh.position.x = Math.cos(angle) * planet.distance;
        planetMesh.position.z = Math.sin(angle) * planet.distance;

        // Update time uniform for glass planet material
        if (planetMesh.children[0] && planetMesh.children[0].material) {
          planetMesh.children[0].material.time = clock.elapsedTime;
        }
      }
    });
  });

  // Create a simple sun material
  const SolarSunMaterial = useMemo(
    () =>
      shaderMaterial(
        {
          color: new THREE.Color("orange"),
          time: 0
        },
        // Vertex
        `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
        // Fragment
        `
        uniform vec3 color;
        uniform float time;

        varying vec3 vNormal;

        float noise(vec3 p){
          return fract(sin(dot(p, vec3(12.9898,78.233, 45.164))) * 43758.5453);
        }

        void main() {
          float n = noise(vNormal * 10.0 + time * 2.0);
          float emission = 1.0 + 0.5 * n;
          emission = clamp(emission, 0.0, 1.0);
          vec3 finalColor = color * emission;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
      ),
    []
  );
  extend({ SolarSunMaterial });

  const solarSunRef = useRef();
  useFrame((_, delta) => {
    // Update time for the sun
    if (solarSunRef.current) {
      solarSunRef.current.uniforms.time.value += delta;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -400]}>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[15, 64, 64]} />
        <solarSunMaterial ref={solarSunRef} />
      </mesh>

      {/* Planets */}
      {planetData.map((planet) => (
        <group key={planet.name}>
          <mesh>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <glassPlanetMaterial
              color={new THREE.Color(planet.color)}
              glowColor={new THREE.Color(planet.color)}
              glowIntensity={0.8}
              transmission={0.9}
              thickness={planet.size * 2}
              envMapIntensity={2.5}
              roughness={0.1}
              clearcoat={1.0}
              time={0}
            />
          </mesh>
          {/* Saturn ring if needed */}
          {planet.ring && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.size + 2, planet.size + 5, 64, 8]} />
              <meshPhysicalMaterial
                color="#aaaaff"
                side={THREE.DoubleSide}
                transparent
                transmission={0.9}
                thickness={1}
                roughness={0.1}
                opacity={0.8}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------------------------
  9. ShootingStars component
     - Continuously spawns small 'shooting stars' that traverse the scene
---------------------------------------------------------------------------------- */
function ShootingStars({ count = 6, speed = 0.5, spread = 800 }) {
  // Each shooting star: position (x,y,z), velocity, lifeTime
  const [stars, setStars] = useState([]);

  // Helper to create a new star
  const createStar = () => {
    const startX = (Math.random() - 0.5) * spread; // random range
    const startY = Math.random() * 200 + 100; // start high above camera
    const startZ = (Math.random() - 0.5) * spread;

    // random directions, mostly downward
    const velX = (Math.random() - 0.5) * 0.5;
    const velY = -Math.random() * speed - 0.2; // negative for downward
    const velZ = (Math.random() - 0.5) * 0.5;

    return {
      id: Math.random(),
      position: new THREE.Vector3(startX, startY, startZ),
      velocity: new THREE.Vector3(velX, velY, velZ),
      life: 0,
      maxLife: Math.random() * 5 + 5 // random total lifetime
    };
  };

  // Initialize some stars
  useEffect(() => {
    const initialStars = [];
    for (let i = 0; i < count; i++) {
      initialStars.push(createStar());
    }
    setStars(initialStars);
  }, [count]);

  // Animate stars
  useFrame((_, delta) => {
    setStars((prevStars) =>
      prevStars
        .map((star) => {
          // update position
          star.position.addScaledVector(star.velocity, delta * 60);
          star.life += delta;
          return star;
        })
        // remove dead stars
        .filter((star) => star.life < star.maxLife)
    );
  });

  // Continuously spawn new stars if below count
  useEffect(() => {
    const interval = setInterval(() => {
      setStars((prev) => {
        if (prev.length < count) {
          return [...prev, createStar()];
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <mesh key={star.id} position={star.position}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
      ))}
    </>
  );
}

/* ----------------------------------------------------------------------------------
  10. BiggerUniverse
      - A large array of 'stars' orbiting the main sun at [0,0,0], giving the effect
        of an even bigger cosmic environment enveloping the black sun area.
---------------------------------------------------------------------------------- */
function BiggerUniverse({ starCount = 2000, maxRadius = 2000, orbitSpeed = 0.0001 }) {
  // Each big star entry: initial angle, radius, y offset, color
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const newStars = [];
    for (let i = 0; i < starCount; i++) {
      const distance = THREE.MathUtils.randFloat(maxRadius * 0.5, maxRadius);
      const angle = Math.random() * Math.PI * 2;
      const yOff = (Math.random() - 0.5) * maxRadius * 0.2; // small vertical offset
      const colorHue = Math.random();
      const colorSat = THREE.MathUtils.randFloat(0.6, 1);
      const colorLight = THREE.MathUtils.randFloat(0.5, 0.9);
      const color = new THREE.Color().setHSL(colorHue, colorSat, colorLight);

      newStars.push({
        angle,
        distance,
        yOff,
        color,
        rotationSpeed: orbitSpeed * THREE.MathUtils.randFloat(0.5, 1.5)
      });
    }
    setStars(newStars);
  }, [starCount, maxRadius, orbitSpeed]);

  // We'll revolve them around [0,0,0] (the BlackSun's position)
  // in a horizontal ring with slight vertical offset
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((starMesh, idx) => {
        const starData = stars[idx];
        if (!starData) return;
        starData.angle += starData.rotationSpeed * delta * 60;
        const x = Math.cos(starData.angle) * starData.distance;
        const z = Math.sin(starData.angle) * starData.distance;
        starMesh.position.set(x, starData.yOff, z);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {stars.map((s, idx) => (
        <mesh key={idx} position={[0, 0, 0]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={s.color} />
        </mesh>
      ))}
    </group>
  );
}

export const App = () => {
  const wrapperRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Popup state management
  const [currentPopup, setCurrentPopup] = useState(null);
  const popupIndexRef = useRef(0);
  const popupTimerRef = useRef(null);

  // Function to show the next popup
  const showNextPopup = () => {
    setCurrentPopup(popupMessages[popupIndexRef.current]);
    popupIndexRef.current = (popupIndexRef.current + 1) % popupMessages.length;
  };

  // Set up interval to show popups every three minutes (180000 milliseconds)
  useEffect(() => {
    // Show the first popup after three minutes
    popupTimerRef.current = setInterval(showNextPopup, 180000); // 3 minutes

    // Optionally, show the first popup immediately
    // showNextPopup();

    return () => {
      if (popupTimerRef.current) {
        clearInterval(popupTimerRef.current);
      }
    };
  }, []);

  // Handler to close the popup
  const handleClosePopup = () => {
    setCurrentPopup(null);
  };

  useEffect(() => {
    const updateDimensions = () => {
      if (wrapperRef.current) {
        const { offsetWidth, offsetHeight } = wrapperRef.current;
        setDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    // Wait for the DOM to ensure `wrapperRef` is initialized
    const timeout = setTimeout(() => {
      updateDimensions();
    }, 0); // Ensures this runs after the component is rendered

    // Add resize listener for dynamic updates
    window.addEventListener("resize", updateDimensions);

    // Cleanup listener and timeout
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Dynamic settings with Leva controls panel (optional UI for debugging)
  const {
    timeSpeed,
    enableBloom,
    starIntensity,
    musicVolume,
    ambientLightIntensity,
    showPerformanceStats
  } = useControls({
    timeSpeed: { value: 1, min: 0.1, max: 5, step: 0.1 },
    enableBloom: true,
    starIntensity: { value: 1.5, min: 0.1, max: 3, step: 0.1 },
    musicVolume: { value: 0.5, min: 0, max: 1, step: 0.1 },
    ambientLightIntensity: { value: 0.2, min: 0, max: 1, step: 0.1 },
    showPerformanceStats: false
  });

  // Performance management
  const [dpr, setDpr] = useState(1.5);

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100vw", height: "100vh", position: "relative" }}
    >
      <Canvas
        shadows
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          stencil: false,
          alpha: false
        }}
        dpr={dpr} // Controlled by PerformanceMonitor
        camera={{ position: [0, 0, 300], fov: 35, near: 1, far: 4000 }}
      >
        <PerformanceMonitor
          onIncline={() => setDpr(Math.min(2, dpr + 0.5))}
          onDecline={() => setDpr(Math.max(0.75, dpr - 0.5))}
        >
          <Suspense fallback={<LoadingScreen />}>
            <AdaptiveDpr pixelated />
            <AdaptiveEvents />

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              minDistance={50}
              maxDistance={1000}
              zoomSpeed={2.5}
              rotateSpeed={0.4}
              panSpeed={0.8}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.DOLLY,
                RIGHT: THREE.MOUSE.PAN
              }}
            />

            {/* Enhanced Lighting Setup */}
            <ambientLight intensity={ambientLightIntensity} color="#ffffff" />
            <color attach="background" args={["#000000"]} />
            <spotLight
              intensity={1}
              angle={0.2}
              penumbra={1}
              position={[100, 100, 100]}
              castShadow
              shadow-mapSize={[2048, 2048]}
              color="#ffffff"
            />
            <directionalLight
              intensity={0.5}
              position={[-50, 50, 50]}
              castShadow
              color="#ffffff"
            />

            {/* Stars with enhanced parameters */}
            <Stars
              radius={1000}
              depth={400}
              count={800}
              factor={2.0}
              fade
              speed={1}
            />

            {/* Immersive Audio */}
            <SoundScape volume={musicVolume} />

            {/* Enhanced Background Elements */}
            <GalaxyCluster />
            <MilkyWay />
            <Starfield intensity={starIntensity} />
            <Nebulae enhanced={true} />
            <SpaceDust />
            <SpiralGalaxy position={[-500, 800, -500]} radius={4000} numStars={35000} numArms={7} />

            {/* Cosmic elements */}
            <BiggerUniverse starCount={600} maxRadius={2000} orbitSpeed={0.0001 * timeSpeed} />
            <AsteroidBelt radius={70} count={1000} />
            <BlackSun position={[0, 0, 0]} radius={10} />
            <SpaceDebris />
            <SolarSystem />
            <CelestialBridge startPoint={[-350, 50, -300]} endPoint={[350, 100, -400]} width={20} />
            <WormholePortal position={[500, 100, -200]} />
            <BlackHole position={[-400, -300, -100]} size={30} />
            <SpaceStation position={[150, 30, 100]} size={30} />
            <CrystalFormation position={[300, -100, -100]} />
            <Supernova />

            <CosmicPortal position={[200, -100, -150]} radius={25} />
            <GalacticRadar position={[0, -100, 200]} />

            {/* Giant Alien Character and Dancing Robot - the biggest objects in the universe */}
            <AlienCharacter position={[0, -200, -2500]} scale={250} />
            <DancingRobot position={[500, 0, -300]} scale={40} />
            <ComputerPC position={[-550, 0, 250]} scale={50} />

            {/* Enhanced animation elements */}
            <Comets density={0.4} />
            <ShootingStars count={300} speed={0.5} spread={800} />

            {/* Environment setup */}
            <Environment preset="night" />
            <BakeShadows />
            <Preload all />

            {/* Enhanced Post-processing Effects */}
            <EffectComposer multisampling={8}>
              {/* Bloom completely disabled to prevent flashing */}

              {/* Only keep minimal effects */}
              <Vignette
                eskil={false}
                offset={0.1}
                darkness={0.3}
                blendFunction={BlendFunction.NORMAL}
              />

              <SMAA />
            </EffectComposer>

            {/* Interactive Elements */}
            <LogoPlanets />

            {/* Display FPS counter if enabled */}
            {showPerformanceStats && <Stats showPanel={0} className="stats" />}
          </Suspense>
        </PerformanceMonitor>
      </Canvas>

      {/* UI Elements */}
      {currentPopup && (
        <Popup
          message={currentPopup.text}
          type={currentPopup.type}
          action={currentPopup.action}
          highlight={currentPopup.highlight}
          onClose={handleClosePopup}
        />
      )}

      {/* Control Panel for Mobile Users */}
      <ControlPanel />

      {/* Time Controls UI Outside Canvas */}
      <TimeControls />
    </div>
  );
};

export default App;