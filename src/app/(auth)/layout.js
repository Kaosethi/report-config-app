'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // Adjust path
import { useRouter } from 'next/navigation';

export default function AuthLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login'); // Redirect if not logged in after loading check
    }
  }, [isAuthenticated, loading, router]);

  // Optional: Add a loading indicator
  if (loading) {
    return <div>Loading authentication status...</div>;
  }

  // Only render children if authenticated (avoids brief flash of content)
  return isAuthenticated ? <>{children}</> : null;
}