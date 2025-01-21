// src/components/LoadingScreen.js

import React from 'react';
import { Html, useProgress } from '@react-three/drei';
import { motion } from 'framer-motion';
import styled, { keyframes } from 'styled-components';
import '@fontsource/roboto/400.css'; // Regular font
import '@fontsource/roboto/700.css'; // Bold font

// Keyframes for spinner rotation
const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled Components

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-family: 'Roboto', sans-serif;
  background: rgba(0, 0, 0, 0.8);
  padding: 50px 80px;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  backdrop-filter: blur(5px);
`;

const Title = styled.h1`
  margin-bottom: 30px;
  font-size: 2.5rem;
  text-align: center;
  color: #00ffea;
  text-shadow: 0 0 10px #00ffea, 0 0 20px #00ffea;
`;

const Spinner = styled.div`
  border: 8px solid rgba(255, 255, 255, 0.1);
  border-top: 8px solid #00ffea;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  animation: ${rotate} 1.5s linear infinite;
  margin-bottom: 40px;
  box-shadow: 0 0 10px #00ffea, 0 0 20px #00ffea;
`;

const LoaderContainer = styled.div`
  width: 100%;
  max-width: 400px;
  height: 25px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
`;

const LoaderBar = styled(motion.div)`
  height: 100%;
  background: linear-gradient(90deg, #00ffea, #00c6ff);
  border-radius: 15px 0 0 15px;
`;

const ProgressText = styled.p`
  font-size: 1.2rem;
  text-align: center;
  color: #ffffff;
  text-shadow: 0 0 5px #000000;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/space-background.jpg'); /* Ensure this path is correct */
  background-size: cover;
  background-position: center;
  opacity: 0.3;
  z-index: -1;
  animation: ${rotate} 60s linear infinite; /* Slow rotation for dynamic background */
`;

// LoadingScreen Component

const LoadingScreen = () => {
  const { progress } = useProgress(); // Get the current loading progress

  return (
    <Html center>
      <Background />
      <Container>
        <Title>Loading Your Space Experience</Title>
        <Spinner />
        <LoaderContainer>
          <LoaderBar
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </LoaderContainer>
        <ProgressText>{progress.toFixed(0)}% Loaded</ProgressText>
      </Container>
    </Html>
  );
};

// Export the component
export default LoadingScreen;
