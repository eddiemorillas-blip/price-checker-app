# How to Keep Inventory Updated

## Overview

Your price checker pulls data from GitHub. Here are 3 ways to keep it updated:

---

## ⚡ Option 1: Quick Manual Sync (Easiest)

**When to use:** After adding new products to your Excel file

**Steps:**
1. Update `Inventory Database.xlsx` as usual
2. Run this command:
   ```bash
   npm run sync-inventory
   ```
3. Upload `github-upload/products.csv` to GitHub
4. Done! Devices will refresh within 6 hours

**Time:** 2 minutes

---

## 🤖 Option 2: Automated Script (Recommended)

**Setup once, never worry again!**

### Initial Setup:

1. **Clone your GitHub repo:**
   ```bash
   cd /home/emorillas
   git clone https://github.com/YOUR-USERNAME/price-data.git
   ```

2. **Configure the script:**
   Edit `scripts/sync-inventory-to-github.js`:
   ```javascript
   githubRepoPath: '/home/emorillas/price-data',
   autoCommit: true
   ```

3. **Test it:**
   ```bash
   npm run sync-inventory
   ```
   Should automatically push to GitHub!

### Daily Usage:

Just update your Excel file. Run when ready:
```bash
npm run sync-inventory
```

Script automatically:
- ✅ Extracts products
- ✅ Generates CSV
- ✅ Pushes to GitHub

---

## ⏰ Option 3: Scheduled Automation (Set & Forget)

**Runs automatically every day at 2am**

### Windows Setup (Task Scheduler):

1. Open "Task Scheduler"
2. Click "Create Basic Task"
3. Name: "Sync Inventory to GitHub"
4. Trigger: Daily, 2:00 AM
5. Action: "Start a program"
   - Program: `C:\Program Files\nodejs\node.exe`
   - Arguments: `C:\Users\EddieMorillas\price-checker-app\scripts\sync-inventory-to-github.js`
   - Start in: `C:\Users\EddieMorillas\price-checker-app`
6. Check "Open properties when finished"
7. Under "Settings":
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges

### WSL/Linux Setup:

```bash
# Edit crontab
crontab -e

# Add this line (daily at 2am)
0 2 * * * cd /home/emorillas/price-checker-app && npm run sync-inventory
```

### What Happens:
1. 2:00 AM - Script runs automatically
2. Extracts from Excel → Pushes to GitHub
3. 6:00 AM - Devices auto-refresh
4. New products appear on all screens!

---

## 📱 Option 4: Streamlit Admin Portal

Use the web interface to upload CSVs manually.

**When setup:**
1. Export products from Excel to CSV
2. Open Streamlit admin portal
3. Upload CSV file
4. Click "Save to GitHub"

See `streamlit-admin/README.md` for setup.

---

## 🔄 Complete Workflow Example

**Your typical day:**

### Morning:
- 8:00 AM - Receive new inventory
- 8:15 AM - Add products to `Inventory Database.xlsx`
- 8:20 AM - Run `npm run sync-inventory`
- ✅ Done! GitHub updated

### Automatically:
- 2:00 AM - Scheduled script runs
- 6:00 AM - All devices refresh
- New products live everywhere!

---

## 📊 What Gets Synced

From your `Inventory Database.xlsx`:

Required:
- ✅ Barcode
- ✅ Product Name
- ✅ Price (retail)

Optional:
- Category (Account)
- Brand (Vendor)
- Description (Color + Size)
- Notes

**Total products in current sync: 6,372**

---

## 🚨 Troubleshooting

**Script says "Cannot find file"**
- Check Excel file path in script
- Make sure Excel is closed

**Git push failed**
- Run `git config --global user.name "Your Name"`
- Run `git config --global user.email "your@email.com"`
- Make sure you've cloned the repo

**Products not appearing on devices**
- Check server logs: Is it fetching from GitHub?
- Verify `.env` has correct `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME`
- Manually refresh: `curl -X POST http://localhost:5000/api/products/refresh`

**Excel file is locked**
- Close Excel before running script
- Or use "Save As" to create a copy first

---

## 🎯 Recommended Setup

For daily operations:

1. ✅ Use **Option 2** (Automated Script) for immediate updates
2. ✅ Setup **Option 3** (Scheduled) as backup for overnight sync
3. ✅ Devices auto-refresh every 6 hours

This ensures:
- Immediate updates when you need them
- Automatic overnight sync catches anything missed
- All devices stay in sync

---

## Quick Commands

```bash
# Sync inventory now
npm run sync-inventory

# Check current products in price checker
curl http://localhost:5000/api/products/search/20220108301

# Force device refresh
curl -X POST http://localhost:5000/api/products/refresh
```
