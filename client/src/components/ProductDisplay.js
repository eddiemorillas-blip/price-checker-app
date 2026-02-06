import React from 'react';

const ProductDisplay = ({ product }) => {
  if (!product?.product) return null;

  const { product: productData } = product;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  // Build details array for any available product info
  const details = [];
  if (productData.category) {
    details.push({ label: 'Category', value: productData.category });
  }
  if (productData.size) {
    details.push({ label: 'Size', value: productData.size });
  }
  if (productData.color) {
    details.push({ label: 'Color', value: productData.color });
  }
  if (productData.barcode) {
    details.push({ label: 'SKU', value: productData.barcode });
  }

  return (
    <div className="product-card">
      {/* Header with brand and name */}
      <div className="product-header">
        {productData.brand && (
          <p className="product-brand">{productData.brand}</p>
        )}
        <h2 className="product-name">{productData.name}</h2>
      </div>

      {/* Body with price and details */}
      <div className="product-body">
        {/* Price Section */}
        <div className="product-price-section">
          <p className="product-price-label">Retail Price</p>
          <p className="product-price">{formatPrice(productData.price)}</p>
        </div>

        {/* Product Details */}
        {details.length > 0 && (
          <div className="product-details">
            {details.map((detail, index) => (
              <div key={index} className="product-detail-row">
                <span className="product-detail-label">{detail.label}</span>
                <span className="product-detail-value">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;
