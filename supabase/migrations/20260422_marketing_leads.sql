-- ============================================================
-- MONO SHOES 고객 마케팅 DB (marketing_leads)
-- 120만 건 대응 설계
-- ============================================================

CREATE TABLE IF NOT EXISTS marketing_leads (
    id              BIGSERIAL PRIMARY KEY,          -- 순번 (자동증가)
    seq             INTEGER,                        -- CSV 파일 순번
    phone           VARCHAR(20) NOT NULL UNIQUE,    -- 연락처 (UPSERT 키)
    name            VARCHAR(100) NOT NULL,          -- 이름
    birth_date      DATE,                           -- 생년월일 (YYYY-MM-DD)
    gender          VARCHAR(1),                     -- 성별: M(남성) / F(여성) / U(미확인)
    gender_code     VARCHAR(1),                     -- 주민번호 뒷자리 시작번호 (1/2/3/4)
    address         TEXT,                           -- 주소 전체
    address_sido    VARCHAR(30),                    -- 시/도 (자동 파싱)
    address_sigungu VARCHAR(50),                    -- 시/군/구
    address_dong    VARCHAR(50),                    -- 읍/면/동
    consent_date    DATE,                           -- 고객 동의일자
    batch_id        VARCHAR(50),                    -- 업로드 배치 ID (추적용)
    is_real         BOOLEAN DEFAULT true,           -- 실제 고객 데이터 여부 (태깅)
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 성능 인덱스 (필터링/검색 최적화)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_phone        ON marketing_leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_name         ON marketing_leads(name);
CREATE INDEX IF NOT EXISTS idx_leads_birth_date   ON marketing_leads(birth_date);
CREATE INDEX IF NOT EXISTS idx_leads_gender       ON marketing_leads(gender);
CREATE INDEX IF NOT EXISTS idx_leads_sido         ON marketing_leads(address_sido);
CREATE INDEX IF NOT EXISTS idx_leads_sigungu      ON marketing_leads(address_sigungu);
CREATE INDEX IF NOT EXISTS idx_leads_dong         ON marketing_leads(address_dong);
CREATE INDEX IF NOT EXISTS idx_leads_batch_id     ON marketing_leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_leads_is_real      ON marketing_leads(is_real);

-- ============================================================
-- Row Level Security (관리자만 접근)
-- ============================================================
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- 관리자 정책: admin_roles 테이블 기반 접근 제어
CREATE POLICY "admin_only_leads" ON marketing_leads
    USING (
        EXISTS (
            SELECT 1 FROM admin_roles
            WHERE admin_roles.user_id = auth.uid()
        )
    );
