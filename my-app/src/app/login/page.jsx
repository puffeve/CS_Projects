'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Fetch the user from the 'users' table where email and password match
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)  // Note: Use hashed password in a real application!
        .single();

      if (userError) {
        throw new Error('Incorrect username or password');
      }

      if (!userData) {
        throw new Error('User not found');
      }

      // Save the user data in localStorage or state management
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect based on the role of the user
      if (userData.role === 'admin') {
        router.push('/dashboard'); // Redirect to the admin dashboard
      } else if (userData.role === 'teacher') {
        router.push('/Teacher_dashboard'); // Redirect to the teacher dashboard
      } else if (userData.role === 'student') {
        router.push('/Student_dashboard'); // Redirect to the student dashboard
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-sky-50 rounded-lg shadow-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
          Login
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email 
            </label>
            <input
              id="email"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password 
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-400 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 disabled:bg-sky-200"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleForgotPassword}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}