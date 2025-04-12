import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PlanetRings = ({ position = [0, 0, 0], innerRadius = 15, outerRadius = 25, rotation = [0.5, 0, 0] }) => {
    const ringsRef = useRef();

    // Slowly rotate the rings
    useFrame((state, delta) => {
        if (ringsRef.current) {
            ringsRef.current.rotation.z += delta * 0.05;
        }
    });

    // Create segmented ring texture
    const ringTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        const context = canvas.getContext('2d');

        // Fill with transparent background
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Create ring segments
        for (let i = 0; i < canvas.width; i++) {
            // Create density variations
            const density = Math.sin(i * 0.05) * 0.5 + 0.5;
            const brightness = 0.65 + Math.random() * 0.2;
            const alpha = density * 0.75;

            // Draw vertical line
            const color = `rgba(255, 220, 180, ${alpha})`;
            context.fillStyle = color;

            // Random gaps in the rings
            if (Math.random() > 0.05) {
                context.fillRect(i, 0, 1, canvas.height);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = 3;

        return texture;
    }, []);

    return (
        <group position={position} rotation={rotation} ref={ringsRef}>
            <mesh>
                <ringGeometry args={[innerRadius, outerRadius, 64]} />
                <meshStandardMaterial
                    map={ringTexture}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.8}
                    roughness={0.6}
                />
            </mesh>
        </group>
    );
};

export default PlanetRings; 