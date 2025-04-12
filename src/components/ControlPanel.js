import React, { useState, useEffect, useRef } from 'react';

const ControlPanel = ({ onControlChange = () => { } }) => {
    // Panel visibility state
    const [visible, setVisible] = useState(false);
    const [animatedIn, setAnimatedIn] = useState(false);
    const [activeTab, setActiveTab] = useState('navigation');

    // Controls state
    const [controls, setControls] = useState({
        // Visualization controls
        bloom: true,
        godRays: true,
        depthOfField: true,
        chromaticAberration: true,
        starIntensity: 1.5,

        // Audio controls
        musicVolume: 0.5,
        soundEffects: true,
        spatialAudio: true,

        // Performance controls
        resolution: 'auto',
        particleDensity: 'high',
        shadowQuality: 'medium',

        // Navigation
        invertControls: false,
        cameraSpeed: 1.0,
        autoRotate: false
    });

    // Timer reference for auto-hiding
    const timeoutRef = useRef(null);
    const panelRef = useRef(null);

    // Toggle panel visibility
    const togglePanel = () => {
        if (visible) {
            setAnimatedIn(false);
            setTimeout(() => setVisible(false), 300); // Wait for animation
        } else {
            setVisible(true);
            setTimeout(() => setAnimatedIn(true), 10); // Trigger animation after mount
        }

        // Reset auto-hide timer
        resetAutoHideTimer();
    };

    // Reset the auto-hide timer
    const resetAutoHideTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (visible) {
            timeoutRef.current = setTimeout(() => {
                setAnimatedIn(false);
                setTimeout(() => setVisible(false), 300);
            }, 15000); // Auto-hide after 15 seconds of inactivity
        }
    };

    // Handle click outside to close panel
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target) && visible) {
                setAnimatedIn(false);
                setTimeout(() => setVisible(false), 300);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [visible]);

    // Handle control changes
    const handleControlChange = (key, value) => {
        setControls(prev => {
            const newControls = { ...prev, [key]: value };
            onControlChange(newControls);
            return newControls;
        });

        // Reset auto-hide timer on interaction
        resetAutoHideTimer();
    };

    // Set up keyboard shortcut for panel
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Toggle panel on Tab key
            if (e.key === 'Tab') {
                e.preventDefault();
                togglePanel();
            }

            // Reset auto-hide timer on any key press while visible
            if (visible) {
                resetAutoHideTimer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [visible]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            {/* Control panel toggle button */}
            <button
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '25px',
                    background: 'rgba(30, 30, 50, 0.7)',
                    backdropFilter: 'blur(5px)',
                    border: '2px solid rgba(100, 150, 255, 0.5)',
                    color: '#ffffff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 0 10px rgba(0, 100, 255, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                }}
                onClick={togglePanel}
                onMouseEnter={resetAutoHideTimer}
            >
                <span style={{ transform: visible ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s ease' }}>
                    {visible ? '×' : '⚙'}
                </span>
            </button>

            {/* Control panel */}
            {visible && (
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        bottom: '80px',
                        right: '20px',
                        width: '300px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        background: 'rgba(10, 15, 30, 0.85)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '10px',
                        boxShadow: '0 0 20px rgba(0, 100, 255, 0.3)',
                        color: '#ffffff',
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '14px',
                        zIndex: 999,
                        transform: animatedIn ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                        opacity: animatedIn ? 1 : 0,
                        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                        border: '1px solid rgba(100, 150, 255, 0.3)'
                    }}
                    onMouseMove={resetAutoHideTimer}
                >
                    {/* Panel header */}
                    <div style={{
                        background: 'rgba(30, 40, 80, 0.9)',
                        padding: '15px 20px',
                        borderRadius: '10px 10px 0 0',
                        borderBottom: '1px solid rgba(100, 150, 255, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#00ccff' }}>
                            Control Panel
                        </h2>
                        <span style={{ opacity: 0.7, fontSize: '12px' }}>
                            Press Tab to toggle
                        </span>
                    </div>

                    {/* Tab navigation */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(100, 150, 255, 0.3)',
                        background: 'rgba(20, 25, 40, 0.8)'
                    }}>
                        {['navigation', 'visuals', 'audio', 'performance'].map(tab => (
                            <div
                                key={tab}
                                style={{
                                    padding: '10px 0',
                                    flex: 1,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderBottom: activeTab === tab ? '2px solid #00ccff' : 'none',
                                    color: activeTab === tab ? '#00ccff' : '#ffffff',
                                    background: activeTab === tab ? 'rgba(0, 80, 255, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => {
                                    setActiveTab(tab);
                                    resetAutoHideTimer();
                                }}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </div>
                        ))}
                    </div>

                    {/* Control content */}
                    <div style={{ padding: '15px 20px' }}>
                        {/* Navigation controls */}
                        {activeTab === 'navigation' && (
                            <>
                                <div className="control-section">
                                    <h3 style={{
                                        fontSize: '16px',
                                        margin: '0 0 15px 0',
                                        color: 'rgba(150, 200, 255, 1)',
                                        borderBottom: '1px solid rgba(100, 150, 255, 0.2)',
                                        paddingBottom: '5px'
                                    }}>
                                        Navigation Controls
                                    </h3>

                                    <div className="control-item" style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <label>Camera Speed</label>
                                            <span>{controls.cameraSpeed.toFixed(1)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="3"
                                            step="0.1"
                                            value={controls.cameraSpeed}
                                            onChange={(e) => handleControlChange('cameraSpeed', parseFloat(e.target.value))}
                                            style={sliderStyle}
                                        />
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.invertControls}
                                                onChange={(e) => handleControlChange('invertControls', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Invert Controls</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.autoRotate}
                                                onChange={(e) => handleControlChange('autoRotate', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Auto Rotate</span>
                                        </label>
                                    </div>

                                    <div className="keyboard-guide" style={{
                                        marginTop: '20px',
                                        background: 'rgba(40, 50, 80, 0.5)',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        fontSize: '12px'
                                    }}>
                                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#aaddff' }}>Keyboard Controls:</p>
                                        <ul style={{
                                            margin: '0',
                                            padding: '0 0 0 20px',
                                            color: 'rgba(200, 220, 255, 0.8)'
                                        }}>
                                            <li>W, A, S, D - Move camera</li>
                                            <li>Shift - Boost speed</li>
                                            <li>Ctrl - Slow motion</li>
                                            <li>E - Explore nearest planet</li>
                                            <li>G - Toggle gravity visualization</li>
                                            <li>C - Switch camera perspectives</li>
                                            <li>T - Time distortion effect</li>
                                            <li>M - Mute/unmute audio</li>
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Visual controls */}
                        {activeTab === 'visuals' && (
                            <>
                                <div className="control-section">
                                    <h3 style={{
                                        fontSize: '16px',
                                        margin: '0 0 15px 0',
                                        color: 'rgba(150, 200, 255, 1)',
                                        borderBottom: '1px solid rgba(100, 150, 255, 0.2)',
                                        paddingBottom: '5px'
                                    }}>
                                        Visual Effects
                                    </h3>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.bloom}
                                                onChange={(e) => handleControlChange('bloom', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Bloom Effect</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.godRays}
                                                onChange={(e) => handleControlChange('godRays', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>God Rays</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.depthOfField}
                                                onChange={(e) => handleControlChange('depthOfField', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Depth of Field</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.chromaticAberration}
                                                onChange={(e) => handleControlChange('chromaticAberration', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Chromatic Aberration</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={{ marginTop: '15px', marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <label>Star Intensity</label>
                                            <span>{controls.starIntensity.toFixed(1)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="3"
                                            step="0.1"
                                            value={controls.starIntensity}
                                            onChange={(e) => handleControlChange('starIntensity', parseFloat(e.target.value))}
                                            style={sliderStyle}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Audio controls */}
                        {activeTab === 'audio' && (
                            <>
                                <div className="control-section">
                                    <h3 style={{
                                        fontSize: '16px',
                                        margin: '0 0 15px 0',
                                        color: 'rgba(150, 200, 255, 1)',
                                        borderBottom: '1px solid rgba(100, 150, 255, 0.2)',
                                        paddingBottom: '5px'
                                    }}>
                                        Audio Controls
                                    </h3>

                                    <div className="control-item" style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <label>Music Volume</label>
                                            <span>{Math.round(controls.musicVolume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={controls.musicVolume}
                                            onChange={(e) => handleControlChange('musicVolume', parseFloat(e.target.value))}
                                            style={sliderStyle}
                                        />
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.soundEffects}
                                                onChange={(e) => handleControlChange('soundEffects', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>Sound Effects</span>
                                        </label>
                                    </div>

                                    <div className="control-item" style={checkboxContainer}>
                                        <label style={checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={controls.spatialAudio}
                                                onChange={(e) => handleControlChange('spatialAudio', e.target.checked)}
                                                style={checkboxStyle}
                                            />
                                            <span style={checkboxText}>3D Spatial Audio</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Performance controls */}
                        {activeTab === 'performance' && (
                            <>
                                <div className="control-section">
                                    <h3 style={{
                                        fontSize: '16px',
                                        margin: '0 0 15px 0',
                                        color: 'rgba(150, 200, 255, 1)',
                                        borderBottom: '1px solid rgba(100, 150, 255, 0.2)',
                                        paddingBottom: '5px'
                                    }}>
                                        Performance Settings
                                    </h3>

                                    <div className="control-item" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Resolution</label>
                                        <select
                                            value={controls.resolution}
                                            onChange={(e) => handleControlChange('resolution', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="ultra">Ultra</option>
                                            <option value="auto">Auto (Adaptive)</option>
                                        </select>
                                    </div>

                                    <div className="control-item" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Particle Density</label>
                                        <select
                                            value={controls.particleDensity}
                                            onChange={(e) => handleControlChange('particleDensity', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="ultra">Ultra</option>
                                        </select>
                                    </div>

                                    <div className="control-item" style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Shadow Quality</label>
                                        <select
                                            value={controls.shadowQuality}
                                            onChange={(e) => handleControlChange('shadowQuality', e.target.value)}
                                            style={selectStyle}
                                        >
                                            <option value="off">Off</option>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <button
                                        style={{
                                            background: 'linear-gradient(to right, #0066cc, #0099ff)',
                                            border: 'none',
                                            borderRadius: '5px',
                                            color: 'white',
                                            padding: '8px 15px',
                                            width: '100%',
                                            cursor: 'pointer',
                                            marginTop: '10px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => {
                                            // Optimize for performance
                                            handleControlChange('bloom', false);
                                            handleControlChange('godRays', false);
                                            handleControlChange('chromaticAberration', false);
                                            handleControlChange('particleDensity', 'low');
                                            handleControlChange('shadowQuality', 'off');
                                            handleControlChange('resolution', 'low');
                                        }}
                                    >
                                        Optimize for Performance
                                    </button>

                                    <button
                                        style={{
                                            background: 'linear-gradient(to right, #6600cc, #9900ff)',
                                            border: 'none',
                                            borderRadius: '5px',
                                            color: 'white',
                                            padding: '8px 15px',
                                            width: '100%',
                                            cursor: 'pointer',
                                            marginTop: '10px',
                                            fontWeight: 'bold',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => {
                                            // Set to high quality
                                            handleControlChange('bloom', true);
                                            handleControlChange('godRays', true);
                                            handleControlChange('chromaticAberration', true);
                                            handleControlChange('depthOfField', true);
                                            handleControlChange('particleDensity', 'high');
                                            handleControlChange('shadowQuality', 'high');
                                            handleControlChange('resolution', 'high');
                                        }}
                                    >
                                        High Quality
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '10px 20px',
                        borderTop: '1px solid rgba(100, 150, 255, 0.2)',
                        fontSize: '12px',
                        color: 'rgba(150, 200, 255, 0.7)',
                        textAlign: 'center',
                        background: 'rgba(20, 30, 50, 0.7)'
                    }}>
                        Space Portfolio Experience v2.0
                    </div>
                </div>
            )}
        </>
    );
};

// Styles
const sliderStyle = {
    width: '100%',
    height: '6px',
    appearance: 'none',
    background: 'linear-gradient(to right, #0044aa, #00ccff)',
    outline: 'none',
    borderRadius: '3px',
    cursor: 'pointer'
};

const checkboxContainer = {
    marginBottom: '10px'
};

const checkboxLabel = {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
};

const checkboxStyle = {
    margin: '0 10px 0 0',
    cursor: 'pointer',
    accentColor: '#00ccff'
};

const checkboxText = {
    fontSize: '14px'
};

const selectStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '5px',
    border: '1px solid rgba(100, 150, 255, 0.3)',
    background: 'rgba(30, 40, 60, 0.8)',
    color: '#ffffff',
    cursor: 'pointer',
    outline: 'none'
};

export default ControlPanel; 