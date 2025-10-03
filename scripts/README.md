# Inventory Sync Scripts

## sync-inventory-to-github.js

Automatically extracts products from your Inventory Database.xlsx and updates GitHub.

### Quick Start

```bash
# Run manually
node scripts/sync-inventory-to-github.js

# Or with npm
npm run sync-inventory
```

### What It Does

1. ✅ Reads `Inventory Database.xlsx`
2. ✅ Extracts products with barcode, name, price
3. ✅ Generates `products.csv`
4. ✅ Optionally pushes to GitHub

### Workflow Options

#### Option A: Manual Sync (Simplest)

1. Update your `Inventory Database.xlsx` as normal
2. Run: `node scripts/sync-inventory-to-github.js`
3. Upload the generated CSV to GitHub manually

#### Option B: Automated Push (Recommended)

1. Clone your GitHub repo locally
2. Edit script and set:
   ```javascript
   githubRepoPath: '/path/to/your/price-data',
   autoCommit: true
   ```
3. Run: `node scripts/sync-inventory-to-github.js`
4. Script automatically pushes to GitHub!

#### Option C: Scheduled Automation

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `node`
   - Arguments: `/home/emorillas/price-checker-app/scripts/sync-inventory-to-github.js`
5. Save

**Linux/Mac (cron):**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2am)
0 2 * * * cd /home/emorillas/price-checker-app && node scripts/sync-inventory-to-github.js
```

### Configuration

Edit the script's `CONFIG` section:

```javascript
const CONFIG = {
  // Path to your Excel file
  excelPath: '/mnt/c/Users/EddieMorillas/...',

  // Sheet name
  sheetName: 'rgpeedc89ef-7277-4f96-8de3-6632',

  // Where to save CSV
  outputCsvPath: '/home/emorillas/price-checker-app/github-upload/products.csv',

  // Git settings (optional)
  githubRepoPath: '', // Path to cloned repo
  autoCommit: false,  // Set true to auto-push
  commitMessage: 'Updated inventory'
};
```

### Complete Workflow Example

**Daily workflow:**
1. Staff adds new products to `Inventory Database.xlsx`
2. At 2am, scheduled script runs automatically
3. Script generates new CSV and pushes to GitHub
4. Price checker devices refresh at 6am (or when they restart)
5. New products appear on all devices!

### Troubleshooting

**Error: Cannot find file**
- Check the `excelPath` is correct
- Make sure Excel file is closed (not locked)

**Error: Sheet not found**
- Verify the sheet name in `sheetName`

**Git push failed**
- Make sure you've cloned the GitHub repo
- Set up SSH keys or use HTTPS with credentials
- Run `git config` to set username/email

### Manual Upload Alternative

If automated push doesn't work:
1. Run the script: `node scripts/sync-inventory-to-github.js`
2. Go to your GitHub repo
3. Click "Upload files"
4. Upload `github-upload/products.csv`
5. Commit changes

---

## Quick Commands

```bash
# Test the script
node scripts/sync-inventory-to-github.js

# Add to package.json scripts:
npm run sync-inventory
```
