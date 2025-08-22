import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { toast } from "react-toastify";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });

      console.log("Register response:", response);

      // If registration successful
      if (response.status === 201) {
        toast.success("Account created successfully! Please login.");
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(
        "Registration failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* 🔹 App Title */}
        <h1
          className="text-center mb-4 fw-bold text-primary"
          style={{ whiteSpace: "nowrap", marginLeft: "-30px" }}
        >
          Smart Document Assistant
        </h1>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <h2 className="fw-bold text-dark mb-2">Create Account</h2>
            <p className="text-muted">Join us to start managing your documents</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control modern-input"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="username">
                <i className="fas fa-user me-2"></i>
                Username
              </label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control modern-input"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <label htmlFor="email">
                <i className="fas fa-envelope me-2"></i>
                Email Address
              </label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control modern-input"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="6"
              />
              <label htmlFor="password">
                <i className="fas fa-lock me-2"></i>
                Password
              </label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control modern-input"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                minLength="6"
              />
              <label htmlFor="confirmPassword">
                <i className="fas fa-lock me-2"></i>
                Confirm Password
              </label>
            </div>

            <button
              type="submit"
              className={`btn btn-auth-primary w-100 ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p className="text-muted mb-0">
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
