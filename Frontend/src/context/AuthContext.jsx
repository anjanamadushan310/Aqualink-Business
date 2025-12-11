import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { API_ENDPOINTS } from '../services/apiConfig';
import { useNotification } from './NotificationContext';

export const AuthContext = createContext();

const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuth = () => useAuthContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState(localStorage.getItem('activeRole') || null);
  const { notifyWarning } = useNotification();

  // Set active role and persist to localStorage
  const setActiveRole = useCallback((role) => {
    localStorage.setItem('activeRole', role);
    setActiveRoleState(role);
  }, []);

  const showSessionExpiredNotice = useCallback(() => {
    if (notifyWarning) {
      notifyWarning('Your session has expired. Please log in again.');
    }
  }, [notifyWarning]);

  const logout = useCallback(() => {
    console.log('=== LOGOUT INITIATED ===');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
    localStorage.removeItem('aqualink_order_data');
    localStorage.removeItem('aqualink_received_quotes');
    localStorage.removeItem('customerOrders');

    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aqualink_quote_request_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    console.log('Cleared localStorage items:', keysToRemove.length + 5);

    sessionStorage.clear();

    setToken(null);
    setUser(null);
    setActiveRoleState(null);

    console.log('Auth state cleared');
    console.log('========================');

    window.dispatchEvent(new CustomEvent('user-logout'));
  }, []);

  const checkTokenExpiration = useCallback(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      if (payload.exp < currentTime) {
        console.log('Token expired, logging out user');
        logout();
        showSessionExpiredNotice();
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      logout();
      showSessionExpiredNotice();
    }
  }, [token, logout, showSessionExpiredNotice]);

  // Check if user is authenticated on app load
  useEffect(() => {
    console.log('=== AUTH CONTEXT INITIALIZATION ===');
    console.log('Token from localStorage:', token ? 'Present' : 'Missing');
    
    if (token) {
      // Try to get user info from localStorage
      const userData = localStorage.getItem('user');
      console.log('User data from localStorage:', userData);
      
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user:', parsedUser);
          console.log('User roles:', parsedUser.roles);
          setUser(parsedUser);
          
          // Set active role if not already set
          if (!activeRole && parsedUser.roles && parsedUser.roles.length > 0) {
            const storedActiveRole = localStorage.getItem('activeRole');
            if (storedActiveRole && parsedUser.roles.includes(storedActiveRole)) {
              setActiveRoleState(storedActiveRole);
            } else {
              // Default to first role
              setActiveRole(parsedUser.roles[0]);
            }
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          logout();
        }
      }
      
      // Check if token is expired
      checkTokenExpiration();
    } else {
      console.log('No token found, user not authenticated');
    }
    
    console.log('=================================');
    setLoading(false);
    
    // Listen for token expiration events from API calls
    const handleTokenExpired = () => {
      logout();
      showSessionExpiredNotice();
    };
    
    window.addEventListener('authTokenExpired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('authTokenExpired', handleTokenExpired);
    };
  }, [token, activeRole, logout, setActiveRole, checkTokenExpiration, showSessionExpiredNotice]);

  const login = async (email, password) => {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.LOGIN,
        {
          email,
          password
        },
        { skipAuthHandling: true }
      );

      console.log('=== LOGIN RESPONSE DEBUG ===');
      console.log('Full response:', response);
      console.log('Token:', response.token ? 'Present' : 'Missing');
      console.log('Roles (raw):', response.roles);
      console.log('===========================');

      const { token: authToken, roles: rolesData, nicNumber, userId, userName } = response;
      
      // Extract role names from Role objects
      // Backend returns: [{id: 1, name: "SHOP_OWNER"}, ...]
      // We need: ["SHOP_OWNER", ...]
      let roleNames = [];
      if (rolesData && Array.isArray(rolesData)) {
        roleNames = rolesData.map(role => role.name || role);
      } else if (rolesData) {
        // If it's a Set or object, convert to array of names
        roleNames = Object.values(rolesData).map(role => 
          typeof role === 'object' ? role.name : role
        );
      }

      console.log('=== EXTRACTED ROLE NAMES ===');
      console.log('Role names:', roleNames);
      console.log('============================');
      
      const userData = {
        email,
        roles: roleNames,
        nicNumber,
        userId,
        name: userName
      };

      // Store in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      
      // Set default active role to first role
      if (roleNames && roleNames.length > 0) {
        setActiveRole(roleNames[0]);
      }

      console.log('=== USER DATA STORED ===');
      console.log('Token stored:', !!localStorage.getItem('token'));
      console.log('User stored:', localStorage.getItem('user'));
      console.log('========================');

      return { ...response, roles: roleNames };
    } catch (error) {
      console.error('Login error:', error);
      const originalMessage = error?.message || '';
      const lowerMessage = originalMessage.toLowerCase();
      let friendlyMessage = originalMessage || 'Email or password is incorrect. Please try again.';

      if (
        lowerMessage.includes('session has expired') ||
        lowerMessage.includes('invalid email or password') ||
        lowerMessage.includes('bad credentials')
      ) {
        friendlyMessage = 'Email or password is incorrect. Please try again.';
      }

      const normalizedError = new Error(friendlyMessage);
      normalizedError.originalError = error;
      throw normalizedError;
    }
  };

  const hasRole = (role) => {
    return user && user.roles && user.roles.includes(role);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const refreshUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    hasRole,
    isAuthenticated,
    refreshUserData,
    loading,
    activeRole,
    setActiveRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuthContext };