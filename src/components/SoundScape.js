import React, { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// A dummy audio class to replace the PositionalAudio from drei
// This avoids loading audio files that aren't available
class DummyAudio {
    constructor() {
        this._volume = 0.5;
        this._isPlaying = false;
    }

    setRefDistance() { }
    setVolume(vol) { this._volume = vol; }
    getVolume() { return this._volume; }
    setLoop() { }
    setRolloffFactor() { }
    setDistanceModel() { }
    play() { this._isPlaying = true; }
    pause() { this._isPlaying = false; }
}

// Main component that orchestrates the entire soundscape - modified to not load external files
const SoundScape = ({
    volume = 0.5,
    enabled = true,
    spatialAudio = true
}) => {
    // Get camera for positional audio
    const { camera } = useThree();

    // References for audio elements
    const ambientRef = useRef();
    const listener = useRef(new THREE.AudioListener());

    // Audio state
    const [primaryTrackPlaying, setPrimaryTrackPlaying] = useState(false);
    const [secondaryTrackPlaying, setSecondaryTrackPlaying] = useState(false);
    const [eventSoundActive, setEventSoundActive] = useState(false);

    // Track references using dummy audio
    const backgroundTrackRef = useRef(new DummyAudio());
    const cosmicAmbienceRef = useRef(new DummyAudio());
    const stellarWindsRef = useRef(new DummyAudio());
    const pulseRef = useRef(new DummyAudio());

    // Position references for spatial audio sources
    const positions = {
        cosmicAmbience: new THREE.Vector3(100, 50, -200),
        stellarWinds: new THREE.Vector3(-150, -70, -100),
        pulse: new THREE.Vector3(0, 0, -300)
    };

    // Initialize audio system
    useEffect(() => {
        // Add listener to camera
        camera.add(listener.current);

        // Clean up
        return () => {
            camera.remove(listener.current);
        };
    }, [camera]);

    // Handle volume changes
    useEffect(() => {
        if (backgroundTrackRef.current) {
            backgroundTrackRef.current.setVolume(volume * 0.7);
        }

        if (cosmicAmbienceRef.current) {
            cosmicAmbienceRef.current.setVolume(volume * 0.4);
        }

        if (stellarWindsRef.current) {
            stellarWindsRef.current.setVolume(volume * 0.3);
        }

        if (pulseRef.current) {
            pulseRef.current.setVolume(volume * 0.2);
        }
    }, [volume]);

    // Handle enabling/disabling audio
    useEffect(() => {
        if (!enabled) {
            // Pause all audio when disabled
            if (backgroundTrackRef.current && primaryTrackPlaying) {
                backgroundTrackRef.current.pause();
                setPrimaryTrackPlaying(false);
            }

            if (cosmicAmbienceRef.current && secondaryTrackPlaying) {
                cosmicAmbienceRef.current.pause();
                setSecondaryTrackPlaying(false);
            }

            if (stellarWindsRef.current) {
                stellarWindsRef.current.pause();
            }

            if (pulseRef.current) {
                pulseRef.current.pause();
            }
        } else {
            // Resume audio when enabled
            if (backgroundTrackRef.current && !primaryTrackPlaying) {
                backgroundTrackRef.current.play();
                setPrimaryTrackPlaying(true);
            }

            if (cosmicAmbienceRef.current && !secondaryTrackPlaying) {
                cosmicAmbienceRef.current.play();
                setSecondaryTrackPlaying(true);
            }

            if (stellarWindsRef.current) {
                stellarWindsRef.current.play();
            }

            if (pulseRef.current) {
                pulseRef.current.play();
            }
        }
    }, [enabled, primaryTrackPlaying, secondaryTrackPlaying]);

    // Set up keyboard shortcut for muting
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key.toLowerCase() === 'm') {
                // Toggle mute with M key
                if (backgroundTrackRef.current) {
                    if (backgroundTrackRef.current.getVolume() > 0) {
                        // Store current volume
                        backgroundTrackRef.current._storedVolume = volume;

                        // Mute all tracks
                        backgroundTrackRef.current.setVolume(0);
                        if (cosmicAmbienceRef.current) cosmicAmbienceRef.current.setVolume(0);
                        if (stellarWindsRef.current) stellarWindsRef.current.setVolume(0);
                        if (pulseRef.current) pulseRef.current.setVolume(0);
                    } else {
                        // Restore volume
                        const storedVolume = backgroundTrackRef.current._storedVolume || volume;
                        backgroundTrackRef.current.setVolume(storedVolume * 0.7);
                        if (cosmicAmbienceRef.current) cosmicAmbienceRef.current.setVolume(storedVolume * 0.4);
                        if (stellarWindsRef.current) stellarWindsRef.current.setVolume(storedVolume * 0.3);
                        if (pulseRef.current) pulseRef.current.setVolume(storedVolume * 0.2);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [volume]);

    // Handle primary audio loading - simulate loaded
    useEffect(() => {
        if (enabled) {
            // Simulate audio loaded
            backgroundTrackRef.current.play();
            setPrimaryTrackPlaying(true);
            cosmicAmbienceRef.current.play();
            setSecondaryTrackPlaying(true);
        }
    }, [enabled]);

    // Just return an empty group since we're not loading actual audio
    return <group></group>;
};

export default SoundScape; 