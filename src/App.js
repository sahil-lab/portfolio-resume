// src/App.js

import { Physics, useSphere } from "@react-three/cannon";
import {
  Environment,
  OrbitControls,
  shaderMaterial
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  // Screen Space Ambient Occlusion
  SMAA,
  SSAO
} from "@react-three/postprocessing";
import React, {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
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
  ProceduralSphereMaterial
} from "./components/ShaderMaterials";
import Spheres from "./components/Spheres";
import Starfield from "./components/Starfield";
import Popup from "./components/Popup";
// Extend Three.js with custom materials
extend({
  OutlinesMaterial,
  ProceduralSphereMaterial,
  EnhancedNebulaeMaterial
});

import LoadingScreen from "./components/LoadingScreen"; // Import the LoadingScreen component
const popupMessages = [
  "I hope you like the space you are in! Let's get in touch. Contact me at: 8559067075 / sahil.aps2k12@gmail.com",
  "Have you tried pressing WASD for space travel?",
  "Why don't you try clickin on the sun ?",
  "Did you know? A teaspoon of a neutron star would weigh about 6 billion tons!",
  "Fun Fact: There are more stars in the universe than grains of sand on all the beaches on Earth.",
  "Did you know? Space is completely silent because there is no atmosphere to carry sound.",
  "Fun Fact: A day on Venus is longer than a year on Venus!",
  "Did you know? 99% of our solar system's mass is in the Sun.",
  "Fun Fact: There are potentially more planets in the universe than grains of sand on Earth.",
  // Add more facts or messages as desired
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
  2. useFrameState hook to track elapsed time
---------------------------------------------------------------------------------- */
const useFrameState = () => {
  const [time, setTime] = useState(0);
  useFrame((state, delta) => {
    setTime((prev) => prev + delta);
  });
  return time;
};

/* ----------------------------------------------------------------------------------
  3. Pointer component to visualize the mouse pointer in 3D space
---------------------------------------------------------------------------------- */
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
      <proceduralSphereMaterial
        metalness={0.6}
        roughness={0.2}
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

/* ----------------------------------------------------------------------------------
  7. AsteroidBelt component representing a belt of asteroids
---------------------------------------------------------------------------------- */
const AsteroidBelt = ({ radius = 170, count = 5000 }) => {
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
            <meshStandardMaterial emissive={planet.color} color={planet.color} />
          </mesh>
          {/* Saturn ring if needed */}
          {planet.ring && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.size + 2, planet.size + 5, 64, 8]} />
              <meshBasicMaterial
                color="gray"
                side={THREE.DoubleSide}
                transparent
                opacity={0.6}
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

  return (
    <div
      ref={wrapperRef}
      style={{ width: "100vw", height: "100vh", position: "relative" }}
    >
      <Canvas
        shadows
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 300], fov: 35, near: 1, far: 4000 }} // Increase far plane
      >
        <Suspense fallback={<LoadingScreen />}>
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

        {/* A bigger universe (stars) orbiting around the main sun */}
        <BiggerUniverse starCount={2000} maxRadius={2000} orbitSpeed={0.0001} />

        {/* Asteroid Belt */}
        <AsteroidBelt radius={70} count={5000} />

        {/* Black Sun */}
        <BlackSun position={[0, 0, 0]} radius={10} />

        {/* Saturn (example big ones placed around) */}
        <Saturn position={[300, 0, 20]} radius={50} ringRadius={75} />
        <Saturn position={[-120, 0, 0]} radius={15} ringRadius={25} />
        <Saturn position={[0, 120, 0]} radius={15} ringRadius={25} />

        {/* Solar System (classic Sun + Planets) */}
        <SolarSystem />

        {/* Physics World for bouncing spheres */}
        <Physics gravity={[0, 0, 0]} iterations={20}>
          <Spheres
            exclusionZones={[
              { center: [200, 0, 0], minDistance: 60 }, // Purple Planet
              { center: [-200, 0, 0], minDistance: 60 }, // Blue Planet
              { center: [0, 200, 0], minDistance: 60 }, // Green Planet
              { center: [120, 0, 0], minDistance: 60 }, // Saturn 1
              { center: [-120, 0, 0], minDistance: 60 }, // Saturn 2
              { center: [0, 120, 0], minDistance: 60 } // Saturn 3
            ]}
          />
          {/* Pointer */}
          <Pointer />
        </Physics>

        {/* Comets */}
        <Comets />

        {/* Always present shooting stars */}
        <ShootingStars count={6} speed={0.5} spread={800} />

        {/* Environment Setup */}
        <Environment preset="night" /> {/* Night preset for appropriate reflections */}

        {/* Post-processing Effects */}
        <EffectComposer disableNormalPass multisampling={0}>
          <SSAO
            samples={31}
            radius={200}
            intensity={2000}
            luminanceInfluence={0.5}
            color="#000000"
          />
          <Bloom mipmapBlur levels={7} intensity={1.5} />
          <SMAA />
        </EffectComposer>

        {/* Logo Planets */}
        <LogoPlanets />
        </Suspense>
      </Canvas>

      {/* Popup Component */}
      {currentPopup && <Popup message={currentPopup} onClose={handleClosePopup} />}

      {/* Optional: Display Canvas Dimensions */}
      <div
        style={{ position: "absolute", top: 200, left: 200, color: "white" }}
      >
        {/* Example: Width: {dimensions.width}, Height: {dimensions.height} */}
      </div>
    </div>
  );
};

export default App;