MEDI 패치 v1 — 의료 이미지 인식/설명 활성화 + 연결 안정화

[패치 목적]
1) X-ray/CT/MRI 같은 영상 이미지를 업로드했을 때, 기존처럼 즉시 '판독 미지원' 고정 답변으로 막히지 않도록 수정
2) AI가 영상을 참고용으로 설명할 수 있게 프롬프트 정책 개선
3) 외부 AI 응답 실패 시 1회 자동 재시도하도록 하여 일시적 연결 실패를 완화
4) 프론트 문구를 '판독 미지원'에서 '설명 지원'으로 수정

[적용 파일]
- app/main.py
- app/provider.py
- static/app.js

[적용 방법]
프로젝트 루트(digital-companion-main)에 아래처럼 덮어쓰기 하세요.
- app/main.py -> 프로젝트의 app/main.py
- app/provider.py -> 프로젝트의 app/provider.py
- static/app.js -> 프로젝트의 static/app.js

[중요]
- .env에 OPENAI_API_KEY가 반드시 있어야 실제 이미지 분석이 동작합니다.
- OPENAI_MODEL은 Responses API + 이미지 입력을 지원하는 모델을 사용하세요.
- 이 패치는 '최종 판독'이 아니라 '참고용 설명'을 목표로 합니다.

[핵심 변경점]
- radiology 이미지 업로드 시 더 이상 백엔드에서 강제 차단하지 않음
- 시스템 프롬프트에서 영상 이미지에 대해
  * 부위/방향/정렬/눈에 띄는 이상 부위를 조심스럽게 설명 허용
  * 확정 진단, 정상 판정, 병변 배제는 금지
  * 불확실성 문구 사용 강제
- OpenAI 호출 실패(타임아웃/일시적 5xx/네트워크 문제) 시 자동 재시도 1회 추가
- UI 라벨 수정

[권장 추가 확인]
1) 서버 재시작 후 /api/config에서 ai_connected=true 인지 확인
2) X-ray 예시 업로드 후, 더 이상 '판독 미지원' 고정 응답이 나오는지 확인
3) 응답이 없으면 .env의 OPENAI_API_KEY / OPENAI_MODEL 재확인
