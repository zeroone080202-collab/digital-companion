# MEDI v0.4 무료 기기 AI 패치

이 패치는 OpenAI API를 사용하지 않습니다. Render/Supabase는 웹앱, 계정, 대화 저장, 의료자료 검색에 사용하고, 생성형 답변은 지원되는 브라우저의 WebGPU에서 무료 오픈소스 모델로 생성합니다.

## 교체/추가할 파일

- `static/index.html` 교체
- `static/app.js` 교체
- `static/app.css` 교체
- `static/local_ai.js` 새로 추가
- `app/main.py` 교체
- `app/config.py` 교체
- `app/schemas.py` 교체
- `app/provider.py` 교체

`knowledge_bundle`은 건드리지 않습니다.

## Render Environment

다음 두 환경변수가 있으면 삭제하세요.

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

OpenAI나 다른 유료 AI API 키를 새로 만들 필요가 없습니다.

다음 기존 변수는 그대로 유지합니다.

- `DEPLOYMENT_MODE=public`
- `SUPABASE_URL=...`
- `SUPABASE_ANON_KEY=...`
- `DATA_ENCRYPTION_KEY=...`
- `ALLOW_OPEN_SIGNUP=true` (공개 회원가입을 사용할 때)
- `PYTHON_VERSION=3.13.5` (현재 배포에서 사용 중이면 유지)
- `DATASET_RIGHTS_CONFIRMED=true` 는 해당 의료 데이터셋을 공개 서비스에서 검색/표시할 이용권한을 확인한 경우에만 사용합니다. 확인 전에는 false로 둡니다.

`SUPABASE_ANON_KEY`는 AI 키가 아닙니다. 로그인/대화 저장을 위한 Supabase 연결 키이므로 삭제하지 않습니다.

## 배포

1. 위 8개 파일을 GitHub의 같은 경로에 통째로 덮어씁니다.
2. Commit 합니다.
3. Render에서 `Manual Deploy` -> `Clear build cache & deploy`를 실행합니다.
4. 사이트를 새로 열고 `설정` -> `무료 AI 준비`를 누릅니다.
5. 첫 질문에서 안전 안내를 확인합니다. `다시 보지 않기`를 누르면 이후 자동으로 뜨지 않으며 설정에서 다시 켤 수 있습니다.

## 동작 방식

질문 -> MEDI 서버에서 업로드 의료자료 검색(RAG) -> 검색 근거를 브라우저로 전달 -> 브라우저의 무료 오픈소스 LLM이 한국어 답변 생성

지원되지 않는 기기에서는 생성형 답변 대신 의료자료 검색 결과를 보여줍니다.

## 아직 하지 않는 것

이 버전의 무료 언어모델은 X-ray/MRI/상처 사진을 판독하지 않습니다. 영상 분석과 Grad-CAM은 별도로 학습/검증한 영상 모델을 준비한 뒤 연결해야 합니다.
