'use client'; // Start as client component for easy access to params

import React from 'react';
import { useParams } from 'next/navigation'; // Hook to get URL parameters
import Link from 'next/link';

export default function IdeaDetailPage() {
  const params = useParams();
  const ideaId = params.ideaId; // Get the ideaId from the URL

  // Basic loading/error state could be added here later
  if (!ideaId) {
    return <div>아이디 ID를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        아이디어 상세 (ID: {ideaId})
      </h1>

      {/* Placeholder for actual idea content */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <p className="text-gray-700">
          여기에 ID <span className="font-mono bg-gray-100 px-1 rounded">{ideaId}</span>에 해당하는 아이디어의 상세 내용 (예: 제목, 설명, 질문/답변 요약, 마인드맵 등)을 불러와 표시합니다.
        </p>
      </div>

      {/* Links to other related pages (examples) */}
      <div className="flex space-x-4">
          <Link href={`/summary/${ideaId}`} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              요약 보기 (구현 필요)
          </Link>
          <Link href={`/map/${ideaId}`} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
              마인드맵 보기 (구현 필요)
          </Link>
          <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              목록으로 돌아가기
          </Link>
      </div>
    </div>
  );
} 