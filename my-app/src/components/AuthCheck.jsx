'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCheck({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return children;
}