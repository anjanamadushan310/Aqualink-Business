import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { API_ENDPOINTS } from '../services/apiConfig';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState(localStorage.getItem('activeRole') || null);

  // Set active role and persist to localStorage
  const setActiveRole = (role) => {
    localStorage.setItem('activeRole', role);
    setActiveRoleState(role);
  };

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
      alert('Your session has expired. Please log in again.');
    };
    
    window.addEventListener('authTokenExpired', handleTokenExpired);
    
    return () => {
      window.removeEventListener('authTokenExpired', handleTokenExpired);
    };
  }, [token]);

  const checkTokenExpiration = () => {
    if (!token) return;
    
    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired, logout user
        console.log('Token expired, logging out user');
        logout();
        alert('Your session has expired. Please log in again.');
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      logout();
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.post(API_ENDPOINTS.LOGIN, {
        email,
        password
      });

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
      throw error;
    }
  };

  const logout = () => {
    console.log('=== LOGOUT INITIATED ===');
    
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
    
    // Clear shopping/ordering related data
    localStorage.removeItem('aqualink_order_data');
    localStorage.removeItem('aqualink_received_quotes');
    localStorage.removeItem('customerOrders');
    
    // Clear seller-specific quote requests
    // Find and remove all aqualink_quote_request_* keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('aqualink_quote_request_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Cleared localStorage items:', keysToRemove.length + 5);
    
    // Clear session storage for temporary data
    sessionStorage.clear();
    
    setToken(null);
    setUser(null);
    
    console.log('Auth state cleared');
    console.log('========================');
    
    // Dispatch a custom event to trigger navigation to home page and cart clearing
    window.dispatchEvent(new CustomEvent('user-logout'));
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