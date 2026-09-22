# MEDI v0.6 — 일반인용 의료 전문 AI 패치

이 패치는 v0.5 계열을 기준으로 다음을 한 번에 수정합니다.

- 건강지식 / 의학학습 모드를 하나의 의료 AI 대화로 통합
- `인공심폐기가 뭐야?` 같은 짧고 넓은 의학 질문도 허용
- 일반인에게 먼저 쉬운 말로 짧게 설명하도록 프롬프트 변경
- 기존 MEDI 의료자료를 먼저 검색하는 RAG 유지/강화
- 이미지 파일 업로드 지원
- 질문창에 이미지를 Ctrl+V로 바로 붙여넣기 지원
- 글 없이 이미지만 보내기도 지원
- Groq Qwen 3.8 또는 Gemini가 연결되면 실제 이미지 입력을 멀티모달 모델에 전달
- 이미지 단독 질문일 때 이미지에서 검색어를 먼저 뽑아 MEDI 자료를 검색한 뒤 최종 답변에 함께 사용
- 검사결과지/상처사진/의료영상의 내용은 참고 수준으로 설명하고 확정 판독은 하지 않음
- 이미지 원본은 대화기록에 저장하지 않음. 서버에서 재인코딩하여 EXIF/ICC 메타데이터 제거
- 단, 이미지 픽셀 안의 이름·환자번호·생년월일은 자동 삭제되지 않으므로 사용자가 가려야 함

## 교체할 파일

GitHub 저장소에서 아래 파일의 내용을 패치 파일의 전체 내용으로 교체하세요.

- `app/config.py`
- `app/main.py`
- `app/provider.py`
- `app/retrieval.py`
- `app/schemas.py`
- `app/policy.py`
- `static/index.html`
- `static/app.js`
- `static/app.css`
- `static/local_ai.js`
- `render.yaml`
- `env.example`

`knowledge_bundle`은 다시 올리지 않습니다.

## Render 환경변수

Groq를 사용할 경우:

```text
MEDI_AI_PROVIDER=groq
GROQ_API_KEY=본인의_키
GROQ_MODEL=qwen/qwen3.8-27b
```

Gemini를 사용할 경우:

```text
MEDI_AI_PROVIDER=gemini
GEMINI_API_KEY=본인의_키
GEMINI_MODEL=gemini-2.5-flash-lite
```

둘 다 등록하고 자동 대체를 원하면:

```text
MEDI_AI_PROVIDER=auto
```

기존 `OPENAI_API_KEY`, `OPENAI_MODEL`은 필요 없습니다.

기존 Supabase 관련 값은 유지합니다.

```text
DEPLOYMENT_MODE=public
SUPABASE_URL=기존값
SUPABASE_ANON_KEY=기존값
DATA_ENCRYPTION_KEY=기존값
ALLOW_OPEN_SIGNUP=true
```

의료 데이터셋을 현재 서비스에서 이용할 권한을 확인한 경우에만:

```text
DATASET_RIGHTS_CONFIRMED=true
```

## 이미지 사용법

1. `+ 이미지` 버튼으로 JPG/PNG/WebP를 선택합니다.
2. 또는 질문 입력칸을 클릭하고 이미지 복사 후 `Ctrl+V`를 누릅니다.
3. 글을 같이 적어도 되고, 이미지만 전송해도 됩니다.
4. 최대 2장, 장당 5MB입니다.

서버 AI 키가 없거나 멀티모달 제공자 연결이 실패하면 이미지는 첨부되지만 내용 분석은 하지 않습니다. 이때 화면에 연결 상태를 안내합니다.

## 배포

파일 교체 후 GitHub에 Commit하고 Render에서:

`Manual Deploy → Clear build cache & deploy`

브라우저에서는 강력 새로고침(Ctrl+Shift+R)을 한 번 해주세요.
