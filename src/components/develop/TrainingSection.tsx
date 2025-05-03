'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTrainingStore, TrainingState } from '@lib/store/trainingStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getQuestionsByModuleId, getModuleById } from '@lib/trainingModules';
import toast from 'react-hot-toast';

interface Props {
  ideaId: string;
}

const TrainingSection: React.FC<Props> = ({ ideaId }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentModuleType, setCurrentModuleType] = useState<string | null>(null);
  const [currentModuleName, setCurrentModuleName] = useState<string>('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Zustand store interaction
  const answers = useTrainingStore((state: TrainingState) => state.answers);
  const initializeAnswers = useTrainingStore((state: TrainingState) => state.initializeAnswers);
  const resetAnswers = useTrainingStore((state: TrainingState) => state.resetAnswers);

  const supabase = createClientComponentClient();

  // Fetch initial data (user, module type, answers)
  useEffect(() => {
    const getInitialData = async () => {
      setIsLoadingData(true);
      setError(null);
      setQuestions([]);
      setCurrentModuleName('');
      setCurrentAnswer(''); // Reset current answer input

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('인증 오류. 다시 로그인해주세요.');
        toast.error('사용자 인증 정보를 가져올 수 없습니다.');
        setIsLoadingData(false);
        return;
      }
      const currentUserId = session.user.id;
      setUserId(currentUserId);

      try {
        const { data: ideaData, error: ideaError } = await supabase
          .from('ideas')
          .select('module_type')
          .eq('id', ideaId)
          .eq('user_id', currentUserId)
          .single();

        if (ideaError) throw new Error(`아이디어 정보 로딩 오류: ${ideaError.message}`);
        if (!ideaData) throw new Error('아이디어를 찾을 수 없거나 접근 권한이 없습니다.');

        const fetchedModuleType = ideaData.module_type;
        const moduleDetails = getModuleById(fetchedModuleType);

        setCurrentModuleType(fetchedModuleType);
        setCurrentModuleName(moduleDetails?.name || '알 수 없는 모듈');
        const fetchedQuestions = moduleDetails?.questions || [];
        setQuestions(fetchedQuestions);

        const { data: answerData, error: answerError } = await supabase
          .from('training_answers')
          .select('answers_data')
          .eq('user_id', currentUserId)
          .eq('idea_id', ideaId)
          .single();

        if (answerError && answerError.code !== 'PGRST116') {
           throw new Error(`답변 데이터 로딩 오류: ${answerError.message}`);
        }

        const fetchedAnswers = (answerData?.answers_data as TrainingState['answers']) || {};
        initializeAnswers(fetchedAnswers);

        // Set initial answer for the first question
        if (fetchedQuestions.length > 0) {
             setCurrentAnswer(fetchedAnswers[0] || '');
        }

      } catch (err: any) {
        console.error('Error fetching initial data:', err.message);
        const fetchErrorMsg = `데이터 로딩 실패: ${err.message}`;
        setError(fetchErrorMsg);
        toast.error(fetchErrorMsg);
      }

      setIsLoadingData(false);
    };

    if (ideaId) {
        getInitialData();
    }

    // Cleanup function to reset store when component unmounts or ideaId changes
    // return () => {
    //   resetAnswers();
    // };
  }, [ideaId, supabase, initializeAnswers, resetAnswers]); // Dependencies

  // Update local currentAnswer when Zustand answers or index changes
  useEffect(() => {
      if (!isLoadingData) {
          const existingAnswer = answers[currentQuestionIndex];
          setCurrentAnswer(existingAnswer || '');
      }
  }, [currentQuestionIndex, answers, isLoadingData]);

  // Save answers to DB
  const saveAnswersToDb = useCallback(async (currentAnswersToSave: TrainingState['answers']) => {
    if (!userId || !ideaId || !currentModuleType) {
      toast.error('사용자, 아이디어 또는 모듈 정보가 없어 저장할 수 없습니다.');
      setError('저장 실패: 필수 정보 부족');
      return false; // Indicate failure
    }
    setIsSaving(true);
    setError(null);

    const { error: upsertError } = await supabase
      .from('training_answers')
      .upsert({
        user_id: userId,
        idea_id: ideaId,
        module_type: currentModuleType,
        answers_data: currentAnswersToSave,
      }, { onConflict: 'user_id, idea_id' });

    setIsSaving(false);
    if (upsertError) {
      console.error('Error saving answers:', upsertError.message);
      const saveErrorMsg = `답변 저장 중 오류: ${upsertError.message}`;
      toast.error(saveErrorMsg);
      setError(saveErrorMsg);
      return false; // Indicate failure
    } else {
       // toast.success('답변이 자동 저장되었습니다.', { duration: 1500 }); // Optional: subtle save indicator
       return true; // Indicate success
    }
  }, [ideaId, supabase, userId, currentModuleType]);

  // Handle answer input change
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newAnswer = e.target.value;
      setCurrentAnswer(newAnswer);
      // Update Zustand store immediately
      initializeAnswers({ ...answers, [currentQuestionIndex]: newAnswer });
      // Optional: Implement debounced background save here
  };

  const navigateQuestion = async (direction: 'next' | 'prev') => {
      const currentAnswersToSave = { ...answers, [currentQuestionIndex]: currentAnswer };
      // Save current answer before navigating
      const saved = await saveAnswersToDb(currentAnswersToSave);
      if (!saved && direction === 'next') { // Prevent moving next if save failed
          toast.error("저장에 실패하여 다음으로 이동할 수 없습니다.");
          return;
      }

      if (direction === 'next') {
          if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
          } else {
              toast.success("마지막 질문입니다! 모든 답변이 저장되었습니다.");
              // Optionally navigate to summary section?
              // router.push(`/idea/${ideaId}/develop?section=summary`);
          }
      } else { // direction === 'prev'
          if (currentQuestionIndex > 0) {
              setCurrentQuestionIndex(currentQuestionIndex - 1);
          }
      }
  };

  // Render logic
  if (isLoadingData) {
    return <div className="p-4 text-center">질문 및 답변 로딩 중...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">오류: {error}</div>;
  }

  if (questions.length === 0) {
      return <div className="p-4 text-center text-gray-500">선택된 모듈에 대한 질문을 찾을 수 없습니다.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
       return <div className="p-4 text-center text-red-500">오류: 현재 질문을 표시할 수 없습니다.</div>;
  }
  const progressText = `질문 ${currentQuestionIndex + 1}/${questions.length}`;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="space-y-6 flex-grow">
        <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-gray-800">핵심 질문</h2>
             {currentModuleName && (
                 <p className="text-lg font-semibold text-indigo-700">{currentModuleName} 훈련</p>
             )}
            <p className="text-sm font-medium text-gray-500">{progressText}</p>
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">
               <span className="text-indigo-500 mr-1">Q{currentQuestionIndex + 1}.</span> {currentQuestion}
            </h3>
            <textarea
              value={currentAnswer}
              onChange={handleAnswerChange}
              placeholder="답변을 입력하세요..."
              className="w-full p-3 border border-gray-300 rounded-md min-h-[150px] focus:ring-indigo-500 focus:border-indigo-500"
              rows={5}
              disabled={isSaving}
            />
             {error && <p className="text-sm text-red-500 mt-1">저장 오류: {error}</p>} 
        </div>

        <div className="flex justify-between items-center pt-4">
            <button
                onClick={() => navigateQuestion('prev')}
                disabled={isFirstQuestion || isSaving}
                className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                이전
            </button>
            <button
                onClick={() => navigateQuestion('next')}
                disabled={isSaving || !currentAnswer.trim()} // Disable if no answer or saving
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSaving ? '저장 중...' : (isLastQuestion ? '완료 및 저장' : '다음 및 저장')}
            </button>
        </div>
    </div>
  );
};

export default TrainingSection; 