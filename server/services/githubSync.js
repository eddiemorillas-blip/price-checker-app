const fetch = require('node-fetch');
const csvParser = require('csv-parser');
const { Readable } = require('stream');

class GitHubSyncService {
  constructor(config) {
    this.repoOwner = config.repoOwner;
    this.repoName = config.repoName;
    this.filePath = config.filePath || 'products.csv';
    this.branch = config.branch || 'main';
    this.githubToken = config.githubToken; // Optional
  }

  /**
   * Fetch the products.csv file from GitHub
   */
  async fetchProductsFromGitHub() {
    try {
      const url = `https://raw.githubusercontent.com/${this.repoOwner}/${this.repoName}/${this.branch}/${this.filePath}`;

      const headers = {};
      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }

      console.log(`Fetching products from: ${url}`);
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();
      const products = await this.parseCSV(csvText);

      console.log(`Successfully fetched ${products.length} products from GitHub`);
      return products;
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
      throw error;
    }
  }

  /**
   * Parse CSV text into product objects
   */
  async parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      const products = [];
      const stream = Readable.from([csvText]);

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          // Normalize and validate product data
          const product = {
            barcode: row.barcode?.toString().trim() || '',
            upc: row.upc?.toString().trim() || '',
            name: row.name?.toString().trim() || '',
            description: row.description?.toString().trim() || '',
            price: parseFloat(row.price) || 0,
            cost: parseFloat(row.cost) || 0,
            category: row.category?.toString().trim() || '',
            brand: row.brand?.toString().trim() || '',
            stock_quantity: parseInt(row.stock_quantity) || 0,
            min_stock_level: parseInt(row.min_stock_level) || 0,
            location: row.location?.toString().trim() || ''
          };

          // Only add if has required fields
          if (product.barcode && product.name && product.price > 0) {
            products.push(product);
          }
        })
        .on('end', () => {
          resolve(products);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Convert products array to database object (keyed by barcode)
   */
  productsToDatabase(products) {
    const database = {};
    products.forEach((product, index) => {
      database[product.barcode] = {
        id: index + 1,
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
    return database;
  }
}

module.exports = GitHubSyncService;
