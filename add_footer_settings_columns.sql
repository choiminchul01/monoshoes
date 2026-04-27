-- ==========================================
-- 1. 푸터 및 설정 정보에 필요한 컬럼 추가
-- ==========================================
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS business_license TEXT,
  ADD COLUMN IF NOT EXISTS mail_order_license TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS cs_phone TEXT,
  ADD COLUMN IF NOT EXISTS cs_hours TEXT,
  ADD COLUMN IF NOT EXISTS cs_email TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS kakao_url TEXT,
  ADD COLUMN IF NOT EXISTS shipping_cost INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_shipping_cost INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS show_owner_name BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_business_license BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_mail_order_license BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_address BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cs_phone BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cs_hours BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_cs_email BOOLEAN DEFAULT true;

-- ==========================================
-- 2. 권한(RLS) 설정 (조회 및 저장 권한 문제 해결)
-- ==========================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 누구나 설정 정보를 조회할 수 있도록 허용 (푸터 표시용)
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.site_settings;
CREATE POLICY "Settings are viewable by everyone"
  ON public.site_settings FOR SELECT
  USING (true);

-- 관리자가 설정을 업데이트할 수 있도록 임시로 모든 사용자/익명에게 허용
-- (클라이언트 사이드 로직에서 서비스키 없이 저장하기 위함)
DROP POLICY IF EXISTS "Anyone can update settings" ON public.site_settings;
CREATE POLICY "Anyone can update settings"
  ON public.site_settings FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert settings" ON public.site_settings;
CREATE POLICY "Anyone can insert settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (true);
