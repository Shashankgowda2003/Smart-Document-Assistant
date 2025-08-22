import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { toast } from "react-toastify";

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await loginUser({ username, password });
      console.log("Login response:", response);
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        onLogin(response.data.user);
        toast.success("Login successful!");
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* 🔹 App Title Added */}
        <h1 className="text-center mb-4 fw-bold text-primary"
         style={{ whiteSpace: "nowrap" , marginLeft: "-30px" }}>
          Smart Document Assistant
        </h1>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <i className="fas fa-sign-in-alt"></i>
            </div>
            <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
            <p className="text-muted">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control modern-input"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
              <label htmlFor="username">
                <i className="fas fa-user me-2"></i>
                Username
              </label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control modern-input"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <label htmlFor="password">
                <i className="fas fa-lock me-2"></i>
                Password
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-auth-primary w-100 ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="text-muted mb-0">
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
