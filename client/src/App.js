import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';

import Header from './components/Header';
import BarcodeScanner from './components/BarcodeScanner';
import UploadPage from './pages/UploadPage';

function App() {
  const [currentPage, setCurrentPage] = useState('scanner');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default branding
  const branding = {
    storeName: 'The Front',
    logoUrl: '/logo.png',
    displaySettings: {
      showStoreName: true,
      showLogo: false
    }
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'upload':
        return <UploadPage branding={branding} />;
      default:
        return <BarcodeScanner branding={branding} isFullscreen={isFullscreen} onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {!isFullscreen && (
        <Header
          branding={branding}
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      )}

      <main className={isFullscreen ? "" : "container py-2"}>
        {renderCurrentPage()}
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
}

export default App;