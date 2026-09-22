# MEDI v0.8 QA 요약

검사 항목:

- Python 문법 검사: 통과
- JavaScript 문법 검사: 통과
- SVG 11개 XML 파싱: 통과
- `/healthz`: 200 OK
- `/api/config`: v0.8.0 반환 확인
- Groq 이미지 요청: `text + image_url` 멀티모달 payload 확인
- Groq 이미지 모델: `qwen/qwen3.8-27b` 사용 확인
- Groq 임시 503 발생 시 재시도 후 Gemini로 failover 확인
- 서버 이미지 채팅 경로: `image_analysis_ok=true` 응답 확인
- 이미지 분석 실패 시 가짜 분석 대신 재시도 UI를 표시하도록 구현
- 자동 그림 선택: 현재 질문 문구만 기준으로 선택하도록 변경
- `왜이래` 같은 짧은 후속 질문이 이전 답변 때문에 무릎 그림을 띄우지 않도록 수정
