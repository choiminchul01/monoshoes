import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.essentia.mall',
  appName: 'Essentia',
  webDir: 'out',
  server: {
    // 1. 개발 중일 때: 로컬 컴퓨터의 IP 주소로 설정 (예: http://192.168.0.10:3000)
    // 2. 배포 시: 실제 웹사이트 도메인으로 변경 (예: https://essentia.com)
    url: 'http://10.0.2.2:3000', // 안드로이드 에뮬레이터용 로컬 주소
    cleartext: true, // http 허용 (개발용)
  },
};

export default config;
