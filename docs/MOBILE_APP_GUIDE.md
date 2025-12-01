# Essentia 모바일 앱 개발 가이드

이 프로젝트는 **Capacitor**를 사용하여 하이브리드 앱으로 구성되었습니다.
현재 웹사이트 코드를 그대로 사용하여 안드로이드 앱을 만들 수 있습니다.

## 1. 사전 준비 사항
앱을 빌드하려면 다음 프로그램이 설치되어 있어야 합니다.
- **Android Studio** (안드로이드 개발 도구)
- **Java JDK** (안드로이드 빌드용)

## 2. 설정 변경 (중요!)
`capacitor.config.ts` 파일을 열어서 `server.url`을 변경해야 합니다.

```typescript
server: {
  // 개발 중일 때: 실행 중인 Next.js 서버 주소 (같은 와이파이 사용 시 IP 주소)
  // 배포 할 때: 실제 운영 중인 웹사이트 도메인 (예: https://essentia-mall.com)
  url: 'http://192.168.x.x:3000', 
  cleartext: true,
}
```

## 3. 앱 실행 방법
1. **Next.js 서버 실행**: `npm run dev`
2. **안드로이드 프로젝트 동기화**:
   ```bash
   npx cap sync
   ```
3. **안드로이드 스튜디오 열기**:
   ```bash
   npx cap open android
   ```
4. 안드로이드 스튜디오가 열리면 상단의 **Run (▶)** 버튼을 눌러 에뮬레이터나 연결된 폰에서 실행합니다.

## 4. 앱 아이콘 및 스플래시 변경
`resources` 폴더(없으면 생성)에 아이콘과 스플래시 이미지를 넣고 다음 명령어를 실행하면 자동으로 생성됩니다.
(별도 패키지 설치 필요: `npm install @capacitor/assets --save-dev`)

## 5. 배포 (APK 추출)
안드로이드 스튜디오에서:
`Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)` 메뉴를 선택하면 설치 파일(.apk)이 생성됩니다.
