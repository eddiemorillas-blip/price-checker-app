# Retail Price Checker App

A complete web-based price checker system for retail stores with barcode scanning, Excel import, and customizable branding.

## Features

- **Barcode Scanner Integration**: Works with USB/wireless barcode scanners
- **Excel Import**: Upload product data from Excel spreadsheets
- **Product Management**: Search, view, and manage product inventory
- **Custom Branding**: Fully customizable store branding and theme
- **Real-time Search**: Instant product lookup by barcode/UPC
- **Price History**: Track price changes over time
- **Stock Management**: Monitor stock levels and low stock alerts
- **Responsive Design**: Works on desktops, tablets, and mobile devices

## Technology Stack

**Backend:**
- Node.js + Express
- MySQL database
- Excel parsing with SheetJS
- File upload with Multer
- API validation and security

**Frontend:**
- React 18
- CSS custom properties for theming
- Axios for API calls
- React Hot Toast for notifications
- React Dropzone for file uploads

## Prerequisites

- Node.js 16+ and npm
- MySQL 5.7+ or MariaDB
- A USB or wireless barcode scanner (optional for manual input)

## Installation

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd price-checker-app

# Install root dependencies
npm install

# Install server and client dependencies
npm run setup
```

### 2. Database Setup

```bash
# Create database
mysql -u root -p
CREATE DATABASE price_checker;
USE price_checker;

# Import schema
source database-schema.sql;
```

### 3. Environment Configuration

```bash
# Copy environment file
cp server/.env.example server/.env

# Edit the .env file with your settings
```

Required environment variables:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=price_checker
DB_USER=root
DB_PASSWORD=your_password
```

### 4. Start the Application

```bash
# Start both server and client in development mode
npm run dev

# Or start individually:
npm run server:dev  # Backend only (port 5000)
npm run client:dev  # Frontend only (port 3000)
```

The application will be available at `http://localhost:3000`

## Usage

### Basic Operation

1. **Start Scanner**: Click "Start Scanner" to activate barcode input
2. **Scan Products**: Use your barcode scanner to scan items
3. **View Results**: Product information appears automatically
4. **Manual Input**: Type barcodes manually if needed

### Excel Import

1. Go to the **Upload** page
2. Drag and drop or browse for Excel files (.xlsx/.xls/.xlsm)
3. Ensure your Excel file has the required columns:
   - `barcode` (required)
   - `name` (required)
   - `price` (required)
   - `upc`, `description`, `cost`, `category`, `brand`, `stock_quantity`, `location` (optional)

### Customization

1. Go to **Settings** page
2. Customize:
   - Store name and logo
   - Color theme
   - Display options
   - Scanner settings

## Barcode Scanner Setup

Most USB barcode scanners work as "keyboard wedge" devices:

1. **Connect Scanner**: Plug USB scanner into computer
2. **Test Input**: Scanner should type scanned barcodes into any text field
3. **Configure Scanner**: Set scanner to send "Enter" after each scan
4. **In App**: Use "Start Scanner" mode for automatic detection

### Recommended Scanner Settings
- Output mode: Keyboard HID
- Suffix: Carriage Return (Enter)
- Prefix: None
- Code types: Enable UPC, EAN, Code 128, Code 39

## API Endpoints

### Products
- `GET /api/products/search/:barcode` - Search by barcode
- `GET /api/products` - List products with pagination
- `PUT /api/products/:id` - Update product

### Upload
- `POST /api/upload/excel` - Upload Excel file
- `GET /api/upload/history` - Get upload history

### Branding
- `GET /api/branding` - Get branding settings
- `PUT /api/branding` - Update branding
- `POST /api/branding/reset` - Reset to defaults

## File Structure

```
price-checker-app/
├── server/                 # Backend API
│   ├── routes/            # API routes
│   ├── config/            # Database and configuration
│   ├── uploads/           # File upload directory
│   └── server.js          # Main server file
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API services
│   └── public/            # Static files
├── database-schema.sql     # Database schema
└── package.json           # Root package file
```

## Production Deployment

### Build for Production

```bash
# Build React app
npm run build

# Start production server
npm start
```

### Environment Variables

Set these additional variables for production:

```env
NODE_ENV=production
JWT_SECRET=your-strong-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Backup

```bash
# Backup database
mysqldump -u root -p price_checker > backup.sql

# Restore database
mysql -u root -p price_checker < backup.sql
```

## Troubleshooting

### Common Issues

1. **Scanner not working**: Check if scanner is in keyboard mode
2. **Database connection**: Verify MySQL credentials in .env
3. **File upload fails**: Check upload directory permissions
4. **Excel import errors**: Verify column headers match requirements

### Debug Mode

Start server with debug logging:
```bash
DEBUG=* npm run server:dev
```

### Support

- Check console logs for errors
- Verify network connectivity between frontend/backend
- Test barcode scanner in text editor first
- Ensure Excel file format matches requirements

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

This project is licensed under the MIT License.