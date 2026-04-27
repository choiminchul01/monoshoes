-- admin_roles 테이블에 누락된 권한 제어 및 메타데이터 컬럼 추가
ALTER TABLE public.admin_roles
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"dashboard": true, "customers": false, "orders": false, "products": false, "reviews": false, "board": false, "coupons": false, "inquiries": false, "settings": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
