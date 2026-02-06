import React, { useState, useEffect } from 'react';

const CameraIndicator = () => {
  const [position, setPosition] = useState('top-right');

  useEffect(() => {
    const updatePosition = () => {
      // Get screen orientation
      const orientation = window.screen.orientation?.type || '';

      // Default iPad camera is on the long edge (top in portrait)
      // When in landscape:
      // - landscape-primary (home button right): camera on LEFT
      // - landscape-secondary (home button left): camera on RIGHT

      if (orientation.includes('landscape')) {
        if (orientation.includes('secondary')) {
          // Rotated with camera on right side
          setPosition('bottom-right');
        } else {
          // Rotated with camera on left side
          setPosition('bottom-left');
        }
      } else if (orientation.includes('portrait')) {
        if (orientation.includes('secondary')) {
          // Upside down portrait - camera on bottom
          setPosition('bottom-center');
        } else {
          // Normal portrait - camera on top
          setPosition('top-center');
        }
      } else {
        // Fallback: check window dimensions
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
          // Default to bottom-right for landscape (common kiosk setup)
          setPosition('bottom-right');
        } else {
          setPosition('top-center');
        }
      }
    };

    // Initial check
    updatePosition();

    // Listen for orientation changes
    window.addEventListener('orientationchange', updatePosition);
    window.addEventListener('resize', updatePosition);

    if (window.screen.orientation) {
      window.screen.orientation.addEventListener('change', updatePosition);
    }

    return () => {
      window.removeEventListener('orientationchange', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', updatePosition);
      }
    };
  }, []);

  // Determine arrow direction based on position
  const getArrowDirection = () => {
    if (position.includes('right')) return '→';
    if (position.includes('left')) return '←';
    if (position.includes('top')) return '↑';
    if (position.includes('bottom')) return '↓';
    return '→';
  };

  return (
    <div className={`camera-indicator ${position}`}>
      <span className="camera-indicator-arrow">{getArrowDirection()}</span>
      <span className="camera-indicator-icon">📷</span>
    </div>
  );
};

export default CameraIndicator;
