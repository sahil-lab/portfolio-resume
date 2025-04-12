import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';

const SpaceDust = ({
    count = 250,
    depth = 1000,
    size = { min: 0.1, max: 0.8 },
    speed = { min: 0.01, max: 0.05 },
    colors = ['#ffffff', '#fffccc', '#aaddff', '#eeccff', '#ffccee'],
    opacities = { min: 0.01, max: 0.1 }
}) => {
    // Get camera for responsive positioning
    const { camera } = useThree();

    // References
    const particlesRef = useRef();
    const particlesMaterialRef = useRef();

    // Create procedural dust textures
    const dustTextures = useMemo(() => {
        const textures = [];
        const size = 64;

        // Create 4 different procedural textures
        for (let i = 0; i < 4; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Fill with black (transparent)
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, size, size);

            // Create a radial gradient
            const gradient = ctx.createRadialGradient(
                size / 2, size / 2, 0,
                size / 2, size / 2, size / 2
            );

            // Different patterns for each texture
            switch (i) {
                case 0: // Simple dust particle
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                    break;
                case 1: // Cloudy dust
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
                    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                    break;
                case 2: // Star-like
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.6)');
                    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                    break;
                case 3: // Hazy dust
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
                    break;
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);

            // Add some noise for texture
            if (i > 0) {
                for (let j = 0; j < 50; j++) {
                    const x = Math.random() * size;
                    const y = Math.random() * size;
                    const radius = Math.random() * 2;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
                    ctx.fill();
                }
            }

            // Create Three.js texture from canvas
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            textures.push(texture);
        }

        return textures;
    }, []);

    // Create particle data - positions, sizes, speeds, colors, textures
    const particles = useMemo(() => {
        return Array(count).fill().map(() => {
            // Generate random spherical coordinates
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = THREE.MathUtils.randFloat(0, depth);

            // Convert to cartesian coordinates
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);

            return {
                position: new THREE.Vector3(x, y, z),
                size: THREE.MathUtils.randFloat(size.min, size.max),
                speed: THREE.MathUtils.randFloat(speed.min, speed.max),
                direction: new THREE.Vector3(
                    THREE.MathUtils.randFloatSpread(0.2),
                    THREE.MathUtils.randFloatSpread(0.2),
                    -1  // Move primarily toward camera
                ).normalize(),
                color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
                opacity: THREE.MathUtils.randFloat(opacities.min, opacities.max),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: THREE.MathUtils.randFloatSpread(0.02),
                textureIndex: Math.floor(Math.random() * dustTextures.length)
            };
        });
    }, [count, depth, size, speed, colors, opacities, dustTextures]);

    // Initialize instanced mesh positions, scales, colors
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const particleIndices = useMemo(() => {
        return new Float32Array(count);
    }, [count]);

    const particleColors = useMemo(() => {
        const colors = new Float32Array(count * 3);
        particles.forEach((particle, i) => {
            colors[i * 3] = particle.color.r;
            colors[i * 3 + 1] = particle.color.g;
            colors[i * 3 + 2] = particle.color.b;

            // Store texture index in particleIndices
            particleIndices[i] = particle.textureIndex;
        });
        return colors;
    }, [particles, count, particleIndices]);

    // Animation - update particle positions, handle wrapping
    useFrame((state, delta) => {
        if (particlesRef.current && particlesMaterialRef.current) {
            // Update the time uniform for shader effects
            particlesMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime;

            // Update each particle
            particles.forEach((particle, i) => {
                // Calculate new position
                particle.position.addScaledVector(
                    particle.direction,
                    particle.speed * delta * state.clock.elapsedTime * 0.1
                );

                // Update particle rotation
                particle.rotation += particle.rotationSpeed * delta;

                // Get camera's forward direction
                const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

                // Calculate distance along camera's view direction
                const viewDistance = particle.position.dot(cameraDirection);

                // Reposition particles that move too far from camera
                if (viewDistance < -depth / 2 || viewDistance > depth / 2) {
                    // Reset to a random position in the view frustum
                    const randomPosInFrustum = new THREE.Vector3(
                        THREE.MathUtils.randFloatSpread(depth),
                        THREE.MathUtils.randFloatSpread(depth),
                        camera.position.z - depth / 2
                    );

                    // Transform to world space
                    randomPosInFrustum.add(camera.position);

                    // Add slight offset to frustum positioning
                    particle.position.copy(randomPosInFrustum);
                    particle.position.addScaledVector(
                        new THREE.Vector3(
                            THREE.MathUtils.randFloatSpread(1),
                            THREE.MathUtils.randFloatSpread(1),
                            THREE.MathUtils.randFloatSpread(0.5)
                        ),
                        depth / 4
                    );
                }

                // Update the dummy object for this particle
                dummy.position.copy(particle.position);
                dummy.rotation.z = particle.rotation;
                dummy.scale.set(particle.size, particle.size, particle.size);
                dummy.updateMatrix();

                // Update the instanced mesh with this matrix
                particlesRef.current.setMatrixAt(i, dummy.matrix);
            });

            // Flag the instance matrix as needing an update
            particlesRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    // Custom shader for texture atlasing and fading
    const particleShader = {
        uniforms: {
            uTexture1: { value: dustTextures[0] },
            uTexture2: { value: dustTextures[1] },
            uTexture3: { value: dustTextures[2] },
            uTexture4: { value: dustTextures[3] },
            uTime: { value: 0 }
        },
        vertexShader: `
      attribute vec3 aColor;
      attribute float aTextureIndex;
      
      varying vec3 vColor;
      varying float vTextureIndex;
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        vUv = uv;
        vColor = aColor;
        vTextureIndex = aTextureIndex;
        
        // Calculate distance from camera for fog effect
        vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        vDistance = -mvPosition.z;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
        fragmentShader: `
      uniform sampler2D uTexture1;
      uniform sampler2D uTexture2;
      uniform sampler2D uTexture3;
      uniform sampler2D uTexture4;
      uniform float uTime;
      
      varying vec3 vColor;
      varying float vTextureIndex;
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        // Select correct texture based on index
        vec4 texColor;
        if (vTextureIndex < 0.5) {
          texColor = texture2D(uTexture1, vUv);
        } else if (vTextureIndex < 1.5) {
          texColor = texture2D(uTexture2, vUv);
        } else if (vTextureIndex < 2.5) {
          texColor = texture2D(uTexture3, vUv);
        } else {
          texColor = texture2D(uTexture4, vUv);
        }
        
        // Create the final color with texture and particle color
        gl_FragColor = texColor * vec4(vColor, 1.0);
        
        // Almost completely eliminated fog effect
        float fogFactor = smoothstep(100.0, depth, vDistance);
        
        // Very subtle pulsing
        float pulse = 0.02 * sin(uTime * 0.3 + vTextureIndex * 3.0);
        
        // Apply reduced fog with minimal effect
        gl_FragColor.a *= (1.0 - fogFactor * 0.3) * (0.98 + pulse);
        
        // Alpha test to improve rendering performance
        if (gl_FragColor.a < 0.01) discard;
      }
    `
    };

    return (
        <instancedMesh
            ref={particlesRef}
            args={[null, null, count]}
            frustumCulled={false}
        >
            <planeGeometry args={[1, 1]} />
            <shaderMaterial
                ref={particlesMaterialRef}
                vertexShader={particleShader.vertexShader}
                fragmentShader={particleShader.fragmentShader}
                uniforms={particleShader.uniforms}
                transparent={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                onBeforeCompile={(shader) => {
                    // Add custom attributes to shader
                    shader.vertexShader = shader.vertexShader.replace(
                        'void main() {',
                        `
            attribute vec3 aColor;
            attribute float aTextureIndex;
            
            varying vec3 vColor;
            varying float vTextureIndex;
            varying vec2 vUv;
            varying float vDistance;
            
            void main() {
            `
                    );
                }}
            >
                {/* Add custom attributes to the material */}
                <instancedBufferAttribute
                    attachObject={['attributes', 'aColor']}
                    args={[particleColors, 3]}
                />
                <instancedBufferAttribute
                    attachObject={['attributes', 'aTextureIndex']}
                    args={[particleIndices, 1]}
                />
            </shaderMaterial>
        </instancedMesh>
    );
};

export default SpaceDust; 