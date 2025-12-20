-- 공지사항 테이블에 notice_date 컬럼 추가
-- Supabase SQL Editor에서 실행

-- 1. notices 테이블에 notice_date 컬럼 추가 (기본값: 현재 날짜)
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS notice_date DATE DEFAULT CURRENT_DATE;

-- 2. 기존 데이터에 대해 created_at 날짜를 notice_date로 설정
UPDATE notices 
SET notice_date = DATE(created_at) 
WHERE notice_date IS NULL;

-- 3. events 테이블에 event_date 컬럼 추가 (소식 날짜)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT CURRENT_DATE;

-- 4. 기존 데이터에 대해 created_at 날짜를 event_date로 설정
UPDATE events 
SET event_date = DATE(created_at) 
WHERE event_date IS NULL;
