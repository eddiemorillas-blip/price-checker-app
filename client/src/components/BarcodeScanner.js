import React, { useState, useEffect } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { productService } from '../services/api';
import ProductDisplay from './ProductDisplay';

const BarcodeScanner = ({ branding, isFullscreen, onToggleFullscreen }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


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
    // Simply toggle the fullscreen state without using browser fullscreen API
    // This works reliably across all devices including iPad
    onToggleFullscreen();
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
    inputRef,
  } = useBarcode(handleScan, scannerOptions);

  // Auto-focus input when entering fullscreen
  useEffect(() => {
    if (isFullscreen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFullscreen, inputRef]);

  // Simple input change handler for manual typing and barcode scanners
  const handleInputChangeWithAutoSearch = (e) => {
    const value = e.target.value.trim();

    // Debounce the search - wait for user to stop typing
    clearTimeout(window.searchTimeout);

    if (value.length >= 6) {
      window.searchTimeout = setTimeout(() => {
        handleScan(value);
        // Clear the input after search
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }, 500); // Wait 500ms after last keystroke
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
      <div style={{ display: 'grid', gridTemplateColumns: product ? '300px 350px 350px' : '300px 350px', columnGap: '2rem', alignItems: 'center', justifyContent: 'center' }}>
        {/* Left side - Chair logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <img
            src="/logo.png"
            alt="The Front Logo"
            className="w-auto"
            style={{ height: '300px', filter: 'invert(1) brightness(1.2)' }}
          />
        </div>

        {/* Middle - Scanner card */}
        <div style={{ transform: 'scale(1.1)', transformOrigin: 'center center', width: '320px' }}>
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
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  fontSize: '0.75rem',
                  padding: '0.5rem'
                }}
                title={isFullscreen ? "Show Header" : "Hide Header"}
              >
                {isFullscreen ? "Exit" : "Hide Header"}
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
          <div style={{ transform: 'scale(1.1)', transformOrigin: 'center center', width: '320px' }}>
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