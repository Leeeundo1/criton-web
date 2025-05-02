'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainingStore } from '@/lib/store/trainingStore'; // Assuming '@' alias
import html2pdf from 'html2pdf.js'; // Import html2pdf

// Use the same questions array as in training page for consistency
const questions = [
  "당신의 아이디어는 어떤 문제를 해결하나요?",
  "누구를 위한 아이디어인가요?",
  "기존 해결 방식은 무엇이 있었고, 어떤 점이 부족했나요?",
  "당신의 아이디어는 어떻게 다르게 해결하나요?",
  "실패한다면 그 이유는 무엇일까요?"
];

export default function SummaryPage() {
  const answers = useTrainingStore((state) => state.answers);
  // Optional: Get reset function if needed later for UI choice
  // const resetAnswers = useTrainingStore((state) => state.resetAnswers);
  const router = useRouter();
  const summaryContentRef = useRef<HTMLDivElement>(null); // Create ref for the content area

  const handleRedo = () => {
    // Navigate back to training. Reset logic can be added here if needed.
    // Example: if (confirm("답변을 초기화하고 다시 시작할까요?")) { resetAnswers(); }
    router.push('/training');
  };

  // Updated function to handle PDF export
  const handlePdfExport = () => {
    const element = summaryContentRef.current;
    if (!element) {
      console.error("Summary content element not found for PDF export.");
      return;
    }

    const opt = {
      margin:       1,
      filename:     'criton_summary.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true }, // Increase scale for better quality
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Generate PDF
    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <div id="summary-content" className="w-full max-w-3xl p-6 sm:p-10 space-y-8 bg-white rounded-xl shadow">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          나의 아이디어 구조화 결과
        </h1>

        <div ref={summaryContentRef}>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={index} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-white break-inside-avoid">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {index + 1}. {question}
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {answers[index] || '답변 없음'} {/* Handle missing answers gracefully */}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8">
          <button
            onClick={handleRedo}
            className="px-5 py-2.5 text-base font-medium text-center text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:ring-4 focus:ring-indigo-300"
          >
            다시 작성하기
          </button>
          <button
            onClick={handlePdfExport}
            className="px-5 py-2.5 text-base font-medium text-center text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300"
            // No longer disabled
          >
            PDF로 저장하기
          </button>
        </div>
      </div>
    </div>
  );
} 