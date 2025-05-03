'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import the client creator
import toast from 'react-hot-toast'; // Import toast

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  // Create Supabase client instance specifically for client components
  const supabase = createClientComponentClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    setError(null);
    const toastId = toast.loading('로그인 시도 중...');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Login Error:', signInError.message);
      let userFriendlyMessage = '로그인 실패: ';
      if (signInError.message.includes('Invalid login credentials')) {
          userFriendlyMessage += '이메일 또는 비밀번호가 잘못되었습니다.';
      } else if (signInError.message.includes('Email not confirmed')) {
          userFriendlyMessage += '이메일 인증이 필요합니다.';
      } else {
          userFriendlyMessage += signInError.message; // Show original error if not recognized
      }
      setError(userFriendlyMessage); // Set inline error
      toast.error(userFriendlyMessage, { id: toastId }); // Show toast error
    } else {
      toast.success('로그인 성공!', { id: toastId });
      router.push('/idea');
      router.refresh(); // Refresh server components after auth change
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const toastId = toast.loading('회원가입 진행 중...');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${location.origin}/auth/callback`, // Enable if email confirmation is on
      },
    });

    if (signUpError) {
      console.error('Sign Up Error:', signUpError.message);
      let userFriendlyMessage = '회원가입 실패: ';
       if (signUpError.message.includes('User already registered')) {
           userFriendlyMessage += '이미 등록된 이메일입니다.';
       } else if (signUpError.message.includes('Password should be at least 6 characters')) {
            userFriendlyMessage += '비밀번호는 6자 이상이어야 합니다.';
       } else {
            userFriendlyMessage += signUpError.message;
       }
      setError(userFriendlyMessage); // Set inline error
      toast.error(userFriendlyMessage, { id: toastId }); // Show toast error
    } else {
      // Replace alert with success toast
      toast.success('회원가입 성공! 이메일 확인이 필요할 수 있습니다. 로그인을 시도해주세요.', { 
          id: toastId, 
          duration: 5000 // Show longer for instructions
      }); 
      // Optionally clear fields or provide other feedback
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-center text-gray-800">Criton 시작하기</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }} // Clear error on input
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }} // Clear error on input
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center pt-1">{error}</p>
          )}

          <button
            type="submit" // Changed to submit type
            disabled={loading}
            className="w-full px-4 py-2 text-base font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? ' ' : '계정이 없으신가요? 회원가입'}
          </button>
        </div>

      </div>
    </div>
  );
} 