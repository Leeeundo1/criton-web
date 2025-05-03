'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation'; // Import hooks

// Define menu items
const menuItems = [
  { name: '아이디어 개요', path: 'overview', icon: '📝' },
  { name: '핵심 질문 (Training)', path: 'training', icon: '❓' },
  { name: '마인드맵 시각화', path: 'map', icon: '🧠' },
 // { name: '인사이트', path: 'insight', icon: '💡' }, // 나중에 추가
  { name: '요약 및 내보내기', path: 'summary', icon: '📄' },
];

const DevelopSidebar: React.FC = () => {
  const params = useParams();
  const searchParams = useSearchParams(); // Get current search params
  const ideaId = params.ideaId as string;
  const currentSection = searchParams.get('section') || 'overview'; // Default to overview

  return (
    <aside className="w-64 h-full bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">아이디어 개발</h2>
      <nav className="flex-grow">
        <ul>
          {menuItems.map((item) => {
            const isActive = currentSection === item.path;
            return (
              <li key={item.path} className="mb-2">
                <Link
                  href={`/idea/${ideaId}/develop?section=${item.path}`}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 
                    ${isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Optional: Add other sidebar elements like a back button */}
      <div className="mt-auto">
         <Link href="/dashboard" className="text-sm text-gray-500 hover:underline"> ← 대시보드로 돌아가기</Link>
      </div>
    </aside>
  );
};

export default DevelopSidebar; 