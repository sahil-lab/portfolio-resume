import React, { useState, useEffect, useCallback } from "react";

const TimeControls = ({ position = "top-right" }) => {
    const [timeSpeed, setTimeSpeed] = useState(1);
    const [isTimeDistorted, setIsTimeDistorted] = useState(false);
    const [timeMode, setTimeMode] = useState("normal"); // normal, slow, fast, reversed
    const [isVisible, setIsVisible] = useState(true);

    // Handle key press for time control
    const handleKeyDown = useCallback((e) => {
        if (e.key.toLowerCase() === "t") {
            // Cycle through time modes
            const modes = ["normal", "slow", "fast", "reversed"];
            const currentIndex = modes.indexOf(timeMode);
            const nextIndex = (currentIndex + 1) % modes.length;
            setTimeMode(modes[nextIndex]);

            // Show time distortion effect
            setIsTimeDistorted(true);
            setTimeout(() => setIsTimeDistorted(false), 1000);
        }
    }, [timeMode]);

    // Set up key event listener
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // Determine position styles
    const getPositionStyle = () => {
        switch (position) {
            case "top-left":
                return { top: "20px", left: "20px" };
            case "bottom-left":
                return { bottom: "20px", left: "20px" };
            case "bottom-right":
                return { bottom: "20px", right: "20px" };
            case "top-right":
            default:
                return { top: "20px", right: "20px" };
        }
    };

    // Get mode icon
    const getModeIcon = () => {
        switch (timeMode) {
            case "slow": return "⏪";
            case "fast": return "⏩";
            case "reversed": return "⏮";
            case "normal":
            default: return "⏯";
        }
    };

    // Get mode color
    const getModeColor = () => {
        switch (timeMode) {
            case "slow": return "#88ccff";
            case "fast": return "#ffaa44";
            case "reversed": return "#ff4488";
            case "normal":
            default: return "#aaddff";
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                ...getPositionStyle(),
                backgroundColor: "rgba(0, 20, 40, 0.7)",
                backdropFilter: "blur(5px)",
                border: `1px solid ${getModeColor()}`,
                borderRadius: "5px",
                padding: "10px",
                width: "120px",
                color: "#ffffff",
                fontFamily: "monospace",
                fontSize: "12px",
                zIndex: 1000,
                transition: "all 0.3s ease",
                boxShadow: isTimeDistorted
                    ? `0 0 15px ${getModeColor()}, 0 0 30px ${getModeColor()}`
                    : "0 0 10px rgba(0, 100, 200, 0.3)",
                opacity: isVisible ? 1 : 0.3
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "5px"
            }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>TIME FLOW</div>
                <div style={{
                    fontSize: "18px",
                    color: getModeColor(),
                    transition: "color 0.3s"
                }}>
                    {getModeIcon()}
                </div>
            </div>

            <div style={{
                backgroundColor: "rgba(0, 40, 80, 0.4)",
                padding: "5px",
                borderRadius: "3px",
                marginTop: "5px",
                textAlign: "center",
                color: getModeColor(),
                fontWeight: "bold",
                textTransform: "uppercase"
            }}>
                {timeMode} TIME
            </div>

            <div style={{
                fontSize: "10px",
                marginTop: "8px",
                opacity: 0.7
            }}>
                Press 'T' to change mode
            </div>
        </div>
    );
};

export default TimeControls; 