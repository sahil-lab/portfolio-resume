import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createPortal } from 'react-dom';
import { orbitControlsRef } from '../App';

// Custom hook to handle spaceship controls
export const useSpaceshipControls = () => {
    const [controlsActive, setControlsActive] = useState(false);
    const [cameraMode, setCameraMode] = useState('orbit'); // Only 'orbit' or 'fps'
    const originalCameraPosition = useRef(null);
    const originalCameraRotation = useRef(null);
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

    // Try to get the Three.js context, but don't fail if not available
    let threeContext;
    try {
        threeContext = useThree();
    } catch (error) {
        // Not inside a Canvas, we'll manage without useThree
        threeContext = null;
    }

    const camera = threeContext?.camera;

    // Define the unified exit function - MOVED UP before it's used in useEffect
    const hardExitShipView = useCallback(() => {
        console.log("UNIFIED EXIT FUNCTION triggered");

        // 1. Try to reset camera to a default position in the scene
        try {
            const camera = document.querySelector('canvas')._canvas?.__r3f?.camera;
            if (camera) {
                console.log("Found camera, resetting position");
                camera.position.set(0, 0, 50);
                camera.rotation.set(0, 0, 0);
                camera.quaternion.identity();
            }
        } catch (e) {
            console.error("Error resetting camera:", e);
        }

        // 2. Directly enable the orbit controls
        try {
            if (orbitControlsRef.current) {
                console.log("Directly enabling orbit controls");
                orbitControlsRef.current.enabled = true;
            }
        } catch (e) {
            console.error("Error enabling orbit controls:", e);
        }

        // 3. Set the mode state in our global controls
        try {
            if (globalControlsInstance) {
                console.log("Setting global controls state to inactive");
                globalControlsInstance.controlsActive = false;
            }
        } catch (e) {
            console.error("Error updating global state:", e);
        }

        // 4. Force React state updates
        try {
            setControlsActive(false);
            setCameraMode('orbit');
        } catch (e) {
            console.error("Error updating state:", e);
        }

        // 5. Also try the regular exit methods as fallbacks
        try {
            // We can't use stableControls here because it's defined later
            if (window.exitShipView) {
                window.exitShipView();
            }
        } catch (e) {
            console.error("Error calling backup exit methods:", e);
        }
    }, [setCameraMode, setControlsActive]); // Add the state setter dependencies

    // Function to return to original camera view
    const deactivateSpaceshipControls = useCallback(() => {
        console.log("deactivateSpaceshipControls called, current state:", {
            controlsActive,
            cameraMode,
            hasCamera: !!camera,
            hasOriginalPosition: !!originalCameraPosition.current,
            hasOriginalRotation: !!originalCameraRotation.current,
            hasOrbitControls: !!orbitControlsRef.current
        });

        // IMPORTANT: First thing is to reset the state flags
        setControlsActive(false);
        setCameraMode('orbit');

        try {
            if (camera) {
                // Reset camera to original position when deactivating
                if (originalCameraPosition.current && originalCameraRotation.current) {
                    console.log("Resetting camera to original position and rotation");
                    camera.position.copy(originalCameraPosition.current);
                    camera.rotation.copy(originalCameraRotation.current);
                } else {
                    console.log("Missing original camera position or rotation, using default values");
                    // Hard-coded fallback position
                    camera.position.set(0, 0, 50);
                    camera.rotation.set(0, 0, 0);
                    camera.quaternion.identity();
                }

                // Re-enable orbit controls when exiting spaceship mode
                if (orbitControlsRef.current) {
                    console.log("Re-enabling orbit controls");
                    orbitControlsRef.current.enabled = true;
                    // Try to reset the orbit controls target
                    try {
                        orbitControlsRef.current.target.set(0, 0, 0);
                        orbitControlsRef.current.update();
                    } catch (error) {
                        console.error("Error resetting orbit controls target:", error);
                    }
                } else {
                    console.log("No orbit controls reference available");
                }
            } else {
                console.log("No camera available for deactivation");
            }

            console.log("Spaceship controls deactivated");

            // Set a timeout to check if the exit was successful
            setTimeout(() => {
                if (controlsActive) {
                    console.log("State appears stuck, forcing state reset");
                    setControlsActive(false);
                    setCameraMode('orbit');

                    // Try to enable orbit controls again
                    if (orbitControlsRef.current) {
                        orbitControlsRef.current.enabled = true;
                    }
                }
            }, 100);

        } catch (error) {
            console.error("Error in deactivateSpaceshipControls:", error);
        }
    }, [camera, controlsActive, cameraMode]);

    // Function to activate spaceship controls and store original camera state
    const activateSpaceshipControls = useCallback((spaceshipRef) => {
        if (!camera || !spaceshipRef || !spaceshipRef.current) {
            console.warn("Cannot activate spaceship controls: missing camera or spaceship reference");
            return;
        }

        if (!originalCameraPosition.current) {
            originalCameraPosition.current = camera.position.clone();
            originalCameraRotation.current = camera.rotation.clone();
        }

        // Immediately position camera in first-person view when entering ship view
        // Get the spaceship's current transform
        const shipPosition = spaceshipRef.current.position;
        const shipQuaternion = spaceshipRef.current.quaternion;

        // Fixed offset for a cockpit-like view (smaller offset for more "inside" feeling)
        const offsetVector = new THREE.Vector3(0, 2.5, -0.5);

        // Apply the ship's rotation to the offset vector
        offsetVector.applyQuaternion(shipQuaternion);

        // Position camera directly using ship's position + offset
        camera.position.copy(shipPosition).add(offsetVector);

        // Copy ship's rotation exactly to camera
        camera.quaternion.copy(shipQuaternion);

        // Disable orbit controls when in spaceship mode
        if (orbitControlsRef.current) {
            orbitControlsRef.current.enabled = false;
        }

        setControlsActive(true);
        // Always go to fps mode when activating
        setCameraMode('fps');
        console.log("Activated spaceship controls, camera mode: fps");
    }, [camera]);

    // Update key state based on UI button presses
    const setKeyState = useCallback((key, isPressed) => {
        if (keys.current.hasOwnProperty(key)) {
            keys.current[key] = isPressed;
            console.log(`Key state updated: ${key} = ${isPressed}, keys:`, keys.current);
        }
    }, []);

    // Add keyboard event listeners - MOVED AFTER function declarations
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key;
            // Handle both lowercase keys and special keys like ArrowUp
            if (keys.current.hasOwnProperty(key)) {
                keys.current[key] = true;
                console.log(`Physical key pressed: ${key}`);
            }

            // Handle Escape key to exit ship view - uses the unified exit function
            if (key === "Escape") {
                console.log("Escape key pressed, calling unified exit function");
                e.preventDefault();
                hardExitShipView();
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key;
            // Handle both lowercase keys and special keys like ArrowUp
            if (keys.current.hasOwnProperty(key)) {
                keys.current[key] = false;
                console.log(`Physical key released: ${key}`);
            }
        };

        // Add event listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Add a global property to make the keys reference accessible for debugging
        window._spaceshipKeys = keys;

        // Add a global reference to the exit function for emergency use
        window.emergencySpaceshipExit = hardExitShipView;

        // Clean up event listeners on unmount
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            delete window._spaceshipKeys;
            delete window.emergencySpaceshipExit;
        };
    }, [hardExitShipView]);

    return {
        keys,
        controlsActive,
        cameraMode,
        activateSpaceshipControls,
        deactivateSpaceshipControls,
        setKeyState,
        hardExitShipView // Export this so it can be used in the SpaceshipControls component
    };
};

