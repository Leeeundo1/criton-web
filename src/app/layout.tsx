import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Criton - 아이디어 기획 툴",
  description: "사유 기반 창업 아이디어 기획 및 구조화 서비스",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <body className={`${geistSans.variable} antialiased flex flex-col min-h-screen`}>
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            success: {
              duration: 2000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Link href={session ? "/idea" : "/"} className="text-2xl font-bold text-indigo-600">
              Criton
            </Link>
            <div>
              {session ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    {session.user.email}
                  </span>
                  <span className="text-xs text-gray-400">(로그아웃은 아이디어 페이지에서)</span>
                </div>
              ) : (
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  로그인 / 회원가입
                </Link>
              )}
            </div>
          </nav>
        </header>

        <main className="flex-grow container mx-auto px-4 py-8">
        {children}
        </main>

        <footer className="bg-gray-100 py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Criton. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
