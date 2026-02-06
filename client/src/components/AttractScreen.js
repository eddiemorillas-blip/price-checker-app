import React from 'react';

const AttractScreen = ({ onTap }) => {
  return (
    <div className="attract-screen" onClick={onTap}>
      <div className="attract-content">
        <img
          src="/logo.png"
          alt="The Front Logo"
          className="attract-logo"
        />
        <h1 className="attract-title">Tap to Check Prices</h1>
        <p className="attract-subtitle">Scan any item to see pricing</p>
        <div className="attract-pulse"></div>
      </div>
    </div>
  );
};

export default AttractScreen;
