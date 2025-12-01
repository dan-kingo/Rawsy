import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import UserDetailsModal from './UserDetailsModal.jsx';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');

      const response = await fetch('https://rawsy.onrender.com/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSupplier = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/supplier/approve/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve supplier');
      }

      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSupplier = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/supplier/reject/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject supplier');
      }

      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) {
      return;
    }

    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/auth/manufacturer/${userId}/suspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to suspend user');
      }

      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/auth/manufacturer/${userId}/unsuspend`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unsuspend user');
      }

      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user account? This action will prevent them from accessing the system.')) {
      return;
    }

    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/auth/manufacturer/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }

      await fetchUsers();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'suspended':
        return 'badge-danger';
      case 'rejected':
        return 'badge-error';
      case 'deactivated':
        return 'badge-deactivated';
      default:
        return 'badge-default';
    }
  };

  const handleVerifySupplier = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`https://rawsy.onrender.com/api/admin/supplier/verify/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify supplier');
      }

      await fetchUsers();
      alert('Supplier verified successfully');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'supplier') return user.role === 'supplier';
    if (filter === 'manufacturer') return user.role === 'manufacturer';
    if (filter === 'pending') return user.status === 'pending';
    if (filter === 'suspended') return user.status === 'suspended';
    return true;
  }).filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="management-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p>Manage and monitor all user accounts in the system</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button onClick={fetchUsers} className="refresh-button">
            <span className="refresh-icon">🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="dashboard-cards">
        <div className="stat-card">
          <div className="stat-icon total">👥</div>
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon supplier">🏭</div>
          <div className="stat-info">
            <h3>{users.filter(u => u.role === 'supplier').length}</h3>
            <p>Suppliers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon manufacturer">🏢</div>
          <div className="stat-info">
            <h3>{users.filter(u => u.role === 'manufacturer').length}</h3>
            <p>Manufacturers</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info">
            <h3>{users.filter(u => u.status === 'pending').length}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('all')}
          >
            All Users
            <span className="tab-count">{users.length}</span>
          </button>
          <button
            className={filter === 'supplier' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('supplier')}
          >
            Suppliers
            <span className="tab-count">{users.filter(u => u.role === 'supplier').length}</span>
          </button>
          <button
            className={filter === 'manufacturer' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('manufacturer')}
          >
            Manufacturers
            <span className="tab-count">{users.filter(u => u.role === 'manufacturer').length}</span>
          </button>
          <button
            className={filter === 'pending' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('pending')}
          >
            Pending Approval
            <span className="tab-count">{users.filter(u => u.status === 'pending').length}</span>
          </button>
          <button
            className={filter === 'suspended' ? 'filter-tab active' : 'filter-tab'}
            onClick={() => setFilter('suspended')}
          >
            Suspended
            <span className="tab-count">{users.filter(u => u.status === 'suspended').length}</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>User Accounts</h3>
          <span className="results-count">{filteredUsers.length} users found</span>
        </div>
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  <div className="no-data-content">
                    <span className="no-data-icon">👥</span>
                    <h4>No users found</h4>
                    <p>Try adjusting your search or filter criteria</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.name || 'N/A'}</span>
                        <span className="user-email">{user.email || 'N/A'}</span>
                        <span className="user-company">{user.companyName || 'No company'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => openUserModal(user)}
                        className="btn-view"
                        title="View user details"
                      >
                        <span className="btn-icon">👁</span>
                        Details
                      </button>

                      {user.role === 'supplier' && user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveSupplier(user._id)}
                            disabled={actionLoading === user._id}
                            className="btn-approve"
                            title="Approve supplier account"
                          >
                            {actionLoading === user._id ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>
                                <span className="btn-icon">✓</span>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRejectSupplier(user._id)}
                            disabled={actionLoading === user._id}
                            className="btn-reject"
                            title="Reject supplier application"
                          >
                            {actionLoading === user._id ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>
                                <span className="btn-icon">✕</span>
                                Reject
                              </>
                            )}
                          </button>
                        </>
                      )}

                      {user.role === 'manufacturer' && user.status !== 'deactivated' && (
                        <>
                          {user.status === 'suspended' ? (
                            <button
                              onClick={() => handleUnsuspendUser(user._id)}
                              disabled={actionLoading === user._id}
                              className="btn-unsuspend"
                              title="Reactivate manufacturer account"
                            >
                              {actionLoading === user._id ? (
                                <span className="loading-spinner"></span>
                              ) : (
                                <>↻ Unsuspend</>
                              )}
                            </button>
                          ) : user.status === 'active' && (
                            <button
                              onClick={() => handleSuspendUser(user._id)}
                              disabled={actionLoading === user._id}
                              className="btn-suspend"
                              title="Temporarily suspend manufacturer access"
                            >
                              {actionLoading === user._id ? (
                                <span className="loading-spinner"></span>
                              ) : (
                                <>⏸ Suspend</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={actionLoading === user._id}
                            className="btn-delete"
                            title="Permanently deactivate manufacturer account"
                          >
                            {actionLoading === user._id ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>🗑 Deactivate</>
                            )}
                          </button>
                        </>
                      )}

                      {user.role === 'supplier' && user.status !== 'pending' && user.status !== 'deactivated' && (
                        <>
                          {user.status === 'suspended' ? (
                            <button
                              onClick={() => handleUnsuspendUser(user._id)}
                              disabled={actionLoading === user._id}
                              className="btn-unsuspend"
                              title="Reactivate supplier account"
                            >
                              {actionLoading === user._id ? (
                                <span className="loading-spinner"></span>
                              ) : (
                                <>↻ Unsuspend</>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspendUser(user._id)}
                              disabled={actionLoading === user._id}
                              className="btn-suspend"
                              title="Temporarily suspend supplier access"
                            >
                              {actionLoading === user._id ? (
                                <span className="loading-spinner"></span>
                              ) : (
                                <>⏸ Suspend</>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            disabled={actionLoading === user._id}
                            className="btn-delete"
                            title="Permanently deactivate supplier account"
                          >
                            {actionLoading === user._id ? (
                              <span className="loading-spinner"></span>
                            ) : (
                              <>🗑 Deactivate</>
                            )}
                          </button>
                          {user.role === 'supplier' && user.status === 'approved' && (
                            <>
                              {user.verifiedSupplier ? (
                                <span className="verified-badge">✔ Verified</span>
                              ) : user.verificationDocs && user.verificationDocs.length > 0 ? (
                                <>
                                  <button
                                    onClick={() => window.open(user.verificationDocs[user.verificationDocs.length - 1].url, '_blank')}
                                    className="btn-view-doc"
                                    title="View latest verification document"
                                  >
                                    📄 View Doc
                                  </button>
                                  <button
                                    onClick={() => handleVerifySupplier(user._id)}
                                    disabled={actionLoading === user._id}
                                    className="btn-verify"
                                    title="Verify supplier account"
                                  >
                                    {actionLoading === user._id ? (
                                      <span className="loading-spinner"></span>
                                    ) : (
                                      <>✔ Verify</>
                                    )}
                                  </button>
                                </>
                              ) : (
                                <span className="no-docs-label">No document uploaded</span>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {user.status === 'deactivated' && (
                        <span className="deactivated-label">Account Deactivated</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={closeUserModal}
        />
      )}
    </div>
  );
}

export default UserManagement;