# Supabase Storage 설정 가이드

## 1. Storage 버킷 생성

Supabase 대시보드에서 Storage 버킷을 생성하세요:

### 단계별 가이드

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 에서 프로젝트를 선택하세요

2. **Storage 메뉴로 이동**
   - 왼쪽 사이드바에서 `Storage` 클릭

3. **새 버킷 생성**
   - `Create a new bucket` 버튼 클릭
   - 버킷 이름: `product-images`
   - Public bucket: ✅ **체크** (중요!)
   - `Create bucket` 클릭

## 2. Storage 정책 설정

버킷이 공개(public)로 설정되어 있으면 추가 정책 설정이 필요 없습니다. 하지만 더 세밀한 제어가 필요하다면 아래 SQL을 실행하세요:

### Supabase SQL Editor에서 실행

```sql
-- product-images 버킷에 대한 정책 설정

-- 1. 누구나 이미지를 볼 수 있음
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. 인증된 사용자만 이미지를 업로드할 수 있음 (선택사항)
-- 현재는 모두 업로드 가능하도록 설정
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

-- 3. 관리자만 이미지를 삭제할 수 있음 (선택사항)
-- 현재는 모두 삭제 가능하도록 설정
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
```

## 3. 이미지 업로드 테스트

관리자 페이지에서 상품을 추가하고 이미지를 업로드해보세요:

1. 개발 서버 실행
   ```bash
   npm run dev
   ```

2. 관리자 페이지 접속
   - http://localhost:3000/admin/products

3. **상품 추가** 버튼 클릭

4. 이미지 파일 선택 및 업로드

5. 업로드된 이미지 URL 확인
   - 형식: `https://your-project.supabase.co/storage/v1/object/public/product-images/filename.jpg`

## 4. 트러블슈팅

### 이미지가 업로드되지 않는 경우

1. **버킷이 공개(public)로 설정되어 있는지 확인**
   - Storage > product-images > Settings
   - Public bucket이 활성화되어 있어야 함

2. **환경 변수 확인**
   - `.env.local` 파일에 올바른 Supabase URL과 키가 설정되어 있는지 확인

3. **브라우저 콘솔 에러 확인**
   - F12 > Console 탭에서 에러 메시지 확인

### 이미지가 표시되지 않는 경우

1. **이미지 URL 형식 확인**
   - 올바른 형식: `https://[PROJECT].supabase.co/storage/v1/object/public/product-images/[FILENAME]`

2. **CORS 설정 확인**
   - Supabase는 기본적으로 CORS를 허용하지만, 문제가 있다면 Support에 문의하세요

## 5. 선택사항: 이미지 최적화

더 나은 성능을 위해 이미지 변환 기능을 사용할 수 있습니다:

```typescript
// 이미지 URL에 변환 파라미터 추가
const optimizedUrl = supabase.storage
  .from('product-images')
  .getPublicUrl(fileName, {
    transform: {
      width: 600,
      height: 800,
      resize: 'cover',
      quality: 80
    }
  });
```

## 완료!

이제 관리자 페이지에서 상품 이미지를 업로드하고 사용할 수 있습니다.
