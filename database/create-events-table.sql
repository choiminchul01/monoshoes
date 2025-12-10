-- =============================================
-- 이벤트 테이블 생성
-- =============================================

-- 1. events 테이블 생성
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    is_popup BOOLEAN DEFAULT false,  -- 팝업으로 홈에 노출할지 여부
    is_active BOOLEAN DEFAULT true,  -- 이벤트 활성화 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 정책 설정
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 읽기: 누구나 활성화된 이벤트 조회 가능
CREATE POLICY "Public can view active events"
ON events FOR SELECT
USING (is_active = true);

-- 쓰기: 인증된 사용자만 (관리자)
CREATE POLICY "Authenticated users can manage events"
ON events FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 3. Storage 버킷 생성 (이벤트 이미지용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage 정책
DROP POLICY IF EXISTS "Public Read Events" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload Events" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete Events" ON storage.objects;

CREATE POLICY "Public Read Events"
ON storage.objects FOR SELECT
USING (bucket_id = 'events');

CREATE POLICY "Auth Upload Events"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

CREATE POLICY "Auth Delete Events"
ON storage.objects FOR DELETE
USING (bucket_id = 'events' AND auth.role() = 'authenticated');

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_is_popup ON events(is_popup);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
