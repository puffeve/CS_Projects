'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    router.push('/Forgotpassword');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#c1d9a4] via-[#95c9a6] to-[#64b6b3]">
      <div className="max-w-md w-full px-8 py-10">
        <h2 className="text-center text-5xl font-extralight text-white mb-16">
        WELCOME to ClassMood Insight!
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-white rounded-md overflow-hidden shadow-md">
            <div className="flex items-center px-4 py-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <input
                id="email"
                type="text"
                placeholder="Email"
                required
                className="ml-2 block w-full border-0 focus:ring-0 focus:outline-none text-gray-400 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-md overflow-hidden shadow-md mt-3">
            <div className="flex items-center px-4 py-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <input
                id="password"
                type="password"
                placeholder="**********"
                required
                className="ml-2 block w-full border-0 focus:ring-0 focus:outline-none text-gray-400 placeholder-gray-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-white py-4">
            <div className="flex items-center">
              
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-light text-white hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 mt-6 bg-teal-700 bg-opacity-40 hover:bg-opacity-50 text-white rounded-md border border-teal-600 border-opacity-30 text-2xl font-light transition-colors duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}