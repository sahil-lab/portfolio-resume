import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const ComputerPC = ({ position = [400, 0, -300], scale = 20 }) => {
    const groupRef = useRef();
    const monitorRef = useRef();
    const screenTextRef = useRef();
    const keyboardRef = useRef();
    const mouseRef = useRef();
    const { camera } = useThree();

    // Animation states
    const [hovered, setHovered] = useState(false);
    const cursorBlinkPhase = useRef(0);
    const showCursor = useRef(true);
    const messageIndex = useRef(0);
    const messageTimer = useRef(0);

    // Collection of messages to display
    const messages = [
        "Hi, my name is Sahil!",
        "I love to code and build apps",
        "I am glad you are here",
        "I enjoy solving problems",
        "Web development is my passion",
        "I build creative digital experiences",
        "Let's connect and collaborate",
        "Check my portfolio projects",
        "Always learning new technologies",
        "Designing intuitive interfaces",
        "Senior Java Developer with 6+ years of experience",
        "Expert in scalable system design",
        "Passionate about Generative AI",
        "Building real-time systems with Kafka",
        "AWS cloud infrastructure expert",
        "Enhancing user experiences with ReactJS",
        "Solving complex problems with Spring Boot",
        "Streamlining workflows with CI/CD pipelines",
        "Automating deployments with Docker and Kubernetes",
        "I optimize system performance with Splunk",
        "Achieved 80% faster deployments",
        "Successfully migrated applications to AWS",
        "Pushing the limits of Big Data analytics",
        "Passionate about algorithmic performance",
        "Improved data throughput by 85%",
        "Scaling applications with Node.js and React",
        "I lead teams to build high-impact products",
        "Innovative solutions that drive business growth",
        "Mastering design patterns and SOLID principles",
        "Collaborating with cross-functional teams",
        "Contributed to high-traffic BFSI applications",
        "Developing data-centric applications with Hadoop",
        "Optimizing back-end systems for scalability",
        "Focused on high availability and fault tolerance",
        "Improved page load times by 85%",
        "Improved system observability with Splunk",
        "Focused on automation with Jenkins",
        "Building e-commerce platforms with Node.js",
        "Launching ERC-20 tokens with Solidity",
        "Driving success in startup environments",
        "Optimizing front-end with advanced JavaScript",
        "Building fast, responsive user interfaces",
        "Using AI/ML to solve complex problems",
        "Contributing to GitHub with open-source projects",
        "Built advanced forecasting models with Java",
        "I strive for excellence in everything I do",
        "Delivering impactful solutions with Generative AI",
        "Optimizing data pipelines with Kafka and AWS",
        "Reducing deployment errors by 90%",
        "Improved system observability and monitoring",
        "I focus on performance and scalability",
        "Pushing the boundaries of Big Data",
        "Specializing in full-stack development",
        "Building applications with modern technologies",
        "AI-driven debugging to cut bug resolution time",
        "TechGig Challenge winner, outperformed 1000+ participants",
        "Developed e-commerce solutions that drive sales",
        "I love to learn and share knowledge",
        "Recognized for cross-team product releases",
        "Optimizing backend services for real-time processing",
        "Building resilient cloud architectures",
        "I transform ideas into actionable solutions",
        "Created scalable data catalog systems",
        "Enhanced data retrieval and integrity with Neo4j",
        "Using Docker and Kubernetes for reliable scaling",
        "Building automated solutions for real-world problems",
        "Building intuitive UIs with ReactJS",
        "I solve problems through innovative design",
        "Developing solutions that impact millions",
        "Bridging the gap between cloud and on-prem",
        "Improving business outcomes with tech",
        "Transforming data into meaningful insights",
        "Focused on building high-performance systems",
        "Improving systems with cutting-edge technologies",
        "Implementing robust data backup strategies",
        "Building resilient systems that never fail",
        "Creating robust backup and recovery strategies",
        "Dedicated to making tech more accessible",
        "Optimizing data flow with Kafka and RabbitMQ",
        "Ensuring seamless data flow across services",
        "I believe in clean and maintainable code",
        "Innovating at the intersection of tech and business",
        "Revolutionizing industries with tech solutions",
        "I focus on data-driven decisions",
        "Building apps that change how we live",
        "Dedicated to continuous learning",
        "Passionate about solving real-world problems",
        "Creating software that drives efficiency",
        "Enabling businesses with better tech solutions",
        "Building the future of software",
        "Innovative developer with a vision",
        "Harnessing the power of AI for better apps",
        "Using data to shape smarter solutions",
        "Helping businesses scale with innovative tech",
        "I always strive for better performance",
        "Building scalable systems with AWS and Azure",
        "Turning ideas into user-centered applications",
        "Using cloud technologies to innovate",
        "Working with the best in the industry",
        "Passionate about building full-stack solutions",
        "Solving data problems with Spark and Hadoop",
        "Optimizing data integrity with big data",
        "Building innovative solutions with React and Node.js",
        "Automating manual tasks to improve efficiency",
        "Harnessing AI for next-gen applications",
        "Bringing products to life with tech",
        "Changing the world one app at a time",
        "Building products with global impact",
        "Enhancing the world with technology",
        "Always striving to make things better",
        "Pushing boundaries with technology",
        "Building powerful solutions with AI/ML",
        "Making complex systems simple and reliable",
        "Pioneering new ways to use tech",
        "I take pride in clean, efficient code",
        "Specializing in creating high-performance apps",
        "Building scalable cloud applications",
        "Delivering impactful, data-driven products",
        "Mastering full-stack development technologies",
        "Creating the next generation of digital experiences",
        "Focused on building secure and scalable systems",
        "Exploring new tech every day",
        "Creating real-time, data-driven solutions",
        "Working at the intersection of tech and business",
        "I believe in building products that last",
        "I'm passionate about building scalable solutions",
        "Building solutions that change the status quo",
        "Innovating cloud solutions with AWS",
        "Optimizing for speed and performance",
        "Helping businesses solve their toughest challenges",
        "Focused on creating seamless user experiences",
        "I bring creativity and logic together",
        "Helping businesses innovate through tech",
        "Building the next big thing in tech",
        "Leading teams to build world-class products",
        "Exploring the future of AI/ML",
        "Building intuitive, data-driven applications",
        "Solving real-world challenges with AI",
        "Pioneering solutions with cutting-edge tech",
        "Transforming the way we build software",
        "Dedicated to building resilient systems",
        "Making complex tasks easy to manage",
        "Optimizing systems for peak performance",
        "Changing how software interacts with users",
        "Helping businesses scale with innovation",
        "I'm always pushing for better solutions",
        "Building software that makes a difference",
        "I create tech that improves lives",
        "Improving software performance with AI",
        "Building secure, scalable systems with Kubernetes",
        "I believe in the power of data",
        "Dedicated to improving app performance",
        "Building applications for the future",
        "Leveraging machine learning to drive change",
        "Striving to make software smarter",
        "Building better solutions every day",
        "Using tech to make the world better",
        "Delivering tech solutions with purpose",
        "Passionate about software that changes lives",
        "Creating innovative products that solve problems",
        "I'm focused on making tech work for people",
        "I love collaborating on impactful projects",
        "Let's create something amazing together",
        "Building solutions that power the future",
        "I am constantly learning new tools",
        "Transforming ideas into powerful products",
        "Let's work together to innovate",
        "Working towards the future of tech",
        "Creating powerful software solutions",
        "Enabling businesses to leverage new tech",
        "I bring a unique perspective to coding",
        "Creating digital solutions that scale",
        "Bringing tech to the forefront",
        "Building powerful apps that matter",
        "Driving business growth through innovation",
        "Scaling solutions to fit every need",
        "Creating seamless, efficient experiences",
        "Focused on building products with impact",
        "Making systems more efficient every day",
        "Driving the future with innovative tech",
        "Empowering businesses with tech solutions",
        "Building apps that solve real-world problems",
        "Let's connect to build something amazing",
        "Join me in building innovative solutions",
        "Let's collaborate to make an impact",
        "Creating the future, one line of code at a time",
        "Together, we can build the future",
        "Building scalable apps for tomorrow",
        "Tech enthusiast, always learning",
        "Transforming businesses with innovative solutions",
        "I help turn ideas into reality"
    ];


    // For floating animation
    const floatPhase = useRef(0);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // Floating animation
        floatPhase.current += delta;
        groupRef.current.position.y = position[1] + Math.sin(floatPhase.current * 0.8) * 3;

        // Make the computer face the camera
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);

        // Calculate direction from PC to camera
        const direction = new THREE.Vector3().subVectors(cameraPosition, groupRef.current.position).normalize();

        // Create rotation that makes the PC face the camera
        // We use lookAt but maintain the original up direction to keep the PC upright
        const tempPosition = new THREE.Vector3().copy(groupRef.current.position);
        const targetPosition = new THREE.Vector3().copy(tempPosition).add(direction);

        // Create a temporary object to calculate the rotation
        const tempObject = new THREE.Object3D();
        tempObject.position.copy(tempPosition);
        tempObject.lookAt(targetPosition);

        // Apply only the Y rotation to keep the PC upright
        groupRef.current.rotation.y = tempObject.rotation.y;

        // Gentle rotation - slightly sway on top of camera facing
        groupRef.current.rotation.x = Math.sin(floatPhase.current * 0.2) * 0.05;
        groupRef.current.rotation.z = Math.sin(floatPhase.current * 0.3) * 0.05;

        // Monitor slight movement
        if (monitorRef.current) {
            monitorRef.current.rotation.x = Math.sin(floatPhase.current * 0.5) * 0.03;
        }

        // Keyboard subtle floating
        if (keyboardRef.current) {
            keyboardRef.current.position.y = -4 + Math.sin(floatPhase.current * 1.2) * 0.2;
        }

        // Mouse movement
        if (mouseRef.current) {
            mouseRef.current.position.x = 3 + Math.sin(floatPhase.current * 1.5) * 0.2;
        }

        // Text cursor blinking
        cursorBlinkPhase.current += delta;
        if (cursorBlinkPhase.current > 0.5) {
            showCursor.current = !showCursor.current;
            cursorBlinkPhase.current = 0;

            if (screenTextRef.current) {
                const currentMessage = messages[messageIndex.current];
                screenTextRef.current.text = currentMessage + (showCursor.current ? "_" : " ");
            }
        }

        // Rotate through messages faster - every 3 seconds instead of 4
        messageTimer.current += delta;
        if (messageTimer.current > 3) {
            messageTimer.current = 0;
            messageIndex.current = (messageIndex.current + 1) % messages.length;
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            {/* Monitor Base */}
            <mesh position={[0, -3, 0]}>
                <boxGeometry args={[3, 0.3, 2]} />
                <meshPhysicalMaterial
                    color="#333333"
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>

            {/* Monitor Stand */}
            <mesh position={[0, -2, 0]}>
                <boxGeometry args={[0.5, 2, 0.5]} />
                <meshPhysicalMaterial
                    color="#444444"
                    metalness={0.7}
                    roughness={0.3}
                />
            </mesh>

            {/* Monitor Screen */}
            <group ref={monitorRef} position={[0, 0, 0]}>
                {/* Monitor Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[7, 5, 0.5]} />
                    <meshPhysicalMaterial
                        color="#222222"
                        metalness={0.7}
                        roughness={0.3}
                    />
                </mesh>

                {/* Screen */}
                <mesh position={[0, 0, 0.3]}>
                    <boxGeometry args={[6, 4, 0.1]} />
                    <meshPhysicalMaterial
                        color={hovered ? "#2a4494" : "#1a2c64"}
                        emissive={hovered ? "#2a4494" : "#1a2c64"}
                        emissiveIntensity={0.5}
                        roughness={0.1}
                    />
                </mesh>

                {/* Screen Text */}
                <Text
                    ref={screenTextRef}
                    position={[0, 0, 0.4]}
                    fontSize={0.35}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={5}
                >
                    {`${messages[0]}${showCursor.current ? '_' : ' '}`}
                </Text>
            </group>

            {/* Keyboard */}
            <group ref={keyboardRef} position={[0, -4, 2]}>
                <mesh>
                    <boxGeometry args={[4, 0.3, 1.5]} />
                    <meshPhysicalMaterial
                        color="#555555"
                        metalness={0.6}
                        roughness={0.3}
                    />
                </mesh>

                {/* Keys (simplified) */}
                <group position={[0, 0.2, 0]}>
                    {/* Row 1 */}
                    {Array(8).fill().map((_, i) => (
                        <mesh key={`key-1-${i}`} position={[-1.5 + i * 0.4, 0, -0.5]}>
                            <boxGeometry args={[0.3, 0.1, 0.3]} />
                            <meshStandardMaterial color="#222222" />
                        </mesh>
                    ))}

                    {/* Row 2 */}
                    {Array(8).fill().map((_, i) => (
                        <mesh key={`key-2-${i}`} position={[-1.5 + i * 0.4, 0, 0]}>
                            <boxGeometry args={[0.3, 0.1, 0.3]} />
                            <meshStandardMaterial color="#222222" />
                        </mesh>
                    ))}

                    {/* Row 3 */}
                    {Array(8).fill().map((_, i) => (
                        <mesh key={`key-3-${i}`} position={[-1.5 + i * 0.4, 0, 0.5]}>
                            <boxGeometry args={[0.3, 0.1, 0.3]} />
                            <meshStandardMaterial color="#222222" />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Mouse */}
            <mesh ref={mouseRef} position={[3, -4, 2]}>
                <boxGeometry args={[0.8, 0.3, 1.5]} />
                <meshPhysicalMaterial
                    color="#444444"
                    metalness={0.7}
                    roughness={0.3}
                />
            </mesh>

            {/* Logo on back of monitor */}
            <mesh position={[0, 0, -0.3]} rotation={[0, Math.PI, 0]}>
                <circleGeometry args={[0.5, 16]} />
                <meshStandardMaterial
                    color="#00aaff"
                    emissive="#00aaff"
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Power LED */}
            <mesh position={[3, -1.8, 0.3]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial
                    color={hovered ? "#00ff00" : "#666666"}
                    emissive={hovered ? "#00ff00" : "#333333"}
                    emissiveIntensity={1}
                />
            </mesh>

            {/* Add glow to monitor when hovered */}
            {hovered && (
                <pointLight
                    position={[0, 0, 2]}
                    color="#00aaff"
                    intensity={1}
                    distance={10}
                    decay={2}
                />
            )}
        </group>
    );
};

export default ComputerPC; 