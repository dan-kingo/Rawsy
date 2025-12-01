import React, { useState, useEffect } from 'react';
import ProductDetailsModal from './ProductDetailsModal';
import './ProductModeration.css';

function ProductModeration() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingProductId, setRejectingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://rawsy.onrender.com/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.products || []);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      setActionLoading(productId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/products/review/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve product');
      }

      await fetchProducts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProduct = async (productId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(productId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/products/review/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject', reason: rejectionReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject product');
      }

      setRejectionReason('');
      setRejectingProductId(null);
      await fetchProducts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlagProduct = async (productId) => {
    try {
      setActionLoading(productId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/products/${productId}/flag`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flagged: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to flag product');
      }

      await fetchProducts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
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
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      case 'flagged':
        return '🚩';
      default:
        return '📦';
    }
  };

  const filteredProducts = products.filter(product => {
    // Filter by status
    let statusMatch = true;
    if (filter === 'pending') statusMatch = product.status === 'pending';
    else if (filter === 'approved') statusMatch = product.status === 'approved';
    else if (filter === 'rejected') statusMatch = product.status === 'rejected';
    else if (filter === 'flagged') statusMatch = product.flagged === true;

    // Filter by search term
    const searchMatch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const openProductDetails = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const getFilterCount = (filterType) => {
    switch (filterType) {
      case 'all': return products.length;
      case 'pending': return products.filter(p => p.status === 'pending').length;
      case 'approved': return products.filter(p => p.status === 'approved').length;
      case 'rejected': return products.filter(p => p.status === 'rejected').length;
      case 'flagged': return products.filter(p => p.flagged === true).length;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="product-moderation">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-moderation">
      <div className="management-header">
        <div className="header-content">
          <h1>Product Moderation</h1>
          <p>Review and manage product submissions</p>
        </div>
        <button onClick={fetchProducts} className="refresh-button">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{products.length}</h3>
            <p>Total Products</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{getFilterCount('pending')}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{getFilterCount('approved')}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{getFilterCount('rejected')}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search products, suppliers, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="clear-search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-tabs">
          {['all', 'pending', 'approved', 'rejected', 'flagged'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              <span className="tab-label">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
              <span className="tab-count">{getFilterCount(tab)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Products ({filteredProducts.length})</h3>
          <div className="table-actions">
            <span className="results-count">
              Showing {filteredProducts.length} of {products.length} products
            </span>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No products found</h3>
            <p>
              {searchTerm 
                ? `No products match "${searchTerm}"`
                : `No ${filter === 'all' ? '' : filter + ' '}products found`
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
                className="clear-filters-btn"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="product-row">
                    <td>
                      <div className="product-info">
                        {product.images?.[0] && (
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            className="product-thumbnail"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="product-details">
                          <span className="product-name">{product.name || 'N/A'}</span>
                          {product.description && (
                            <span className="product-description">
                              {product.description.substring(0, 50)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="supplier-info">
                        <span className="supplier-name">
                          {product.supplier?.name || product.supplierName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">
                        {product.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(product.status)}`}>
                        <span className="status-icon">
                          {getStatusIcon(product.status)}
                        </span>
                        {product.status}
                        {product.flagged && <span className="flag-indicator"> 🚩</span>}
                      </span>
                    </td>
                    <td>
                      <span className="price-tag">
                        ${(product.price || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span className={`stock-indicator ${(product.stock || 0) > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {product.stock || 0} units
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openProductDetails(product)}
                          className="btn-view"
                          title="View details"
                        >
                          👁️ View
                        </button>

                        {product.status === 'pending' && (
                          <div className="moderation-actions">
                            <button
                              onClick={() => handleApproveProduct(product._id)}
                              disabled={actionLoading === product._id}
                              className="btn-approve"
                              title="Approve product"
                            >
                              {actionLoading === product._id ? '⏳' : '✅'} Approve
                            </button>

                            {rejectingProductId === product._id ? (
                              <div className="reject-form">
                                <textarea
                                  placeholder="Reason for rejection..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="reject-textarea"
                                  maxLength={500}
                                />
                                <div className="reject-actions">
                                  <span className="char-count">
                                    {rejectionReason.length}/500
                                  </span>
                                  <button
                                    onClick={() => handleRejectProduct(product._id)}
                                    disabled={actionLoading === product._id || !rejectionReason.trim()}
                                    className="btn-reject-confirm"
                                  >
                                    {actionLoading === product._id ? '⏳' : '❌'} Confirm
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRejectingProductId(null);
                                      setRejectionReason('');
                                    }}
                                    className="btn-reject-cancel"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRejectingProductId(product._id)}
                                className="btn-reject"
                                title="Reject product"
                              >
                                ❌ Reject
                              </button>
                            )}
                          </div>
                        )}

                        {!product.flagged && product.status !== 'rejected' && (
                          <button
                            onClick={() => handleFlagProduct(product._id)}
                            disabled={actionLoading === product._id}
                            className="btn-flag"
                            title="Flag product for review"
                          >
                            {actionLoading === product._id ? '⏳' : '🚩'} Flag
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default ProductModeration;