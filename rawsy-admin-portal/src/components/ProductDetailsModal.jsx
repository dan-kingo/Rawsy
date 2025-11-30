import React, { useState } from 'react';
import './ProductDetailsModal.css';

function ProductDetailsModal({ product, onClose }) {
  const images = product.images || [];
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  const getImageGridClass = () => {
    const count = images.length;
    if (count === 1) return 'images-single';
    if (count === 2) return 'images-double';
    if (count === 3) return 'images-triple';
    if (count === 4) return 'images-quad';
    if (count === 5) return 'images-five';
    return 'images-grid';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="product-icon">
            {product.category ? product.category.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="header-content">
            <h2>{product.name}</h2>
            <p className="product-category">{product.category || 'Uncategorized'}</p>
          </div>
          <span className={`status-badge ${getStatusClass(product.status)}`}>
            {product.status}
          </span>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-icon">🏭</div>
              <div className="detail-content">
                <label>Supplier</label>
                <p>{product.supplier?.name || product.supplierName || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">💰</div>
              <div className="detail-content">
                <label>Price</label>
                <p className="price-highlight">${(product.price || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">🎯</div>
              <div className="detail-content">
                <label>Discount</label>
                <p className={product.discount?.active ? 'discount-highlight' : ''}>
                  {product.discount?.active ? `${product.discount.percentage}%` : 'No discount'}
                </p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">🤝</div>
              <div className="detail-content">
                <label>Negotiable</label>
                <p className={product.negotiable ? 'negotiable-yes' : 'negotiable-no'}>
                  {product.negotiable ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">📦</div>
              <div className="detail-content">
                <label>Stock</label>
                <p className="stock-highlight">{product.stock || 0} units</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon">💳</div>
              <div className="detail-content">
                <label>Payment Methods</label>
                <p>{product.paymentMethods?.length > 0 ? product.paymentMethods.join(', ') : 'N/A'}</p>
              </div>
            </div>
          </div>

          {images.length > 0 && (
            <div className="images-section">
              <h3>Product Images ({images.length}/5)</h3>
              <div className={`images-grid ${getImageGridClass()}`}>
                {images.map((image, index) => (
                  <div 
                    key={index} 
                    className="image-card"
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=Image+Error';
                      }}
                    />
                    <div className="image-overlay">
                      <span className="view-full-text">View Full</span>
                    </div>
                    <div className="image-counter">{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.description && (
            <div className="description-section">
              <h3>Description</h3>
              <div className="description-card">
                <p className="description-text">{product.description}</p>
              </div>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="specifications-section">
              <h3>Specifications</h3>
              <div className="specifications-grid">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="spec-card">
                    <div className="spec-item">
                      <span className="spec-key">{key}</span>
                      <span className="spec-value">{String(value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.status === 'rejected' && product.rejectionReason && (
            <div className="rejection-section">
              <h3>Rejection Reason</h3>
              <p className="rejection-text">{product.rejectionReason}</p>
            </div>
          )}

          <div className="meta-section">
            <h3>Product Information</h3>
            <div className="meta-grid">
              <div className="meta-item">
                <label>Created</label>
                <p>{new Date(product.createdAt).toLocaleString()}</p>
              </div>
              {product.updatedAt && (
                <div className="meta-item">
                  <label>Last Updated</label>
                  <p>{new Date(product.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-close-modal">
            Close
          </button>
        </div>
      </div>

      {/* Full screen image modal */}
      {selectedImage && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Full size product"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x600?text=Image+Error';
              }}
            />
            <button className="image-modal-close" onClick={closeImageModal}>
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'approved':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    case 'rejected':
      return 'badge-error';
    case 'flagged':
      return 'badge-danger';
    default:
      return 'badge-default';
  }
}

export default ProductDetailsModal;