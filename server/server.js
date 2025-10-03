const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');
const GitHubSyncService = require('./services/githubSync');

const app = express();
const PORT = process.env.PORT || 5000;

// GitHub sync configuration
const githubSync = new GitHubSyncService({
  repoOwner: process.env.GITHUB_REPO_OWNER || '',
  repoName: process.env.GITHUB_REPO_NAME || '',
  filePath: process.env.GITHUB_FILE_PATH || 'products.csv',
  branch: process.env.GITHUB_BRANCH || 'main',
  githubToken: process.env.GITHUB_TOKEN || ''
});

// Load products from GitHub on startup
async function loadProductsFromGitHub() {
  try {
    console.log('Loading products from GitHub...');
    const products = await githubSync.fetchProductsFromGitHub();
    const database = githubSync.productsToDatabase(products);
    uploadRoutes.setProductDatabase(database);
    console.log(`✅ Loaded ${products.length} products from GitHub`);
    return true;
  } catch (error) {
    console.error('❌ Failed to load from GitHub:', error.message);
    console.log('⚠️  Server will continue with existing product database');
    return false;
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Mount upload routes
app.use('/api/upload', uploadRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/products/search/:barcode', (req, res) => {
  let { barcode } = req.params;

  // Normalize barcode - remove spaces, leading zeros for flexible matching
  barcode = barcode.trim();

  // Get product database from upload routes
  const productDatabase = uploadRoutes.getProductDatabase();

  // Try exact match first
  let product = productDatabase[barcode];

  // If no exact match, try normalized matching
  if (!product) {
    const normalizedSearchBarcode = barcode.replace(/^0+/, ''); // Remove leading zeros

    for (const [key, value] of Object.entries(productDatabase)) {
      const normalizedDbBarcode = key.trim().replace(/^0+/, '');
      if (normalizedDbBarcode === normalizedSearchBarcode || key === barcode) {
        product = value;
        break;
      }
    }
  }

  if (!product) {
    console.log(`Product not found for barcode: "${barcode}". Database has ${Object.keys(productDatabase).length} products.`);
    return res.status(404).json({
      error: 'Product not found',
      barcode: barcode
    });
  }

  res.json({
    product: {
      ...product,
      stock_status: product.stock_quantity <= 10 ? 'low' : 'normal'
    },
    priceHistory: []
  });
});

app.get('/api/branding', (req, res) => {
  res.json({
    storeName: 'My Retail Store',
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter, system-ui, sans-serif',
    displaySettings: {
      showLogo: true,
      showStoreName: true,
      showStockLevels: true,
      showPriceHistory: false,
      compactMode: false
    },
    scannerSettings: {
      autoFocus: true,
      scanDelay: 500,
      successSound: true,
      errorSound: true
    }
  });
});

// Manual refresh endpoint
app.post('/api/products/refresh', async (req, res) => {
  try {
    const success = await loadProductsFromGitHub();
    if (success) {
      const productDatabase = uploadRoutes.getProductDatabase();
      res.json({
        success: true,
        message: 'Products refreshed from GitHub',
        productCount: Object.keys(productDatabase).length,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to refresh products from GitHub'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for API routes only (if we reach here in production, React app handles it)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Load products from GitHub on startup
  await loadProductsFromGitHub();

  // Setup cron job to refresh every 6 hours (0 */6 * * *)
  if (process.env.GITHUB_REPO_OWNER && process.env.GITHUB_REPO_NAME) {
    console.log('📅 Setting up auto-refresh: every 6 hours');
    cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ Auto-refresh triggered');
      await loadProductsFromGitHub();
    });
  } else {
    console.log('⚠️  GitHub not configured. Set GITHUB_REPO_OWNER and GITHUB_REPO_NAME in .env');
  }
});