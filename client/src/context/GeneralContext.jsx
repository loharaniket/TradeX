import { createContext, useContext, useState, useEffect } from 'react';
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

  // Virtual Wallet metrics state
  const [wallet, setWallet] = useState({
    availableBalance: user?.virtualBalance || 100000,
    investedAmount: 0,
    portfolioValue: 0,
    totalAccountValue: user?.virtualBalance || 100000,
    unrealizedProfitLoss: 0,
    profitLossPercent: 0,
  });

  // Fetch virtual wallet metrics from backend
  const fetchWallet = async () => {
    if (!token) return;
    try {
      const response = await axiosInstance.get('/users/wallet');
      if (response.data?.success) {
        setWallet(response.data);
        // Also sync user.virtualBalance
        if (user && user.virtualBalance !== response.data.availableBalance) {
          const updatedUser = { ...user, virtualBalance: response.data.availableBalance };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch {
      // Fallback: keep current local state
    }
  };

  // Reset virtual wallet balance to $100k
  const resetWallet = async () => {
    if (!token) return { success: false, message: 'Not logged in' };
    try {
      const response = await axiosInstance.post('/users/wallet/reset');
      if (response.data?.success) {
        await fetchWallet();
        return { success: true, message: response.data.message };
      }
      return { success: false, message: 'Reset failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Could not reset wallet',
      };
    }
  };

  // Refresh wallet metrics on load or when token changes
  useEffect(() => {
    if (token) {
      fetchWallet();
    }
  }, [token]);

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
    setWallet({
      availableBalance: 100000,
      investedAmount: 0,
      portfolioValue: 0,
      totalAccountValue: 100000,
      unrealizedProfitLoss: 0,
      profitLossPercent: 0,
    });
  };

  // Refresh user profile and balance from backend
  const fetchProfile = async () => {
    if (!token) return;
    try {
      const response = await axiosInstance.get('/users/profile');
      const updatedData = { ...user, ...response.data };
      setUser(updatedData);
      localStorage.setItem('user', JSON.stringify(updatedData));
    } catch {
      // Ignore
    }
  };

  return (
    <GeneralContext.Provider
      value={{
        user,
        token,
        wallet,
        loading,
        error,
        setError,
        login,
        register,
        logout,
        fetchProfile,
        fetchWallet,
        resetWallet,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </GeneralContext.Provider>
  );
};

// Custom hook to consume the GeneralContext easily
export const useGeneralContext = () => useContext(GeneralContext);
