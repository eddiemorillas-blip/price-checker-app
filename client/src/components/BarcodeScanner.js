import React, { useState, useEffect } from 'react';
import { useBarcode } from '../hooks/useBarcode';
import { productService } from '../services/api';
import ProductDisplay from './ProductDisplay';

const BarcodeScanner = ({ branding }) => {
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

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

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
            <p className="scanner-subtitle">Scan or enter barcode</p>
          </div>

          <div className="scanner-card-body">
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="barcodeInput">
                Barcode
              </label>
              <input
                ref={inputRef}
                id="barcodeInput"
                type="text"
                className="form-input large"
                placeholder="Scan barcode here..."
                onChange={handleInputChangeWithAutoSearch}
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <button
              onClick={clearResults}
              className="btn btn-outline"
              disabled={loading}
              style={{ width: '100%' }}
            >
              Clear
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
