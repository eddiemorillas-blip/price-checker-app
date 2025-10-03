const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 30 * 1024 * 1024 // 30MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept .xlsx, .xls, and .xlsm files
    const allowedTypes = ['.xlsx', '.xls', '.xlsm'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .xlsm) are allowed'));
    }
  }
});

const findColumnIndex = (headers, possibleNames) => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h =>
      h.toLowerCase().trim().replace(/[^a-z0-9]/g, '').includes(name.toLowerCase().replace(/[^a-z0-9]/g, ''))
    );
    if (index !== -1) return index;
  }
  return -1;
};

const parseExcelData = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);

    // Define flexible column mappings - many possible names for each field
    const columnMappings = {
      barcode: ['barcode', 'bar code', 'bar_code', 'sku', 'code', 'item code', 'itemcode', 'product code', 'productcode', 'upc', 'ean', 'gtin', 'item number', 'itemnumber', 'item_number', 'part number', 'partnumber', 'part_number'],
      name: ['name', 'product name', 'productname', 'product_name', 'title', 'description', 'item name', 'itemname', 'item_name', 'product', 'item', 'product title', 'producttitle', 'product_title'],
      price: ['price', 'cost', 'amount', 'value', 'retail price', 'retailprice', 'retail_price', 'sale price', 'saleprice', 'sale_price', 'selling price', 'sellingprice', 'selling_price', 'unit price', 'unitprice', 'unit_price', 'msrp', 'srp']
    };

    let foundSheet = null;
    let foundData = null;
    let foundHeaders = null;
    let columnIndexes = null;

    // Try to find a sheet with the required columns (flexible matching)
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      if (data.length < 2) continue; // Skip empty or single-row sheets

      const headers = data[0].map(h => h ? h.toString().trim() : '');

      // Try to find required columns with flexible matching
      const barcodeIndex = findColumnIndex(headers, columnMappings.barcode);
      const nameIndex = findColumnIndex(headers, columnMappings.name);
      const priceIndex = findColumnIndex(headers, columnMappings.price);

      if (barcodeIndex !== -1 && nameIndex !== -1 && priceIndex !== -1) {
        // Found a sheet with all required columns
        foundSheet = sheetName;
        foundData = data;
        foundHeaders = headers;
        columnIndexes = {
          barcode: barcodeIndex,
          name: nameIndex,
          price: priceIndex
        };
        break;
      }
    }

    if (!foundSheet) {
      // No automatic match found - return sheet info for manual mapping
      throw new Error('NO_AUTO_MATCH');
    }

    const headers = foundHeaders;
    const rows = foundData.slice(1);

    // Find optional columns with flexible matching
    const optionalMappings = {
      upc: ['upc', 'ean', 'gtin', 'universal product code', 'europeanarticlenumber', 'global trade item number'],
      description: ['description', 'desc', 'details', 'info', 'notes', 'comment', 'remarks', 'long description', 'longdescription', 'long_description'],
      cost: ['cost', 'wholesale', 'wholesale price', 'wholesaleprice', 'wholesale_price', 'buy price', 'buyprice', 'buy_price', 'purchase price', 'purchaseprice', 'purchase_price'],
      category: ['category', 'cat', 'type', 'group', 'department', 'dept', 'section', 'class', 'classification'],
      brand: ['brand', 'manufacturer', 'make', 'company', 'vendor', 'supplier', 'mfg', 'mfr'],
      stock_quantity: ['stock', 'qty', 'quantity', 'inventory', 'stock quantity', 'stockquantity', 'stock_quantity', 'on hand', 'onhand', 'on_hand', 'available', 'in stock', 'instock', 'in_stock'],
      min_stock_level: ['min stock', 'minstock', 'min_stock', 'minimum', 'reorder level', 'reorderlevel', 'reorder_level', 'min level', 'minlevel', 'min_level'],
      location: ['location', 'loc', 'position', 'aisle', 'bin', 'shelf', 'warehouse', 'store', 'section']
    };

    // Build complete column mapping
    const completeColumnMap = {
      barcode: columnIndexes.barcode,
      name: columnIndexes.name,
      price: columnIndexes.price,
      upc: findColumnIndex(headers, optionalMappings.upc),
      description: findColumnIndex(headers, optionalMappings.description),
      cost: findColumnIndex(headers, optionalMappings.cost),
      category: findColumnIndex(headers, optionalMappings.category),
      brand: findColumnIndex(headers, optionalMappings.brand),
      stock_quantity: findColumnIndex(headers, optionalMappings.stock_quantity),
      min_stock_level: findColumnIndex(headers, optionalMappings.min_stock_level),
      location: findColumnIndex(headers, optionalMappings.location)
    };

    return rows.map(row => ({
      barcode: row[completeColumnMap.barcode]?.toString().trim() || '',
      upc: completeColumnMap.upc !== -1 ? (row[completeColumnMap.upc]?.toString().trim() || '') : '',
      name: row[completeColumnMap.name]?.toString().trim() || '',
      description: completeColumnMap.description !== -1 ? (row[completeColumnMap.description]?.toString().trim() || '') : '',
      price: parseFloat(row[completeColumnMap.price]) || 0,
      cost: completeColumnMap.cost !== -1 ? (parseFloat(row[completeColumnMap.cost]) || 0) : 0,
      category: completeColumnMap.category !== -1 ? (row[completeColumnMap.category]?.toString().trim() || '') : '',
      brand: completeColumnMap.brand !== -1 ? (row[completeColumnMap.brand]?.toString().trim() || '') : '',
      stock_quantity: completeColumnMap.stock_quantity !== -1 ? (parseInt(row[completeColumnMap.stock_quantity]) || 0) : 0,
      min_stock_level: completeColumnMap.min_stock_level !== -1 ? (parseInt(row[completeColumnMap.min_stock_level]) || 0) : 0,
      location: completeColumnMap.location !== -1 ? (row[completeColumnMap.location]?.toString().trim() || '') : ''
    })).filter(item => item.barcode && item.name && item.price > 0);

  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

