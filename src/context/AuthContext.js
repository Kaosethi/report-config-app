// src/context/AuthContext.tsx
'use client'; // Essential for hooks and localStorage

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

/**
 * @typedef {Object} AuthContextType
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {(username: string, password: string) => boolean} login
 * @property {() => void} logout
 */

// Create context with null initial value, but type it correctly
const AuthContext = createContext(null);

// Define props for the provider component
// Props for the provider component
// children: React.ReactNode

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Start loading until checked
  const router = useRouter();

  // Check auth status on initial client-side load
  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsAuthenticated(loggedIn);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      // Handle potential SSR or security errors gracefully
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Stop loading once checked
    }
  }, []);

  // Simulated login function
  const login = (username, password) => {
    setLoading(true); // Indicate loading during login attempt
    // ** Replace with your actual API call **
    if (username === 'admin' && password === 'password') {
      try {
        localStorage.setItem('isLoggedIn', 'true');
        setIsAuthenticated(true);
        setLoading(false);
        router.push('/config'); // Redirect after successful login
        return true;
      } catch (error) {
         console.error("Error setting localStorage:", error);
         setIsAuthenticated(false); // Ensure state is correct on error
      }
    }
    // If login fails or error occurs
    setIsAuthenticated(false);
    setLoading(false);
    return false;
  };

  // Logout function
  const logout = () => {
    try {
      localStorage.removeItem('isLoggedIn');
    } catch (error) {
        console.error("Error removing from localStorage:", error);
    } finally {
       setIsAuthenticated(false);
       router.push('/login'); // Redirect to login after logout
    }
  };

  // The value provided to consuming components
  const value = { isAuthenticated, loading, login, logout };
  return (
    <AuthContext.Provider value={value}>
      {/* Only render children once loading is complete to avoid flashes */}
      {!loading && children}
      {/* Or show a global loading spinner if preferred: loading ? <GlobalSpinner /> : children */}
    </AuthContext.Provider>
  );
};

// Custom hook to consume the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  // This check ensures context is not null when used
  // It should only be null if used outside of AuthProvider
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}