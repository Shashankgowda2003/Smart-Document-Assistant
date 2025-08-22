import axios from "axios";

const API_BASE = "http://127.0.0.1:5000/api";

// Create an axios instance with interceptors for JWT
const api = axios.create({
  baseURL: API_BASE
});

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log("Adding token to request:", config.url);
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log("Token prefix:", token.substring(0, 20) + "...");
    } else {
      console.log("No token found for request:", config.url);
    }
    return config;
  },
  error => Promise.reject(error)
);

// Auth endpoints
export const registerUser = (userData) =>
  axios.post(`${API_BASE}/auth/register`, {
    username: userData.username,
    password: userData.password,
    email: userData.email
  });

export const loginUser = (userData) =>
  axios.post(`${API_BASE}/auth/login`, {
    username: userData.username,
    password: userData.password
  });

export const getUserProfile = () => 
  api.get(`${API_BASE}/auth/profile`);

// Document endpoints
export const uploadDocument = (formData) =>
  api.post(`${API_BASE}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getDocuments = () =>
  api.get(`${API_BASE}/documents`);

export const getDocument = (docId) =>
  api.get(`${API_BASE}/document/${docId}`);

export const exportDocument = (docId) =>
  api.get(`${API_BASE}/export/${docId}`, {
    responseType: "blob",
  });

export const deleteDocument = (docId) =>
  api.delete(`${API_BASE}/document/${docId}`);

export const deleteCurrentUser = () => {
  console.log("Making delete account request to:", `/auth/delete_account`);
  return api.delete(`/auth/delete_account`);
};

// Helper function to set auth token
export const setAuthToken = (token) => {
  if (token) {
    console.log("Setting token in localStorage, token format check:");
    console.log("- Token length:", token.length);
    console.log("- Token start:", token.substring(0, 20));
    console.log("- Is string:", typeof token === 'string');
    
    // Make sure token is properly formatted
    localStorage.setItem('token', token);
  } else {
    console.log("Removing token from localStorage");
    localStorage.removeItem('token');
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// User management endpoints
export const getUsers = () =>
  api.get(`${API_BASE}/users`);

export const createUser = (username) =>
  api.post(`${API_BASE}/users`, { username });

export const deleteUser = (userId) =>
  api.delete(`${API_BASE}/users/${userId}`);
