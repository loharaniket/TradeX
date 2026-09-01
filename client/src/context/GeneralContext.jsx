import { createContext, useContext, useState } from 'react';
import axiosInstance from '../axiosInstance';

// Create the authentication and general app context
export const GeneralContext = createContext();

export const GeneralProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/users/login', { email, password });
      const data = response.data;

      // Save user and token to state and localStorage
      setUser(data);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      setLoading(false);
      return { success: true, user: data };
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  // Register function
  const register = async ({ name, email, password, contact }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/users/register', {
        name,
        email,
        password,
        contact,
      });
      const data = response.data;

      // Save user and token to state and localStorage
      setUser(data);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);

      setLoading(false);
      return { success: true, user: data };
    } catch (err) {
      setLoading(false);
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Refresh user profile and balance from backend
  const fetchProfile = async () => {
    if (!token) return;
    try {
      const response = await axiosInstance.get('/users/profile');
      const updatedData = { ...user, ...response.data };
      setUser(updatedData);
      localStorage.setItem('user', JSON.stringify(updatedData));
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  return (
    <GeneralContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        fetchProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

// Custom hook to consume the GeneralContext easily
export const useGeneralContext = () => useContext(GeneralContext);
