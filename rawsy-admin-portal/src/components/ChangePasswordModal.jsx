import React, { useState } from 'react';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('New password must be different from old password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('authToken');
      
      const response = await fetch('https://rawsy.onrender.com/api/auth/me/change-password', {
        method: 'PUT', // Changed to PUT
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an unexpected response');
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to change password: ${response.status}`);
      }

      setSuccess('Password changed successfully!');
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="change-password-modal">
        <div className="modal-header">
          <h2>Change Password</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="oldPassword">Current Password</label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Enter your current password"
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password (min 6 characters)"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="password-requirements">
            <p className="requirements-title">Password Requirements:</p>
            <ul>
              <li className={formData.newPassword.length >= 6 ? 'met' : ''}>
                At least 6 characters long
              </li>
              <li className={formData.newPassword && formData.newPassword === formData.confirmPassword ? 'met' : ''}>
                Passwords match
              </li>
              <li className={formData.oldPassword && formData.oldPassword !== formData.newPassword ? 'met' : ''}>
                Different from current password
              </li>
            </ul>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner"></div>
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;