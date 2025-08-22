import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DocumentUploader from "../components/DocumentUploader";
import DocumentList from "../components/DocumentList";
import { getDocuments, getUserProfile, deleteCurrentUser } from "../api";
import { toast } from "react-toastify";

const Dashboard = ({ user, setUser, onLogout }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDocs();
  }, [user, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-profile-enhanced')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  const loadDocs = async () => {
    try {
      const res = await getDocuments();
      setDocs(res.data);
    } catch (err) {
      console.error("Error loading documents:", err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone and will delete all your documents."
    );
    if (!confirmDelete) return;

    const finalConfirm = window.confirm(
      "This is your final warning! All your data will be permanently lost. Do you really want to delete your account?"
    );
    if (!finalConfirm) return;

    try {
      await deleteCurrentUser();
      localStorage.removeItem('token');
      setUser(null);
      toast.success("Account deleted successfully");
      navigate('/login');
    } catch (err) {
      console.error("Delete account error:", err);
      toast.error("Failed to delete account: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-animation">
          <div className="loading-circle"></div>
          <div className="loading-circle"></div>
          <div className="loading-circle"></div>
        </div>
        <h4 className="mt-3 text-primary">Loading your workspace...</h4>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <nav className="navbar navbar-expand-lg">
          <div className="container-fluid">
            <div className="navbar-brand-enhanced">
              <div className="brand-logo">
                <div className="logo-circle">
                  <i className="fas fa-brain"></i>
                </div>
                <div className="logo-pulse"></div>
              </div>
              <div className="brand-text">
                <h3 className="brand-title">Smart Document AI</h3>
                <span className="brand-subtitle">Intelligent Assistant</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="nav-tabs-modern d-none d-lg-flex">
              <button 
                className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="fas fa-tachometer-alt me-2"></i>
                Overview
              </button>
              <button 
                className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                <i className="fas fa-cloud-upload-alt me-2"></i>
                Upload
              </button>
              <button 
                className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <i className="fas fa-folder-open me-2"></i>
                Documents
              </button>
            </div>

            {/* User Profile */}
            <div className="user-profile-enhanced" onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}>
              <div className="user-avatar-enhanced">
                <div className="avatar-circle">
                  <i className="fas fa-user"></i>
                </div>
                <div className="status-indicator online"></div>
              </div>
              <div className="user-details d-none d-md-block">
                <div className="user-name">{user?.username || user?.name || 'User'}</div>
                <div className="user-status">Online</div>
              </div>
              <i className={`fas fa-chevron-down dropdown-toggle ${showDropdown ? 'rotated' : ''}`}></i>
              
              {showDropdown && (
                <div className="dropdown-menu-enhanced">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="avatar-small">
                        <i className="fas fa-user"></i>
                      </div>
                      <div>
                        <div className="name">{user?.username || user?.name || 'User'}</div>
                        <div className="email">{user?.email || 'user@example.com'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item danger" onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    handleDeleteAccount();
                  }}>
                    <i className="fas fa-trash me-3"></i>
                    <span>Delete Account</span>
                  </div>
                  <div className="dropdown-item" onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onLogout();
                  }}>
                    <i className="fas fa-sign-out-alt me-3"></i>
                    <span>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="container-fluid">
          {/* Hero Section */}
          <div className="hero-section">
            <div className="hero-content">
              <div className="welcome-message">
                <h1 className="hero-title">
                  {getGreeting()}, <span className="text-gradient">{user?.username || user?.name || 'User'}</span>!
                </h1>
                <p className="hero-subtitle">
                  Ready to unlock the power of AI-driven document analysis? Let’s extract text from any image.
                </p>
              </div>
              <div className="hero-actions">
                <button 
                  className="btn btn-hero-primary"
                  onClick={() => setActiveTab('upload')}
                >
                  <i className="fas fa-plus me-2"></i>
                  Upload Document
                </button>
                <button 
                  className="btn btn-hero-secondary"
                  onClick={() => setActiveTab('documents')}
                >
                  <i className="fas fa-search me-2"></i>
                  Browse Files
                </button>
              </div>
            </div>
            <div className="hero-illustration">
              <div className="floating-elements">
                <div className="float-item item-1">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div className="float-item item-2">
                  <i className="fas fa-image"></i>
                </div>
                <div className="float-item item-3">
                  <i className="fas fa-brain"></i>
                </div>
                <div className="float-item item-4">
                  <i className="fas fa-magic"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content-section">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                {/* Quick Search */}
                <div className="quick-search-section mb-4">
                  <div className="content-card">
                    <div className="card-header">
                      <h5 className="card-title">
                        <i className="bi bi-search me-2 text-primary"></i>
                        Quick Document Search
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="search-container">
                        <div className="search-input-wrapper">
                          <i className="bi bi-search search-icon"></i>
                          <input
                            type="text"
                            className="form-control search-input"
                            placeholder="Search your documents by title or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          {searchTerm && (
                            <button
                              className="btn btn-sm clear-search"
                              onClick={() => setSearchTerm("")}
                              type="button"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {searchTerm && (
                        <div className="search-results-preview mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">
                              Found {docs.filter(doc =>
                                doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                doc.analysis?.toLowerCase().includes(searchTerm.toLowerCase())
                              ).length} document(s)
                            </small>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setActiveTab('documents')}
                            >
                              View All Results
                            </button>
                          </div>
                          <div className="search-preview-list">
                            {docs.filter(doc =>
                              doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              doc.analysis?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).slice(0, 3).map((doc) => (
                              <div key={doc.doc_id} className="search-result-item">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-file-earmark-text text-primary me-3"></i>
                                  <div className="flex-grow-1">
                                    <div className="fw-semibold">{doc.title || 'Untitled Document'}</div>
                                    <small className="text-muted">
                                      {doc.analysis ? doc.analysis.substring(0, 80) + '...' : 'No analysis available'}
                                    </small>
                                  </div>
                                  <button 
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => setActiveTab('documents')}
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* How to Use Section */}
                <div className="row g-4">
                  <div className="col-lg-8">
                    <div className="content-card">
                      <div className="card-header">
                        <h5 className="card-title">
                          <i className="fas fa-lightbulb me-2" style={{ color: '#FFD700' }}></i>
                          How to Use
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="how-to-use">
                          <ol className="list-group list-group-numbered">
                            <li className="list-group-item">
                              <strong>Upload:</strong> Go to the <em>Upload</em> tab and upload any image containing text.
                            </li>
                            <li className="list-group-item">
                              <strong>Extract:</strong> Our AI will automatically extract text from the uploaded file.
                            </li>
                            <li className="list-group-item">
                              <strong>Browse:</strong> Navigate to the <em>Documents</em> tab to view, search, and manage all your uploaded files.
                            </li>
                            <li className="list-group-item">
                              <strong>Search:</strong> Use the search bar in the dashboard to quickly find documents by title.
                            </li>
                            <li className="list-group-item">
                              <strong>Manage:</strong> You can delete documents, export results.
                            </li>
                          </ol>
                          <p className="mt-3 text-muted">
                            Tip: For best results, upload clear images with visible text.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions (unchanged) */}
                  <div className="col-lg-4">
                    <div className="content-card">
                      <div className="card-header">
                        <h5 className="card-title">
                          <i className="fas fa-bolt me-2 text-warning"></i>
                          Quick Actions
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="quick-actions">
                          <button className="quick-action-btn" onClick={() => setActiveTab('upload')}>
                            <i className="fas fa-upload"></i>
                            <span>Upload New</span>
                          </button>
                          <button className="quick-action-btn" onClick={() => setActiveTab('documents')}>
                            <i className="fas fa-folder"></i>
                            <span>View All</span>
                          </button>
                          <button className="quick-action-btn">
                            <i className="fas fa-download"></i>
                            <span>Export</span>
                          </button>
                          <button className="quick-action-btn">
                            <i className="fas fa-share"></i>
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="upload-tab">
                <DocumentUploader onUpload={loadDocs} />
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="documents-tab">
                <DocumentList docs={docs} onUpdate={loadDocs} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
