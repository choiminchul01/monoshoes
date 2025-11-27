-- orders 테이블의 RLS 정책 수정
-- 문제: 기존 RLS 정책이 클라이언트 측 업데이트를 차단
-- 해결: orders 테이블에 대한 UPDATE 권한을 모두에게 허용

-- 기존 UPDATE 정책 삭제
DROP POLICY IF EXISTS "Public Update Orders" ON orders;

-- 새로운 UPDATE 정책 생성 (모든 사용자가 orders 업데이트 가능)
CREATE POLICY "Allow all updates on orders"
ON orders
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 참고: 프로덕션 환경에서는 보안을 위해 더 제한적인 정책을 사용해야 합니다
-- 예를 들어, 특정 역할이나 조건에서만 업데이트를 허용하도록 설정
