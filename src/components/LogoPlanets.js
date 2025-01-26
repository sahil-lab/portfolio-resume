// src/LogoPlanets.js

import {
  useTexture,
  Text,
  Html,
  useGLTF,
  PointerLockControls,
  useCursor,
  PositionalAudio,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React,
  {
    useEffect,
    useMemo,
    useRef,
    useState,
    Suspense,
  } from "react";
import * as THREE from "three";

// Import Logo Textures
import githubLogo from '../assets/github.png';
import gmailLogo from '../assets/gmail.png';
import linkedinLogo from '../assets/linkedin.png';
import mediumLogo from '../assets/medium.png';
import resumeLogo from '../assets/resume.png';
import whatsappLogo from '../assets/whatsapp.png';
import { CustomOutlines } from "../App"; 

// Import the music files
import musicGLB from '../assets/music.glb'; // Ensure the path is correct
import musicFile from '../assets/music.mp3'; // Ensure the path is correct

// Import a custom font (ensure the font file is in the specified path)
import customFont from '../assets/fonts/Roboto-Bold.ttf'; 

// Import the spaceship GLB model
import spaceshipModel from '../assets/spaceship.glb'; // Adjust the path as necessary

// Helper function to trigger link opening or download
const triggerLink = (link, download = false) => {
  if (download) {
    // Create an anchor element to trigger the download
    const linkElement = document.createElement('a');
    linkElement.href = link; // Use the link variable correctly
    linkElement.setAttribute('download', 'resume.pdf'); // Desired file name
    document.body.appendChild(linkElement);
    linkElement.click();
    linkElement.remove();
  } else {
    window.open(link, "_blank"); // Open the link in a new tab
  }
};

// OrbitingRing Component for adding rings around planets
const OrbitingRing = ({ size, rotationSpeed, color }) => {
  const ringRef = useRef();

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[size, 0.1, 16, 100]} />
      <meshStandardMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
};

