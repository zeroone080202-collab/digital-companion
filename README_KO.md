# MEDI v0.9 — Gemini 무료 API + 이미지 분석 + 코드 충돌 수정

이 패치는 이전 패치에서 서로 다른 버전의 `main.py`, `provider.py`, `config.py`, `app.js`가 섞이면서 생긴 오류를 정리하고, OpenAI/Groq 없이 **Google Gemini API 하나만** 사용하도록 맞춘 일관된 세트입니다.

## 이번에 고친 핵심

1. OpenAI API 의존 제거
2. Groq API 의존 제거
3. Gemini 무료 API를 서버 AI 기본값으로 사용
4. JPG/PNG/WebP 이미지를 Gemini에 실제 `inline_data`로 전송
5. X-ray/CT/MRI도 이미지 자체를 먼저 보고 참고용 설명을 생성
6. 이미지에서 뽑은 핵심어를 MEDI 의료지식 DB 검색에 추가해 RAG와 연결
7. 의료영상 업로드 시 기존 `radiology` 분류를 `photo`로 덮어쓰던 버그 수정
8. 일시적 Gemini 네트워크/5xx 오류 자동 재시도
9. v0.8에서 `index.html`은 참조하지만 패치 ZIP에 빠져 있던 `static/local_ai.js`를 다시 포함
10. app.js가 참조하는 `static/visuals/` 11개 자료를 모두 포함하여 404 오류 제거
11. 무릎 설명 그림은 더 상세한 `knee_detail.png`로 교체
12. 정적 파일 캐시 버전을 `v=0900`으로 올림

## GitHub에서 덮어쓸 파일

- app/config.py
- app/main.py
- app/provider.py
- app/schemas.py
- static/app.js
- static/app.css
- static/index.html
- static/local_ai.js
- static/visuals/*
- render.yaml
- env.example

`knowledge_bundle`은 건드릴 필요 없습니다.

## Gemini API 키 만들기

Google AI Studio에 Google 계정으로 로그인한 뒤 API Keys 메뉴에서 새 Gemini API 키를 만듭니다.

무료 티어를 사용할 때는 유료 Billing 업그레이드를 누를 필요가 없습니다. 사용량 한도는 계정/프로젝트/모델에 따라 달라질 수 있으므로 AI Studio의 Rate limits 화면에서 현재 한도를 확인하세요.

## Render 환경변수

아래 3개를 설정하세요.

```text
MEDI_AI_PROVIDER=gemini
GEMINI_API_KEY=발급받은_본인_키
GEMINI_MODEL=gemini-2.5-flash
```

기존에 아래 값이 있으면 MEDI v0.9에서는 사용하지 않으므로 삭제해도 됩니다.

```text
OPENAI_API_KEY
OPENAI_MODEL
GROQ_API_KEY
GROQ_MODEL
GROQ_VISION_MODEL
```

아래 값은 기존대로 유지하세요.

```text
DEPLOYMENT_MODE=public
SUPABASE_URL=기존값
SUPABASE_ANON_KEY=기존값
DATA_ENCRYPTION_KEY=기존값
ALLOW_OPEN_SIGNUP=true
```

본인이 MEDI에 업로드한 의료지식 자료를 공개 서비스에서 사용할 권한을 확인한 경우에만:

```text
DATASET_RIGHTS_CONFIRMED=true
```

로 설정하세요.

## 재배포

GitHub Commit 후 Render에서:

1. Manual Deploy
2. Clear build cache & deploy
3. 배포 완료 후 `/api/config`에서 `ai_connected: true`, `ai_backend: "gemini"`, `image_understanding_enabled: true`인지 확인

## 테스트 질문

이미지를 첨부한 뒤:

```text
이 X-ray에서 보이는 구조와 눈에 띄는 점을 일반인이 이해하기 쉽게 설명해줘.
```

라고 보내 보세요.

정상이라면 더 이상 `외부 이미지 이해 AI가 응답하지 않았습니다` 같은 고정 답변만 나오지 않고, Gemini가 실제 이미지에서 본 내용을 `이미지에서 보이는 점`으로 표시합니다.

## 의료정보·개인정보 주의

Gemini 무료 티어에서는 입력 데이터가 Google 제품 개선에 사용될 수 있습니다. 따라서 공개 서비스에서 이름, 주민번호, 전화번호, 환자번호, 생년월일 등 개인 식별정보가 들어간 실제 의료영상을 그대로 보내는 용도로 사용하면 안 됩니다. 반드시 가리거나 제거한 뒤 테스트하세요.

이 기능은 교육·참고용 이미지 설명이며 의료진의 최종 판독과 진단을 대체하지 않습니다.

## Dr7.ai에 대해

현재 Dr7.ai의 공식 Free 플랜은 웹 체험 기능은 있지만 무료 API 모델 접근은 제공하지 않습니다. 따라서 무료 공개 MEDI에 붙일 서버 API로는 이번 패치에서 사용하지 않았습니다.
