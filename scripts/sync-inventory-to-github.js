#!/usr/bin/env node

/**
 * Sync Inventory to GitHub
 *
 * This script:
 * 1. Reads your Inventory Database.xlsx
 * 2. Extracts products with barcode, name, and price
 * 3. Generates products.csv
 * 4. Commits and pushes to GitHub
 *
 * Usage:
 *   node sync-inventory-to-github.js
 *
 * Or schedule it to run automatically (e.g., daily at 2am):
 *   Windows Task Scheduler or cron job
 */

const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration - UPDATE THESE
const CONFIG = {
  excelPath: '/mnt/c/Users/EddieMorillas/The Front Climbing Club/Retail - Documents/Buying/Best Retail Workbooks Ever/Retail Tool Code/Price Checker App/Inventory Database.xlsx',
  sheetName: 'rgpeedc89ef-7277-4f96-8de3-6632',
  outputCsvPath: '/home/emorillas/price-checker-app/github-upload/products.csv',

  // GitHub settings (or leave empty to manually push)
  githubRepoPath: '/home/emorillas/price-data', // Path to cloned repo
  autoCommit: true,  // Automatically push to GitHub
  commitMessage: `Updated inventory - ${new Date().toISOString().split('T')[0]}`
};

function extractProducts() {
  console.log('📖 Reading Excel file...');
  const workbook = xlsx.readFile(CONFIG.excelPath);
  const sheet = workbook.Sheets[CONFIG.sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  console.log(`   Found ${data.length} rows`);

  const products = [];
  data.forEach(item => {
    const barcode = item.Barcode ? item.Barcode.toString().trim() : '';
    const name = item['Product Name'] ? item['Product Name'].toString().trim() : '';
    const price = parseFloat(item.Price) || 0;

    // Skip items without required fields
    if (!barcode || !name || price <= 0) return;

    // Build description from color and size
    const descParts = [];
    if (item.Color) descParts.push(item.Color);
    if (item.Size) descParts.push(item.Size);
    const description = descParts.join(' - ');

    products.push({
      barcode: barcode,
      name: name,
      price: price,
      category: (item.Account || '').toString().trim(),
      brand: (item.Vendor || '').toString().trim(),
      description: description,
      notes: (item.Notes || '').toString().trim()
    });
  });

  console.log(`✅ Extracted ${products.length} valid products`);
  return products;
}

function generateCSV(products) {
  console.log('📝 Generating CSV...');

  const csv = [
    'barcode,name,price,category,brand,description,notes',
    ...products.map(p =>
      [
        p.barcode,
        '"' + (p.name || '').replace(/"/g, '""') + '"',
        p.price,
        '"' + (p.category || '').replace(/"/g, '""') + '"',
        '"' + (p.brand || '').replace(/"/g, '""') + '"',
        '"' + (p.description || '').replace(/"/g, '""') + '"',
        '"' + (p.notes || '').replace(/"/g, '""') + '"'
      ].join(',')
    )
  ].join('\n');

  return csv;
}

function saveCsv(csv) {
  const dir = path.dirname(CONFIG.outputCsvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(CONFIG.outputCsvPath, csv);
  console.log(`💾 Saved to: ${CONFIG.outputCsvPath}`);
}

function pushToGitHub() {
  if (!CONFIG.autoCommit || !CONFIG.githubRepoPath) {
    console.log('\n⚠️  Auto-commit disabled. Manually push to GitHub or configure autoCommit.');
    return;
  }

  try {
    console.log('\n📤 Pushing to GitHub...');

    // Copy CSV to git repo
    const gitCsvPath = path.join(CONFIG.githubRepoPath, 'products.csv');
    fs.copyFileSync(CONFIG.outputCsvPath, gitCsvPath);

    // Git commands
    const commands = [
      `cd "${CONFIG.githubRepoPath}"`,
      'git add products.csv',
      `git commit -m "${CONFIG.commitMessage}"`,
      'git push'
    ];

    execSync(commands.join(' && '), { stdio: 'inherit' });
    console.log('✅ Pushed to GitHub successfully!');
  } catch (error) {
    console.error('❌ Error pushing to GitHub:', error.message);
    console.log('   You can manually push the file later.');
  }
}

function main() {
  console.log('🚀 Starting inventory sync...\n');

  try {
    const products = extractProducts();
    const csv = generateCSV(products);
    saveCsv(csv);
    pushToGitHub();

    console.log('\n✨ Sync completed successfully!');
    console.log(`   Total products: ${products.length}`);
    console.log(`   Timestamp: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { extractProducts, generateCSV };
