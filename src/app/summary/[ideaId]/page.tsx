'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import html2pdf from 'html2pdf.js';
import Link from 'next/link';
import { getQuestionsByModuleId, getModuleById } from '@lib/trainingModules'; // Import helpers

// Remove the hardcoded questions array
// const questions = [...]; 

// Define type for answers for clarity
type Answers = { [index: number]: string };

export default function SummaryPage() {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [ideaTitle, setIdeaTitle] = useState<string>(''); // State for idea title
  const [moduleName, setModuleName] = useState<string>(''); // State for module name
  const [questions, setQuestions] = useState<string[]>([]); // State for dynamic questions
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const ideaId = params.ideaId as string;
  const summaryContentRef = useRef<HTMLDivElement>(null);
  const supabase = createClientComponentClient();

  // Fetch idea details and answers data based on ideaId
  useEffect(() => {
    if (!ideaId) {
        setError("아이디어 ID를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setQuestions([]); // Reset questions

      try {
        // Fetch idea details (title, module_type)
        const { data: ideaData, error: ideaError } = await supabase
          .from('ideas')
          .select('title, module_type')
          .eq('id', ideaId)
          .single();

        if (ideaError) throw new Error(`아이디어 정보 로딩 오류: ${ideaError.message}`);
        if (!ideaData) throw new Error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');

        setIdeaTitle(ideaData.title || '제목 없음');
        const moduleDetails = getModuleById(ideaData.module_type);
        setModuleName(moduleDetails?.name || '알 수 없는 모듈');
        setQuestions(moduleDetails?.questions || []);

        // Fetch answers
        const { data: answerData, error: answerError } = await supabase
          .from('training_answers')
          .select('answers_data')
          .eq('idea_id', ideaId)
          // We assume answers are stored against idea_id regardless of module type change
          // If answers should be specific to a module type run, add .eq('module_type', ideaData.module_type)
          .single();

        if (answerError && answerError.code !== 'PGRST116') {
          throw new Error(`답변 데이터 로딩 오류: ${answerError.message}`);
        }

        if (answerData && answerData.answers_data) {
          setAnswers(answerData.answers_data as Answers);
        } else {
          setAnswers({}); // Set to empty object if no answers found
        }

      } catch (err: any) {
         console.error('Error fetching summary data:', err.message);
         setError(err.message);
         setAnswers(null);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [ideaId, supabase]); // Removed router dependency


  const handlePdfExport = () => {
    const element = summaryContentRef.current;
    if (!element) {
      console.error("Summary content element not found for PDF export.");
      return;
    }
    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5], // Margins: top, left, bottom, right (in inches)
      filename:     `criton_summary_${ideaTitle.replace(/\s+/g, '_') || ideaId}.pdf`, // Use title in filename
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false }, // Added logging false
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] } // Improved page breaking
    };
    html2pdf().from(element).set(opt).save();
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">요약 정보 로딩 중...</div>;
  }

  if (error) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen p-4">
            <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">오류: {error}</p>
            <Link href="/dashboard" className="text-indigo-600 hover:underline">대시보드로 돌아가기</Link>
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-100">
      <div className="w-full max-w-3xl">
        <div ref={summaryContentRef} className="p-6 sm:p-10 space-y-8 bg-white rounded-xl shadow-lg mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 break-words">
              {ideaTitle}
            </h1>
            <p className="text-sm text-indigo-600 font-medium mt-2">({moduleName} 질문 기반)</p>
          </div>

          <div className="space-y-6">
            {(answers && questions.length > 0) ? (
               questions.map((question, index) => (
                <div key={index} className="p-5 border border-gray-200 rounded-lg shadow-sm bg-gray-50/50 break-inside-avoid">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    <span className="text-indigo-500 mr-2">Q{index + 1}.</span>{question}
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap pl-6">
                    {answers[index] || <span className="text-gray-400 italic">답변 없음</span>}
                  </p>
                </div>
              ))
            ) : (
                 <p className="text-center text-gray-500 py-10">저장된 답변 데이터가 없거나 질문을 불러올 수 없습니다.</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center sm:justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
          <Link href={`/training/${ideaId}`} className="w-full sm:w-auto px-5 py-2.5 text-base font-medium text-center text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:ring-4 focus:ring-indigo-300 transition duration-150 ease-in-out">
            다시 작성하기
          </Link>
          <button
            onClick={handlePdfExport}
            disabled={!answers || Object.keys(answers).length === 0 || questions.length === 0} // Disable if no answers or questions
            className="w-full sm:w-auto px-5 py-2.5 text-base font-medium text-center text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 transition duration-150 ease-in-out"
          >
            PDF로 저장하기
          </button>
          <Link href="/dashboard" className="w-full sm:w-auto px-5 py-2.5 text-base font-medium text-center text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300 transition duration-150 ease-in-out">
              목록으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
} 