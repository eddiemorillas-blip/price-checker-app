import React from 'react';

const Header = ({ branding, currentPage, onNavigate }) => {
  if (!branding) return null;

  const { storeName, logoUrl, displaySettings } = branding;

  return (
    <header className="shadow-sm border-b sticky top-0 z-50" style={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)' }}>
      <div className="container">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            {displaySettings?.showLogo && logoUrl && (
              <img
                src={logoUrl}
                alt={`${storeName} Logo`}
                className="store-logo h-8 w-8"
                style={{ filter: 'invert(1) brightness(2)', mixBlendMode: 'screen' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            {displaySettings?.showStoreName !== false && (
              <div>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                  {storeName}
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Price Checker System
                </p>
              </div>
            )}
          </div>

          <nav className="flex gap-1">
            <button
              onClick={() => onNavigate('scanner')}
              className={`btn ${currentPage === 'scanner' ? 'btn-primary' : 'btn-outline'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Scanner
            </button>
            <button
              onClick={() => onNavigate('upload')}
              className={`btn ${currentPage === 'upload' ? 'btn-primary' : 'btn-outline'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;