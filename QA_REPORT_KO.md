# MEDI v0.6 QA 보고서

검사 완료 항목:

- Python 구문 검사: `config.py`, `main.py`, `provider.py`, `retrieval.py`, `schemas.py`, `policy.py` 통과
- JavaScript 구문 검사: `static/app.js` 통과
- 이미지 없는 짧은 의학 질문 `인공심폐기가 뭐야?` 의료 범위 판정 통과
- 비의료 질문 `파이썬으로 게임 만들어줘` 범위 밖 판정 확인
- 글 없이 이미지만 포함한 ChatRequest 검증 통과
- 실제 MEDI 지식 DB 검색:
  - `인공심폐기가 뭐야?` → 관련 자료 5건 검색
  - `무릎이 아픈데 왜 그럴까?` → 관련 자료 5건 검색
- Groq 멀티모달 요청 Mock 테스트:
  - `qwen/qwen3.8-27b` 요청에 base64 image_url 포함 확인
  - 이미지 검색용 핵심어 JSON 추출 경로 확인
- 브라우저 스모크 테스트 1440px / 390px:
  - 반응형 가로 넘침 없음
  - 건강지식/의학학습 선택 UI 제거 확인
  - 라이트/다크 설정창 표시 확인
  - 이미지 파일 단독 전송 확인
- 클립보드 붙여넣기 스모크 테스트:
  - 질문 입력칸의 paste 이벤트로 PNG 이미지 첨부 생성 확인

주의: 실제 Groq/Gemini의 외부 네트워크 호출은 사용자의 API 키가 필요하므로 Mock 요청으로 payload 구조를 검증했습니다.
