import React from 'react';
import './UserDetailsModal.css';
import { MdEmail, MdPhone, MdApartment, MdCheckCircle, MdDescription, MdClose } from 'react-icons/md';

function UserDetailsModal({ user, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="user-avatar">
            {user.companyName ? user.companyName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="header-content">
            <h2>{user.companyName || 'Guest'}</h2>
            <p className="user-role">{user.role || 'No role specified'}</p>
          </div>
          <span className={`status-badge ${getStatusClass(user.status)}`}>
            {user.status}
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <MdClose />
          </button>
        </div>

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-card">
              <div className="detail-icon"><MdEmail /></div>
              <div className="detail-content">
                <label>Email Address</label>
                <p>{user.email || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon"><MdPhone /></div>
              <div className="detail-content">
                <label>Phone Number</label>
                <p>{user.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon"><MdApartment /></div>
              <div className="detail-content">
                <label>Company</label>
                <p>{user.companyName || 'N/A'}</p>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-icon"><MdCheckCircle /></div>
              <div className="detail-content">
                <label>Verified Supplier</label>
                <p className={user.verifiedSupplier ? 'verified-yes' : 'verified-no'}>
                  {user.verifiedSupplier ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>
          </div>

          {user.verificationDocs && user.verificationDocs.length > 0 && (
            <div className="documents-section">
              <h3>Verification Documents</h3>
              <div className="documents-grid">
                {user.verificationDocs.map((doc, idx) => (
                    <div key={idx} className="document-card">
                    <div className="document-icon"><MdDescription /></div>
                    <div className="document-info">
                      <span className="document-name">
                        {doc.name || `Document ${idx + 1}`}
                      </span>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="view-link">
                        View Document
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="meta-section">
            <h3>Account Information</h3>
            <div className="meta-grid">
              <div className="meta-item">
                <label>Member Since</label>
                <p>{new Date(user.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              {user.updatedAt && (
                <div className="meta-item">
                  <label>Last Updated</label>
                  <p>{new Date(user.updatedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
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
    </div>
  );
}

function getStatusClass(status) {
  switch (status) {
    case 'active':
    case 'approved':
      return 'badge-success';
    case 'pending':
      return 'badge-warning';
    case 'suspended':
      return 'badge-danger';
    case 'rejected':
      return 'badge-error';
    case 'deactivated':
      return 'badge-default';
    default:
      return 'badge-default';
  }
}

export default UserDetailsModal;