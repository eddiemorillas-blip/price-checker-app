# Price Checker iPad Setup Guide

Complete setup instructions for deploying Price Checker on iPad Mini kiosks.

---

## 1. Safari Camera Permission

1. Open **Settings**
2. Scroll down and tap **Safari**
3. Tap **Camera**
4. Select **Allow**

This grants Safari permanent camera access without prompts.

---

## 2. Disable Auto-Lock

1. Open **Settings**
2. Tap **Display & Brightness**
3. Tap **Auto-Lock**
4. Select **Never**

This keeps the screen on at all times.

---

## 3. Install the App to Home Screen

1. Open **Safari**
2. Go to: `https://price-checker-app-production.up.railway.app`
3. Tap the **Share** button (square with upward arrow)
4. Scroll down and tap **Add to Home Screen**
5. Tap **Add** in the top right

The app will now appear on your home screen and run in fullscreen mode.

---

## 4. Test the App

1. Open **Price Checker** from the home screen
2. Tap **Start Camera**
3. Point at a barcode to verify scanning works
4. Confirm the product information displays correctly

---

## 5. Set Up Guided Access

Guided Access locks the iPad to a single app, preventing users from exiting.

1. Open **Settings**
2. Tap **Accessibility**
3. Scroll down and tap **Guided Access**
4. Toggle **Guided Access** to **ON**
5. Tap **Passcode Settings**
6. Tap **Set Guided Access Passcode**
7. Enter a passcode (remember this for staff use!)
8. Confirm the passcode

---

## 6. Lock iPad to Price Checker

1. Open the **Price Checker** app from the home screen
2. **Triple-click** the Home button (or Side button on newer iPads)
3. The Guided Access screen will appear
4. Tap **Options** in the bottom left corner
5. Ensure **Touch** is set to **ON**
6. Tap **Done**
7. Tap **Start** in the top right corner

The iPad is now locked to the Price Checker app.

---

## Exiting Guided Access (Staff Only)

1. **Triple-click** the Home button (or Side button)
2. Enter the Guided Access passcode
3. Tap **End** in the top left corner

---

## App Features

| Feature | Description |
|---------|-------------|
| Camera Scanning | Point camera at any UPC/EAN barcode |
| Auto-pause | Scanning pauses when product is displayed |
| Scan Another Item | Tap button to scan the next product |
| Attract Screen | After 60 seconds idle, shows "Tap to Check Prices" |
| Audio Feedback | Beeps on successful scan or error |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Camera not working | Exit Guided Access, check Settings → Safari → Camera is set to Allow |
| Camera permission popup blocked | Grant permission before enabling Guided Access |
| Screen goes black/sleeps | Settings → Display & Brightness → Auto-Lock → Never |
| App not running fullscreen | Delete app from home screen and re-add it |
| Products not found | Check WiFi connection; verify barcode exists in inventory |
| App shows "Tap to Check Prices" | This is the idle screen - tap anywhere to return to scanner |
| Barcode won't scan | Move closer, adjust angle, ensure good lighting |

---

## Recommended iPad Settings Summary

| Setting | Location | Value |
|---------|----------|-------|
| Camera Access | Settings → Safari → Camera | Allow |
| Auto-Lock | Settings → Display & Brightness → Auto-Lock | Never |
| Guided Access | Settings → Accessibility → Guided Access | ON |
| Brightness | Settings → Display & Brightness | 80-100% |
| Volume | Side buttons | Medium-High (for scan beeps) |

---

## Quick Reference Card

For printing and posting near the kiosk:

```
PRICE CHECKER QUICK REFERENCE

To Check a Price:
1. Point camera at barcode
2. Hold steady until beep
3. View price on screen
4. Tap "Scan Another Item" for next product

If Screen Shows "Tap to Check Prices":
- Tap anywhere on screen

Need Help?
- Contact store manager
```

---

## Support

For technical issues, check the deployment logs at Railway or contact your system administrator.
