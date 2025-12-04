---
description: Git 커밋 및 푸시 워크플로우
---

# Git 커밋 방법 (PowerShell 호환)

PowerShell에서는 `&&` 연산자가 지원되지 않을 수 있습니다.
아래 명령어를 순서대로 실행하세요.

// turbo-all

## 커밋하기

1. 변경사항 스테이징
```powershell
git add -A
```

2. 커밋 메시지와 함께 커밋 (메시지 예시)
```powershell
git commit -m "feat: 기능 설명"
```

## 커밋 메시지 규칙

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `style:` UI/디자인 변경
- `refactor:` 코드 리팩토링
- `docs:` 문서 수정
- `chore:` 기타 작업

## 푸시하기 (원격 저장소에 업로드)

```powershell
git push origin master
```

## 상태 확인

```powershell
git status
```

## 커밋 로그 확인

```powershell
git log -n 5 --oneline
```
