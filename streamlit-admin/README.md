# Price Checker Admin Portal

Streamlit app for managing product prices stored in GitHub.

## Quick Start

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Edit `app.py` and configure:
   - `GITHUB_REPO` - your GitHub username/repo
   - `GITHUB_TOKEN` - your GitHub personal access token
   - `ADMIN_PASSWORD` - password to access admin portal

3. Run locally:
```bash
streamlit run app.py
```

4. Deploy to Streamlit Cloud (free):
   - Push this folder to GitHub
   - Go to share.streamlit.io
   - Connect your repo
   - Add secrets in settings

## Features

- 📊 View and edit all products
- 🔍 Search products
- 💾 Save changes to GitHub
- 📤 Bulk CSV upload
- 🔒 Password protected
- ☁️ Free cloud hosting

## CSV Format

Required columns:
- `barcode`
- `name`
- `price`

Optional columns:
- `upc`, `description`, `cost`, `category`, `brand`, `stock_quantity`, `min_stock_level`, `location`
