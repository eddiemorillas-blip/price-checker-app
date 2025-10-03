import { useState, useEffect, useRef, useCallback } from 'react';

export const useBarcode = (onScan, options = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const inputRef = useRef(null);
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef(null);

  const {
    minLength = 6,
    maxLength = 50,
    scanDelay = 500,
    autoFocus = true,
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

  const processScan = useCallback((barcode) => {
    if (!barcode || barcode.length < minLength || barcode.length > maxLength) {
      return;
    }

    if (barcode === lastScan) {
      return;
    }

    setLastScan(barcode);

    const scanResult = onScan(barcode);

    if (scanResult instanceof Promise) {
      scanResult
        .then(() => playSound('success'))
        .catch(() => playSound('error'));
    } else {
      playSound('success');
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [minLength, maxLength, lastScan, onScan, playSound]);

  const handleKeyDown = useCallback((event) => {
    if (!isListening) return;

    const char = event.key;

    if (char === 'Enter') {
      event.preventDefault();
      clearTimeout(scanTimeoutRef.current);

      if (scanBufferRef.current.length >= minLength) {
        processScan(scanBufferRef.current);
      }

      scanBufferRef.current = '';
      return;
    }

    if (char.length === 1 && /[\w-]/.test(char)) {
      event.preventDefault();
      scanBufferRef.current += char;

      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        if (scanBufferRef.current.length >= minLength) {
          processScan(scanBufferRef.current);
        }
        scanBufferRef.current = '';
      }, scanDelay);
    }
  }, [isListening, minLength, scanDelay, processScan]);

  const handleInputChange = useCallback((event) => {
    if (!isListening) return;

    const value = event.target.value;

    if (value.length >= minLength) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = setTimeout(() => {
        processScan(value);
      }, 100);
    }
  }, [isListening, minLength, processScan]);

  const startListening = useCallback(() => {
    setIsListening(true);
    scanBufferRef.current = '';

    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    clearTimeout(scanTimeoutRef.current);
    scanBufferRef.current = '';
  }, []);

  const manualScan = useCallback((barcode) => {
    if (barcode && barcode.trim()) {
      processScan(barcode.trim());
    }
  }, [processScan]);

  useEffect(() => {
    if (isListening) {
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(scanTimeoutRef.current);
      };
    }
  }, [isListening, handleKeyDown]);

  useEffect(() => {
    return () => {
      clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    manualScan,
    inputRef,
    handleInputChange,
    lastScan,
  };
};