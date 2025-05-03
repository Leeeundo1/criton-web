'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { trainingModules } from '@lib/trainingModules'; // Import training modules data
import toast from 'react-hot-toast'; // Import toast

export default function IdeaPage() {
  const [currentIdea, setCurrentIdea] = useState('');
  const [description, setDescription] = useState(''); // State for description
  const [selectedModuleId, setSelectedModuleId] = useState<string>('basic'); // State for selected module ID
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        toast.error("사용자 정보를 가져오는데 실패했습니다.");
        router.push('/login');
      }
      setUser(user);
    };
    fetchUser();
  }, [supabase, router]);

  const handleNext = async () => {
    // Trim title, description can be empty
    const trimmedTitle = currentIdea.trim(); 
    if (!trimmedTitle || !user) {
        if (!user) {
            toast.error('사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
            router.push('/login');
        }
        // Add specific alert if title is empty
        if (!trimmedTitle) {
            toast.error('아이디어 제목을 입력해주세요.');
        }
        return;
    }

    setLoading(true);
    const toastId = toast.loading('아이디어를 저장하는 중...'); // Show loading toast

    try {
      const { data: newIdeaData, error } = await supabase
        .from('ideas')
        .insert([{ 
            title: trimmedTitle, // Use trimmed title
            description: description, // Include description
            user_id: user.id, 
            module_type: selectedModuleId 
        }])
        .select('id') 
        .single(); 

      if (error) {
        console.error('❌ Supabase 저장 오류:', error.message);
        let userFriendlyMessage = '아이디어 저장 중 오류가 발생했습니다.';
        // Provide more specific user-friendly messages if possible
        if (error.message.includes('duplicate key')) {
            userFriendlyMessage = '이미 유사한 아이디어가 존재할 수 있습니다.';
        } else if (error.code === '23514') { // Example check constraint violation code
             userFriendlyMessage = '입력 내용을 확인해주세요 (예: 허용되지 않는 값).';
        }
        // Dismiss loading toast and show error toast
        toast.error(userFriendlyMessage, { id: toastId }); 
        setLoading(false);
        return;
      }

      if (!newIdeaData || !newIdeaData.id) {
          console.error('❌ Failed to retrieve new idea ID after insert.');
          // Dismiss loading toast and show error toast
          toast.error('아이디어 저장 후 ID를 가져오는데 실패했습니다.', { id: toastId });
          setLoading(false);
          return;
      }

      const newIdeaId = newIdeaData.id;
      // Dismiss loading toast and show success toast
      toast.success('아이디어가 저장되었습니다!', { id: toastId }); 
      setLoading(false);
      // Redirect to the new develop page, starting with the overview section
      router.push(`/idea/${newIdeaId}/develop?section=overview`);

    } catch (err: any) {
      console.error('🚨 예상치 못한 오류 발생:', err);
      // Dismiss loading toast and show error toast
      toast.error('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.', { id: toastId });
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout Error:', error.message);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    } else {
      toast.success('로그아웃 되었습니다.');
      setUser(null);
      router.push('/login');
    }
    setLoading(false);
  };

  // Find the selected module's description (optional, for display)
  const selectedModuleDescription = trainingModules.find(m => m.id === selectedModuleId)?.description;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl flex justify-end mb-4">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? '...' : (user ? '로그아웃' : ' ')}
          </button>
      </div>

      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          아이디어를 꺼내보세요
        </h1>
        
        {/* Idea Title Input */}
        <div className="space-y-1">
           <label htmlFor="ideaTitle" className="block text-sm font-medium text-gray-700">
            아이디어 제목 <span className="text-red-500">*</span>
          </label>
            <textarea
              id="ideaTitle"
              value={currentIdea}
              onChange={(e) => setCurrentIdea(e.target.value)}
              placeholder="예: 반려동물을 위한 자동 장난감, AI 기반 학습 플래너..."
              className="w-full p-4 border border-gray-300 rounded-xl shadow-sm min-h-[100px] focus:ring-indigo-500 focus:border-indigo-500"
              rows={3} // Adjusted rows for title
              disabled={!user || loading}
              required // Add required attribute
            />
             <p className="text-center text-xs text-gray-500 pt-1">
                당신이 만들고 싶은 것, 요즘 떠오른 문제를 자유롭게 적어보세요.
            </p>
        </div>

        {/* Idea Description Input */}
         <div className="space-y-1">
           <label htmlFor="ideaDescription" className="block text-sm font-medium text-gray-700">
            아이디어 설명 (선택 사항)
          </label>
            <textarea
              id="ideaDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="아이디어에 대한 추가적인 설명을 적어주세요."
              className="w-full p-4 border border-gray-300 rounded-xl shadow-sm min-h-[120px] focus:ring-indigo-500 focus:border-indigo-500"
              rows={4} // Adjusted rows for description
              disabled={!user || loading}
            />
        </div>

        {/* Module Selection Dropdown */}
        <div className="space-y-2">
          <label htmlFor="moduleSelect" className="block text-sm font-medium text-gray-700">
            어떤 방식으로 아이디어를 구체화할까요?
          </label>
          <select
            id="moduleSelect"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            disabled={!user || loading}
          >
            {trainingModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
          {selectedModuleDescription && (
            <p className="text-xs text-gray-500 pl-1">{selectedModuleDescription}</p>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4 pt-4">
          <button
            onClick={handleNext}
            disabled={!currentIdea.trim() || loading || !user}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '다음으로 (구체화 시작)'}
          </button>
        </div>
      </div>
    </div>
  );
} 