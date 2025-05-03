'use client';

import React from 'react';

interface Props {
  ideaId: string;
}

const SummarySection: React.FC<Props> = ({ ideaId }) => {
  // TODO: Integrate the logic from the old /summary/[ideaId] page
  return (
    <div className="space-y-6 flex-grow">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">요약 및 내보내기</h2>
      </div>
      <div className="p-4 border rounded bg-gray-100">
        <h3 className="text-lg font-semibold mb-2">요약 및 내보내기 (Placeholder)</h3>
        <p>Idea ID: {ideaId}</p>
        <p>여기에 기존 요약 보기 및 PDF 내보내기 컴포넌트/로직을 통합합니다.</p>
      </div>
    </div>
  );
};

export default SummarySection; 