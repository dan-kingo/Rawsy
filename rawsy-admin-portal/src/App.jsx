import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ProductModeration from './components/ProductModeration';
import PlatformAnalytics from './components/platformAnalytics';
import AdminSupportSystem from './components/supportSystem';
import ChangePasswordModal from './components/ChangePasswordModal';
import './App.css';
import { MdPeople, MdInventory, MdAnalytics, MdSupportAgent, MdLogout, MdSettings, MdChevronLeft, MdChevronRight } from 'react-icons/md';

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
      case 'users': return <MdPeople size={20} />;
      case 'products': return <MdInventory size={20} />;
      case 'analytics': return <MdAnalytics size={20} />;
      case 'support': return <MdSupportAgent size={20} />;
      default: return <MdSettings size={20} />;
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
            <div className="logo-icon">R</div>
            
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
            <span className="logo-icon">R</span>
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
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {['users', 'products', 'analytics', 'support'].map((tab) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              title={getTabTitle(tab)}
            >
              <span className="nav-icon">{getTabIcon(tab)}</span>
              {!sidebarCollapsed && (
                <span className="nav-label">{getTabTitle(tab)}</span>
              )}
              {activeTab === tab && !sidebarCollapsed && (
                <div className="active-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {adminUser?.companyName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="user-info">
                <span className="user-name">{adminUser?.companyName || 'Admin'}</span>
                <span className="user-role">Administrator</span>
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <button className="settings-btn" title="Settings" onClick={() => setShowChangePassword(true)}>
                <MdSettings size={18} color='#fff'/>
              </button>
            </div>
          </div>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="logout-icon"><MdLogout size={16} /></span>
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
            {/* <div className="quick-stats">
              <div className="stat-item">
                <span className="stat-value">24</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">156</span>
                <span className="stat-label">Today</span>
              </div>
            </div> */}
            <div className="header-actions">
              {/* header settings removed per design; settings remain in user card */}
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