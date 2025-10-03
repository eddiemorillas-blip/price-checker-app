import React from 'react';
import { Toaster } from 'react-hot-toast';

import BarcodeScanner from './components/BarcodeScanner';

function App() {
  // Default branding
  const branding = {
    storeName: 'The Front',
    logoUrl: '/logo.png',
    displaySettings: {
      showStoreName: true,
      showLogo: false
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <BarcodeScanner branding={branding} />
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