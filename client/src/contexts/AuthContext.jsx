import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('cc_token'));

  const loadUser = useCallback(async () => {
    const savedToken = localStorage.getItem('cc_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.getMe();
      setUser(res.data.data.user);
      setProviderProfile(res.data.data.providerProfile);
    } catch (err) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (usernameOrCreds, password) => {
    const payload =
      typeof usernameOrCreds === 'object' && usernameOrCreds !== null
        ? usernameOrCreds
        : { username: usernameOrCreds, password };
    const res = await authApi.login(payload);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('cc_token', newToken);
    localStorage.setItem('cc_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success('Welcome back! 👋');
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
    setToken(null);
    setUser(null);
    setProviderProfile(null);
    toast.success('Logged out successfully.');
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('cc_token', newToken);
    setToken(newToken);
    setUser(newUser);
    toast.success('Account created successfully! Welcome to CareConnect 🎉');
    return newUser;
  };

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  const isRole = (...roles) => roles.includes(user?.role);
  const isCustomer = () => user?.role === 'customer';
  const isProvider = () => user?.role === 'provider';
  const isAdmin = () => user?.role === 'admin';
  const isOperations = () => user?.role === 'operations';
  const isSupport = () => user?.role === 'support';
  const isStaff = () => ['admin', 'operations', 'support'].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        providerProfile,
        token,
        loading,
        login,
        logout,
        register,
        refreshUser,
        isRole,
        isCustomer,
        isProvider,
        isAdmin,
        isOperations,
        isSupport,
        isStaff,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
