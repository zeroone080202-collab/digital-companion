# MEDI v0.6 무료 AI 연결 정리

## Groq

기본 모델은 `qwen/qwen3.8-27b`입니다. 현재 MEDI v0.6은 이 모델에 텍스트뿐 아니라 첨부 이미지도 `image_url` 데이터 URL 형식으로 전달할 수 있게 수정되어 있습니다.

- 일반 의료 질문: MEDI RAG 자료 + 질문 → Qwen
- 이미지 질문: 이미지에서 검색용 핵심어 추출 → MEDI RAG 검색 → 이미지 + MEDI 근거 + 질문 → Qwen

## Gemini

Groq 로그인이 계속 막히는 경우 동일 코드에서 Gemini로 바꿀 수 있습니다. 이미지 inline data를 함께 전달합니다.

## 브라우저 보조 AI

서버 AI가 없을 때 텍스트 답변 보조용입니다. 이미지 이해는 하지 않습니다. 따라서 이미지 기능을 제대로 쓰려면 Groq 또는 Gemini 연결을 권장합니다.