// OrbitingParticle Component for adding particles orbiting the planet
const OrbitingParticle = ({ distance, speed, color, size }) => {
  const particleRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2); // Random starting angle

  useFrame((state, delta) => {
    angleRef.current += speed * delta;
    const x = distance * Math.cos(angleRef.current);
    const z = distance * Math.sin(angleRef.current);
    if (particleRef.current) {
      particleRef.current.position.set(x, 0, z);
    }
  });

  return (
    <mesh ref={particleRef}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// 18. LogoPlanet Component for clickable logo-bearing planets with animations
const LogoPlanet = ({ logo, position, size, link, emissiveColor, label, download }) => {
  // Load the logo texture
  const texture = useTexture(logo);

  // Reference for the mesh
  const meshRef = useRef();

  // Hover state for visual feedback
  const [hovered, setHovered] = useState(false);

  // Reference for the text mesh to apply animations
  const textRef = useRef();

  // Floating animation state using ref to prevent unnecessary re-renders
  const floatOffsetRef = useRef(0);

  // Rotate the planet for animation and handle floating text
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Adjust rotation speed as desired
    }
    if (textRef.current) {
      // Update floating animation
      floatOffsetRef.current += delta;
      textRef.current.position.y = size + 4 + Math.sin(floatOffsetRef.current) * 0.2;

      // Make text face the camera
      textRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  // Change cursor on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
  }, [hovered]);

  // Handle click event to open the link or download the resume
  const handleClick = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    triggerLink(link, download);
  };

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
        emissiveIntensity={hovered ? 2 : 1.5} // Increase emissive intensity on hover
      />
      {/* Add white outlines */}
      <CustomOutlines
        color="white"
        opacity={hovered ? 1 : 0.7}
        transparent={true}
        thickness={0.02}
      />
      
      {/* Always render the label text and control visibility via opacity */}
      <Text
        ref={textRef}
        position={[0, size + 4, 0]} // Position above the sphere
        font={customFont} // Use the custom font
        fontSize={2} // Increased font size
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1} // Outline width
        outlineColor="black" // Outline color for better contrast
        // Add emissive glow
        material-toneMapped={false}
        emissive="cyan"
        emissiveIntensity={0.5}
        opacity={hovered ? 1 : 0} // Control visibility
        transparent={true}
        // Keep text always facing the camera
        billboard
        // Smooth transition for opacity
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <alphamap_fragment>`,
            `
              #include <alphamap_fragment>
              diffuseColor.a *= opacity;
            `
          );
        }}
      >
        {label}
      </Text>

      {/* Orbiting Rings */}
      <OrbitingRing size={size + 2} rotationSpeed={0.2} color={emissiveColor} />
      <OrbitingRing size={size + 4} rotationSpeed={0.1} color={emissiveColor} />

      {/* Orbiting Particles */}
      <OrbitingParticle distance={size + 6} speed={0.5} color="white" size={0.1} />
      <OrbitingParticle distance={size + 6} speed={0.7} color="cyan" size={0.1} />
      <OrbitingParticle distance={size + 6} speed={0.6} color="magenta" size={0.1} />
    </mesh>
  );
};

// MusicPlanet Component for playing music on interaction
const MusicPlanet = ({ position, size, emissiveColor, label }) => {
  // Load the music.glb model
  const { scene } = useGLTF(musicGLB);

  // Reference to the mesh
  const meshRef = useRef();

  // Reference to the audio
  const audioRef = useRef();

  // Hover state for visual feedback
  const [hovered, setHovered] = useState(false);

  // State to track if music is playing
  const [isPlaying, setIsPlaying] = useState(false);

  // Reference for the text mesh to apply animations
  const textRef = useRef();

  // Floating animation state using ref to prevent unnecessary re-renders
  const floatOffsetRef = useRef(0);

  // Handle click event to toggle music playback
  const handleClick = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    if (isPlaying) {
      audioRef.current.stop();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Change cursor on hover
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
  }, [hovered]);

  // Rotate the music planet for animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Adjust rotation speed as desired
    }
    if (textRef.current) {
      // Update floating animation
      floatOffsetRef.current += delta;
      textRef.current.position.y = size * 20 + 4 + Math.sin(floatOffsetRef.current) * 0.2;

      // Make text face the camera
      textRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      name="MusicPlanet" // Assign a unique name for easy reference
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? size * 60 : size * 20} // Scale by 100x, enlarge by additional 10% on hover
      castShadow
      receiveShadow
    >
      {/* Render the music.glb model */}
      <primitive object={scene} />

      {/* Add white outlines */}
      <CustomOutlines
        color="white"
        opacity={hovered ? 1 : 0.7}
        transparent={true}
        thickness={0.02}
      />
      
      {/* Label Text */}
      <Text
        ref={textRef}
        position={[0, size * 20 + 4, 0]} // Position above the model, adjusted for scale
        font={customFont}
        fontSize={200} // Adjust font size proportionally
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1}
        outlineColor="black"
        material-toneMapped={false}
        emissive="cyan"
        emissiveIntensity={0.5}
        opacity={hovered ? 1 : 0}
        transparent={true}
        // Keep text always facing the camera
        billboard
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            `#include <alphamap_fragment>`,
            `
              #include <alphamap_fragment>
              diffuseColor.a *= opacity;
            `
          );
        }}
      >
        {label}
      </Text>

      {/* Positional Audio */}
      <PositionalAudio
        ref={audioRef}
        url={musicFile}
        loop
        distance={5000} // Increased distance to accommodate larger scale
        volume={1}
        autoplay={false} // Do not autoplay
      />
    </mesh>
  );
};

// Utility function to generate random positions with minimum distance and exclusion zones
const generateRandomPositions = (count, minDistance, range, exclusionZones = []) => {
  const positions = [];
  let attempts = 0;
  const maxAttempts = count * 100; // Prevent infinite loops

  while (positions.length < count && attempts < maxAttempts) {
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

    // Check against already placed logo planets to prevent intersection
    if (valid) {
      for (let existingPos of positions) {
        const distance = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...existingPos));
        if (distance < minDistance) {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      positions.push(pos);
    }

    attempts++;
  }

  if (positions.length < count) {
    console.warn(`Could only place ${positions.length} out of ${count} logo planets after ${maxAttempts} attempts.`);
  }

  return positions;
};

