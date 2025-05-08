// src/app/page.tsx
'use client'; // Need client-side hooks for auth state and redirection

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed

type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  // add other properties if needed
};

export default function HomePage() {
  const auth = useAuth() as AuthContextType | null;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const loading = auth?.loading ?? true;
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication status is determined
    if (!loading) {
      if (isAuthenticated) {
        // If logged in, redirect to the main configuration page
        router.replace('/config'); // Use replace to avoid adding '/' to history
      } else {
        // If not logged in, redirect to the login page
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  // Optional: Show a loading indicator while checking auth status
  // This prevents a brief flash of content if you had any UI here
  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // You can return null or a minimal loading message because the redirect
  // will happen very quickly after loading is false.
  return null; // Or return <div>Redirecting...</div>;

}