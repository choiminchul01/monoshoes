-- ========================================
-- SECURITY ENHANCED RLS POLICIES
-- ========================================
-- Supabase SQL Editor에서 이 파일을 실행하여 보안 정책을 강화하세요
-- 기존의 "임시로 모두 허용" 정책을 실제 권한 검증으로 변경합니다

-- ========================================
-- 1. Products 테이블 정책 강화
-- ========================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

-- 관리자만 상품을 추가할 수 있음
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role IN ('master', 'manager')
    )
);

-- 관리자만 상품을 수정할 수 있음
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role IN ('master', 'manager')
    )
);

-- 관리자만 상품을 삭제할 수 있음
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role = 'master'
    )
);

-- ========================================
-- 2. Orders 테이블 정책 강화
-- ========================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- 본인 주문만 조회 가능 또는 관리자
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (
    -- 관리자는 모든 주문 조회 가능
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
    -- 또는 본인의 이메일로 주문한 경우 (비회원 주문 포함)
    OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    -- 또는 인증되지 않은 사용자는 조회 불가 (비회원 주문 확인 페이지는 별도 처리)
);

-- 관리자만 주문을 수정할 수 있음
CREATE POLICY "Admins can update orders"
ON orders FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- 관리자만 주문을 삭제할 수 있음
CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role = 'master'
    )
);

-- ========================================
-- 3. Order Items 테이블 정책 강화
-- ========================================

-- 기존 정책 제거
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;

-- 본인 주문의 아이템만 조회 가능
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
USING (
    -- 관리자는 모든 주문 아이템 조회 가능
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
    -- 또는 해당 주문이 본인 것인 경우
    OR EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (
            orders.customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
            OR EXISTS (
                SELECT 1 FROM admin_roles WHERE user_id = auth.uid()
            )
        )
    )
);

-- 관리자만 주문 아이템을 수정할 수 있음
CREATE POLICY "Admins can update order items"
ON order_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- 관리자만 주문 아이템을 삭제할 수 있음
CREATE POLICY "Admins can delete order items"
ON order_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- ========================================
-- 4. Reviews 테이블 정책 강화
-- ========================================

-- 기존 정책 확인 및 제거 (필요한 경우)
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can delete reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;

-- 인증된 사용자만 리뷰 작성 가능
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- 본인 리뷰 또는 관리자만 수정 가능
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- 본인 리뷰 또는 관리자만 삭제 가능
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- ========================================
-- 5. Wishlist 테이블 정책 강화
-- ========================================

-- 기존 정책 확인 및 제거
DROP POLICY IF EXISTS "Public wishlist access" ON wishlist;
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert to own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete from own wishlist" ON wishlist;

-- 본인 위시리스트만 조회 가능
CREATE POLICY "Users can view own wishlist"
ON wishlist FOR SELECT
USING (user_id = auth.uid());

-- 본인 위시리스트만 추가 가능
CREATE POLICY "Users can insert to own wishlist"
ON wishlist FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 본인 위시리스트만 삭제 가능
CREATE POLICY "Users can delete from own wishlist"
ON wishlist FOR DELETE
USING (user_id = auth.uid());

-- ========================================
-- 6. Coupons 테이블 정책 강화
-- ========================================

-- 관리자만 쿠폰 생성 가능
DROP POLICY IF EXISTS "Anyone can create coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can create coupons" ON coupons;
CREATE POLICY "Admins can create coupons"
ON coupons FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role IN ('master', 'manager')
    )
);

-- 관리자만 쿠폰 수정 가능
DROP POLICY IF EXISTS "Anyone can update coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can update coupons" ON coupons;
CREATE POLICY "Admins can update coupons"
ON coupons FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role IN ('master', 'manager')
    )
);

-- 관리자만 쿠폰 삭제 가능
DROP POLICY IF EXISTS "Anyone can delete coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can delete coupons" ON coupons;
CREATE POLICY "Admins can delete coupons"
ON coupons FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
        AND role = 'master'
    )
);

-- ========================================
-- 7. User Coupons 테이블 정책 강화
-- ========================================

-- 본인 쿠폰만 조회 가능
DROP POLICY IF EXISTS "Public user coupons access" ON user_coupons;
DROP POLICY IF EXISTS "Users can view own coupons" ON user_coupons;
DROP POLICY IF EXISTS "Users can insert own coupons" ON user_coupons;
DROP POLICY IF EXISTS "Admins can update user coupons" ON user_coupons;
CREATE POLICY "Users can view own coupons"
ON user_coupons FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- 본인 또는 관리자만 쿠폰 발급 가능
CREATE POLICY "Users can insert own coupons"
ON user_coupons FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- 관리자만 사용자 쿠폰 수정 가능
CREATE POLICY "Admins can update user coupons"
ON user_coupons FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- ========================================
-- 8. Point Transactions 테이블 정책 강화
-- ========================================

-- 본인 포인트 거래 내역만 조회 가능
DROP POLICY IF EXISTS "Public point transactions access" ON point_transactions;
DROP POLICY IF EXISTS "Users can view own point transactions" ON point_transactions;
CREATE POLICY "Users can view own point transactions"
ON point_transactions FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- ========================================
-- 9. Inquiries 테이블 정책 강화
-- ========================================

-- 본인 문의만 조회 가능 (비공개 문의는 본인만)
DROP POLICY IF EXISTS "Public inquiries access" ON inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can update own inquiries" ON inquiries;
CREATE POLICY "Users can view own inquiries"
ON inquiries FOR SELECT
USING (
    -- 관리자는 모두 조회 가능
    EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
    -- 본인 문의
    OR user_id = auth.uid()
    -- 공개 문의는 모두 조회 가능
    OR is_private = false
);

-- 인증된 사용자만 문의 작성 가능
CREATE POLICY "Authenticated users can create inquiries"
ON inquiries FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 본인 문의 또는 관리자만 수정 가능
CREATE POLICY "Users can update own inquiries"
ON inquiries FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = auth.uid()
    )
);

-- ========================================
-- 완료!
-- ========================================
-- RLS 정책이 강화되었습니다.
-- 이제 관리자 권한이 없으면 민감한 데이터를 수정할 수 없습니다.
