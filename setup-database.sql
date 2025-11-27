-- ========================================
-- ESSENTIA 쇼핑몰 데이터베이스 완전 설정
-- ========================================
-- Supabase SQL Editor에서 이 파일을 한 번에 실행하세요
-- 이 파일은 모든 테이블, 인덱스, RLS 정책, 초기 데이터를 포함합니다

-- ========================================
-- 1. 테이블 생성
-- ========================================

-- Products 테이블 (상품 정보)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders 테이블 (주문 정보)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  
  -- 주문자 정보
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_postal_code TEXT,
  customer_address TEXT,
  customer_address_detail TEXT,
  customer_memo TEXT,
  
  -- 배송지 정보
  shipping_same_as_customer BOOLEAN DEFAULT false,
  shipping_name TEXT,
  shipping_phone TEXT,
  shipping_postal_code TEXT,
  shipping_address TEXT,
  shipping_address_detail TEXT,
  shipping_memo TEXT,
  
  -- 금액 정보
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  shipping_cost INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  coupon_code TEXT,
  
  -- 상태 관리
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'confirmed', 'cancelled')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items 테이블 (주문 상품 상세)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  
  -- 스냅샷 정보 (상품 정보가 변경되어도 주문 당시 정보 유지)
  product_name TEXT NOT NULL,
  product_brand TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price INTEGER NOT NULL,
  color TEXT,
  size TEXT,
  image TEXT
);

-- ========================================
-- 2. 인덱스 생성 (검색 성능 향상)
-- ========================================

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);

-- ========================================
-- 3. 트리거 및 함수
-- ========================================

-- Updated At 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Products 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. RLS (Row Level Security) 활성화
-- ========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. RLS 정책 설정
-- ========================================

-- Products 정책
-- 모든 사용자가 상품을 조회할 수 있음
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT 
USING (true);

-- 관리자만 상품을 추가할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products" 
ON products FOR INSERT 
WITH CHECK (true);

-- 관리자만 상품을 수정할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products" 
ON products FOR UPDATE 
USING (true);

-- 관리자만 상품을 삭제할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" 
ON products FOR DELETE 
USING (true);

-- Orders 정책
-- 누구나 주문을 생성할 수 있음
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" 
ON orders FOR INSERT 
WITH CHECK (true);

-- 모든 사용자가 주문을 조회할 수 있음 (임시 설정)
DROP POLICY IF EXISTS "Orders are viewable by everyone" ON orders;
CREATE POLICY "Orders are viewable by everyone" 
ON orders FOR SELECT 
USING (true);

-- 관리자만 주문을 수정할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders" 
ON orders FOR UPDATE 
USING (true) WITH CHECK (true);

-- 관리자만 주문을 삭제할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders" 
ON orders FOR DELETE 
USING (true);

-- Order Items 정책
-- 누구나 주문 아이템을 생성할 수 있음
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
CREATE POLICY "Anyone can create order items" 
ON order_items FOR INSERT 
WITH CHECK (true);

-- 모든 사용자가 주문 아이템을 조회할 수 있음 (임시 설정)
DROP POLICY IF EXISTS "Order items are viewable by everyone" ON order_items;
CREATE POLICY "Order items are viewable by everyone" 
ON order_items FOR SELECT 
USING (true);

-- 관리자만 주문 아이템을 삭제할 수 있음 (임시로 모두 허용)
DROP POLICY IF EXISTS "Admins can delete order items" ON order_items;
CREATE POLICY "Admins can delete order items" 
ON order_items FOR DELETE 
USING (true);

-- ========================================
-- 6. 초기 데이터 시딩
-- ========================================

