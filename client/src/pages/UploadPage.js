import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadService } from '../services/api';

const UploadPage = ({ branding }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMapping, setShowMapping] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [columnMapping, setColumnMapping] = useState({
    barcode: -1,
    name: -1,
    price: -1,
    upc: -1,
    description: -1,
    cost: -1,
    category: -1,
    brand: -1,
    stock_quantity: -1,
    min_stock_level: -1,
    location: -1
  });

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
      setError('Please select an Excel file (.xlsx, .xls, or .xlsm)');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(25);
      setError(null);
      setUploadResult(null);
      setPreview(null);

      // First get preview of sheets
      const previewResult = await uploadService.previewExcel(file);
      console.log('Preview result:', previewResult);
      setPreview(previewResult);
      setSelectedFile(file);
      setUploadProgress(0);
      setUploading(false);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to preview file. Please try again.');
      console.error('Preview error:', err);
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    maxFiles: 1,
    maxSize: 30 * 1024 * 1024, // 30MB
    disabled: uploading
  });

  const handleUpload = async () => {
    console.log('handleUpload called, selectedFile:', selectedFile);
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const result = await uploadService.uploadExcel(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      setUploadResult(result);
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
    setShowMapping(false);
    setSelectedSheet(null);
    setColumnMapping({
      barcode: -1,
      name: -1,
      price: -1,
      upc: -1,
      description: -1,
      cost: -1,
      category: -1,
      brand: -1,
      stock_quantity: -1,
      min_stock_level: -1,
      location: -1
    });
  };

  const handleManualMapping = (sheet) => {
    console.log('handleManualMapping called with sheet:', sheet);
    setSelectedSheet(sheet);
    setShowMapping(true);
    // Pre-populate detected columns if available
    if (sheet.detectedColumns) {
      setColumnMapping(prev => ({
        ...prev,
        barcode: sheet.detectedColumns.barcode,
        name: sheet.detectedColumns.name,
        price: sheet.detectedColumns.price
      }));
    }
  };

  const handleMappingChange = (field, value) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: parseInt(value)
    }));
  };

  const handleUploadWithMapping = async () => {
    if (!selectedFile || !selectedSheet) return;

    // Validate required mappings
    if (columnMapping.barcode === -1 || columnMapping.name === -1 || columnMapping.price === -1) {
      setError('Please select columns for barcode, name, and price (required fields)');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const result = await uploadService.uploadExcelWithMapping(
        selectedFile,
        selectedSheet.name,
        columnMapping,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadResult(result);
      setPreview(null);
      setSelectedFile(null);
      setShowMapping(false);
      setSelectedSheet(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      console.error('Upload with mapping error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="upload-page">
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>Upload Excel File</h2>
          <p style={{ color: 'var(--text-muted)' }}>Import products and pricing from Excel spreadsheet</p>
        </div>

        <div className="card-body">
          {!uploading && !uploadResult && !preview && !showMapping && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
                ${isDragActive
                  ? 'border-primary-color bg-primary-light/10 scale-[1.02]'
                  : 'border-border-color hover:border-primary-color hover:bg-surface-color/50'
                }
                ${uploading ? 'cursor-not-allowed opacity-50' : ''}
              `}
              style={{
                borderColor: isDragActive ? 'var(--primary-color)' : 'var(--border-color)',
                backgroundColor: isDragActive ? 'rgb(99 102 241 / 0.05)' : undefined
              }}
            >
              <input {...getInputProps()} />

              <div className="mb-6">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.1 }}>
                  <svg className="h-10 w-10" style={{ color: 'var(--primary-color)' }} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {isDragActive ? (
                <p className="font-semibold text-lg" style={{ color: 'var(--primary-color)' }}>Drop the Excel file here...</p>
              ) : (
                <div>
                  <p className="font-semibold text-lg mb-3" style={{ color: 'var(--text-color)' }}>
                    Drag and drop an Excel file here, or click to browse
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Supports .xlsx, .xls, and .xlsm files (max 30MB)
                  </p>
                </div>
              )}
            </div>
          )}

          {uploading && (
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.1 }}>
                  <span className="loading" style={{ width: '2rem', height: '2rem' }}></span>
                </div>
                <p className="font-medium text-lg" style={{ color: 'var(--text-color)' }}>Uploading and processing file...</p>
              </div>

              <div className="w-full max-w-md mx-auto rounded-full h-2 mb-4" style={{ backgroundColor: 'var(--border-light)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, backgroundColor: 'var(--primary-color)' }}
                ></div>
              </div>

              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-4">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={resetUpload}
                  className="btn btn-outline btn-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {preview && !uploading && !showMapping && (
            <div className="space-y-6">
              <div className="alert alert-info">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-color)', opacity: 0.1 }}>
                      <svg className="w-4 h-4" style={{ color: 'var(--info-color)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">Found {preview.sheets.length} sheet(s) in "{preview.filename}"</span>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="btn btn-outline btn-sm"
                  >
                    Choose Different File
                  </button>
                </div>
              </div>

              <div className="grid gap-6">
                {preview.sheets.map((sheet, index) => (
                  <div key={index} className="card">
                    <div className="card-header">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: sheet.hasRequiredColumns ? 'var(--success-color)' : 'var(--warning-color)' }}></div>
                          <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>
                            "{sheet.name}"
                            {sheet.hasRequiredColumns && (
                              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--success-color)' }}>Compatible</span>
                            )}
                            {!sheet.hasRequiredColumns && (
                              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--warning-color)' }}>Missing required columns</span>
                            )}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                            {sheet.rowCount} rows
                          </div>
                          {!sheet.hasRequiredColumns && (
                            <button
                              onClick={() => handleManualMapping(sheet)}
                              className="btn btn-outline btn-sm"
                              disabled={uploading}
                            >
                              Manual Mapping
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="mb-4">
                        <h4 className="font-medium mb-3" style={{ color: 'var(--text-color)' }}>Columns found:</h4>
                        <div className="flex flex-wrap gap-2">
                          {sheet.headers.map((header, idx) => {
                            const isRequired = ['barcode', 'name', 'price'].includes(header.toLowerCase());
                            return (
                              <span
                                key={idx}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isRequired ? '' : ''
                                }`}
                                style={{
                                  backgroundColor: isRequired ? 'var(--success-color)' : 'var(--border-light)',
                                  color: isRequired ? 'white' : 'var(--text-muted)'
                                }}
                              >
                                {header}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {sheet.sampleData && sheet.sampleData.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3" style={{ color: 'var(--text-color)' }}>Sample data (first 3 rows):</h4>
                          <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-light)' }}>
                            <table className="w-full text-sm">
                              <thead style={{ backgroundColor: 'var(--background-color)' }}>
                                <tr>
                                  {sheet.headers.map((header, idx) => (
                                    <th key={idx} className="p-3 text-left font-medium" style={{ color: 'var(--text-color)', borderRight: idx < sheet.headers.length - 1 ? '1px solid var(--border-light)' : 'none' }}>{header}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sheet.sampleData.map((row, idx) => (
                                  <tr key={idx} style={{ borderTop: '1px solid var(--border-light)' }}>
                                    {row.map((cell, cellIdx) => (
                                      <td key={cellIdx} className="p-3" style={{ color: 'var(--text-secondary)', borderRight: cellIdx < row.length - 1 ? '1px solid var(--border-light)' : 'none' }}>{cell || '-'}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(() => {
                const hasCompatibleSheets = preview.sheets.some(s => s.hasRequiredColumns);
                console.log('Automatic upload button condition:', hasCompatibleSheets, preview.sheets);
                return hasCompatibleSheets;
              })() && (
                <div className="text-center p-6 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-light)' }}>
                  <div className="mb-4">
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'var(--success-color)', opacity: 0.1 }}>
                      <svg className="w-6 h-6" style={{ color: 'var(--success-color)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-color)' }}>Ready to Import</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                      Compatible sheets found. Only sheets with required columns (barcode, name, price) will be imported.
                    </p>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-primary btn-lg"
                  >
                    {uploading ? <span className="loading mr-2"></span> : null}
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Products
                  </button>
                </div>
              )}

              {!preview.sheets.some(s => s.hasRequiredColumns) && (
                <div className="alert alert-warning">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--warning-color)', opacity: 0.1 }}>
                      <svg className="w-4 h-4" style={{ color: 'var(--warning-color)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium mb-1">No compatible sheets found!</p>
                      <p className="text-sm">Make sure at least one sheet has columns named "barcode", "name", and "price", or use the "Manual Mapping" button to map columns manually.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {showMapping && selectedSheet && !uploading && (
            <div className="space-y-6">
              <div className="alert alert-info">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-color)', opacity: 0.1 }}>
                      <svg className="w-4 h-4" style={{ color: 'var(--info-color)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">Manual column mapping for sheet: "{selectedSheet.name}"</span>
                  </div>
                  <button
                    onClick={() => setShowMapping(false)}
                    className="btn btn-outline btn-sm"
                  >
                    Back to Preview
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>Select Column Mappings</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Choose which column corresponds to each field. Required fields must be mapped.</p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--error-color)' }}></div>
                        <h4 className="font-semibold" style={{ color: 'var(--text-color)' }}>Required Fields</h4>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Barcode/SKU <span className="text-error">*</span>
                        </label>
                        <select
                          value={columnMapping.barcode}
                          onChange={(e) => handleMappingChange('barcode', e.target.value)}
                          className="form-input"
                        >
                          <option value={-1}>-- Select Column --</option>
                          {selectedSheet.headers.map((header, index) => (
                            <option key={index} value={index}>
                              Column {index + 1}: {header}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Product Name <span className="text-error">*</span>
                        </label>
                        <select
                          value={columnMapping.name}
                          onChange={(e) => handleMappingChange('name', e.target.value)}
                          className="form-input"
                        >
                          <option value={-1}>-- Select Column --</option>
                          {selectedSheet.headers.map((header, index) => (
                            <option key={index} value={index}>
                              Column {index + 1}: {header}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Price <span className="text-error">*</span>
                        </label>
                        <select
                          value={columnMapping.price}
                          onChange={(e) => handleMappingChange('price', e.target.value)}
                          className="form-input"
                        >
                          <option value={-1}>-- Select Column --</option>
                          {selectedSheet.headers.map((header, index) => (
                            <option key={index} value={index}>
                              Column {index + 1}: {header}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }}></div>
                        <h4 className="font-semibold" style={{ color: 'var(--text-color)' }}>Optional Fields</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { key: 'upc', label: 'UPC Code' },
                          { key: 'description', label: 'Description' },
                          { key: 'cost', label: 'Cost' },
                          { key: 'category', label: 'Category' },
                          { key: 'brand', label: 'Brand' },
                          { key: 'stock_quantity', label: 'Stock Quantity' },
                          { key: 'min_stock_level', label: 'Min Stock Level' },
                          { key: 'location', label: 'Location' }
                        ].map(field => (
                          <div key={field.key} className="form-group">
                            <label className="form-label">{field.label}</label>
                            <select
                              value={columnMapping[field.key]}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className="form-input"
                            >
                              <option value={-1}>-- Not Used --</option>
                              {selectedSheet.headers.map((header, index) => (
                                <option key={index} value={index}>
                                  Column {index + 1}: {header}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {selectedSheet.sampleData && selectedSheet.sampleData.length > 0 && (
                    <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-light)' }}>
                      <h4 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Preview with your mapping:</h4>
                      <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-light)' }}>
                        <table className="w-full text-sm">
                          <thead style={{ backgroundColor: 'var(--surface-color)' }}>
                            <tr>
                              <th className="p-3 text-left font-medium" style={{ color: 'var(--text-color)', borderRight: '1px solid var(--border-light)' }}>Field</th>
                              <th className="p-3 text-left font-medium" style={{ color: 'var(--text-color)' }}>Sample Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { key: 'barcode', label: 'Barcode', required: true },
                              { key: 'name', label: 'Name', required: true },
                              { key: 'price', label: 'Price', required: true },
                              { key: 'upc', label: 'UPC' },
                              { key: 'description', label: 'Description' },
                              { key: 'cost', label: 'Cost' },
                              { key: 'category', label: 'Category' },
                              { key: 'brand', label: 'Brand' },
                              { key: 'stock_quantity', label: 'Stock Quantity' },
                              { key: 'min_stock_level', label: 'Min Stock Level' },
                              { key: 'location', label: 'Location' }
                            ].filter(field => columnMapping[field.key] !== -1 || field.required).map(field => (
                              <tr key={field.key} style={{ borderTop: '1px solid var(--border-light)' }}>
                                <td className="p-3 font-medium" style={{ color: 'var(--text-color)', borderRight: '1px solid var(--border-light)' }}>
                                  <div className="flex items-center gap-2">
                                    {field.required && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--error-color)' }}></div>}
                                    {field.label}
                                    {field.required && <span style={{ color: 'var(--error-color)' }}>*</span>}
                                  </div>
                                </td>
                                <td className="p-3" style={{ color: 'var(--text-secondary)' }}>
                                  {columnMapping[field.key] !== -1
                                    ? <span className="font-medium">{selectedSheet.sampleData[0]?.[columnMapping[field.key]] || '-'}</span>
                                    : <span style={{ color: 'var(--text-muted)' }}>Not mapped</span>
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-light)' }}>
                    <button
                      onClick={handleUploadWithMapping}
                      disabled={uploading || columnMapping.barcode === -1 || columnMapping.name === -1 || columnMapping.price === -1}
                      className="btn btn-primary btn-lg"
                    >
                      {uploading ? <span className="loading mr-2"></span> : null}
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Import Products with Custom Mapping
                    </button>
                    {(columnMapping.barcode === -1 || columnMapping.name === -1 || columnMapping.price === -1) && (
                      <p className="text-sm mt-3" style={{ color: 'var(--error-color)' }}>
                        Please map all required fields (barcode, name, price) before importing.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadResult && (
            <div className="space-y-6">
              <div className="alert alert-success">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-color)', opacity: 0.1 }}>
                      <svg className="w-4 h-4" style={{ color: 'var(--success-color)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-semibold">File processed successfully!</span>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="btn btn-primary btn-sm"
                  >
                    Upload Another
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold" style={{ color: 'var(--text-color)' }}>Import Summary</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-3 gap-6 text-center mb-6">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-light)' }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>{uploadResult.summary.totalRows}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Total Rows</div>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(34 197 94 / 0.05)', border: '1px solid var(--success-color)', borderOpacity: 0.2 }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--success-color)' }}>{uploadResult.summary.successful}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--success-color)' }}>Successful</div>
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(239 68 68 / 0.05)', border: '1px solid var(--error-color)', borderOpacity: 0.2 }}>
                      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--error-color)' }}>{uploadResult.summary.failed}</div>
                      <div className="text-sm font-medium" style={{ color: 'var(--error-color)' }}>Failed</div>
                    </div>
                  </div>

                  {uploadResult.summary.errors && uploadResult.summary.errors.length > 0 && (
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(239 68 68 / 0.05)', border: '1px solid var(--error-color)', borderOpacity: 0.2 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--error-color)', opacity: 0.1 }}>
                          <svg className="w-3 h-3" style={{ color: 'var(--error-color)' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="font-semibold" style={{ color: 'var(--error-color)' }}>Errors Found:</h4>
                      </div>
                      <ul className="space-y-2">
                        {uploadResult.summary.errors.map((error, index) => (
                          <li key={index} className="text-sm flex items-start gap-2" style={{ color: 'var(--error-color)' }}>
                            <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: 'var(--error-color)' }}></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--info-color)', opacity: 0.1 }}>
              <svg className="w-4 h-4" style={{ color: 'var(--info-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Excel Format Requirements</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--error-color)' }}></div>
                <h4 className="font-semibold" style={{ color: 'var(--text-color)' }}>Required Columns:</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-light)' }}>
                  <code className="px-2 py-1 rounded font-mono text-sm" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--primary-color)', border: '1px solid var(--border-light)' }}>barcode</code>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product barcode/SKU</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-light)' }}>
                  <code className="px-2 py-1 rounded font-mono text-sm" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--primary-color)', border: '1px solid var(--border-light)' }}>name</code>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Product name</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-light)' }}>
                  <code className="px-2 py-1 rounded font-mono text-sm" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--primary-color)', border: '1px solid var(--border-light)' }}>price</code>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Selling price</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }}></div>
                <h4 className="font-semibold" style={{ color: 'var(--text-color)' }}>Optional Columns:</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { code: 'upc', desc: 'UPC code' },
                  { code: 'description', desc: 'Product description' },
                  { code: 'cost', desc: 'Product cost' },
                  { code: 'category', desc: 'Product category' },
                  { code: 'brand', desc: 'Product brand' },
                  { code: 'stock_quantity', desc: 'Stock quantity', alt: 'stock' },
                  { code: 'min_stock_level', desc: 'Minimum stock level', alt: 'min_stock' },
                  { code: 'location', desc: 'Storage location' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded" style={{ backgroundColor: 'var(--background-color)' }}>
                    <code className="px-2 py-1 rounded font-mono text-xs" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                      {item.code}
                    </code>
                    {item.alt && (
                      <>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>or</span>
                        <code className="px-2 py-1 rounded font-mono text-xs" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}>
                          {item.alt}
                        </code>
                      </>
                    )}
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>- {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgb(59 130 246 / 0.05)', border: '1px solid var(--info-color)', borderOpacity: 0.2 }}>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--info-color)', opacity: 0.1 }}>
                  <svg className="w-3 h-3" style={{ color: 'var(--info-color)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--info-color)' }}>Important Notes:</p>
                  <ul className="text-sm space-y-1" style={{ color: 'var(--info-color)' }}>
                    <li>• The first row should contain column headers</li>
                    <li>• Products with duplicate barcodes will be updated with new information</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;