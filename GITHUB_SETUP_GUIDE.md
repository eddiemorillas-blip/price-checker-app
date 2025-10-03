# GitHub + Streamlit Setup Guide

This guide will help you set up centralized pricing management using GitHub and Streamlit.

## Overview

- **GitHub**: Stores your `products.csv` file (single source of truth)
- **Streamlit Admin**: Web interface to manage prices (free cloud hosting)
- **Price Checker Devices**: Auto-refresh from GitHub every 6 hours

---

## Step 1: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click "New repository"
3. Name it something like `price-data` or `store-products`
4. Make it **public** (easier) or **private** (requires token)
5. Click "Create repository"

## Step 2: Create products.csv

1. In your new repository, click "Add file" → "Create new file"
2. Name it `products.csv`
3. Add your product data in this format:

```csv
barcode,name,price,category,stock_quantity
1234567890123,Widget A,19.99,Electronics,50
9876543210987,Widget B,29.99,Electronics,25
5555555555555,Gadget C,39.99,Home,100
```

**Required columns:**
- `barcode` - Product barcode/SKU
- `name` - Product name
- `price` - Selling price

**Optional columns:**
- `upc`, `description`, `cost`, `category`, `brand`, `stock_quantity`, `min_stock_level`, `location`

4. Click "Commit new file"

## Step 3: Get GitHub Personal Access Token (Optional, for private repos)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name like "Price Checker"
4. Check the `repo` scope
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

## Step 4: Configure Your Price Checker Server

1. Navigate to `server/` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your GitHub info:
   ```
   GITHUB_REPO_OWNER=your-github-username
   GITHUB_REPO_NAME=price-data
   GITHUB_FILE_PATH=products.csv
   GITHUB_BRANCH=main
   GITHUB_TOKEN=your_token_here_if_private_repo
   ```

4. Restart your server

## Step 5: Set Up Streamlit Admin App

### Option A: Run Locally

1. Navigate to `streamlit-admin/` folder
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Edit `app.py` and configure:
   ```python
   GITHUB_REPO = "your-username/price-data"
   GITHUB_TOKEN = "your_token_here"
   ADMIN_PASSWORD = "your_secure_password"
   ```

4. Run the app:
   ```bash
   streamlit run app.py
   ```

5. Open http://localhost:8501

### Option B: Deploy to Streamlit Cloud (FREE)

1. Push the `streamlit-admin/` folder to your GitHub repo:
   ```bash
   git add streamlit-admin/
   git commit -m "Add Streamlit admin app"
   git push
   ```

2. Go to https://share.streamlit.io
3. Sign in with GitHub
4. Click "New app"
5. Select your repository
6. Set "Main file path" to `streamlit-admin/app.py`
7. Click "Advanced settings" and add secrets:
   ```
   GITHUB_TOKEN = "your_token_here"
   ADMIN_PASSWORD = "your_password_here"
   ```
8. Click "Deploy"

Your admin portal will be live at: `https://your-app.streamlit.app`

## Step 6: How It Works

### Daily Workflow:

1. **Admin opens Streamlit app**
2. **Edit prices** or upload new CSV
3. **Click "Save to GitHub"**
4. Changes are committed to GitHub

### Price Checker Devices:

- **On startup**: Load prices from GitHub
- **Every 6 hours**: Auto-refresh from GitHub
- **Manual refresh**: POST to `/api/products/refresh`

---

## Testing

### Test GitHub Sync:

```bash
# Test fetching from GitHub
curl http://localhost:5000/api/products/refresh -X POST

# Search for a product
curl http://localhost:5000/api/products/search/1234567890123
```

### Test Streamlit Admin:

1. Open Streamlit app
2. Login with your password
3. View products
4. Edit a price
5. Click "Save to GitHub"
6. Check your GitHub repo - you should see the commit!

---

## Files to Upload to GitHub

For your **pricing data repository**, upload only:
- `products.csv` - Your product database

For your **price-checker-app repository** (optional), you can include:
- The entire `price-checker-app/` folder
- But add a `.gitignore` to exclude:
  - `node_modules/`
  - `server/.env`
  - `server/uploads/`
  - `.env`

---

## Troubleshooting

**Error: "GitHub fetch failed"**
- Check your `GITHUB_REPO_OWNER` and `GITHUB_REPO_NAME` in `.env`
- Make sure the repo is public OR you have a valid token
- Check that `products.csv` exists in the repo

**Error: "Could not load products from GitHub"**
- Verify your CSV has required columns: barcode, name, price
- Check CSV formatting (no missing commas, etc.)

**Streamlit: "GitHub API error"**
- Make sure you have a valid GitHub token
- Token needs `repo` permissions
- For public repos, token is optional

---

## Auto-Refresh Schedule

The server refreshes prices from GitHub:
- **On startup**
- **Every 6 hours** (at 12am, 6am, 12pm, 6pm)
- **Manual**: POST to `/api/products/refresh`

To change the schedule, edit `server/server.js`:
```javascript
// Current: every 6 hours
cron.schedule('0 */6 * * *', ...)

// Daily at midnight:
cron.schedule('0 0 * * *', ...)

// Every hour:
cron.schedule('0 * * * *', ...)
```

---

## Next Steps

1. ✅ Create GitHub repo with products.csv
2. ✅ Configure server/.env
3. ✅ Test GitHub sync
4. ✅ Set up Streamlit admin (local or cloud)
5. ✅ Test full workflow
6. 🎉 Manage prices from anywhere!
