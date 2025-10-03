# Railway Deployment Guide

Your price checker app is now ready for deployment! Follow these steps:

## Step 1: Push to GitHub

1. Go to GitHub and create a new repository called `price-checker-app`
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

2. Copy the repository URL (should be something like `https://github.com/eddiemorillas-blip/price-checker-app.git`)

3. Run these commands from the `/home/emorillas/price-checker-app` directory:
   ```bash
   git remote add origin https://github.com/eddiemorillas-blip/price-checker-app.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Create Railway Account

1. Go to https://railway.app/
2. Click "Login" or "Start a New Project"
3. Sign up with your GitHub account
4. You'll get $5 in free credits (no credit card required initially)

## Step 3: Deploy to Railway

1. From your Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **`price-checker-app`** repository
4. Railway will automatically detect it's a Node.js app

## Step 4: Configure Environment Variables

In Railway, click on your project, then **"Variables"** tab and add:

```
NODE_ENV=production
GITHUB_REPO_OWNER=eddiemorillas-blip
GITHUB_REPO_NAME=price-data
GITHUB_FILE_PATH=products.csv
GITHUB_BRANCH=main
GITHUB_TOKEN=<your-github-token>
```

*(Use the same GitHub token you used before for the price-data repo)*

## Step 5: Deploy and Test

1. Railway will automatically build and deploy your app
2. Once deployed, Railway will give you a public URL like `https://price-checker-app-production.up.railway.app`
3. Click the URL to test your app!

## What Happens During Deployment

- Railway runs `npm install` to install all dependencies
- Railway runs `npm run build` which:
  - Installs server and client dependencies
  - Builds the React frontend
- Railway runs `npm start` to start the server
- The server serves the built React app on port 5000
- Your app loads products from GitHub on startup
- Products auto-refresh every 6 hours

## Accessing from Your Devices

Once deployed, you can access your price checker from any device by visiting the Railway URL:
- iPads
- Computers
- Phones
- Any device with a web browser

## Troubleshooting

### Build fails
- Check the build logs in Railway
- Make sure all dependencies are in package.json

### App loads but products not found
- Check environment variables in Railway
- Make sure GITHUB_TOKEN has access to the price-data repo

### App is slow or times out
- Check Railway logs for errors
- Make sure GitHub repo URL is correct

## Cost

- **Free tier**: $5/month credit (≈17-20 days of runtime)
- **After free credit**: ~$5-10/month depending on usage
- Can pause service when not in use to save credits

## Need Help?

Check Railway logs: Project → Deployments → View Logs