-- 샘플 상품 데이터 삽입
INSERT INTO products (id, name, brand, price, category, images, description, stock, is_available)
VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Medium Leather Tote Bag', 'PRADA', 3500000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+1'], 'A study of the triangle inspires new geometric elements and novel interpretations of Prada''s historic stylistic code. The iconic shape is presented again in this shoulder bag with sleek lines that comes with a strap for versatility. The tonal embossed logo and the enameled metal triangle logo on the back enhance the minimalist aesthetics.', 100, true),
('550e8400-e29b-41d4-a716-446655440002', 'Re-Nylon Backpack', 'PRADA', 2800000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+2'], 'Functional and innovative, this backpack is made of Re-Nylon, a regenerated nylon yarn produced from recycled, purified plastic trash collected in the ocean, fishing nets and textile waste fibers.', 100, true),
('550e8400-e29b-41d4-a716-446655440003', 'Saffiano Leather Wallet', 'PRADA', 850000, 'WALLET', ARRAY['https://placehold.co/600x800/png?text=Wallet+1'], 'This Saffiano leather wallet is defined by its elegant, minimalist design. The accessory with slots for credit cards and pockets for bills and documents is decorated with the enameled metal triangle logo.', 100, true),
('550e8400-e29b-41d4-a716-446655440004', 'Monolith Brushed Leather Loafers', 'PRADA', 1450000, 'SHOES', ARRAY['https://placehold.co/600x800/png?text=Shoes+1'], 'The Monolith loafers made of brushed leather are characterized by the maxi rubber sole that gives the shoe a unique, modern look.', 100, true),
('550e8400-e29b-41d4-a716-446655440005', 'Embroidered Jersey T-shirt', 'PRADA', 1200000, 'CLOTHING', ARRAY['https://placehold.co/600x800/png?text=T-shirt+1'], 'This jersey tee features a boxy cut and is decorated with the embroidered logo.', 100, true),
('550e8400-e29b-41d4-a716-446655440006', 'Nylon Bucket Hat', 'PRADA', 650000, 'ACCESSORY', ARRAY['https://placehold.co/600x800/png?text=Hat+1'], 'Adorned with the iconic enameled metal triangle logo, this bucket hat is made from Re-Nylon.', 100, true),
('550e8400-e29b-41d4-a716-446655440007', 'Small Leather Shoulder Bag', 'PRADA', 2900000, 'BAG', ARRAY['https://placehold.co/600x800/png?text=Bag+3'], 'This small leather shoulder bag with soft lines is decorated with the metal lettering logo.', 100, true),
('550e8400-e29b-41d4-a716-446655440008', 'Sunglasses', 'PRADA', 550000, 'ACCESSORY', ARRAY['https://placehold.co/600x800/png?text=Glasses+1'], 'Acetate sunglasses with a rectangular shape and bold rims.', 100, true),
('550e8400-e29b-41d4-a716-446655440009', 'Leather Belt', 'PRADA', 650000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Belt+1'], 'Elegant leather belt with metal buckle.', 100, true),
('550e8400-e29b-41d4-a716-446655440010', 'Key Trick', 'PRADA', 450000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Key+1'], 'Saffiano leather key trick.', 100, true),
('550e8400-e29b-41d4-a716-446655440011', 'Hair Clip', 'PRADA', 520000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Clip+1'], 'Metal hair clip with logo.', 100, true),
('550e8400-e29b-41d4-a716-446655440012', 'Scarf', 'PRADA', 890000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Scarf+1'], 'Cashmere scarf with embroidered logo.', 100, true),
('550e8400-e29b-41d4-a716-446655440013', 'Card Holder', 'PRADA', 420000, 'WALLET', ARRAY['https://placehold.co/600x600/png?text=Card+1'], 'Leather card holder.', 100, true),
('550e8400-e29b-41d4-a716-446655440014', 'Phone Case', 'PRADA', 580000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Case+1'], 'Leather phone case.', 100, true),
('550e8400-e29b-41d4-a716-446655440015', 'Headband', 'PRADA', 490000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Headband+1'], 'Nylon headband.', 100, true),
('550e8400-e29b-41d4-a716-446655440016', 'Bracelet', 'PRADA', 750000, 'ACCESSORY', ARRAY['https://placehold.co/600x600/png?text=Bracelet+1'], 'Leather bracelet.', 100, true)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 완료!
-- ========================================
-- 이제 Supabase Storage에서 'product-images' 버킷을 생성하세요
-- setup-storage.md 파일을 참고하세요
