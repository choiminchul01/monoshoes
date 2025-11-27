# ESSENTIA - Supabase 설정 가이드

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

템플릿은 `env-template.txt` 파일을 참고하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. Supabase 설정 확인

```bash
npm run setup
```

이 명령어는 다음을 확인합니다:
- ✅ 환경 변수 설정 확인
- ✅ 데이터베이스 연결 테스트
- ✅ Storage 버킷 존재 확인

### 4. 데이터베이스 설정

Supabase 대시보드에서 SQL Editor를 열고 `setup-database.sql` 파일의 내용을 붙여넣고 실행하세요.

이 파일은 다음을 생성합니다:
- 📦 테이블: `products`, `orders`, `order_items`
- 🔐 RLS 정책
- 📊 인덱스 및 트리거
- 🎨 샘플 데이터 (PRADA 상품 16개)

### 5. Storage 버킷 생성

`setup-storage.md` 파일의 가이드를 따라 `product-images` 버킷을 생성하세요.

**간단한 방법:**
1. Supabase 대시보드 → Storage
2. "Create a new bucket" 클릭
3. 버킷 이름: `product-images`
4. Public bucket: ✅ 체크
5. Create 클릭

### 6. 개발 서버 실행

```bash
npm run dev
```

### 7. 관리자 페이지 접속

브라우저에서 다음 URL로 이동하세요:
- **관리자 대시보드**: http://localhost:3000/admin
- **상품 관리**: http://localhost:3000/admin/products
- **주문 관리**: http://localhost:3000/admin/orders

## 📁 생성된 파일

| 파일 | 설명 |
|------|------|
| `setup-database.sql` | 통합 데이터베이스 설정 SQL |
| `setup-storage.md` | Storage 버킷 설정 가이드 |
| `scripts/setup-supabase.js` | 자동 설정 검증 스크립트 |
| `env-template.txt` | 환경 변수 템플릿 |

## 🔧 트러블슈팅

### 데이터베이스 연결 실패

1. `.env.local` 파일이 존재하는지 확인
2. Supabase URL과 Anon Key가 올바른지 확인
3. `npm run setup` 실행하여 연결 테스트

### 이미지 업로드 실패

1. `product-images` 버킷이 생성되었는지 확인
2. 버킷이 **Public**으로 설정되었는지 확인
3. `setup-storage.md` 파일의 정책 설정 확인

### RLS 정책 오류

`setup-database.sql` 파일을 다시 실행하세요. 기존 정책은 자동으로 교체됩니다.

## 🎯 다음 단계

- [ ] 실제 상품 데이터로 교체
- [ ] 관리자 인증 추가
- [ ] 결제 시스템 연동
- [ ] 이메일 알림 설정

## 📚 추가 자료

- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)
