import React, { useState, useEffect } from 'react';
import './AdminSupportSystem.css';
import {
  MdWarning,
  MdDescription,
  MdCampaign,
  MdApartment,
  MdCheckCircle,
  MdHourglassEmpty,
  MdInventory2,
  MdAttachMoney,
  MdTrendingUp,
  MdEdit,
  MdAdd,
  MdSave,
  MdMenuBook,
  MdVisibility,
  MdVisibilityOff,
  MdDelete,
  MdGroup,
  MdBusiness,
  MdClose,
  MdNotifications,
  MdNote,
  MdLightbulb,
  MdChat,
  MdSend
} from 'react-icons/md';

const AdminSupportSystem = () => {
  const [activeSection, setActiveSection] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // FAQ Form State
  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    tags: '',
    visible: true
  });
  const [editingFaq, setEditingFaq] = useState(null);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    targetRole: 'all'
  });

  // Fetch FAQs
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://rawsy.onrender.com/api/support/faq');
      const data = await response.json();
      if (response.ok) {
        setFaqs(data.faqs || []);
      } else {
        setError(data.error || 'Failed to fetch FAQs');
      }
    } catch (err) {
      setError('Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'faqs') {
      fetchFAQs();
    }
  }, [activeSection]);

  // FAQ Functions
  const createFAQ = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const tagsArray = faqForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch('https://rawsy.onrender.com/api/support/faq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...faqForm,
          tags: tagsArray
        })
      });

      const data = await response.json();
      if (response.ok) {
        setFaqForm({ question: '', answer: '', tags: '', visible: true });
        fetchFAQs();
        setError('');
      } else {
        setError(data.error || 'Failed to create FAQ');
      }
    } catch (err) {
      setError('Failed to create FAQ');
    } finally {
      setLoading(false);
    }
  };

  const updateFAQ = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const tagsArray = faqForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`https://rawsy.onrender.com/api/support/faq/${editingFaq._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...faqForm,
          tags: tagsArray
        })
      });

      const data = await response.json();
      if (response.ok) {
        setFaqForm({ question: '', answer: '', tags: '', visible: true });
        setEditingFaq(null);
        fetchFAQs();
        setError('');
      } else {
        setError(data.error || 'Failed to update FAQ');
      }
    } catch (err) {
      setError('Failed to update FAQ');
    } finally {
      setLoading(false);
    }
  };

  const deleteFAQ = async (id) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const response = await fetch(`https://rawsy.onrender.com/api/support/faq/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        fetchFAQs();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete FAQ');
      }
    } catch (err) {
      setError('Failed to delete FAQ');
    }
  };

  const startEditFAQ = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      tags: faq.tags?.join(', ') || '',
      visible: faq.visible
    });
  };

  const cancelEdit = () => {
    setEditingFaq(null);
    setFaqForm({ question: '', answer: '', tags: '', visible: true });
  };

  // Broadcast Function
  const sendBroadcast = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('https://rawsy.onrender.com/api/support/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(broadcastForm)
      });

      const data = await response.json();
      if (response.ok) {
        setBroadcastForm({ title: '', message: '', targetRole: 'all' });
        alert(`Broadcast sent successfully to ${data.recipients} users`);
        setError('');
      } else {
        setError(data.error || 'Failed to send broadcast');
      }
    } catch (err) {
      setError('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-support-system">
      <div className="support-header">
        <div className="header-content">
          <h1>Help & Support System</h1>
          <p>Manage FAQs and send broadcast notifications to platform users</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <MdWarning className="error-icon" />
            <span className="error-text">{error}</span>
          </div>
          <button onClick={() => setError('')} className="close-error" aria-label="Close error"><MdClose /></button>
        </div>
      )}

      <div className="support-nav">
        <button
          className={`nav-btn ${activeSection === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveSection('faqs')}
        >
          <MdDescription className="nav-icon" />
          <span className="nav-text">Manage FAQs</span>
          {faqs.length > 0 && <span className="nav-badge">{faqs.length}</span>}
        </button>
        <button
          className={`nav-btn ${activeSection === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveSection('broadcast')}
        >
          <MdCampaign className="nav-icon" />
          <span className="nav-text">Send Broadcast</span>
        </button>
      </div>

      <div className="support-content">
        {activeSection === 'faqs' && (
          <div className="faqs-section">
            <div className="section-header">
              <div className="section-title">
                <h2>FAQ Management</h2>
                <p>Create and manage frequently asked questions for users</p>
              </div>
              <div className="section-stats">
                <div className="stat-card">
                  <span className="stat-number">{faqs.length}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-card">
                  <span className="stat-number">{faqs.filter(f => f.visible).length}</span>
                  <span className="stat-label">Visible</span>
                </div>
              </div>
            </div>

            {/* FAQ Form */}
            <div className="form-container">
              <form className="faq-form" onSubmit={editingFaq ? updateFAQ : createFAQ}>
                <div className="form-header">
                  <h3>{editingFaq ? <><MdEdit /> Edit FAQ</> : <><MdAdd /> Create New FAQ</>}</h3>
                  {editingFaq && (
                    <button type="button" className="btn-cancel" onClick={cancelEdit}>
                      Cancel Edit
                    </button>
                  )}
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Question *</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="Enter the question that users frequently ask..."
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Answer *</label>
                    <textarea
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Provide a clear and detailed answer..."
                      rows="4"
                      required
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tags</label>
                    <input
                      type="text"
                      value={faqForm.tags}
                      onChange={(e) => setFaqForm({ ...faqForm, tags: e.target.value })}
                      placeholder="orders, payments, shipping, etc."
                      className="form-input"
                    />
                    <small className="form-hint">Separate tags with commas</small>
                  </div>

                  <div className="form-group">
                    <div className="checkbox-card">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={faqForm.visible}
                          onChange={(e) => setFaqForm({ ...faqForm, visible: e.target.checked })}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-text">Visible to users</span>
                      </label>
                      <small className="checkbox-hint">When unchecked, this FAQ will be hidden from users</small>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className={`btn-primary ${loading ? 'loading' : ''}`} 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        {editingFaq ? 'Updating FAQ...' : 'Creating FAQ...'}
                      </>
                    ) : (
                      editingFaq ? <><MdSave /> Update FAQ</> : <><MdAdd /> Create FAQ</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* FAQs List */}
            <div className="faqs-list">
              <div className="list-header">
                <h3>Existing FAQs</h3>
                <div className="list-controls">
                  <span className="results-count">Showing {faqs.length} FAQs</span>
                </div>
              </div>
              
              {faqs.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><MdMenuBook /></div>
                  <h4>No FAQs Created Yet</h4>
                  <p>Start by creating your first FAQ above to help users find answers to common questions.</p>
                </div>
              ) : (
                <div className="faqs-grid">
                  {faqs.map((faq) => (
                    <div key={faq._id} className={`faq-card ${!faq.visible ? 'hidden' : ''}`}>
                      <div className="faq-header">
                        <div className="faq-title">
                          <h4>{faq.question}</h4>
                          <span className={`visibility-badge ${faq.visible ? 'visible' : 'hidden'}`}>
                            {faq.visible ? <><MdVisibility /> Visible</> : <><MdVisibilityOff /> Hidden</>}
                          </span>
                        </div>
                      </div>
                      <p className="faq-answer">{faq.answer}</p>
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="faq-tags">
                          {faq.tags.map((tag, index) => (
                            <span key={index} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="faq-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => startEditFAQ(faq)}
                          title="Edit FAQ"
                        >
                          <MdEdit className="btn-icon" />
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => deleteFAQ(faq._id)}
                          title="Delete FAQ"
                        >
                          <MdDelete className="btn-icon" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'broadcast' && (
          <div className="broadcast-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Send Broadcast Notification</h2>
                <p>Send important announcements to platform users</p>
              </div>
            </div>

            <div className="broadcast-container">
              <form className="broadcast-form" onSubmit={sendBroadcast}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Target Audience *</label>
                    <div className="select-wrapper">
                      <select
                        value={broadcastForm.targetRole}
                        onChange={(e) => setBroadcastForm({ ...broadcastForm, targetRole: e.target.value })}
                        required
                        className="form-select"
                      >
                        <option value="all"><MdGroup /> All Users</option>
                        <option value="manufacturer"><MdApartment /> Manufacturers Only</option>
                        <option value="supplier"><MdBusiness /> Suppliers Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Notification Title *</label>
                    <input
                      type="text"
                      value={broadcastForm.title}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                      placeholder="Enter a clear and concise title for your notification..."
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Message *</label>
                    <textarea
                      value={broadcastForm.message}
                      onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                      placeholder="Write your broadcast message here. Be clear and informative..."
                      rows="6"
                      required
                      className="form-textarea"
                    />
                    <small className="form-hint">This message will be sent as a push notification to users' devices</small>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`btn-primary broadcast-btn ${loading ? 'loading' : ''}`} 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Sending Broadcast...
                    </>
                  ) : (
                    <>
                      <MdCampaign className="btn-icon" />
                      Send Broadcast Notification
                    </>
                  )}
                </button>
              </form>

              <div className="broadcast-info">
                <div className="info-header">
                  <MdLightbulb className="info-icon" />
                  <h4>Broadcast Guidelines</h4>
                </div>
                <div className="info-content">
                  <div className="info-item">
                    <MdNotifications className="item-icon" />
                    <span>Notifications will be sent as push notifications to users' devices</span>
                  </div>
                  <div className="info-item">
                    <MdNote className="item-icon" />
                    <span>Messages will also be saved in users' notification history</span>
                  </div>
                  <div className="info-item">
                    <MdWarning className="item-icon" />
                    <span>Choose target audience carefully - broadcast cannot be undone</span>
                  </div>
                  <div className="info-item">
                    <MdChat className="item-icon" />
                    <span>Keep messages clear, concise, and relevant to the target audience</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportSystem;