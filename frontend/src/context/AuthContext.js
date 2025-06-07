import React, { createContext, useState, useContext, useEffect } from 'react';
import { isAuthenticated, login, logout, signup as apiSignup } from '../services/api';

// Create the Authentication Context
const AuthContext = createContext();

// Custom hook for easy context usage
export const useAuth = () => useContext(AuthContext);

// AuthProvider component that wraps the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated();
      if (authenticated) {
        // For now, we just know they're logged in without details
        // In a real app, you might want to fetch user data here
        setUser({ isLoggedIn: true });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await login(credentials);
      setUser({ isLoggedIn: true, ...response.user });
      return true;
    } catch (err) {
      setError(err.message || 'Failed to log in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  // Signup function
  const handleSignup = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await apiSignup(userData);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Value object provided by context
  const value = {
    user,
    loading,
    error,
    login: handleLogin,
    logout: handleLogout,
    signup: handleSignup,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
