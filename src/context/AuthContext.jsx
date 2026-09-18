import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('vaultflow_token');
      const storedUser = localStorage.getItem('vaultflow_user');

      if (storedToken) {
        setToken(storedToken);
        api.setAuthToken(storedToken);

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            setUser(null);
          }
        }

        // Verify with /api/auth/me in background
        try {
          const res = await api.getMe();
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('vaultflow_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.login({ email, password });
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
      api.setAuthToken(response.token);
      localStorage.setItem('vaultflow_token', response.token);
      localStorage.setItem('vaultflow_user', JSON.stringify(response.user));
      return response.user;
    }
    throw new Error(response.error || 'Login failed');
  };

  const register = async (name, email, password) => {
    const response = await api.register({ name, email, password });
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user);
      api.setAuthToken(response.token);
      localStorage.setItem('vaultflow_token', response.token);
      localStorage.setItem('vaultflow_user', JSON.stringify(response.user));
      return response.user;
    }
    throw new Error(response.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    api.setAuthToken(null);
    localStorage.removeItem('vaultflow_token');
    localStorage.removeItem('vaultflow_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