// In-memory storage for demo (replace with database later)
let productDatabase = {
  "1234567890123": {
    id: 1,
    barcode: "1234567890123",
    name: "Sample Product",
    price: 19.99,
    description: "This is a sample product for testing",
    category: "Electronics",
    stock_quantity: 50
  }
};

router.post('/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    try {
      let products;
      try {
        products = parseExcelData(filePath);
      } catch (parseError) {
        if (parseError.message === 'NO_AUTO_MATCH') {
          fs.unlinkSync(filePath);
          return res.status(400).json({
            error: 'Unable to automatically detect required columns. Please use manual column mapping.',
            code: 'NO_AUTO_MATCH'
          });
        }
        throw parseError;
      }

      if (products.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'No valid products found in Excel file'
        });
      }

      for (const [index, product] of products.entries()) {
        try {
          // Add to our in-memory database
          productDatabase[product.barcode] = {
            id: Object.keys(productDatabase).length + 1,
            ...product,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          successCount++;
        } catch (error) {
          failCount++;
          errors.push(`Row ${index + 2}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        message: 'File processed successfully',
        summary: {
          totalRows: products.length,
          successful: successCount,
          failed: failCount,
          errors: errors.slice(0, 10) // Only show first 10 errors
        }
      });

    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Excel upload error:', error);
    res.status(500).json({
      error: 'File processing failed',
      message: error.message
    });
  }
});

router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
      const workbook = xlsx.readFile(filePath);
      const sheets = workbook.SheetNames.map(name => {
        const worksheet = workbook.Sheets[name];
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = data.length > 0 ? data[0].map(h => h ? h.toString().trim() : '') : [];
        const rowCount = data.length - 1; // Subtract header row

        // Use flexible column matching for preview
        const columnMappings = {
          barcode: ['barcode', 'bar code', 'bar_code', 'sku', 'code', 'item code', 'itemcode', 'product code', 'productcode', 'upc', 'ean', 'gtin', 'item number', 'itemnumber', 'item_number', 'part number', 'partnumber', 'part_number'],
          name: ['name', 'product name', 'productname', 'product_name', 'title', 'description', 'item name', 'itemname', 'item_name', 'product', 'item', 'product title', 'producttitle', 'product_title'],
          price: ['price', 'cost', 'amount', 'value', 'retail price', 'retailprice', 'retail_price', 'sale price', 'saleprice', 'sale_price', 'selling price', 'sellingprice', 'selling_price', 'unit price', 'unitprice', 'unit_price', 'msrp', 'srp']
        };

        const barcodeIndex = findColumnIndex(headers, columnMappings.barcode);
        const nameIndex = findColumnIndex(headers, columnMappings.name);
        const priceIndex = findColumnIndex(headers, columnMappings.price);
        const hasRequiredColumns = barcodeIndex !== -1 && nameIndex !== -1 && priceIndex !== -1;

        return {
          name,
          headers,
          rowCount: rowCount > 0 ? rowCount : 0,
          hasRequiredColumns,
          sampleData: data.slice(1, 4), // First 3 data rows for preview
          detectedColumns: hasRequiredColumns ? {
            barcode: barcodeIndex,
            name: nameIndex,
            price: priceIndex
          } : null
        };
      });

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        filename: req.file.originalname,
        sheets
      });

    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Excel preview error:', error);
    res.status(500).json({
      error: 'File preview failed',
      message: error.message
    });
  }
});

router.post('/excel-with-mapping', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { sheetName, columnMapping } = req.body;

    if (!sheetName || !columnMapping) {
      return res.status(400).json({ error: 'Sheet name and column mapping are required' });
    }

    const mapping = JSON.parse(columnMapping);
    if (!mapping.barcode || !mapping.name || !mapping.price) {
      return res.status(400).json({ error: 'Barcode, name, and price column mappings are required' });
    }

    const filePath = req.file.path;
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    try {
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: `Sheet "${sheetName}" not found` });
      }

      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = data.length > 0 ? data[0] : [];
      const rows = data.slice(1);

      // Validate column indices
      const maxIndex = headers.length - 1;
      if (mapping.barcode > maxIndex || mapping.name > maxIndex || mapping.price > maxIndex) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Invalid column mapping: column index out of range' });
      }

      for (const [index, row] of rows.entries()) {
        try {
          const barcode = row[mapping.barcode]?.toString().trim();
          const name = row[mapping.name]?.toString().trim();
          const price = parseFloat(row[mapping.price]);

          if (!barcode || !name || isNaN(price) || price <= 0) {
            failCount++;
            errors.push(`Row ${index + 2}: Missing or invalid required data (barcode: "${barcode}", name: "${name}", price: ${price})`);
            continue;
          }

          // Build product object with manual mapping
          const product = {
            barcode,
            name,
            price,
            upc: mapping.upc !== undefined && mapping.upc !== -1 ? (row[mapping.upc]?.toString().trim() || '') : '',
            description: mapping.description !== undefined && mapping.description !== -1 ? (row[mapping.description]?.toString().trim() || '') : '',
            cost: mapping.cost !== undefined && mapping.cost !== -1 ? (parseFloat(row[mapping.cost]) || 0) : 0,
            category: mapping.category !== undefined && mapping.category !== -1 ? (row[mapping.category]?.toString().trim() || '') : '',
            brand: mapping.brand !== undefined && mapping.brand !== -1 ? (row[mapping.brand]?.toString().trim() || '') : '',
            stock_quantity: mapping.stock_quantity !== undefined && mapping.stock_quantity !== -1 ? (parseInt(row[mapping.stock_quantity]) || 0) : 0,
            min_stock_level: mapping.min_stock_level !== undefined && mapping.min_stock_level !== -1 ? (parseInt(row[mapping.min_stock_level]) || 0) : 0,
            location: mapping.location !== undefined && mapping.location !== -1 ? (row[mapping.location]?.toString().trim() || '') : ''
          };

          // Add to our in-memory database
          productDatabase[product.barcode] = {
            id: Object.keys(productDatabase).length + 1,
            ...product,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          successCount++;
        } catch (error) {
          failCount++;
          errors.push(`Row ${index + 2}: ${error.message}`);
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      res.json({
        message: 'File processed successfully with manual column mapping',
        summary: {
          totalRows: rows.length,
          successful: successCount,
          failed: failCount,
          errors: errors.slice(0, 10) // Only show first 10 errors
        }
      });

    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Manual mapping upload error:', error);
    res.status(500).json({
      error: 'File processing failed',
      message: error.message
    });
  }
});

router.get('/history', (req, res) => {
  // Mock upload history for demo
  res.json({
    imports: [
      {
        id: 1,
        filename: 'products.xlsx',
        imported_at: new Date().toISOString(),
        total_rows: Object.keys(productDatabase).length - 1, // Subtract sample product
        successful_rows: Object.keys(productDatabase).length - 1,
        failed_rows: 0,
        status: 'completed'
      }
    ]
  });
});

// Export the product database so other routes can access it
router.getProductDatabase = () => productDatabase;

// Allow setting the product database (for GitHub sync)
router.setProductDatabase = (newDatabase) => {
  productDatabase = newDatabase;
};

module.exports = router;