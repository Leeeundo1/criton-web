import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <div className="flex flex-col items-center justify-center text-center pt-16">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Criton: 당신의 아이디어를 현실로
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl">
        막연한 아이디어를 질문과 사고 훈련을 통해 구체적인 계획으로 만들고,
        팀과 함께 발전시켜 나가세요.
      </p>
      <div>
        {session ? (
          <Link
            href="/idea"
            className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            내 아이디어 시작하기
          </Link>
        ) : (
          <Link
            href="/login"
            className="px-8 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            시작하기 (로그인)
          </Link>
        )}
        </div>
    </div>
  );
}
