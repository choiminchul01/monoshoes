-- 상품 삭제 정책을 manager도 가능하도록 변경

-- 기존 삭제 정책 제거
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- 새로운 삭제 정책 생성 (master와 manager 모두 가능)
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role IN ('master', 'manager')
    )
);

-- 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'products'
AND policyname = 'Admins can delete products';
