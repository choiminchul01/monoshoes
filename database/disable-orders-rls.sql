-- ============================================
-- 🔧 개발 단계 RLS 비활성화 스크립트
-- Supabase SQL Editor에서 복사 붙여넣기 후 실행
-- ============================================

-- orders 테이블 RLS 비활성화
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 확인 메시지
SELECT 'orders 테이블 RLS 비활성화 완료!' AS result;
