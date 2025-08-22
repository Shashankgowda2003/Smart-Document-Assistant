import React, { useState } from "react";
import { uploadDocument } from "../api";
import { toast } from "react-toastify";

const DocumentUploader = ({ onUpload }) => {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.warn("Please choose a file before uploading.");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);

    try {
      console.log("Uploading document with formData:", {
        title: formData.get("title"),
        file: formData.get("file") ? formData.get("file").name : null
      });
      console.log("Token:", localStorage.getItem('token'));
      const response = await uploadDocument(formData);
      console.log("Upload response:", response);
      setTitle("");
      setFile(null);
      toast.success("Document uploaded successfully!");
      onUpload();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-section-modern">
      <div className="upload-card-modern">
        <div className="upload-header text-center mb-4">
          <div className="upload-icon-large mb-3">
            <i className="fas fa-cloud-upload-alt fa-3x text-primary"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Upload Your Documents</h3>
          <p className="text-muted mb-0">Transform your documents with AI-powered analysis</p>
        </div>

        <form className="upload-form-modern">
          <div className="row g-3">
            <div className="col-12">
              <div className="form-floating">
                <input
                  type="text"
                  className="form-control modern-input"
                  id="titleInput"
                  placeholder="Document title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading}
                />
                <label htmlFor="titleInput">
                  <i className="fas fa-file-signature me-2"></i>
                  Document Title (Optional)
                </label>
              </div>
            </div>

            <div className="col-12">
              <div className="file-upload-zone">
                <input
                  type="file"
                  id="fileInput"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0])}
                  disabled={isUploading}
                  style={{ display: 'none' }}
                />
                <label htmlFor="fileInput" className="file-drop-zone">
                  <div className="file-drop-content">
                    {file ? (
                      <>
                        <div className="file-success-icon mb-3">
                          <i className="fas fa-check-circle fa-3x text-success"></i>
                        </div>
                        <h5 className="text-success fw-bold">{file.name}</h5>
                        <p className="text-muted mb-0">File ready for upload</p>
                      </>
                    ) : (
                      <>
                        <div className="upload-animation mb-3">
                          <i className="fas fa-cloud-upload-alt fa-4x text-primary"></i>
                        </div>
                        <h5 className="fw-bold text-dark mb-2">
                          Drop your file here or <span className="text-primary">browse</span>
                        </h5>
                        <p className="text-muted mb-3">
                          Supports JPG, PNG • Maximum size 5MB
                        </p>
                        <div className="supported-formats">
                          <span className="format-badge">JPG</span>
                          <span className="format-badge">PNG</span>
                          <span className="format-badge">≤ 5MB</span>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="col-12 text-center">
              <button
                type="button"
                className={`btn btn-upload-modern ${isUploading ? 'uploading' : file ? 'ready' : 'disabled'}`}
                onClick={handleUpload}
                disabled={isUploading || !file}
              >
                {isUploading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket me-2"></i>
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploader;
