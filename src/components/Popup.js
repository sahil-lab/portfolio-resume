// src/components/Popup.js

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Popup = ({
  message,
  type = "info",
  onClose,
  action = null,
  highlight = [],
  image = null,
  sound = null,
  visual = null,
  targetObject = null,
  counter = null
}) => {
  // State for counting keypresses for interactive elements
  const [keyPressCount, setKeyPressCount] = useState(0);
  const [keyHighlightActive, setKeyHighlightActive] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  // References
  const popupRef = useRef(null);
  const audioRef = useRef(null);
  const highlightTimerRef = useRef(null);

  // Handle key press for closing the popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Close popup with X key
      if (e.key.toLowerCase() === "x") {
        onClose();
      }

      // Track keypresses for highlighted keys
      if (highlight && highlight.length > 0) {
        const pressedKey = e.key.toUpperCase();
        if (highlight.includes(pressedKey)) {
          setKeyPressCount(prev => prev + 1);
          pulseKeyHighlight();
        }
      }

      // Handle action key if defined
      if (action && e.key.toLowerCase() === "e") {
        handleAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, highlight, action]);

  // Handle popup appearance animations and effects
  useEffect(() => {
    // Start animation sequence
    setTimeout(() => {
      setAnimationComplete(true);
    }, 500);

    // Play sound if present
    if (sound && !audioPlaying) {
      playSound();
    }

    // Auto-hide after a time period for certain types
    let hideTimeout;
    if (type === "fact" || type === "tip") {
      hideTimeout = setTimeout(() => {
        onClose();
      }, 12000); // 12 seconds for facts and tips
    }

    return () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [sound, type, audioPlaying, onClose]);

  // Visual pulse effect for key highlights
  const pulseKeyHighlight = () => {
    setKeyHighlightActive(true);

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    highlightTimerRef.current = setTimeout(() => {
      setKeyHighlightActive(false);
    }, 300);
  };

  // Handle playing sound effect
  const playSound = () => {
    if (sound && !audioPlaying) {
      const audio = new Audio(sound);
      audio.volume = 0.5;
      audioRef.current = audio;

      audio.onended = () => {
        setAudioPlaying(false);
        audioRef.current = null;
      };

      audio.play();
      setAudioPlaying(true);
    }
  };

  // Handle action (links, downloads, etc)
  const handleAction = () => {
    if (!action) return;

    if (action.startsWith("mailto:")) {
      window.location.href = action;
    } else if (action.startsWith("http")) {
      window.open(action, "_blank");
    } else if (targetObject) {
      // Could dispatch an event to focus on a particular 3D object
      const event = new CustomEvent("focusObject", {
        detail: { target: targetObject }
      });
      window.dispatchEvent(event);
    }

    // Close the popup after action
    onClose();
  };

  // Icon based on popup type
  const getIcon = () => {
    switch (type) {
      case "fact":
        return "💫";
      case "tip":
        return "💡";
      case "interactive":
        return "🖱️";
      case "contact":
        return "📡";
      case "challenge":
        return "🏆";
      default:
        return "ℹ️";
    }
  };

  // Background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case "fact":
        return "rgba(70, 30, 120, 0.85)";
      case "tip":
        return "rgba(30, 70, 120, 0.85)";
      case "interactive":
        return "rgba(120, 50, 30, 0.85)";
      case "contact":
        return "rgba(30, 100, 70, 0.85)";
      case "challenge":
        return "rgba(120, 30, 70, 0.85)";
      default:
        return "rgba(10, 15, 30, 0.85)";
    }
  };

  // Border color based on type
  const getBorderColor = () => {
    switch (type) {
      case "fact":
        return "rgba(180, 100, 255, 0.5)";
      case "tip":
        return "rgba(100, 180, 255, 0.5)";
      case "interactive":
        return "rgba(255, 150, 100, 0.5)";
      case "contact":
        return "rgba(100, 255, 150, 0.5)";
      case "challenge":
        return "rgba(255, 100, 150, 0.5)";
      default:
        return "rgba(100, 150, 255, 0.3)";
    }
  };

  // Highlight a key in the message
  const highlightKeys = (text) => {
    if (!highlight || highlight.length === 0) return text;

    // Split text by spaces to find and highlight keys
    return text.split(' ').map((word, idx) => {
      // Check if any highlighted key is in this word
      const foundKey = highlight.find(key =>
        word.toUpperCase().includes(key.toUpperCase())
      );

      if (foundKey) {
        // Highlight the key part only
        const keyIndex = word.toUpperCase().indexOf(foundKey.toUpperCase());
        const beforeKey = word.substring(0, keyIndex);
        const actualKey = word.substring(keyIndex, keyIndex + foundKey.length);
        const afterKey = word.substring(keyIndex + foundKey.length);

        return (
          <span key={idx}>
            {beforeKey}
            <motion.span
              className="highlighted-key"
              initial={{ color: "#ffffff" }}
              animate={{
                color: keyHighlightActive ? "#ffff00" : "#00ffff",
                textShadow: keyHighlightActive
                  ? "0 0 8px rgba(255, 255, 0, 0.8)"
                  : "0 0 5px rgba(0, 255, 255, 0.5)"
              }}
              transition={{ duration: 0.2 }}
              style={{
                fontWeight: "bold",
                padding: "0 2px"
              }}
            >
              {actualKey}
            </motion.span>
            {afterKey}
            {' '}
          </span>
        );
      }

      return word + ' ';
    });
  };

  // Counter display for challenge type
  const renderCounter = () => {
    if (type !== "challenge" || !counter) return null;

    return (
      <div className="counter" style={{
        marginTop: '10px',
        padding: '5px 10px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px'
      }}>
        <span style={{ marginRight: '10px' }}>Progress:</span>
        <div style={{
          display: 'flex',
          gap: '3px'
        }}>
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3, scale: 0.8 }}
              animate={{
                opacity: i < keyPressCount ? 1 : 0.3,
                scale: i < keyPressCount ? 1 : 0.8,
                backgroundColor: i < keyPressCount ? 'rgba(255, 220, 100, 0.9)' : 'rgba(100, 100, 100, 0.3)'
              }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              style={{
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: 'rgba(100, 100, 100, 0.3)'
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Image display
  const renderImage = () => {
    if (!image) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: imageLoaded ? 1 : 0,
          height: imageLoaded ? 'auto' : 0
        }}
        transition={{ duration: 0.5 }}
        style={{
          marginTop: '10px',
          borderRadius: '5px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <img
          src={image}
          alt="Popup illustration"
          style={{
            width: '100%',
            maxHeight: '120px',
            objectFit: 'cover'
          }}
          onLoad={() => setImageLoaded(true)}
        />
      </motion.div>
    );
  };

  // Action button
  const renderActionButton = () => {
    if (!action && !targetObject) return null;

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleAction}
        style={{
          marginTop: '10px',
          background: 'linear-gradient(90deg, rgba(0, 150, 255, 0.7), rgba(0, 200, 255, 0.7))',
          border: 'none',
          borderRadius: '5px',
          padding: '8px 15px',
          color: '#ffffff',
          fontWeight: 'bold',
          cursor: 'pointer',
          width: '100%',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}
      >
        {type === "contact" ? "Contact Now" :
          type === "interactive" ? "Interact (E)" :
            "Learn More"}
      </motion.button>
    );
  };

  // Sound controls
  const renderSoundControls = () => {
    if (!sound) return null;

    return (
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          onClick={playSound}
          disabled={audioPlaying}
          style={{
            background: audioPlaying ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 150, 255, 0.5)',
            border: 'none',
            borderRadius: '5px',
            padding: '5px 10px',
            color: '#ffffff',
            cursor: audioPlaying ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px'
          }}
        >
          {audioPlaying ? '🔊 Playing...' : '🔈 Listen'}
        </button>

        {audioPlaying && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'loop' }}
            style={{
              height: '3px',
              background: 'linear-gradient(90deg, rgba(0, 150, 255, 0.7), rgba(0, 200, 255, 0.2))',
              borderRadius: '3px'
            }}
          />
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          maxWidth: "350px",
          backgroundColor: getBackgroundColor(),
          color: "#ffffff",
          borderRadius: "10px",
          boxShadow: "0 5px 25px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
          backdropFilter: "blur(10px)",
          border: `1px solid ${getBorderColor()}`
        }}
      >
        {/* Header with type indicator and close button */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 15px",
          borderBottom: `1px solid ${getBorderColor()}`,
          background: "rgba(0, 0, 0, 0.2)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "bold"
          }}>
            <span style={{ fontSize: "18px" }}>{getIcon()}</span>
            <span style={{ textTransform: "capitalize" }}>{type}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#ffffff",
              fontSize: "20px",
              cursor: "pointer",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0"
            }}
          >
            ×
          </motion.button>
        </div>

        {/* Content area */}
        <div style={{
          padding: "15px 20px"
        }}>
          {/* Message with key highlighting */}
          <motion.div
            style={{
              lineHeight: "1.4",
              marginBottom: image || action || sound ? "5px" : "0"
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {highlightKeys(message)}
          </motion.div>

          {/* Image if provided */}
          {renderImage()}

          {/* Sound controls if provided */}
          {renderSoundControls()}

          {/* Action button if action provided */}
          {renderActionButton()}

          {/* Challenge counter if appropriate */}
          {renderCounter()}
        </div>

        {/* Footer with hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: animationComplete ? 0.8 : 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          style={{
            fontSize: "11px",
            padding: "8px 15px",
            background: "rgba(0, 0, 0, 0.3)",
            textAlign: "right",
            color: "rgba(255, 255, 255, 0.7)"
          }}
        >
          Press "X" to close
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Popup;
