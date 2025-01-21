// src/components/Controls.js

import React from 'react';

const Controls = ({ keys, setKeys }) => {
  // Handle button press (mouse or touch)
  const handlePress = (key) => {
    setKeys((prev) => ({ ...prev, [key]: true }));
  };

  // Handle button release (mouse or touch)
  const handleRelease = (key) => {
    setKeys((prev) => ({ ...prev, [key]: false }));
  };

  // Style for the controls container
  const controlsStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    userSelect: 'none',
    zIndex: 1, // Ensure controls are above the canvas
  };

  // Style for individual buttons
  const buttonStyle = {
    width: '60px',
    height: '60px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    border: '2px solid #000',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s, background-color 0.1s', // Smooth transition for interactions
  };

  // Style for pressed buttons
  const pressedButtonStyle = {
    transform: 'scale(0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  };

  // Determine button style based on key state
  const getButtonStyle = (key) => {
    return keys[key]
      ? { ...buttonStyle, ...pressedButtonStyle }
      : buttonStyle;
  };

  return (
    <div style={controlsStyle}>
      {/* Row for Up Arrow */}
      <button
        style={getButtonStyle('ArrowUp')}
        aria-label="Move Up"
        onMouseDown={() => handlePress('ArrowUp')}
        onMouseUp={() => handleRelease('ArrowUp')}
        onMouseLeave={() => handleRelease('ArrowUp')}
        onTouchStart={() => handlePress('ArrowUp')}
        onTouchEnd={() => handleRelease('ArrowUp')}
      >
        ↑
      </button>

      {/* Row for Left, Down, Right Arrows */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          style={getButtonStyle('a')}
          aria-label="Move Left"
          onMouseDown={() => handlePress('a')}
          onMouseUp={() => handleRelease('a')}
          onMouseLeave={() => handleRelease('a')}
          onTouchStart={() => handlePress('a')}
          onTouchEnd={() => handleRelease('a')}
        >
          A
        </button>
        <button
          style={getButtonStyle('ArrowDown')}
          aria-label="Move Down"
          onMouseDown={() => handlePress('ArrowDown')}
          onMouseUp={() => handleRelease('ArrowDown')}
          onMouseLeave={() => handleRelease('ArrowDown')}
          onTouchStart={() => handlePress('ArrowDown')}
          onTouchEnd={() => handleRelease('ArrowDown')}
        >
          ↓
        </button>
        <button
          style={getButtonStyle('d')}
          aria-label="Move Right"
          onMouseDown={() => handlePress('d')}
          onMouseUp={() => handleRelease('d')}
          onMouseLeave={() => handleRelease('d')}
          onTouchStart={() => handlePress('d')}
          onTouchEnd={() => handleRelease('d')}
        >
          D
        </button>
      </div>

      {/* Row for W, S Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          style={getButtonStyle('w')}
          aria-label="Move Forward"
          onMouseDown={() => handlePress('w')}
          onMouseUp={() => handleRelease('w')}
          onMouseLeave={() => handleRelease('w')}
          onTouchStart={() => handlePress('w')}
          onTouchEnd={() => handleRelease('w')}
        >
          W
        </button>
        <button
          style={getButtonStyle('s')}
          aria-label="Move Backward"
          onMouseDown={() => handlePress('s')}
          onMouseUp={() => handleRelease('s')}
          onMouseLeave={() => handleRelease('s')}
          onTouchStart={() => handlePress('s')}
          onTouchEnd={() => handleRelease('s')}
        >
          S
        </button>
      </div>
    </div>
  );
};

export default Controls;
