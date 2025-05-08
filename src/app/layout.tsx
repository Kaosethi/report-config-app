// src/app/layout.tsx
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext'; // <--- Use the alias path
import React from 'react'; // <--- Import React for ReactNode type

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Report Configuration',
  description: 'Configure report automation logic',
};

// Add type annotation for props, including children
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // <--- Type the children prop
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* Wrap children with AuthProvider */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}