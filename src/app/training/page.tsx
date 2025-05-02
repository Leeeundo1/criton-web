'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTrainingStore } from '@/lib/store/trainingStore'; // Assuming '@' alias

const questions = [
  "당신의 아이디어는 어떤 문제를 해결하나요?",
  "누구를 위한 아이디어인가요?",
  "기존 해결 방식은 무엇이 있었고, 어떤 점이 부족했나요?",
  "당신의 아이디어는 어떻게 다르게 해결하나요?",
  "실패한다면 그 이유는 무엇일까요?"
];

export default function TrainingPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const { answers, setAnswer } = useTrainingStore((state) => ({ answers: state.answers, setAnswer: state.setAnswer }));
  const router = useRouter();

  // Load existing answer if user navigates back
  useEffect(() => {
    const existingAnswer = answers[currentQuestionIndex];
    if (existingAnswer) {
      setCurrentAnswer(existingAnswer);
    }
    // Clear answer field only if there was no existing answer for the new question
    else {
      setCurrentAnswer('');
    }
    // Depend on index to re-run when question changes
  }, [currentQuestionIndex, answers]);

  const handleNext = () => {
    // Save current answer before moving
    setAnswer(currentQuestionIndex, currentAnswer);

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (isLastQuestion) {
      router.push('/summary');
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // The useEffect will handle clearing or loading the next answer
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progressText = `Step ${currentQuestionIndex + 1}/${questions.length}`;
  const isNextDisabled = !currentAnswer.trim();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-xl shadow">
        {/* Progress Indicator */}
        <div className="text-sm font-medium text-center text-indigo-600">{progressText}</div>

        {/* Question Card */}
        <div className="p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-center text-gray-800">
            {currentQuestion}
          </h2>
        </div>

        {/* Answer Textarea */}
        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="여기에 답변을 입력하세요..."
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm min-h-[150px] focus:ring-indigo-500 focus:border-indigo-500"
          rows={5} // Suggest initial rows
        />

        {/* Navigation Button */}
        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className="w-full px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestionIndex === questions.length - 1 ? '완료하고 요약 보기' : '다음 질문으로'}
        </button>
      </div>
    </div>
  );
} 