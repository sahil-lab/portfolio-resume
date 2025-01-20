/* ----------------------------- Spheres ------------------------------ */
import { useControls } from "leva";
import React, {
  useMemo
} from "react";
import * as THREE from "three";
import { Sphere } from "../App"; // Adjust the path to App.js as per your project structure

// Import Logo Textures
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

export default Spheres;