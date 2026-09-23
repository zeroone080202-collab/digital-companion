# MEDI v0.10 QA

검사 결과:

- Python 문법 검사: PASS
  - app/config.py
  - app/main.py
  - app/provider.py
  - app/schemas.py
- JavaScript 문법 검사: PASS
  - static/app.js
- `app/main.py`의 일반 질문 경로에서 `fixed_answer('out_of_scope')` 제거 확인: PASS
- 일반 질문의 브라우저 보조 AI 자동 폴백 제거 확인: PASS
- Gemini 미설정 시 고정 검색답변 대신 `gemini_not_configured` 오류 반환 확인: PASS
- Gemini 오류 시 검색 결과를 AI 답변으로 가장하는 fallback 제거 확인: PASS
- 시각자료 자동 표시 조건을 명시적 시각 의도(그림/구조/위치/해부/흐름/원리 등)로 제한: PASS
- `static/index.html`에서 `local_ai.js` 로딩 제거: PASS
- Gemini 기본 모델 `gemini-2.5-flash`: 확인
- 이미지 inline_data 전송 코드는 유지: 확인

실제 Google 서버 호출은 사용자의 Gemini API 키가 없으므로 실행하지 않았습니다.
