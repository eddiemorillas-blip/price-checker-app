import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useCameraScanner = (onScan, options = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(0);

  const scannerRef = useRef(null);
  const containerIdRef = useRef('camera-scanner-container');
  const isRestartingRef = useRef(false);
  const retryCountRef = useRef(0);
  const isScanningRef = useRef(false);
  const isInitializingRef = useRef(false);
  const maxRetries = 3;

  const {
    scanCooldown = 2000, // 2 second cooldown between scans
    preferBackCamera = true,
    successSound = true,
    errorSound = true,
  } = options;

  const playSound = useCallback((type) => {
    if (typeof Audio === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      if (type === 'success' && successSound) {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } else if (type === 'error' && errorSound) {
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }, [successSound, errorSound]);

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const handleScanSuccess = useCallback((decodedText) => {
    // Check if paused
    if (isPausedRef.current) {
      return;
    }

    const now = Date.now();

    // Cooldown check
    if (now - lastScanTime < scanCooldown) {
      return;
    }

    setLastScanTime(now);

    // Call the onScan callback
    const result = onScan(decodedText);

    // Handle promise for sound feedback
    if (result instanceof Promise) {
      result
        .then(() => playSound('success'))
        .catch(() => playSound('error'));
    } else {
      playSound('success');
    }
  }, [lastScanTime, scanCooldown, onScan, playSound]);

  const pauseScanning = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeScanning = useCallback(() => {
    setIsPaused(false);
    setLastScanTime(0); // Reset cooldown
  }, []);

  const getPreferredCamera = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();

      if (!devices || devices.length === 0) {
        throw new Error('No cameras found');
      }

      if (preferBackCamera) {
        // Look for back camera (environment facing)
        const backCamera = devices.find(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        );

        if (backCamera) {
          return backCamera.id;
        }
      }

      // Default to first camera if no back camera found
      return devices[0].id;
    } catch (err) {
      console.error('Error getting cameras:', err);
      throw err;
    }
  }, [preferBackCamera]);

  const startScanning = useCallback(async () => {
    // Use refs for guards to avoid stale closure issues during retries
    if (isScanningRef.current || isInitializingRef.current) return;

    isInitializingRef.current = true;
    setIsInitializing(true);
    setError(null);

    try {
      // Create scanner instance if not exists
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerIdRef.current);
      }

      const cameraId = await getPreferredCamera();

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        formatsToSupport: [
          0,  // QR_CODE
          1,  // AZTEC
          2,  // CODABAR
          3,  // CODE_39
          4,  // CODE_93
          5,  // CODE_128
          6,  // DATA_MATRIX
          7,  // MAXICODE
          8,  // ITF
          9,  // EAN_13
          10, // EAN_8
          11, // PDF_417
          12, // RSS_14
          13, // RSS_EXPANDED
          14, // UPC_A
          15, // UPC_E
          16, // UPC_EAN_EXTENSION
        ],
      };

      await scannerRef.current.start(
        cameraId,
        config,
        handleScanSuccess,
        () => {} // Ignore scan failures (no barcode in frame)
      );

      isScanningRef.current = true;
      setIsScanning(true);
      retryCountRef.current = 0;
    } catch (err) {
      console.error('Error starting camera:', err);

      // Check if we should retry (for transient errors after wake)
      const isTransientError =
        err.message?.includes('NotReadableError') ||
        err.name === 'NotReadableError' ||
        err.message?.includes('Could not start video source') ||
        err.message?.includes('Starting video source');

      if (isTransientError && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        const delay = retryCountRef.current * 1000;
        console.log(`Camera start failed, retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);

        // Clear container and scanner for retry
        const container = document.getElementById(containerIdRef.current);
        if (container) {
          container.innerHTML = '';
        }
        scannerRef.current = null;
        isInitializingRef.current = false;
        setIsInitializing(false);

        setTimeout(() => {
          isScanningRef.current = false;
          isInitializingRef.current = false;
          setIsScanning(false);
          setIsInitializing(false);
          startScanning();
        }, delay);
        return;
      }

      let errorMessage = 'Failed to start camera';

      if (err.message?.includes('NotAllowedError') || err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.message?.includes('NotReadableError') || err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      }

      setError(errorMessage);
      retryCountRef.current = 0;
    } finally {
      isInitializingRef.current = false;
      setIsInitializing(false);
    }
  }, [getPreferredCamera, handleScanSuccess]);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
    } catch (err) {
      // Ignore errors - scanner may already be stopped
    }
    isScanningRef.current = false;
    setIsScanning(false);
  }, []);

  const toggleScanning = useCallback(async () => {
    if (isScanning) {
      await stopScanning();
    } else {
      await startScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Check if camera video stream is actually working
  const isCameraWorking = useCallback(() => {
    const container = document.getElementById(containerIdRef.current);
    if (!container) return false;

    const video = container.querySelector('video');
    if (!video) return false;

    // Check if video has valid dimensions and is playing
    const hasValidStream = video.srcObject &&
      video.readyState >= 2 && // HAVE_CURRENT_DATA or better
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      !video.paused;

    return hasValidStream;
  }, []);

  // Force restart camera (for wake from sleep scenarios)
  const restartScanning = useCallback(async () => {
    // Prevent concurrent restart attempts
    if (isRestartingRef.current) {
      return;
    }

    // Check if camera is actually working - if so, don't restart
    if (isScanningRef.current && isCameraWorking()) {
      return;
    }

    isRestartingRef.current = true;
    retryCountRef.current = 0;

    // Force stop and destroy scanner instance
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // Ignore errors when stopping - scanner may already be in bad state
      }
      // Clear the instance so a fresh one is created
      scannerRef.current = null;
    }

    // Clear any stale video elements from the container
    const container = document.getElementById(containerIdRef.current);
    if (container) {
      container.innerHTML = '';
    }

    isScanningRef.current = false;
    isInitializingRef.current = false;
    setIsScanning(false);
    setIsInitializing(false);
    setError(null);

    // Longer delay for camera hardware to fully release after sleep
    setTimeout(() => {
      isRestartingRef.current = false;
      startScanning();
    }, 1500);
  }, [startScanning, isCameraWorking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return {
    isScanning,
    isInitializing,
    isPaused,
    error,
    startScanning,
    stopScanning,
    restartScanning,
    toggleScanning,
    pauseScanning,
    resumeScanning,
    containerId: containerIdRef.current,
  };
};
