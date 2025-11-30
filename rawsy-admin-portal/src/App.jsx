import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProductModeration from './components/ProductModeration';
import PlatformAnalytics from './components/platformAnalytics';
import AdminSupportSystem from './components/supportSystem';
import ChangePasswordModal from './components/ChangePasswordModal';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('adminUser');

    if (token && user) {
      setIsAuthenticated(true);
      setAdminUser(JSON.parse(user));
    }

    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    setIsAuthenticated(true);
    setAdminUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'users': return '👥';
      case 'products': return '📦';
      case 'analytics': return '📊';
      case 'support': return '🛟';
      default: return '📋';
    }
  };

  const getTabTitle = (tab) => {
    switch (tab) {
      case 'users': return 'User Management';
      case 'products': return 'Product Moderation';
      case 'analytics': return 'Platform Analytics';
      case 'support': return 'Help & Support';
      default: return 'Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="logo-loader">
            <div className="logo-icon">🚀</div>
            <h1>Rawsy Admin</h1>
          </div>
          <div className="spinner-large"></div>
          <p>Initializing Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🚀</span>
            {!sidebarCollapsed && (
              <div className="logo-text">
                <h2>Rawsy</h2>
                <span className="logo-subtitle">Admin Portal</span>
              </div>
            )}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {['users', 'products', 'analytics', 'support'].map((tab) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="nav-icon">{getTabIcon(tab)}</span>
              {!sidebarCollapsed && (
                <span className="nav-label">{getTabTitle(tab)}</span>
              )}
              {activeTab === tab && !sidebarCollapsed && (
                <div className="active-indicator"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{adminUser?.name || 'Admin'}</span>
                <span className="user-role">Administrator</span>
              </div>
            )}
          </div>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon">🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="app-content">
        <header className="app-header">
          <div className="header-left">
            <h1>{getTabTitle(activeTab)}</h1>
            <p className="page-description">
              {activeTab === 'users' && 'Manage platform users and permissions'}
              {activeTab === 'products' && 'Review and moderate product submissions'}
              {activeTab === 'analytics' && 'View platform insights and statistics'}
              {activeTab === 'support' && 'Manage FAQs and user support'}
            </p>
          </div>
          <div className="header-right">
            <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-value">24</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">156</span>
                <span className="stat-label">Today</span>
              </div>
            </div>
            <div className="header-actions">
              {/* Notification button removed */}
              <button 
                className="settings-btn" 
                title="Change Password"
                onClick={() => setShowChangePassword(true)}
              >
                ⚙️
              </button>
            </div>
          </div>
        </header>

        <main className="app-main">
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'products' && <ProductModeration />}
          {activeTab === 'analytics' && <PlatformAnalytics />}
          {activeTab === 'support' && <AdminSupportSystem />}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal 
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}

export default App;