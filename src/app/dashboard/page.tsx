'use client'; // 클라이언트 컴포넌트로 변경

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // 클라이언트 컴포넌트용 클라이언트 생성
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // useRouter 사용
import { useEffect, useState, useCallback } from 'react'; // useState, useEffect, useCallback 추가
import toast from 'react-hot-toast'; // Import toast
import { getModuleById, trainingModules } from '@lib/trainingModules'; // Import trainingModules too

interface Idea {
  id: string;
  title: string | null;
  description: string | null;
  module_type: string | null; // Add module_type
  created_at: string | null;
}

// Helper function to format date (optional)
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null); // 사용자 ID 상태 추가
  // Sorting and Filtering states
  const [sortBy, setSortBy] = useState('created_at'); // Default sort field
  const [sortOrder, setSortOrder] = useState('desc'); // Default sort order
  const [filterModule, setFilterModule] = useState('all'); // Default filter

  const router = useRouter();
  const supabase = createClientComponentClient(); // 클라이언트 컴포넌트에서 Supabase 클라이언트 생성

  // Fetch user info and ideas based on sort/filter
  const fetchUserDataAndIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    let sessionUserId = null;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(`세션 오류: ${sessionError.message}`);
      if (!session) {
        router.push('/login');
        return; // Exit early if no session
      }
      sessionUserId = session.user.id;
      setUserId(sessionUserId);

      let query = supabase
        .from('ideas')
        .select('id, title, created_at, description, module_type') // Select module_type
        .eq('user_id', sessionUserId);

      // Apply filter if not 'all'
      if (filterModule !== 'all') {
        query = query.eq('module_type', filterModule);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: fetchedIdeas, error: fetchError } = await query;

      if (fetchError) throw new Error(`아이디어 로딩 오류: ${fetchError.message}`);
      
      setIdeas(fetchedIdeas || []);

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err.message);
      toast.error(`데이터를 불러오는 중 오류 발생: ${err.message}`);
      setError(err.message); // Set critical error state
    }
    setLoading(false);
  }, [supabase, router, sortBy, sortOrder, filterModule]);

  useEffect(() => {
    fetchUserDataAndIdeas();
  }, [fetchUserDataAndIdeas]);

  // 아이디어 삭제 핸들러
  const handleDelete = useCallback(async (ideaId: string) => {
    if (!window.confirm('정말로 이 아이디어를 삭제하시겠습니까? 연관된 트레이닝 데이터도 함께 삭제됩니다.')) {
      return;
    }
    if (!userId) {
        toast.error("사용자 정보가 없어 삭제할 수 없습니다.");
        return;
    }

    const toastId = toast.loading('아이디어를 삭제하는 중...');

    try {
      // 1. training_answers 삭제
      const { error: deleteAnswersError } = await supabase
        .from('training_answers')
        .delete()
        .eq('idea_id', ideaId)
        .eq('user_id', userId);
      // Log error but don't necessarily block idea deletion if answers don't exist
      if (deleteAnswersError && deleteAnswersError.code !== 'PGRST116') { 
        console.warn(`Could not delete training answers (may not exist): ${deleteAnswersError.message}`);
        // Optionally show a warning toast
        // toast.warning('연관된 답변 데이터 삭제 중 문제가 발생했습니다.', { id: toastId });
      }

      // 2. ideas 삭제
      const { error: deleteIdeaError } = await supabase
        .from('ideas')
        .delete()
        .eq('id', ideaId)
        .eq('user_id', userId);
      if (deleteIdeaError) {
        throw new Error(`아이디어 삭제 중 오류: ${deleteIdeaError.message}`);
      }

      // 3. 상태 업데이트 및 성공 토스트
      setIdeas((prevIdeas) => prevIdeas.filter((idea) => idea.id !== ideaId));
      toast.success('아이디어가 삭제되었습니다.', { id: toastId });
      setError(null); // Clear any previous errors

    } catch (err: any) {
      console.error('Error deleting idea:', err.message);
      toast.error(`아이디어 삭제 실패: ${err.message}`, { id: toastId });
      // setError(`아이디어 삭제 중 오류가 발생했습니다: ${err.message}`); // Optionally set state too
    }
  }, [supabase, userId]);

  if (loading) {
    return <div className="text-center py-10">로딩 중...</div>;
  }

  // Only show critical error state if loading failed completely
  if (error && ideas.length === 0) {
    return (
        <div className="text-center py-10 px-6 bg-white rounded-lg shadow border border-red-200">
             <p className="text-red-600 mb-4">데이터 로딩 중 오류가 발생했습니다: {error}</p>
             <button onClick={() => fetchUserDataAndIdeas()} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded hover:bg-indigo-700">
                 다시 시도
             </button>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-0"> {/* Responsive padding */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"> {/* Responsive layout */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">내 아이디어 목록</h1>
        <Link
            href="/idea"
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-center" // Responsive width
        >
            + 새 아이디어 만들기
        </Link>
      </div>

      {/* Sorting and Filtering UI */}
      <div className="flex flex-col sm:flex-row justify-end items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          {/* Filter by Module */}
          <div className="flex items-center space-x-2">
              <label htmlFor="filterModule" className="text-sm font-medium text-gray-700">모듈 필터:</label>
              <select 
                  id="filterModule"
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                  <option value="all">전체 모듈</option>
                  {trainingModules.map(module => (
                      <option key={module.id} value={module.id}>{module.name}</option>
                  ))}
              </select>
          </div>
          {/* Sort By */}
          <div className="flex items-center space-x-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">정렬 기준:</label>
              <select 
                  id="sortBy"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                  <option value="created_at">생성일</option>
                  <option value="title">제목</option>
                  {/* Add other sortable fields if needed */}
              </select>
              <select 
                  id="sortOrder"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                  <option value="desc">내림차순</option>
                  <option value="asc">오름차순</option>
              </select>
          </div>
      </div>
      
      {/* Loading indicator during refetch */}
      {loading && <div className="text-center py-4 text-gray-500">목록 업데이트 중...</div>}

      {/* Idea List */}
      {!loading && ideas.length > 0 ? (
        <div className="space-y-4">
          {ideas.map((idea) => {
            const moduleDetails = getModuleById(idea.module_type);
            const moduleName = moduleDetails?.name || '기본';
            const moduleColor = 
                idea.module_type === 'scamper' ? 'bg-blue-100 text-blue-800' : 
                idea.module_type === 'sixhats' ? 'bg-purple-100 text-purple-800' : 
                'bg-gray-100 text-gray-800';
            
            return (
              <div
                key={idea.id}
                className="bg-white p-4 sm:p-5 rounded-lg shadow border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <Link href={`/idea/${idea.id}/develop?section=overview`} className="flex-grow mb-3 sm:mb-0 group block overflow-hidden mr-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-indigo-600 mb-1 truncate">
                    {idea.title || '제목 없음'}
                  </h2>
                  {idea.description && (
                     <p className="text-sm text-gray-500 mb-2 line-clamp-2 group-hover:text-gray-600">
                        {idea.description}
                      </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                      <span 
                          title={`훈련 모듈: ${moduleName}`}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${moduleColor}`}
                      >
                          {moduleName}
                      </span>
                      <p className="text-xs text-gray-400 group-hover:text-gray-500">
                        생성일: {formatDate(idea.created_at)}
                      </p>
                  </div>
                </Link>

                <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
                  {/* 열기 Button - Links to develop page with overview section */}
                   <Link
                        href={`/idea/${idea.id}/develop?section=overview`}
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                    >
                        열기
                    </Link>
                    {/* Map Button - Links to develop page with map section */}
                     <Link
                        href={`/idea/${idea.id}/develop?section=map`}
                        className="px-3 py-1.5 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100"
                    >
                        맵 보기
                    </Link>
                   {/* Delete Button */}
                   <button
                      onClick={() => handleDelete(idea.id)}
                      className="px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                  >
                      삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Show empty state only if not loading
        !loading && (
            <div className="text-center py-10 px-6 bg-white rounded-lg shadow border border-gray-200">
              <p className="text-gray-600 mb-4">표시할 아이디어가 없습니다.</p>
              {filterModule !== 'all' && (
                 <p className="text-sm text-gray-500 mb-4">선택한 필터 '{getModuleById(filterModule)?.name || filterModule}'에 해당하는 아이디어가 없습니다.</p>
              )}
              <Link href="/idea" className="px-5 py-2.5 text-base font-medium text-center text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition duration-150">새 아이디어 만들기</Link>
            </div>
        )
      )}
    </div>
  );
} 