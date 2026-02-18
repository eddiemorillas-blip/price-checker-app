import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCameraScanner } from '../hooks/useCameraScanner';
import { productService } from '../services/api';
import ProductDisplay from './ProductDisplay';
import CameraPreview from './CameraPreview';
import CameraIndicator from './CameraIndicator';
import AttractScreen from './AttractScreen';

const IDLE_TIMEOUT = 60000; // 60 seconds

const BarcodeScanner = ({ branding }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isIdle, setIsIdle] = useState(false);

  const idleTimerRef = useRef(null);
  const hasResultRef = useRef(false);
  const wasIdleRef = useRef(false);
  const lastActiveTimeRef = useRef(Date.now());
  const watchdogRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Track if we have a result (for scan callback)
  hasResultRef.current = product || error || loading;

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
    // Ignore scans if already showing a result
    if (hasResultRef.current) return;

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
    stopScanning,
    restartScanning,
    containerId,
  } = useCameraScanner(handleScan, scannerOptions);

  // Keep camera running when active, stop when idle
  useEffect(() => {
    if (isIdle) {
      stopScanning();
      wasIdleRef.current = true;
    } else if (wasIdleRef.current) {
      // Only restart when waking from idle, not on initial mount
      wasIdleRef.current = false;
      restartScanning();
    } else {
      // Initial mount - just start normally
      startScanning();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIdle]);

  // Restart camera when waking from device sleep
  useEffect(() => {
    const fiveMinutes = 5 * 60 * 1000;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActiveTimeRef.current = Date.now();
      } else if (document.visibilityState === 'visible') {
        const sleepDuration = Date.now() - lastActiveTimeRef.current;

        if (sleepDuration > fiveMinutes) {
          window.location.reload();
          return;
        }

        if (!isIdle) {
          restartScanning();
        }
      }
    };

    // Watchdog timer for Guided Access mode where visibility events don't fire
    // Checks every second for time gaps indicating device was asleep
    const startWatchdog = () => {
      lastTickRef.current = Date.now();
      watchdogRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;
        lastTickRef.current = now;

        // If more than 5 minutes passed, reload the page
        if (elapsed > fiveMinutes) {
          window.location.reload();
          return;
        }

        // If 2-5 minutes passed, restart camera (short sleep)
        if (elapsed > 2000 && !isIdle) {
          restartScanning();
        }
      }, 1000);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startWatchdog();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIdle]);

  const clearResults = () => {
    setProduct(null);
    setError(null);
  };

  const handleAttractTap = () => {
    setIsIdle(false);
    resetIdleTimer();
  };

  // Show attract screen when idle
  if (isIdle) {
    return <AttractScreen onTap={handleAttractTap} />;
  }

  const hasResult = product || error || loading;

  return (
    <div className="scanner-container">
      {/* Camera position indicator */}
      {isScanning && !isPaused && <CameraIndicator />}

      <div className={`scanner-layout ${hasResult ? 'has-result' : 'scanner-only'}`}>
        {/* Scanner Card */}
        <div className="scanner-card">
          <div className="scanner-card-header">
            <h1 className="scanner-title">Price Checker</h1>
            <p className="scanner-subtitle">Scan a barcode to see pricing</p>
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

            {(product || error) && (
              <button
                onClick={clearResults}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                Scan Another Item
              </button>
            )}

            {loading && (
              <div className="loading-overlay" style={{ marginTop: '1.25rem' }}>
                <span className="loading"></span>
                <span>Looking up product...</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
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
