import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCameraScanner } from '../hooks/useCameraScanner';
import { productService } from '../services/api';
import ProductDisplay from './ProductDisplay';
import CameraPreview from './CameraPreview';
import AttractScreen from './AttractScreen';

const IDLE_TIMEOUT = 60000; // 60 seconds

const BarcodeScanner = ({ branding }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  const idleTimerRef = useRef(null);

  // Reset idle timer on activity
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    setIsIdle(false);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  }, []);

  // Set up idle detection
  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown'];

    const handleActivity = () => {
      resetIdleTimer();
    };

    // Start the timer
    resetIdleTimer();

    // Listen for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetIdleTimer]);

  // Auto-clear product after 30 seconds
  useEffect(() => {
    if (product) {
      const timer = setTimeout(() => {
        setProduct(null);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [product]);

  const handleScan = async (barcode) => {
    resetIdleTimer(); // Reset on scan
    try {
      setLoading(true);
      setError(null);
      setProduct(null);

      const result = await productService.searchByBarcode(barcode);
      setProduct(result);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Product not found: ${barcode}`);
      } else {
        setError('Failed to lookup product. Please try again.');
      }
      console.error('Barcode scan error:', err);
      throw err; // Re-throw for sound feedback
    } finally {
      setLoading(false);
    }
  };

  const scannerOptions = {
    ...(branding?.scannerSettings || {}),
    scanCooldown: 2000,
    preferBackCamera: true,
  };

  const {
    isScanning,
    isInitializing,
    isPaused,
    error: cameraError,
    startScanning,
    pauseScanning,
    resumeScanning,
    containerId,
  } = useCameraScanner(handleScan, scannerOptions);

  // Pause scanning when product is displayed or idle
  useEffect(() => {
    if (product || error || isIdle) {
      pauseScanning();
    }
  }, [product, error, isIdle, pauseScanning]);

  const clearResults = () => {
    setProduct(null);
    setError(null);
    resumeScanning();
  };

  const handleAttractTap = () => {
    setIsIdle(false);
    resetIdleTimer();
    resumeScanning();
    // Restart camera if it's not scanning
    if (!isScanning) {
      startScanning();
    }
  };

  // Show attract screen when idle
  if (isIdle) {
    return <AttractScreen onTap={handleAttractTap} />;
  }

  return (
    <div className="scanner-container">
      <div className="scanner-layout">
        {/* Logo */}
        <div className="scanner-logo">
          <img
            src="/logo.png"
            alt="The Front Logo"
            style={{
              height: '220px',
              width: 'auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.85
            }}
          />
        </div>

        {/* Scanner Card */}
        <div className="scanner-card">
          <div className="scanner-card-header">
            <h1 className="scanner-title">Price Checker</h1>
            <p className="scanner-subtitle">Scan barcode with camera</p>
          </div>

          <div className="scanner-card-body">
            {/* Camera Preview */}
            <CameraPreview
              containerId={containerId}
              isInitializing={isInitializing}
              isScanning={isScanning}
              isPaused={isPaused}
              error={cameraError}
              onStartCamera={startScanning}
            />

            <button
              onClick={clearResults}
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              Scan Another Item
            </button>

            {loading && (
              <div className="loading-overlay" style={{ marginTop: '1.5rem' }}>
                <span className="loading"></span>
                <span>Searching...</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '1.5rem', marginBottom: 0 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Product Display */}
        {product && (
          <ProductDisplay product={product} branding={branding} />
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
