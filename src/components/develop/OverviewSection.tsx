'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Props {
  ideaId: string;
}

interface IdeaDetails {
  title: string | null;
  description: string | null;
  module_type: string | null;
  created_at: string | null;
}

const OverviewSection: React.FC<Props> = ({ ideaId }) => {
  const [ideaDetails, setIdeaDetails] = useState<IdeaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchIdeaDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('ideas')
          .select('title, description, module_type, created_at')
          .eq('id', ideaId)
          .single();

        if (fetchError) {
          throw new Error(fetchError.message);
        }
        if (!data) {
           throw new Error('아이디어 정보를 찾을 수 없습니다.');
        }
        setIdeaDetails(data);
      } catch (err: any) {
        console.error("Error fetching idea details:", err.message);
        setError('아이디어 정보를 불러오는 중 오류가 발생했습니다.');
        toast.error('아이디어 정보를 불러오는 중 오류가 발생했습니다.');
      }
      setLoading(false);
    };

    if (ideaId) {
      fetchIdeaDetails();
    }
  }, [ideaId, supabase]);

  if (loading) {
    return <div className="p-4 text-center">아이디어 정보 로딩 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">오류: {error}</div>;
  }

  if (!ideaDetails) {
     return <div className="p-4 text-center text-gray-500">아이디어 정보를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="p-4 space-y-4 flex-grow">
      <div className="flex justify-between items-center">
           <h2 className="text-2xl font-bold text-gray-800">아이디어 개요</h2>
            <Link 
                href={`/idea/${ideaId}/edit`}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors duration-150"
            >
                 제목/설명 수정
            </Link>
      </div>
      <div className="p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">
          {ideaDetails.title || '제목 없음'}
        </h3>
        <p className="text-gray-600 whitespace-pre-wrap">
          {ideaDetails.description || <span className="text-gray-400 italic">설명 없음</span>}
        </p>
      </div>
    </div>
  );
};

export default OverviewSection; 