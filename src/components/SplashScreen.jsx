import React, { useEffect, useState } from "react";
import "./SplashScreen.css";

const SplashScreen = ({ onFinish, duration = 2200 }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 500); // match CSS fade-out duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <div className={`splash-overlay ${fadeOut ? "splash-fade-out" : ""}`}>
      <div className="splash-card">
        {/* Glow backdrop behind logo */}
        <div className="logo-glow-ring"></div>
        
        {/* Logo Container */}
        <div className="splash-logo-wrapper">
          <img
            src="/logo.png"
            alt="AgriDirect AI Logo"
            className="splash-logo-img"
          />
        </div>

        {/* Brand Name */}
        <h1 className="splash-title">
          AgriDirect <span className="splash-highlight">AI</span>
        </h1>
        <p className="splash-subtitle">Direct Agriculture Marketplace & Market Intelligence</p>

        {/* Loading Progress Bar */}
        <div className="splash-progress-track">
          <div className="splash-progress-bar"></div>
        </div>

        <div className="splash-status-text">Loading agricultural intelligence...</div>
      </div>
    </div>
  );
};

export default SplashScreen;
