import React, { useState, useEffect } from "react";

const InteractiveConsole = ({ position = "bottom-right" }) => {
    const [messages, setMessages] = useState([
        { text: "System initialized", type: "system" },
        { text: "Space exploration mode active", type: "info" }
    ]);
    const [isVisible, setIsVisible] = useState(true);

    // Add a message periodically
    useEffect(() => {
        const possibleMessages = [
            { text: "Scanning nearby celestial bodies...", type: "info" },
            { text: "Gravitational anomaly detected", type: "warning" },
            { text: "Stellar radiation levels normal", type: "info" },
            { text: "Navigation systems optimal", type: "success" },
            { text: "Detecting interstellar particles", type: "info" },
            { text: "Warning: Approaching asteroid field", type: "warning" },
            { text: "Hyperspace calculations complete", type: "success" }
        ];

        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const newMessage = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
                setMessages(prevMessages => [
                    ...prevMessages,
                    newMessage
                ].slice(-6)); // Keep only the last 6 messages
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Toggle console visibility
    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    // Determine position styles
    const getPositionStyle = () => {
        switch (position) {
            case "top-left":
                return { top: "20px", left: "20px" };
            case "top-right":
                return { top: "20px", right: "20px" };
            case "bottom-left":
                return { bottom: "20px", left: "20px" };
            case "bottom-right":
            default:
                return { bottom: "20px", right: "20px" };
        }
    };

    // Message type colors
    const getMessageColor = (type) => {
        switch (type) {
            case "system": return "#88ccff";
            case "warning": return "#ffaa33";
            case "error": return "#ff3333";
            case "success": return "#33ff88";
            case "info":
            default: return "#cccccc";
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                width: "300px",
                ...getPositionStyle(),
                backgroundColor: "rgba(0, 20, 40, 0.8)",
                borderRadius: "5px",
                backdropFilter: "blur(5px)",
                border: "1px solid rgba(100, 180, 255, 0.3)",
                boxShadow: "0 0 10px rgba(0, 100, 200, 0.5)",
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "12px",
                zIndex: 1000,
                transition: "opacity 0.3s, transform 0.3s",
                opacity: isVisible ? 1 : 0.2,
                transform: isVisible ? "translateY(0)" : "translateY(80%)"
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "5px",
                    borderBottom: "1px solid rgba(100, 180, 255, 0.3)",
                    paddingBottom: "5px"
                }}
            >
                <div style={{ color: "#33ccff", fontWeight: "bold" }}>SPACE CONSOLE</div>
                <div
                    style={{ cursor: "pointer", color: "#aaaaaa" }}
                    onClick={toggleVisibility}
                >
                    {isVisible ? "[-]" : "[+]"}
                </div>
            </div>

            <div>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            margin: "4px 0",
                            color: getMessageColor(msg.type),
                            opacity: 0.9
                        }}
                    >
                        &gt; {msg.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InteractiveConsole; 