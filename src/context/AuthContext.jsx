import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finai_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return { user_id: 'usr_guest', username: 'Guest Trader', email: 'guest@finai.io' };
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('finai_user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        const err = await res.json().catch(() => ({ detail: 'Login failed.' }));
        return { success: false, error: err.detail || 'Invalid credentials' };
      }
    } catch (e) {
      return { success: false, error: e.message || 'Network error logging in.' };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('finai_user', JSON.stringify(data.user));
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      } else {
        const err = await res.json().catch(() => ({ detail: 'Registration failed.' }));
        return { success: false, error: err.detail || 'Failed to create account' };
      }
    } catch (e) {
      return { success: false, error: e.message || 'Network error registering.' };
    }
  };

  const logout = () => {
    setUser({ user_id: 'usr_guest', username: 'Guest Trader', email: 'guest@finai.io' });
    localStorage.removeItem('finai_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.user_id || 'usr_guest',
        login,
        register,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
