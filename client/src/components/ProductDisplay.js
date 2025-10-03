import React from 'react';

const ProductDisplay = ({ product }) => {
  if (!product?.product) return null;

  const { product: productData } = product;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="product-display">
      <div className="card" style={{ width: '320px', minHeight: '100%' }}>
        <div className="card-header">
          <div style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            {productData.brand && (
              <p style={{
                fontSize: '1rem',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                margin: 0
              }}>
                {productData.brand}
              </p>
            )}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-color)',
              lineHeight: '1.2',
              margin: 0
            }}>
              {productData.name}
            </h3>
            {productData.description && (
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                margin: 0
              }}>
                {productData.description}
              </p>
            )}
            <div style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              color: 'var(--primary-color)',
              marginTop: '0.5rem'
            }}>
              {formatPrice(productData.price)}
            </div>
            {productData.category && (
              <p style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                margin: 0
              }}>
                {productData.category}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDisplay;