# MEDI v0.9 QA

검사한 항목:

- Python 문법 검사: PASS
  - app/config.py
  - app/provider.py
  - app/main.py
  - app/schemas.py
- JavaScript 문법 검사: PASS
  - static/app.js
  - static/local_ai.js
- Gemini mock API 멀티모달 payload 검사: PASS
  - 이미지가 `inline_data`로 전달됨
  - `responseJsonSchema` 구조화 출력 설정 포함
  - `gemini_free` ProviderResult 생성 확인
- MEDI 이미지→검색 핵심어 추출 경로 검사: PASS
- static/app.js가 참조하는 시각자료 11개 존재 여부: PASS
- static/local_ai.js 누락 여부: PASS
- OpenAI API 키를 필수로 요구하지 않음: PASS
- Groq API 키를 필수로 요구하지 않음: PASS

주의: 실제 Gemini 호출은 사용자의 API 키가 필요하므로 여기서는 키를 사용하지 않고 MockTransport로 요청 구조를 검사했습니다.
