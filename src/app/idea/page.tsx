'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/lib/store/ideaStore'; // Corrected alias path
import { supabase } from '@lib/supabaseClient'; // Corrected alias path

export default function IdeaPage() {
  const [currentIdea, setCurrentIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const setIdea = useIdeaStore((state) => state.setIdea);
  const router = useRouter();
  // State for showing examples (optional)
  const [showExamples, setShowExamples] = useState(false);

  const handleNext = async () => {
    if (!currentIdea.trim()) return;

    setLoading(true);

    try {
      // Supabase에 저장 (description 필드 제외 가정)
      const { data, error } = await supabase
        .from('ideas')
        .insert([{ title: currentIdea }])
        .select(); // Optional: select() to get the inserted data back if needed

      if (error) {
        console.error('❌ Supabase 저장 오류:', error.message);
        alert(`아이디어 저장 중 오류 발생: ${error.message}\nSupabase 테이블/컬럼 설정 또는 RLS 정책을 확인해주세요.`);
        setLoading(false); // 오류 시 로딩 해제
        return;
      }

      // console.log('✅ 아이디어 저장 성공:', data); // 필요시 저장된 데이터 확인

      // 상태 저장
      setIdea(currentIdea);

      // 페이지 이동 전 로딩 상태 해제
      setLoading(false);
      router.push('/training');

    } catch (err) {
      console.error('🚨 예상치 못한 오류 발생:', err);
      alert('예상치 못한 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false); // 예외 발생 시 로딩 해제
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          아이디어를 꺼내보세요
        </h1>
        <p className="text-center text-gray-600">
          당신이 만들고 싶은 것, 요즘 떠오른 문제를 자유롭게 적어보세요
        </p>

        <textarea
          value={currentIdea}
          onChange={(e) => setCurrentIdea(e.target.value)}
          placeholder="예: 반려동물을 위한 자동 장난감, AI 기반 학습 플래너..."
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm min-h-[160px] focus:ring-indigo-500 focus:border-indigo-500"
        />

        <div className="flex flex-col items-center space-y-4">
          {/* Optional Example Button */}
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm text-indigo-600 hover:underline"
          >
            {showExamples ? '예시 숨기기' : '아이디어 예시 보기'}
          </button>

          {/* Example Ideas (conditional rendering) */}
          {showExamples && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Replace with actual example cards later */}
              <div className="p-3 border rounded bg-gray-100 text-sm">예시 아이디어 1...</div>
              <div className="p-3 border rounded bg-gray-100 text-sm">예시 아이디어 2...</div>
              <div className="p-3 border rounded bg-gray-100 text-sm">예시 아이디어 3...</div>
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={!currentIdea.trim() || loading}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '저장 중...' : '다음으로 (Next)'}
          </button>
        </div>
      </div>
    </div>
  );
} 