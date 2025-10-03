import React, { useState, useEffect } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { productService } from '../services/api';
import ProductDisplay from './ProductDisplay';

const BarcodeScanner = ({ branding, isFullscreen, onToggleFullscreen }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      if (isCurrentlyFullscreen !== isFullscreen) {
        onToggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen, onToggleFullscreen]);

  // Auto-clear product after 30 seconds
  useEffect(() => {
    if (product) {
      const timer = setTimeout(() => {
        setProduct(null);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [product]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleScan = async (barcode) => {
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
    } finally {
      setLoading(false);
    }
  };

  const scannerOptions = branding?.scannerSettings || {};

  const {
    isListening,
    startListening,
    stopListening,
    manualScan,
    inputRef,
    handleInputChange,
  } = useBarcode(handleScan, scannerOptions);

  // Simple input change handler for manual typing and barcode scanners
  const handleInputChangeWithAutoSearch = (e) => {
    const value = e.target.value.trim();

    // Auto-search when we have enough characters (works for both manual typing and barcode scanners)
    if (value.length >= 6) {
      // Debounce the search to avoid too many requests
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        handleScan(value);
        // Clear the input after successful search
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 100); // Shorter delay for better UX
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const barcode = inputRef.current?.value?.trim();
    if (barcode) {
      manualScan(barcode);
    }
  };

  const clearResults = () => {
    setProduct(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="barcode-scanner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: product ? '375px 400px 400px' : '375px 400px', columnGap: '4rem', alignItems: 'center', justifyContent: 'center' }}>
        {/* Left side - Chair logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginRight: '2rem' }}>
          <img
            src="/logo.png"
            alt="The Front Logo"
            className="w-auto"
            style={{ height: '375px', filter: 'invert(1) brightness(1.2)' }}
          />
        </div>

        {/* Middle - Scanner card */}
        <div style={{ transform: 'scale(1.25)', transformOrigin: 'center center', width: '320px' }}>
          <div className="card" style={{ width: '320px' }}>
            <div className="card-header" style={{ padding: '1.5rem 2rem', position: 'relative' }}>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>Price Checker</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Scan a barcode or type manually below.
                </p>
              </div>
              <button
                onClick={toggleFullscreen}
                className="btn btn-outline btn-sm"
                style={{ position: 'absolute', top: '1rem', right: '1rem' }}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
              </button>
            </div>

            <div className="card-body" style={{ padding: '1.5rem 2rem' }}>
              <div className="mb-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="barcodeInput">
                    Barcode Input
                  </label>
                  <input
                    ref={inputRef}
                    id="barcodeInput"
                    type="text"
                    className="form-input large"
                    placeholder="Scan barcode here"
                    onChange={handleInputChangeWithAutoSearch}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="mb-3">
                <button
                  onClick={clearResults}
                  className="btn btn-outline"
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  Clear Results
                </button>
              </div>

              {loading && (
                <div className="alert alert-info text-center">
                  <span className="loading mr-2"></span>
                  Searching for product...
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Product display */}
        {product && (
          <div style={{ transform: 'scale(1.25)', transformOrigin: 'center center', width: '320px' }}>
            <ProductDisplay
              product={product}
              branding={branding}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default BarcodeScanner;