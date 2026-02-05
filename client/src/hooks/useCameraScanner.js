import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useCameraScanner = (onScan, options = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(0);

  const scannerRef = useRef(null);
  const containerIdRef = useRef('camera-scanner-container');

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

  const handleScanSuccess = useCallback((decodedText) => {
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
    if (isScanning || isInitializing) return;

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

      setIsScanning(true);
    } catch (err) {
      console.error('Error starting camera:', err);

      let errorMessage = 'Failed to start camera';

      if (err.message?.includes('NotAllowedError') || err.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.message?.includes('NotFoundError') || err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.message?.includes('NotReadableError') || err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application.';
      }

      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [isScanning, isInitializing, getPreferredCamera, handleScanSuccess]);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current || !isScanning) return;

    try {
      await scannerRef.current.stop();
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
  }, [isScanning]);

  const toggleScanning = useCallback(async () => {
    if (isScanning) {
      await stopScanning();
    } else {
      await startScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

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
    error,
    startScanning,
    stopScanning,
    toggleScanning,
    containerId: containerIdRef.current,
  };
};
