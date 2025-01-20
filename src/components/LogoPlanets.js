// src/LogoPlanets.js

import {
  useTexture,
  Text,
  Html
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, {
  useEffect, useMemo, useRef, useState
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
    </group>
  );
};

export default LogoPlanets;
