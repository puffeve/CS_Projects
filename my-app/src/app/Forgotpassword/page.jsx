'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
  
      // Add logic to check if the email exists in your system (supabase or database)
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
  
        if (userError) {
          throw new Error('Email not found');
        }
  
        // Redirect to the reset password page with email
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-sky-50 rounded-lg shadow-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
            Forgot Password
          </h2>
  
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center">
              {error}
            </div>
          )}
  
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Enter your registered email
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
  
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-400 hover:bg-pink-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-300 disabled:bg-sky-200"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    );
  }