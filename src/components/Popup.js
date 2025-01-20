// src/components/Popup.js

import React, { useEffect } from "react";

const Popup = ({ message, onClose }) => {
  // Handle key press for closing the popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "x") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div style={styles.overlay}>
      <div style={styles.popup}>
        <button style={styles.closeButton} onClick={onClose}>
          &times; {/* "×" symbol */}
        </button>
        <div style={styles.message}>{message}</div>
        <div style={styles.instruction}>Press "X" to close</div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
    animation: "slide-in 0.5s forwards",
  },
  popup: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "#ffffff",
    padding: "20px",
    borderRadius: "8px",
    minWidth: "250px",
    maxWidth: "300px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "5px",
    right: "10px",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    fontSize: "20px",
    cursor: "pointer",
  },
  message: {
    marginBottom: "10px",
  },
  instruction: {
    fontSize: "12px",
    color: "#cccccc",
    textAlign: "right",
  },
};

export default Popup;