// 19. LogoPlanets Component to render all LogoPlanets and MusicPlanet
const LogoPlanets = () => {
  // Define the logos and their corresponding links and labels
  const logos = [
    { logo: githubLogo, link: "https://github.com/sahil-lab", label: "GitHub" },
    { logo: whatsappLogo, link: "https://wa.me/+918559067075", label: "WhatsApp" },
    { logo: gmailLogo, link: "mailto:sahil.aps2k12@gmail.com", label: "Gmail" },
    { logo: linkedinLogo, link: "https://www.linkedin.com/in/sahil-upadhyay-2921b5127/", label: "LinkedIn" },
    { logo: mediumLogo, link: "https://medium.com/@sahilupadhyay.work", label: "Medium" },
    { 
      logo: resumeLogo, 
      link: "https://raw.githubusercontent.com/sahil-lab/portfolio-resume/main/src/assets/resume.pdf", // Updated raw GitHub link
      label: "Resume",
      download: true // Flag indicating download action
    },
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

  // Define a set of neon colors
  const neonColors = useMemo(() => [
    new THREE.Color(0x39FF14), // Neon Green
    new THREE.Color(0x00F0FF), // Neon Red
    new THREE.Color(0xF8F8FF), // Neon Pink
    new THREE.Color(0x00F0FF), // Neon Blue
    new THREE.Color(0xFFFF33), // Neon Yellow
    new THREE.Color(0xFF00FF), // Neon Magenta
    new THREE.Color(0x0FF0FC), // Neon Cyan
    new THREE.Color(0xF8F8FF), // Ghost White (for a bright look)
  ], []);

  // Assign neon colors to planets, cycling through if necessary
  const glowingColors = useMemo(() => {
    return logos.map((_, index) => neonColors[index % neonColors.length]);
  }, [logos.length, neonColors]);

  // Define the size of the planets
  const planetSize = 5; // New size value

  return (
    <group>
      {logos.map((item, index) => {
        const position = positions[index];
        const size = planetSize; // Use the new size
        const emissiveColor = glowingColors[index];

        return (
          <LogoPlanet
            key={index}
            logo={item.logo}
            position={position}
            size={size}
            link={item.link}
            emissiveColor={emissiveColor}
            label={item.label} // Pass the label prop
            download={item.download} // Pass the download flag
          />
        );
      })}

      {/* Add the MusicPlanet component */}
      <MusicPlanet
        position={[0, -100, 0]} // Adjust position as needed
        size={5} // Original size before scaling
        emissiveColor={new THREE.Color(0xFF69B4)} // Example emissive color (Hot Pink)
        label="Music"
      />

      {/* Add the Spaceship component */}
      <Suspense fallback={null}>
        <SpaceshipModel logoPositions={positions} logos={logos} />
      </Suspense>
    </group>
  );
};

export default LogoPlanets;

// Updated Spaceship Component using spaceship.glb
const SpaceshipModel = ({ logoPositions, logos }) => {
  const { scene } = useGLTF(spaceshipModel);
  const spaceshipRef = useRef();
  const textRef = useRef();
  const { camera, gl, scene: threeScene } = useThree();

  // Movement state using refs for mutable values
  const velocity = useRef(new THREE.Vector3());
  const acceleration = 0.2;
  const deceleration = 0.95;
  const maxSpeed = 5;

  // Controls state
  const keys = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
    q: false,
    e: false
  });

  // Collision flags to prevent multiple triggers
  const totalCollisions = logoPositions.length + 1; // +1 for MusicPlanet
  const collisionFlags = useRef(new Array(totalCollisions).fill(false));

  // Handle keydown and keyup events
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key;
      if (keys.current.hasOwnProperty(key)) {
        keys.current[key] = true;
      }
    };
    const handleKeyUp = (e) => {
      const key = e.key;
      if (keys.current.hasOwnProperty(key)) {
        keys.current[key] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Helper function to get rotation quaternion based on keys
  const getRotationQuaternion = () => {
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler(0, 0, 0, 'XYZ');

    if (keys.current.a) euler.y += 0.02; // Rotate left around Y-axis
    if (keys.current.d) euler.y -= 0.02; // Rotate right around Y-axis
    if (keys.current.q) euler.z += 0.02; // Roll left
    if (keys.current.e) euler.z -= 0.02; // Roll right
    if (keys.current.ArrowUp) euler.x += 0.02; // Pitch up
    if (keys.current.ArrowDown) euler.x -= 0.02; // Pitch down

    quaternion.setFromEuler(euler);
    return quaternion;
  };

  // Update spaceship movement and orientation
  useFrame((state, delta) => {
    if (!spaceshipRef.current) return;

    // Handle rotation
    const rotationQuaternion = getRotationQuaternion();
    spaceshipRef.current.quaternion.multiplyQuaternions(rotationQuaternion, spaceshipRef.current.quaternion);

    // Handle movement direction (forward/backward)
    let direction = new THREE.Vector3();

    if (keys.current.w) direction.z -= 1; // Forward
    if (keys.current.s) direction.z += 1; // Backward

    if (direction.length() > 0) {
      direction.normalize();
      direction.applyQuaternion(spaceshipRef.current.quaternion);
      direction.multiplyScalar(acceleration);
      velocity.current.add(direction);
      velocity.current.clampLength(0, maxSpeed);
    } else {
      // Apply deceleration when no keys are pressed
      velocity.current.multiplyScalar(deceleration);
    }

    // Update spaceship position
    spaceshipRef.current.position.add(velocity.current.clone());

    // Update "Let's Go" text position and make it face the camera
    if (textRef.current && spaceshipRef.current) {
      const offset = new THREE.Vector3(0, 10, 0); // Adjust as needed
      textRef.current.position.copy(spaceshipRef.current.position).add(offset);
      textRef.current.quaternion.copy(state.camera.quaternion); // Keep text aligned with camera
    }

    // Collision detection with precise contact
    // Iterate over logoPositions and MusicPlanet
    logoPositions.forEach((pos, index) => {
      const planetPosition = new THREE.Vector3(...pos);
      const spaceshipPosition = spaceshipRef.current.position.clone();

      // Define collision radii based on scales
      const spaceshipRadius = 10; // Adjusted based on spaceship scale (10)
      const planetRadius = 5.5;    // size=5, scaled by 1.1 on hover

      const collisionDistance = spaceshipRadius + planetRadius; // 15.5

      const distance = spaceshipPosition.distanceTo(planetPosition);

      if (distance <= collisionDistance) {
        if (!collisionFlags.current[index]) {
          // Trigger the link or download
          triggerLink(logos[index].link, logos[index].download || false);
          // Set the flag to true to prevent multiple triggers
          collisionFlags.current[index] = true;
        }
      } else {
        if (collisionFlags.current[index]) {
          // Reset the flag when no longer colliding
          collisionFlags.current[index] = false;
        }
      }
    });

    // Handle collision with MusicPlanet
    const musicPlanetIndex = logoPositions.length; // Last index
    const musicPlanetPosition = new THREE.Vector3(0, -100, 0); // Same as MusicPlanet's position
    const spaceshipPosition = spaceshipRef.current.position.clone();

    const spaceshipRadius = 10; // Adjusted based on spaceship scale
    const musicPlanetScale = 100; // size=5 scaled by 20
    const musicPlanetRadius = musicPlanetScale / 2; // 50

    const collisionDistanceMusic = spaceshipRadius + musicPlanetRadius; // 60

    const distanceToMusicPlanet = spaceshipPosition.distanceTo(musicPlanetPosition);

    if (distanceToMusicPlanet <= collisionDistanceMusic) {
      if (!collisionFlags.current[musicPlanetIndex]) {
        // Automatically play music if not already playing
        const musicPlanet = threeScene.getObjectByName('MusicPlanet'); // Ensure MusicPlanet has this name
        if (musicPlanet) {
          const audio = musicPlanet.children.find(child => child.type === 'PositionalAudio');
          if (audio && !audio.isPlaying) {
            audio.play();
            // Optionally, you can set a state or ref here if needed
          }
        }
        // Set the flag to true to prevent multiple triggers
        collisionFlags.current[musicPlanetIndex] = true;
      }
    } else {
      if (collisionFlags.current[musicPlanetIndex]) {
        // Optionally stop the music when no longer colliding
        const musicPlanet = threeScene.getObjectByName('MusicPlanet');
        if (musicPlanet) {
          const audio = musicPlanet.children.find(child => child.type === 'PositionalAudio');
          if (audio && audio.isPlaying) {
            audio.stop();
            // Optionally, you can set a state or ref here if needed
          }
        }
        // Reset the flag when no longer colliding
        collisionFlags.current[musicPlanetIndex] = false;
      }
    }

    // Booster particles
    if (velocity.current.length() > 0.1 && spaceshipRef.current) {
      // Emit particles opposite to the direction of movement
      const direction = velocity.current.clone().normalize().multiplyScalar(-1);
      const boosterOffsetY = 1; // Adjust based on spaceship size

      const particleLeft = new THREE.Vector3(
        spaceshipRef.current.position.x - 2,
        spaceshipRef.current.position.y - boosterOffsetY,
        spaceshipRef.current.position.z
      ).add(direction.clone().multiplyScalar(2));

      const particleRight = new THREE.Vector3(
        spaceshipRef.current.position.x + 2,
        spaceshipRef.current.position.y - boosterOffsetY,
        spaceshipRef.current.position.z
      ).add(direction.clone().multiplyScalar(2));

      // Create particles
      const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8); // Original size
      const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 1 });
      const particleLeftMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      const particleRightMesh = new THREE.Mesh(particleGeometry, particleMaterial);
      particleLeftMesh.position.copy(particleLeft);
      particleRightMesh.position.copy(particleRight);
      particleLeftMesh.velocity = direction.clone().multiplyScalar(0.5);
      particleRightMesh.velocity = direction.clone().multiplyScalar(0.5);
      threeScene.add(particleLeftMesh);
      threeScene.add(particleRightMesh);

      // Animate particles
      const animateParticle = () => {
        if (particleLeftMesh && particleRightMesh) {
          particleLeftMesh.position.add(particleLeftMesh.velocity);
          particleRightMesh.position.add(particleRightMesh.velocity);
          // Fade out
          particleLeftMesh.material.opacity -= 0.02;
          particleRightMesh.material.opacity -= 0.02;
          if (particleLeftMesh.material.opacity <= 0 || particleRightMesh.material.opacity <= 0) {
            threeScene.remove(particleLeftMesh);
            threeScene.remove(particleRightMesh);
          } else {
            requestAnimationFrame(animateParticle);
          }
        }
      };
      animateParticle();
    }
  });

  return (
    <>
      {/* Spaceship */}
      <primitive
        ref={spaceshipRef}
        object={scene}
        position={[0, 0, 0]}
        scale={[10, 10, 10]} // Adjusted scale for accurate collision detection
        castShadow
        receiveShadow
      />

      {/* "Let's Go" Text */}
      <Text
        ref={textRef}
        position={[0, 10, 0]} // Initial position; will be updated in useFrame
        font={customFont}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1}
        outlineColor="black"
        material-toneMapped={false}
        emissive="cyan"
        emissiveIntensity={0.5}
        // Keep text always facing the camera
        billboard
      >
        Let's Go
      </Text>
    </>
  );
};

// Preload the GLTF models for better performance
useGLTF.preload(spaceshipModel);
useGLTF.preload(musicGLB);
