# MEDI v0.10.1 QA 보고서

## 수정 대상
- Gemini API 요청이 `/api/chat`에서 502로만 보이던 문제
- 새 Google AI Studio 프로젝트에서 `gemini-2.5-flash` 접근 제한 가능성
- 실제 Gemini 오류 원인이 UI에 가려지던 문제

## 적용 내용
- 기본 모델 `gemini-3.8-flash`
- 예비 모델 `gemini-3.5-flash-lite`
- 1차 모델이 403/404/429/5xx/네트워크 오류로 실패하면 예비 모델 자동 시도
- API key 인증 실패는 즉시 중단하고 정확한 오류 표시
- Gemini ProviderError를 무조건 502로 변환하던 처리 제거
- 프론트에서 Gemini 오류의 `detail`을 우선 표시
- `/api/config`에 `ai_fallback_model` 노출

## 검사
- `python3 -m py_compile app/config.py app/provider.py app/main.py app/schemas.py` 통과
- `node --check static/app.js` 통과
- MockTransport 테스트: `gemini-3.8-flash` 404 -> `gemini-3.5-flash-lite` 200 자동 전환 통과

## 제한
실제 Google API key는 사용자 비밀정보이므로 이 환경에서 실제 Google API 호출은 수행하지 않았습니다. 배포 후 사용자 Render 환경의 API key/프로젝트 권한은 실제 서비스에서 확인해야 합니다.
