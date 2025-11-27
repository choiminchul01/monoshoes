-- ESSENTIA 쇼핑몰 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. Products 테이블 (상품 정보)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  price INTEGER NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Orders 테이블 (주문 정보)
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
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'cancelled')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Order Items 테이블 (주문 상품 상세)
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

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- RLS (Row Level Security) 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for products (누구나 상품 조회 가능)
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT 
USING (true);

-- Orders는 생성만 public (주문 생성은 누구나 가능)
CREATE POLICY "Anyone can create orders" 
ON orders FOR INSERT 
WITH CHECK (true);

-- Order items도 생성만 public
CREATE POLICY "Anyone can create order items" 
ON order_items FOR INSERT 
WITH CHECK (true);

-- 관리자만 모든 주문 및 상품 수정 가능 (나중에 관리자 인증 추가 후 수정)
-- 현재는 모두 조회 가능하도록 임시 설정
CREATE POLICY "Orders are viewable by everyone (temp)" 
ON orders FOR SELECT 
USING (true);

CREATE POLICY "Order items are viewable by everyone (temp)" 
ON order_items FOR SELECT 
USING (true);

-- Updated At 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Products 테이블에 트리거 적용
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