// Create a shared instance of the spaceship controls hook
let globalControlsInstance = null;

// Function to get a shared instance of the controls
const getSharedControls = () => {
    if (!globalControlsInstance) {
        // Create the instance with default values
        const controls = {
            keys: { current: {} },
            controlsActive: false,
            cameraMode: 'orbit',
            activateSpaceshipControls: () => console.warn("Controls not fully initialized"),
            deactivateSpaceshipControls: () => console.warn("Controls not fully initialized"),
            setKeyState: () => console.warn("Controls not fully initialized")
        };
        globalControlsInstance = controls;
    }
    return globalControlsInstance;
};

// On-screen UI controls component that renders OUTSIDE the Canvas
const SpaceshipControls = ({ spaceshipRef, toggleFn, enterFn, exitFn }) => {
    const controlsRef = useRef(null);

    // Get the hook instance
    const hookControls = useSpaceshipControls();

    // Update the global instance with the latest functions from the hook
    useEffect(() => {
        globalControlsInstance = hookControls;
    }, [hookControls]);

    // Destructure from the shared global instance
    const {
        keys,
        controlsActive,
        cameraMode,
        activateSpaceshipControls,
        deactivateSpaceshipControls,
        setKeyState,
        hardExitShipView
    } = hookControls;

    // Add a state debug value that we can display in the UI
    const [displayedState, setDisplayedState] = useState("Not in ship view");

    // Update the displayed state whenever controlsActive changes
    useEffect(() => {
        setDisplayedState(controlsActive ? "In ship view" : "Not in ship view");
    }, [controlsActive]);

    // Static reference to functions to prevent effect dependencies
    const stableControls = useRef({
        toggleFn,
        enterFn,
        exitFn,
        activateSpaceshipControls,
        deactivateSpaceshipControls,
        setKeyState,
        hardExitShipView
    });

    // Update the stable ref when props change
    useEffect(() => {
        stableControls.current = {
            toggleFn,
            enterFn,
            exitFn,
            activateSpaceshipControls,
            deactivateSpaceshipControls,
            setKeyState,
            hardExitShipView
        };
    }, [toggleFn, enterFn, exitFn, activateSpaceshipControls, deactivateSpaceshipControls, setKeyState, hardExitShipView]);

    // Use an effect to create UI outside the Canvas
    useEffect(() => {
        // This runs when the component mounts
        // Create a container for our controls if it doesn't exist
        let controlsContainer = document.getElementById('spaceship-controls-container');
        if (!controlsContainer) {
            controlsContainer = document.createElement('div');
            controlsContainer.id = 'spaceship-controls-container';
            document.body.appendChild(controlsContainer);
        }

        // Common button styles
        const buttonStyle = {
            width: '50px',
            height: '50px',
            borderRadius: '5px',
            backgroundColor: 'rgba(50, 50, 70, 0.7)',
            backdropFilter: 'blur(5px)',
            color: 'white',
            border: '1px solid rgba(100, 150, 255, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            boxShadow: '0 0 5px rgba(0, 100, 255, 0.5)',
            userSelect: 'none'
        };

        const activeButtonStyle = {
            ...buttonStyle,
            backgroundColor: 'rgba(100, 150, 255, 0.7)',
        };

        // Create the controls UI
        const renderControls = () => {
            if (!controlsContainer) return;

            // Clean up any previous renders
            while (controlsContainer.firstChild) {
                controlsContainer.removeChild(controlsContainer.firstChild);
            }

            // Create the container div
            const containerDiv = document.createElement('div');
            containerDiv.style.position = 'fixed';
            containerDiv.style.bottom = '20px';
            containerDiv.style.left = '20px';
            containerDiv.style.display = 'flex';
            containerDiv.style.flexDirection = 'column';
            containerDiv.style.gap = '10px';
            containerDiv.style.zIndex = '1000';

            // Create mode toggle buttons
            const toggleButtonsDiv = document.createElement('div');
            toggleButtonsDiv.style.display = 'flex';
            toggleButtonsDiv.style.justifyContent = 'center';
            toggleButtonsDiv.style.gap = '10px'; // Add gap between buttons
            toggleButtonsDiv.style.marginBottom = '10px';

            // Enter Ship View button (always visible)
            const enterButton = document.createElement('button');
            Object.assign(enterButton.style, buttonStyle);
            enterButton.style.width = 'auto';
            enterButton.style.padding = '0 15px';
            enterButton.style.backgroundColor = 'rgba(50, 200, 100, 0.7)'; // Green for enter
            enterButton.innerText = 'Enter Ship View';

            // Only enable the enter button when not in ship view
            enterButton.disabled = controlsActive;
            enterButton.style.opacity = controlsActive ? '0.5' : '1';
            enterButton.style.cursor = controlsActive ? 'default' : 'pointer';

            enterButton.onclick = () => {
                if (controlsActive) return; // Already in ship view

                const currentEnterFn = stableControls.current.enterFn;
                if (currentEnterFn) {
                    currentEnterFn();
                } else if (window.enterShipView) {
                    window.enterShipView();
                } else if (spaceshipRef) {
                    stableControls.current.activateSpaceshipControls(spaceshipRef);
                }
            };

            // Exit Ship View button with simplified implementation
            const exitButton = document.createElement('button');
            Object.assign(exitButton.style, buttonStyle);
            exitButton.style.width = 'auto';
            exitButton.style.padding = '0 15px';
            exitButton.style.backgroundColor = 'rgba(255, 100, 100, 0.7)'; // Red for exit
            exitButton.innerText = 'Exit Ship View';

            // IMPORTANT: Always make the exit button clickable for troubleshooting
            exitButton.disabled = false;
            exitButton.style.opacity = '1';
            exitButton.style.cursor = 'pointer';

            // The button now uses the unified exit function
            exitButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Exit button clicked, calling unified exit function");
                hardExitShipView();
            };

            toggleButtonsDiv.appendChild(enterButton);
            toggleButtonsDiv.appendChild(exitButton);

            // Emergency Force Exit button (now uses the same unified function)
            const forceExitButton = document.createElement('button');
            Object.assign(forceExitButton.style, buttonStyle);
            forceExitButton.style.width = 'auto';
            forceExitButton.style.padding = '0 15px';
            forceExitButton.style.backgroundColor = 'rgba(255, 50, 50, 0.9)'; // Bright red for emergency
            forceExitButton.innerText = 'Force Exit';
            forceExitButton.style.marginLeft = '10px';

            forceExitButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Force Exit button clicked, calling unified exit function");
                hardExitShipView();
            };

            toggleButtonsDiv.appendChild(forceExitButton);

            containerDiv.appendChild(toggleButtonsDiv);

            // Create control pad - ALWAYS show directional controls
            const controlPadDiv = document.createElement('div');
            controlPadDiv.style.display = 'flex';
            controlPadDiv.style.justifyContent = 'space-between';
            controlPadDiv.style.width = '300px';

            // Create directional pad (left side)
            const dpadDiv = document.createElement('div');
            dpadDiv.style.display = 'grid';
            dpadDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
            dpadDiv.style.gridTemplateRows = 'repeat(3, 1fr)';
            dpadDiv.style.gap = '5px';
            dpadDiv.style.width = '160px';
            dpadDiv.style.height = '160px';

            // Helper function to create a button
            const createButton = (key, symbol, gridColumn, gridRow) => {
                const button = document.createElement('button');

                // Apply the correct style based on whether the key is pressed
                const isActive = keys.current[key];
                Object.assign(button.style, isActive ? activeButtonStyle : buttonStyle);

                // Set grid position
                if (gridColumn) button.style.gridColumn = gridColumn;
                if (gridRow) button.style.gridRow = gridRow;

                button.innerText = symbol;

                // Improved event handling for both mouse and touch
                const pressHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleButtonDown(key);
                    button.style.backgroundColor = activeButtonStyle.backgroundColor;
                };

                const releaseHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleButtonUp(key);
                    button.style.backgroundColor = buttonStyle.backgroundColor;
                };

                // Mouse events
                button.addEventListener('mousedown', pressHandler);
                button.addEventListener('mouseup', releaseHandler);
                button.addEventListener('mouseleave', releaseHandler);

                // Touch events
                button.addEventListener('touchstart', pressHandler);
                button.addEventListener('touchend', releaseHandler);
                button.addEventListener('touchcancel', releaseHandler);

                return button;
            };

            // Create empty slots and buttons in dpad grid

            // Top row
            const topLeft = document.createElement('div');
            topLeft.style.gridColumn = '1';
            topLeft.style.gridRow = '1';
            dpadDiv.appendChild(topLeft);

            const upButton = createButton('w', '↑', '2', '1');
            dpadDiv.appendChild(upButton);

            const topRight = document.createElement('div');
            topRight.style.gridColumn = '3';
            topRight.style.gridRow = '1';
            dpadDiv.appendChild(topRight);

            // Middle row
            const leftButton = createButton('a', '←', '1', '2');
            dpadDiv.appendChild(leftButton);

            const middleEmpty = document.createElement('div');
            middleEmpty.style.gridColumn = '2';
            middleEmpty.style.gridRow = '2';
            dpadDiv.appendChild(middleEmpty);

            const rightButton = createButton('d', '→', '3', '2');
            dpadDiv.appendChild(rightButton);

            // Bottom row
            const bottomLeft = document.createElement('div');
            bottomLeft.style.gridColumn = '1';
            bottomLeft.style.gridRow = '3';
            dpadDiv.appendChild(bottomLeft);

            const downButton = createButton('s', '↓', '2', '3');
            dpadDiv.appendChild(downButton);

            const bottomRight = document.createElement('div');
            bottomRight.style.gridColumn = '3';
            bottomRight.style.gridRow = '3';
            dpadDiv.appendChild(bottomRight);

            controlPadDiv.appendChild(dpadDiv);

            // Create pitch/roll controls (right side)
            const pitchRollDiv = document.createElement('div');
            pitchRollDiv.style.display = 'flex';
            pitchRollDiv.style.flexDirection = 'column';
            pitchRollDiv.style.gap = '5px';

            // Up arrow for pitch up
            const pitchUpButton = createButton('ArrowUp', '▲', '', '');
            pitchRollDiv.appendChild(pitchUpButton);

            // Roll buttons container
            const rollDiv = document.createElement('div');
            rollDiv.style.display = 'flex';
            rollDiv.style.gap = '5px';

            // Roll left (q) and right (e) buttons
            const rollLeftButton = createButton('q', '↺', '', '');
            rollDiv.appendChild(rollLeftButton);

            const rollRightButton = createButton('e', '↻', '', '');
            rollDiv.appendChild(rollRightButton);

            pitchRollDiv.appendChild(rollDiv);

            // Down arrow for pitch down
            const pitchDownButton = createButton('ArrowDown', '▼', '', '');
            pitchRollDiv.appendChild(pitchDownButton);

            controlPadDiv.appendChild(pitchRollDiv);

            // Add controls to the container
            containerDiv.appendChild(controlPadDiv);

            // Add to the DOM
            controlsContainer.appendChild(containerDiv);
        };

        // Helper functions for button interaction
        const handleButtonDown = (key) => {
            // CRITICAL: Directly update the keys object for immediate response
            keys.current[key] = true;

            // Update via the setter function for completeness
            stableControls.current.setKeyState(key, true);

            try {
                // Create and dispatch keyboard event
                const event = new KeyboardEvent('keydown', {
                    key: key,
                    code: key === 'ArrowUp' ? 'ArrowUp' :
                        key === 'ArrowDown' ? 'ArrowDown' :
                            `Key${key.toUpperCase()}`,
                    bubbles: true
                });
                window.dispatchEvent(event);

                // Force update the global accessor if available
                if (window._spaceshipKeys && window._spaceshipKeys.current) {
                    window._spaceshipKeys.current[key] = true;
                }
            } catch (error) {
                console.error("Error in handleButtonDown:", error);
            }
        };

        const handleButtonUp = (key) => {
            // CRITICAL: Directly update the keys object for immediate response
            keys.current[key] = false;

            // Update via the setter function for completeness
            stableControls.current.setKeyState(key, false);

            try {
                // Create and dispatch keyboard event
                const event = new KeyboardEvent('keyup', {
                    key: key,
                    code: key === 'ArrowUp' ? 'ArrowUp' :
                        key === 'ArrowDown' ? 'ArrowDown' :
                            `Key${key.toUpperCase()}`,
                    bubbles: true
                });
                window.dispatchEvent(event);

                // Force update the global accessor if available
                if (window._spaceshipKeys && window._spaceshipKeys.current) {
                    window._spaceshipKeys.current[key] = false;
                }
            } catch (error) {
                console.error("Error in handleButtonUp:", error);
            }
        };

        // Initial render
        renderControls();

        // Use a simple timeout-based update instead of requestAnimationFrame for stability
        const intervalId = setInterval(() => {
            try {
                renderControls();
            } catch (error) {
                console.error("Error in renderControls:", error);
            }
        }, 100); // Update every 100ms

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
            if (controlsContainer && document.body.contains(controlsContainer)) {
                try {
                    document.body.removeChild(controlsContainer);
                } catch (error) {
                    console.error("Error removing controls container:", error);
                }
            }
        };
    }, [controlsActive, cameraMode, keys, spaceshipRef, hardExitShipView]); // Added hardExitShipView to dependency array

    // Return null because this component should not render anything directly
    // It creates the UI using DOM manipulation in the useEffect
    return null;
};

export default SpaceshipControls; 