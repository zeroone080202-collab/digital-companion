# MEDI v0.10.1 — Gemini 502 / 새 프로젝트 모델 접근 수정 패치

## 왜 502가 났나
2026-09-18부터 Google은 새 Gemini 프로젝트에서 2.5 계열 모델 접근을 제한하기 시작했습니다. 기존 v0.10은 기본 모델이 `gemini-2.5-flash`라서 새 API 키/프로젝트에서는 403/404 등으로 실패할 수 있었고, MEDI 서버가 그 오류를 전부 502로 숨겼습니다.

## 이번 패치
- 기본 모델: `gemini-3.8-flash`
- 자동 예비 모델: `gemini-3.5-flash-lite`
- 3.8이 모델 접근/할당량/일시 장애로 실패하면 3.5 Flash-Lite 자동 시도
- Gemini의 실제 오류 내용을 화면에 표시
- 모든 Gemini 오류를 무조건 502로 바꾸던 코드 제거
- 텍스트/이미지 모두 동일한 모델 자동전환 경로 사용

## GitHub에서 교체할 파일
- `app/config.py`
- `app/provider.py`
- `app/main.py`
- `static/app.js`
- `env.example`
- `render.yaml`

## Render Environment
기존 `MEDI_AI_PROVIDER`를 새로 추가하지 말고 기존 값을 수정하세요.

```
MEDI_AI_PROVIDER=gemini
GEMINI_API_KEY=본인의 Google AI Studio API 키
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90
```

`OPENAI_*`, `GROQ_*`는 이 버전에서 필요 없습니다.

## 배포
GitHub Commit 후 Render에서 `Manual Deploy -> Clear build cache & deploy`.

배포 뒤 `https://본인주소/api/config`에서 다음을 확인하세요.
- `ai_connected: true`
- `ai_model: gemini-3.8-flash`
- `ai_fallback_model: gemini-3.5-flash-lite`

그 다음 `마취의 종류에 대해서 알려줘`처럼 텍스트 질문부터 테스트하세요. 텍스트가 성공한 뒤 이미지를 테스트하는 것이 오류 구분에 좋습니다.
