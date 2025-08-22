import React, { useState, useRef } from "react";
import { exportDocument, deleteDocument } from "../api";
import { toast } from "react-toastify";

const DocumentList = ({ docs, onUpdate }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null); 

  // Filter documents based on search term
  const filteredDocs = docs.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.analysis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to format date in IST
  const formatDateToIST = (dateString) => {
    try {
      const date = new Date(dateString);
      const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      const day = istTime.getDate().toString().padStart(2, '0');
      const month = (istTime.getMonth() + 1).toString().padStart(2, '0');
      const year = istTime.getFullYear();
      let hours = istTime.getHours();
      const minutes = istTime.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, '0');
      return `${day}-${month}-${year} at ${formattedHours}:${minutes} ${ampm} IST`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const handleExport = async (id, title) => {
    try {
      const res = await exportDocument(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title || 'document'}.txt`;
      link.click();
      toast.success("Document exported successfully!");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  const handleDelete = async (id, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${title || 'this document'}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDocument(id);
      toast.success("Document deleted successfully!");
      onUpdate();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete document");
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", file);
      // TODO: Call your upload API here
    }
  };

  return (
    <>
      <div className="documents-header mb-4">
        <h4 className="documents-title">Document Collection</h4>
        <div className="documents-count">
          <span className="badge bg-primary">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'Document' : 'Documents'}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section mb-4">
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control search-input"
              placeholder="Search documents by title or content..."
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
      </div>

      <div className="documents-subheader mb-4">
        <p className="documents-description">
          <i className="bi bi-stars me-2"></i>
          Explore your intelligent document repository for quick access and insights
        </p>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="no-documents">
          {searchTerm ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-search" style={{ fontSize: '3rem' }}></i>
              </div>
              <h5>No documents found</h5>
              <p style={{ color: 'black' }}>No documents match your search for "{searchTerm}". Try different keywords.</p>
              <button 
                className="btn btn-outline-primary"
                onClick={() => setSearchTerm("")}
                 style={{ color: 'white' }}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="bi bi-file-earmark-text"></i>
              </div>
              <p style={{ color: 'black' }}>No documents found</p>
              <small style={{ color: 'black' }}>Upload a document to get started</small>
              <button 
                className="btn btn-primary mt-3" 
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="bi bi-cloud-upload me-2"></i>
                Upload Now
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="document-grid">
          {filteredDocs.map((doc) => (
            <div 
              key={doc.doc_id} 
              className="document-card" 
              onMouseEnter={() => setHoveredCard(doc.doc_id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="card-body">
                <div className="document-icon">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <div className="document-date">
                  <i className="bi bi-clock me-1"></i>
                  {doc.upload_date 
                    ? formatDateToIST(doc.upload_date)
                    : "Unknown date"}
                </div>
                <h5 className="card-title">{doc.title || "Untitled Document"}</h5>

                {doc.extracted_text ? (
                  <div
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxHeight: "300px",
                      overflowY: "auto",
                      padding: "10px",
                      background: "#f9f9f9",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      marginTop: "10px"
                    }}
                  >
                    {doc.extracted_text}
                  </div>
                ) : (
                  <p className="text-muted">No text extracted</p>
                )}

                <div className={`document-actions ${hoveredCard === doc.doc_id ? 'visible' : ''}`}>
                  <button
                    className="btn btn-sm btn-primary action-btn export-btn"
                    onClick={() => handleExport(doc.doc_id, doc.title)}
                  >
                    <i className="bi bi-download me-1"></i> Export
                  </button>
                  <button
                    className="btn btn-sm btn-danger action-btn delete-btn ms-2"
                    onClick={() => handleDelete(doc.doc_id, doc.title)}
                  >
                    <i className="bi bi-trash me-1"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </>
  );
};

export default DocumentList;
