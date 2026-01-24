const { BigQuery } = require('@google-cloud/bigquery');
const path = require('path');

class BigQuerySyncService {
  constructor(config) {
    this.projectId = config.projectId || 'front-data-production';
    this.keyFilename = config.keyFilename;
    this.productsTable = config.productsTable || 'dataform.products_all';
    this.inventoryTable = config.inventoryTable || 'dataform.INVENTORY_on_hand_report';

    this.bigquery = new BigQuery({
      projectId: this.projectId,
      keyFilename: this.keyFilename
    });
  }

  /**
   * Fetch products from BigQuery by joining products_all with inventory
   */
  async fetchProductsFromBigQuery() {
    try {
      console.log('Fetching products from BigQuery...');

      // Query that joins products with inventory data
      // Uses products_all for price/description and inventory for stock quantities
      const query = `
        SELECT
          p.BARCODE as barcode,
          p.DESCRIPTION as name,
          p.RETAIL_PRICE as price,
          p.DISP_CATEGORY as category,
          p.SIZE_DESC as size,
          p.COLOR_DESC as color,
          p.INACTIVE as inactive,
          COALESCE(i.vendor, '') as brand,
          COALESCE(i.cost, 0) as cost,
          COALESCE(i.on_hand_qty, 0) as stock_quantity,
          COALESCE(i.facility_name, '') as location,
          p.PREPARED_INTERNAL_NOTE as description
        FROM \`${this.projectId}.${this.productsTable}\` p
        LEFT JOIN \`${this.projectId}.${this.inventoryTable}\` i
          ON p.BARCODE = i.barcode
        WHERE p.BARCODE IS NOT NULL
          AND p.BARCODE != ''
          AND p.INACTIVE = 0
          AND CAST(p.RETAIL_PRICE AS FLOAT64) > 0
      `;

      const [rows] = await this.bigquery.query({ query });

      const products = rows.map(row => ({
        barcode: row.barcode?.toString().trim() || '',
        upc: row.barcode?.toString().trim() || '', // Use barcode as UPC if not available
        name: row.name?.toString().trim() || '',
        description: row.description?.toString().trim() || '',
        price: parseFloat(row.price) || 0,
        cost: parseFloat(row.cost) || 0,
        category: row.category?.toString().trim() || '',
        brand: row.brand?.toString().trim() || '',
        stock_quantity: parseInt(row.stock_quantity) || 0,
        min_stock_level: 0, // Not available in BigQuery tables
        location: row.location?.toString().trim() || '',
        size: row.size?.toString().trim() || '',
        color: row.color?.toString().trim() || ''
      }));

      console.log(`Successfully fetched ${products.length} products from BigQuery`);
      return products;
    } catch (error) {
      console.error('Error fetching from BigQuery:', error);
      throw error;
    }
  }

  /**
   * Search for a specific product by barcode
   */
  async searchByBarcode(barcode) {
    try {
      const query = `
        SELECT
          p.BARCODE as barcode,
          p.DESCRIPTION as name,
          p.RETAIL_PRICE as price,
          p.DISP_CATEGORY as category,
          p.SIZE_DESC as size,
          p.COLOR_DESC as color,
          COALESCE(i.vendor, '') as brand,
          COALESCE(i.cost, 0) as cost,
          COALESCE(i.on_hand_qty, 0) as stock_quantity,
          COALESCE(i.facility_name, '') as location,
          p.PREPARED_INTERNAL_NOTE as description
        FROM \`${this.projectId}.${this.productsTable}\` p
        LEFT JOIN \`${this.projectId}.${this.inventoryTable}\` i
          ON p.BARCODE = i.barcode
        WHERE p.BARCODE = @barcode
        LIMIT 1
      `;

      const options = {
        query,
        params: { barcode: barcode.toString() }
      };

      const [rows] = await this.bigquery.query(options);

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      return {
        barcode: row.barcode?.toString().trim() || '',
        upc: row.barcode?.toString().trim() || '',
        name: row.name?.toString().trim() || '',
        description: row.description?.toString().trim() || '',
        price: parseFloat(row.price) || 0,
        cost: parseFloat(row.cost) || 0,
        category: row.category?.toString().trim() || '',
        brand: row.brand?.toString().trim() || '',
        stock_quantity: parseInt(row.stock_quantity) || 0,
        min_stock_level: 0,
        location: row.location?.toString().trim() || '',
        size: row.size?.toString().trim() || '',
        color: row.color?.toString().trim() || ''
      };
    } catch (error) {
      console.error('Error searching BigQuery:', error);
      throw error;
    }
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

module.exports = BigQuerySyncService;
