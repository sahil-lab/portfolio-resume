// src/LogoPlanets.js

import {
  useTexture,
  Text,
  Html,
  useGLTF,
  PointerLockControls,
  useCursor,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, {
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

// Import a custom font (ensure the font file is in the specified path)
import customFont from '../assets/fonts/Roboto-Bold.ttf'; 

// Import the spaceship GLB model
import spaceshipModel from '../assets/spaceship.glb'; // Adjust the path as necessary

// 18. LogoPlanet Component for clickable logo-bearing planets
const LogoPlanet = ({ logo, position, size, link, emissiveColor, label }) => {
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

  // Reference for the text mesh to apply animations
  const textRef = useRef();

  // Floating animation state
  const [floatOffset, setFloatOffset] = useState(0);

  // Rotate the planet for animation and handle floating text
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Adjust rotation speed as desired
    }
    if (textRef.current) {
      // Update floating animation
      setFloatOffset(prev => prev + delta);
      textRef.current.position.y = size + 4 + Math.sin(floatOffset) * 0.2;
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
  // Define the logos and their corresponding links and labels
  const logos = [
    { logo: githubLogo, link: "https://github.com/sahil-lab", label: "GitHub" },
    { logo: whatsappLogo, link: "https://wa.me/+918559067075", label: "WhatsApp" },
    { logo: gmailLogo, link: "mailto:sahil.aps2k12@gmail.com", label: "Gmail" },
    { logo: linkedinLogo, link: "https://www.linkedin.com/in/sahil-upadhyay-2921b5127/", label: "LinkedIn" },
    { logo: mediumLogo, link: "https://medium.com/@sahilupadhyay.work", label: "Medium" },
    { logo: resumeLogo, link: "/resume.pdf", label: "Resume" }, // Assuming resume is hosted
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
    new THREE.Color(0xFFFF33), // Neon Magenta
    new THREE.Color(0x0FF0FC), // Neon Cyan
    new THREE.Color(0xF8F8FF), // Ghost White (for a bright look)
  ], []);

  // Assign neon colors to planets, cycling through if necessary
  const glowingColors = useMemo(() => {
    return logos.map((_, index) => neonColors[index % neonColors.length]);
  }, [logos.length, neonColors]);

  // Increase the size of the planets from 4 to 5
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
          />
        );
      })}
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

  // Movement state
  const [velocity, setVelocity] = useState(new THREE.Vector3());
  const acceleration = 0.2;
  const deceleration = 0.95;
  const maxSpeed = 5;

  // Controls state
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowDown: false,
  });

  // Collision flags to prevent multiple triggers
  const collisionFlags = useRef(new Array(logos.length).fill(false));

  // Handle keydown and keyup events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setKeys((prev) => ({ ...prev, [e.key]: true }));
      }
    };
    const handleKeyUp = (e) => {
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setKeys((prev) => ({ ...prev, [e.key]: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Remove emissive properties to disable glowing effect
  // (No longer traversing the scene to set emissive properties)

  // Update velocity based on keys
  useFrame(() => {
    let direction = new THREE.Vector3();

    // WASD for X and Z movement
    if (keys.w) direction.z -= 1; // Forward
    if (keys.s) direction.z += 1; // Backward
    if (keys.a) direction.x -= 1; // Left
    if (keys.d) direction.x += 1; // Right

    // Arrow Up/Down for Y movement
    if (keys.ArrowUp) direction.y += 1; // Up
    if (keys.ArrowDown) direction.y -= 1; // Down

    if (direction.length() > 0) {
      direction.normalize();
      direction.multiplyScalar(acceleration);
      setVelocity((prev) => {
        const newVel = prev.clone().add(direction);
        newVel.clampLength(0, maxSpeed);
        return newVel;
      });
    } else {
      // Apply deceleration when no keys are pressed
      setVelocity((prev) => prev.clone().multiplyScalar(deceleration));
    }

    // Update spaceship position
    if (spaceshipRef.current) {
      spaceshipRef.current.position.add(velocity.clone());
      spaceshipRef.current.rotation.y += velocity.x * 0.01; // Optional: Rotate based on movement
      spaceshipRef.current.rotation.x += velocity.z * 0.01; // Optional: Rotate based on movement
      spaceshipRef.current.rotation.z += velocity.y * 0.01; // Optional: Rotate based on Y movement
    }

    // Update "Let's Go" text position
    if (textRef.current && spaceshipRef.current) {
      textRef.current.position.copy(spaceshipRef.current.position);
      textRef.current.position.y += 10; // Adjust as needed
    }

    // Collision detection with precise contact
    logoPositions.forEach((pos, index) => {
      const planetPosition = new THREE.Vector3(...pos);
      const spaceshipPosition = spaceshipRef.current.position.clone();

      // Define collision radii based on scales
      const spaceshipRadius = 0.5; // Half of the original spaceship scale (1 / 2)
      const planetRadius = 2.5;      // Half of the planet scale (5 / 2)

      const collisionDistance = spaceshipRadius + planetRadius; // 3

      const distance = spaceshipPosition.distanceTo(planetPosition);

      if (distance <= collisionDistance) {
        if (!collisionFlags.current[index]) {
          // Trigger the link
          window.open(logos[index].link, "_blank");
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
  });

  // Booster particles
  useFrame(() => {
    if (velocity.length() > 0.1 && spaceshipRef.current) {
      // Emit particles opposite to the direction of movement
      const direction = velocity.clone().normalize().multiplyScalar(-1);
      const boosterOffsetY = 1; // Adjust based on spaceship size

      const particleLeft = new THREE.Vector3(
        spaceshipRef.current.position.x - 2,
        spaceshipRef.current.position.y - boosterOffsetY,
        spaceshipRef.current.position.z
      );
      const particleRight = new THREE.Vector3(
        spaceshipRef.current.position.x + 2,
        spaceshipRef.current.position.y - boosterOffsetY,
        spaceshipRef.current.position.z
      );
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
        scale={[1, 1, 1]} // Reset to original scale
        castShadow
        receiveShadow
      />

      {/* "Let's Go" Text */}
      <Text
        ref={textRef}
        position={[0, 10, 0]} // Adjust as needed
        font={customFont}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.1}
        outlineColor="black"
      >
        Let's Go
      </Text>
    </>
  );
};

// Preload the GLTF model for better performance
useGLTF.preload(spaceshipModel);
