-- 관리자만 쿠폰을 생성/수정/삭제할 수 있도록 RLS 정책 추가
-- 이 파일을 Supabase SQL Editor에서 실행하면 기존 정책을 대체합니다.

-- 기존 쿠폰 정책 삭제 및 재생성
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Only admins can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Only admins can update coupons" ON coupons;
DROP POLICY IF EXISTS "Only admins can delete coupons" ON coupons;

-- 일반 사용자: 활성화된 쿠폰만 조회 가능
CREATE POLICY "Public can view active coupons" 
ON coupons FOR SELECT 
USING (is_active = true);

-- 관리자만 쿠폰 생성/수정/삭제 가능
-- 참고: Supabase에서는 관리자 확인을 위해 service role key를 사용하거나
-- 별도의 admin role을 설정해야 합니다.
-- 현재는 service role key를 사용하는 supabaseAdmin으로만 작업합니다.

-- 일반 사용자는 쿠폰을 생성/수정/삭제할 수 없음 (정책 없음 = 거부)
