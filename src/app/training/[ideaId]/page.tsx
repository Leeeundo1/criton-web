'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTrainingStore, TrainingState } from '@lib/store/trainingStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { getQuestionsByModuleId, getModuleById } from '@lib/trainingModules'; // Import getModuleById
import toast from 'react-hot-toast'; // Import toast

// Remove the hardcoded questions array, we will fetch it dynamically
// const questions = [...]; 

export default function TrainingPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); 
  const [userId, setUserId] = useState<string | null>(null); 
  const [currentModuleType, setCurrentModuleType] = useState<string | null>(null); // State for module type
  const [currentModuleName, setCurrentModuleName] = useState<string>(''); // State for module name
  const [questions, setQuestions] = useState<string[]>([]); // State for dynamic questions
  const [error, setError] = useState<string | null>(null); 
  const router = useRouter();
  const params = useParams();
  const ideaId = params.ideaId as string;

  const answers = useTrainingStore((state: TrainingState) => state.answers);
  const setAnswer = useTrainingStore((state: TrainingState) => state.setAnswer); // This seems unused, consider removing if not needed later
  const initializeAnswers = useTrainingStore((state: TrainingState) => state.initializeAnswers);
  const resetAnswers = useTrainingStore((state: TrainingState) => state.resetAnswers);

  const supabase = createClientComponentClient();

  // Fetch user ID, idea module type, and existing answers
  useEffect(() => {
    const getInitialData = async () => {
      setIsLoadingData(true);
      setError(null);
      setQuestions([]); // Reset questions initially
      setCurrentModuleName(''); // 모듈 이름 초기화

      // 1. Get user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Error getting session or no session:', sessionError?.message);
        // Use toast for session errors
        toast.error('사용자 인증 정보를 가져올 수 없습니다.'); 
        setError('인증 오류. 로그인 페이지로 이동합니다.'); // Set critical error
        setIsLoadingData(false);
        setTimeout(() => router.push('/login'), 1500); // Redirect after delay
        return;
      }
      const currentUserId = session.user.id;
      setUserId(currentUserId);

      // 2. Fetch idea details (including module_type) and answers if user and ideaId are available
      if (currentUserId && ideaId) {
        try {
          // Fetch both idea details and answers in parallel or sequence
          const { data: ideaData, error: ideaError } = await supabase
            .from('ideas')
            .select('module_type')
            .eq('id', ideaId)
            .eq('user_id', currentUserId) // Ensure user owns the idea
            .single();

          if (ideaError) throw new Error(`아이디어 정보 로딩 오류: ${ideaError.message}`);
          if (!ideaData) throw new Error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');
          
          const fetchedModuleType = ideaData.module_type;
          const moduleDetails = getModuleById(fetchedModuleType); // 모듈 상세 정보 가져오기
          
          setCurrentModuleType(fetchedModuleType); // Set module type state
          setCurrentModuleName(moduleDetails?.name || '알 수 없는 모듈'); // 모듈 이름 설정
          setQuestions(moduleDetails?.questions || []); // 질문 설정

          // Fetch answers
          const { data: answerData, error: answerError } = await supabase
            .from('training_answers')
            .select('answers_data')
            .eq('user_id', currentUserId)
            .eq('idea_id', ideaId)
            // .eq('module_type', fetchedModuleType) // Optionally filter by module type too
            .single();

          if (answerError && answerError.code !== 'PGRST116') { // Ignore 'No rows found'
             throw new Error(`답변 데이터 로딩 오류: ${answerError.message}`);
          }

          // Initialize or reset answers based on fetched data
          if (answerData && answerData.answers_data) {
            initializeAnswers(answerData.answers_data as TrainingState['answers']);
          } else {
            if (Object.keys(answers).length > 0) {
                resetAnswers();
            }
          }

        } catch (err: any) {
          console.error('Error fetching initial data:', err.message);
          toast.error(`데이터 로딩 실패: ${err.message}`);
          setError(err.message); // Set critical error
        }

      } else if (!ideaId) {
          toast.error('잘못된 접근입니다 (아이디어 ID 없음).');
          setError('아이디어 ID를 찾을 수 없습니다.');
      }

      setIsLoadingData(false);
    };

    getInitialData();

    return () => {
      resetAnswers();
    };
  }, [ideaId, supabase, initializeAnswers, resetAnswers, router]); // Added router

  // Effect to update local currentAnswer when answers or index changes
  useEffect(() => {
      if (!isLoadingData) {
          const existingAnswer = answers[currentQuestionIndex];
          setCurrentAnswer(existingAnswer || '');
      }
  // Ensure questions are loaded before trying to access answers[index]
  }, [currentQuestionIndex, answers, isLoadingData, questions]); 

  // Function to save answers to Supabase
  const saveAnswersToDb = useCallback(async (currentAnswersToSave: TrainingState['answers']) => {
    if (!userId || !ideaId || !currentModuleType) {
      console.error('User ID, Idea ID, or Module Type is missing, cannot save answers.');
      // Use toast for this validation error
      toast.error('사용자, 아이디어 또는 모듈 정보가 없어 저장할 수 없습니다.'); 
      setError('저장 실패: 필수 정보 부족'); // Also set internal error if needed
      return; // Important: Return after error
    }
    setIsSaving(true);
    setError(null); // Clear previous errors
    
    // Don't use loading toast for background saves, only for final save
    // const toastId = toast.loading('저장 중...'); 

    const { error: upsertError } = await supabase
      .from('training_answers')
      .upsert({
        user_id: userId,
        idea_id: ideaId,
        module_type: currentModuleType, 
        answers_data: currentAnswersToSave,
      }, {
        onConflict: 'user_id, idea_id' 
      });

    if (upsertError) {
      console.error('Error saving answers:', upsertError.message);
      // Use toast for save errors
      toast.error(`답변 저장 중 오류: ${upsertError.message}`); 
      setError(`답변 저장 중 오류 발생: ${upsertError.message}`); // Set internal error state
      setIsSaving(false); // Ensure saving state is reset on error
      throw upsertError; // Re-throw error to be caught by handleNext if needed
    } else {
      // console.log('Answers saved successfully');
      // Don't show success toast for intermediate saves to avoid spam
    }
    setIsSaving(false); // Reset saving state on success too
  }, [ideaId, supabase, userId, currentModuleType]);

  const handleNext = async () => {
    // Ensure questions are loaded before proceeding
    if (questions.length === 0) return; 

    const updatedAnswers = { ...answers, [currentQuestionIndex]: currentAnswer };
    initializeAnswers(updatedAnswers);

    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    if (!isLastQuestion) {
      // Background save, don't await, don't show loading toast
      saveAnswersToDb(updatedAnswers).catch(err => {
          console.error("Background save failed:", err);
          // Optionally show a subtle non-blocking error indicator
          toast.error('백그라운드 저장 실패 (네트워크 확인)', { duration: 1500 });
      });
      setCurrentQuestionIndex(currentQuestionIndex + 1); 
    } else {
      // Final save, show loading toast and await completion
      setIsSaving(true);
      const toastId = toast.loading('마지막 답변을 저장하는 중...');
      try {
        await saveAnswersToDb(updatedAnswers);
        // Success: Dismiss loading toast, show success, navigate
        toast.success('모든 답변이 저장되었습니다!', { id: toastId }); 
        router.push(`/summary/${ideaId}`);
        // No need to setIsSaving(false) here, component will unmount
      } catch (err) {
          // Error occurred during final save (already handled by toast in saveAnswersToDb)
          // Just dismiss the loading toast if it's still there
          toast.dismiss(toastId);
          console.error("Error during final save await:", err);
          // Error state is already set by saveAnswersToDb, so UI should show it
          setIsSaving(false); // Ensure button is re-enabled
      }
    }
  };

  // Render logic checks
  if (isLoadingData) {
      return <div className="flex justify-center items-center min-h-screen">데이터 로딩 중...</div>;
  }

  if (error) { // Display error if loading finished and error exists
      return (
          <div className="flex flex-col justify-center items-center min-h-screen p-4">
              <p className="text-red-600 bg-red-100 p-4 rounded-md mb-4">오류: {error}</p>
              <Link href="/dashboard" className="text-indigo-600 hover:underline">
                  대시보드로 돌아가기
              </Link>
          </div>
      );
  }
  
  // Ensure questions are loaded before rendering the main UI
  if (questions.length === 0) {
      return <div className="flex justify-center items-center min-h-screen">질문 로딩 중...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  // Ensure index is within bounds (should be handled by loading state, but as safeguard)
  if (!currentQuestion) {
       console.error("Current question index out of bounds or questions not loaded.");
       // Handle this case, maybe show an error or reset index
       return <div className="flex justify-center items-center min-h-screen">오류: 현재 질문을 찾을 수 없습니다.</div>;
  }

  const progressText = `질문 ${currentQuestionIndex + 1}/${questions.length}`;
  const isNextDisabled = !currentAnswer.trim() || isSaving;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-2xl p-6 sm:p-8 space-y-6 bg-white rounded-xl shadow-lg">
        {/* Module Name Display */}
        {currentModuleName && (
            <h1 className="text-xl font-semibold text-center text-indigo-700">
              {currentModuleName} 훈련 중
            </h1>
        )}
        <div className="text-sm font-medium text-center text-indigo-600">{progressText}</div>

        <div className="p-5 border border-gray-200 rounded-lg bg-gray-50/80">
          <h2 className="text-lg sm:text-xl font-semibold text-center text-gray-800">
            {currentQuestion} 
          </h2>
        </div>

        <textarea
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
          placeholder="여기에 답변을 입력하세요..."
          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm min-h-[150px] focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition duration-150 ease-in-out"
          rows={5}
          disabled={isSaving}
        />

        <button
          onClick={handleNext}
          disabled={isNextDisabled}
          className={`w-full px-6 py-3 text-lg font-semibold text-white rounded-xl shadow-sm transition duration-150 ease-in-out ${isNextDisabled ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
        >
          {isSaving ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {isSaving ? '저장 중...' : (currentQuestionIndex === questions.length - 1 ? '완료하고 요약 보기' : '다음 질문으로')}
        </button>
      </div>
    </div>
  );
} 