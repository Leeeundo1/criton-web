'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/lib/store/ideaStore'; // Assuming '@' alias

// --- Insight Card Data Example ---
interface InsightCardData {
  id: string;
  category: '시장' | '경쟁사' | '트렌드' | '비즈니스 모델';
  icon: string;
  title: string;
  description: string;
  keywords: string[];
  link?: string; // Optional source link
}

const allInsightCards: InsightCardData[] = [
  {
    id: '1',
    category: '시장',
    icon: '📊',
    title: 'Z세대 창업 지원 시장',
    description: '정부 및 민간 지원 포함, 2024년 약 1조 규모 예상. 교육 및 멘토링 수요 증가.',
    keywords: ['청년', 'Z세대', '창업', '지원', '교육', '시장'],
    link: '#', // Placeholder link
  },
  {
    id: '2',
    category: '경쟁사',
    icon: '🏆',
    title: '유사 서비스: Miro / FigJam',
    description: '온라인 화이트보드 기반 협업 툴. 시각적 아이디어 구체화 및 공유 기능 강점.',
    keywords: ['협업', '화이트보드', '시각화', '아이디어', 'miro', 'figma'],
    link: '#',
  },
  {
    id: '3',
    category: '트렌드',
    icon: '📈',
    title: '생성형 AI와 아이데이션',
    description: '초기 아이디어 발상 및 구체화 단계에서 AI 활용 증가 추세. 맞춤형 질문 생성 등.',
    keywords: ['AI', '인공지능', '아이디어', '기획', '트렌드', '생성'],
  },
  {
    id: '4',
    category: '비즈니스 모델',
    icon: '💰',
    title: '구독(Subscription) 모델',
    description: 'SaaS 형태의 서비스 제공 시 안정적인 수익 확보 가능. 기능별 요금제 차등.',
    keywords: ['BM', '구독', 'SaaS', '수익', '비즈니스', '모델'],
  },
  {
    id: '5',
    category: '시장',
    icon: '📊',
    title: '개인 생산성 앱 시장',
    description: 'Notion, Evernote 등 경쟁 치열. 특정 워크플로우에 최적화된 틈새 시장 공략 필요.',
    keywords: ['생산성', '앱', '노션', '에버노트', '시장', '기획'],
  },
  {
    id: '6',
    category: '트렌드',
    icon: '📈',
    title: 'No-Code / Low-Code 툴 활용',
    description: '개발 지식 없이 아이디어를 빠르게 프로토타이핑하고 검증하는 경향 증가.',
    keywords: ['노코드', '로우코드', '개발', '프로토타입', '트렌드', 'no-code'],
  },
];
// --- End of Insight Card Data ---

export default function InsightPage() {
  const idea = useIdeaStore((state) => state.idea);
  const router = useRouter();

  // Filter insights based on keywords in the idea text
  const relevantInsights = useMemo(() => {
    if (!idea) {
      // If no idea, show a few random examples or a specific subset
      return allInsightCards.slice(0, 4); // Show first 4 as default
    }
    const ideaLowerCase = idea.toLowerCase();
    const filtered = allInsightCards.filter(card =>
      card.keywords.some(keyword => ideaLowerCase.includes(keyword.toLowerCase()))
    );
    // If filtering results in few items, maybe add some random ones?
    // For now, just return filtered or default if filter is empty.
    return filtered.length > 0 ? filtered : allInsightCards.slice(0, 4);
  }, [idea]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        시장과 경쟁사 인사이트
      </h1>

      {/* Insight Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {relevantInsights.map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col">
            <div className="flex items-center mb-3">
              <span className="text-3xl mr-3">{card.icon}</span>
              <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
            </div>
            <p className="text-sm text-gray-600 flex-grow mb-3">{card.description}</p>
            {card.link && (
              <a
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline mt-auto"
              >
                출처 보기
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-auto pt-8 border-t border-gray-200">
        <button
          onClick={() => handleNavigate('/idea')}
          className="px-5 py-2.5 text-base font-medium text-center text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:ring-4 focus:ring-indigo-300"
        >
          아이디어 다시 작성하기
        </button>
        <button
          onClick={() => handleNavigate('/map')}
          className="px-5 py-2.5 text-base font-medium text-center text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
        >
          마인드맵 보기
        </button>
        {/* Optional: Add button to Summary page */}
        {/* <button onClick={() => handleNavigate('/summary')} className="...">요약 보기</button> */}
      </div>
    </div>
  );
} 