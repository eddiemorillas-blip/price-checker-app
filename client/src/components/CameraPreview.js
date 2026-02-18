import React, { useState, useEffect } from 'react';

const CameraPreview = ({
  containerId,
  isInitializing,
  isScanning,
  isPaused,
  error,
  useBackCamera,
  onStartCamera,
  onSwitchCamera,
}) => {
  const [showHint, setShowHint] = useState(false);

  // Show hint after 3 seconds of scanning without a result
  useEffect(() => {
    if (isScanning && !isPaused) {
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
        setShowHint(false);
      };
    } else {
      setShowHint(false);
    }
  }, [isScanning, isPaused]);

  return (
    <div className="camera-preview-wrapper">
      {/* Scanner container - html5-qrcode will render video here */}
      <div id={containerId} className="camera-container">
        {/* Show placeholder when not scanning */}
        {!isScanning && !isInitializing && !error && (
          <div className="camera-placeholder">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onStartCamera}
            >
              Start Camera
            </button>
            <p className="camera-hint">Tap to enable camera scanning</p>
          </div>
        )}
      </div>

      {/* Scanning overlay with frame */}
      {isScanning && !isPaused && (
        <div className="camera-overlay">
          <div className="scanning-frame">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>
          <p className="scanning-hint">
            {showHint
              ? "Move closer or adjust angle"
              : "Position barcode in frame"}
          </p>
          {onSwitchCamera && (
            <button
              type="button"
              className="camera-switch-btn"
              onClick={onSwitchCamera}
              title={useBackCamera ? "Switch to front camera" : "Switch to back camera"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path>
                <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="m18 22-3-3 3-3"></path>
                <path d="m6 2 3 3-3 3"></path>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Paused overlay */}
      {isScanning && isPaused && (
        <div className="camera-overlay camera-paused">
          <p className="scanning-hint">Scanning paused</p>
        </div>
      )}

      {/* Loading state */}
      {isInitializing && (
        <div className="camera-loading">
          <span className="loading"></span>
          <span>Starting camera...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="camera-error">
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onStartCamera}
            style={{ marginTop: '1rem' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraPreview;
