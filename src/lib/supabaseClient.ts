import { createClient } from '@supabase/supabase-js'

// 환경 변수에서 Supabase URL과 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 타입스크립트 에러 방지를 위한 간단한 체크
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL 또는 Anon Key가 .env.local 파일에 설정되지 않았습니다.");
}

// Supabase 클라이언트 생성 및 내보내기
export const supabase = createClient(supabaseUrl, supabaseAnonKey);