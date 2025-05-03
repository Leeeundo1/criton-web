'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function EditIdeaPage() {
  const params = useParams<{ ideaId: string }>();
  const ideaId = params.ideaId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialTitle, setInitialTitle] = useState('');
  const [initialDescription, setInitialDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch existing idea data
  const fetchIdea = useCallback(async (currentUserId: string) => {
    setLoading(true);
    setError(null);
    const { data: idea, error: fetchError } = await supabase
      .from('ideas')
      .select('title, description')
      .eq('id', ideaId)
      .eq('user_id', currentUserId)
      .single();

    if (fetchError) {
      console.error('Error fetching idea:', fetchError.message);
      toast.error('아이디어를 불러오는 중 오류가 발생했습니다.');
      setError('데이터를 불러올 수 없습니다. 대시보드로 돌아가세요.');
      setLoading(false);
      return;
    }

    if (idea) {
      setTitle(idea.title || '');
      setInitialTitle(idea.title || '');
      setDescription(idea.description || '');
      setInitialDescription(idea.description || '');
    } else {
       toast.error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');
       setError('아이디어를 찾을 수 없습니다.');
    }
    setLoading(false);
  }, [supabase, ideaId]);

  // Get user session and then fetch idea
  useEffect(() => {
    const getUserAndFetchIdea = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Error getting session or no session:', sessionError?.message);
        toast.error('사용자 인증 정보를 확인하지 못했습니다.');
        setError('사용자 인증 정보를 확인하는 중 오류가 발생했습니다. 다시 로그인해주세요.');
        setLoading(false);
        // router.push('/login');
        return;
      }
      setUserId(session.user.id);
      fetchIdea(session.user.id);
    };
    getUserAndFetchIdea();
  }, [supabase, fetchIdea]);

  // Handle form submission
  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    
    if (trimmedTitle === initialTitle && description === initialDescription) {
      toast.error('변경된 내용이 없습니다.');
      return; 
    }
    if (!trimmedTitle) {
        toast.error('아이디어 제목을 입력해주세요.');
        return;
    }
    if (!userId) {
        toast.error('사용자 정보가 없어 저장할 수 없습니다.');
        return;
    }

    setSaving(true);
    setError(null);
    const toastId = toast.loading('변경사항을 저장하는 중...');

    const { error: updateError } = await supabase
      .from('ideas')
      .update({ 
          title: trimmedTitle, 
          description: description
      })
      .eq('id', ideaId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating idea:', updateError.message);
      toast.error(`아이디어 저장 중 오류: ${updateError.message}`, { id: toastId });
    } else {
      toast.success('아이디어가 성공적으로 수정되었습니다.', { id: toastId });
      router.push('/dashboard');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-10">아이디어 로딩 중...</div>;
  }

  if (error && (!initialTitle && !title)) {
      return (
           <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border border-gray-200 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Link href="/dashboard" className="text-indigo-600 hover:underline">
                    대시보드로 돌아가기
                </Link>
            </div>
      );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">아이디어 수정</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label htmlFor="ideaTitle" className="block text-sm font-medium text-gray-700 mb-1">
            아이디어 제목 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="ideaTitle"
            value={title}
            onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
            }}
            placeholder="아이디어를 입력하세요"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={saving}
            required
          />
        </div>

        <div>
           <label htmlFor="ideaDescription" className="block text-sm font-medium text-gray-700 mb-1">
            아이디어 설명 (선택 사항)
          </label>
            <textarea
              id="ideaDescription"
              value={description}
              onChange={(e) => {
                  setDescription(e.target.value);
                  if (error) setError(null);
              }}
              placeholder="아이디어에 대한 추가적인 설명을 적어주세요."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
              rows={4}
              disabled={saving}
            />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
           <Link href="/dashboard" className={`px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}>
              취소
            </Link>
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
} 