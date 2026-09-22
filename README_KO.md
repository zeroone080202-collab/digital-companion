# MEDI v0.5.2 의료 전문 AI 패치

이 패치는 현재 `digital-companion-main` 기준본에서 **교체해야 하는 파일만** 담았습니다.
`knowledge_bundle`은 건드리거나 다시 올릴 필요가 없습니다.

## 무엇이 달라졌나

- OpenAI 유료 API 의존성 없음
- MEDI 의료자료를 **먼저 검색(RAG)** 한 뒤 생성 AI에 근거로 전달
- 건강 질문에서도 QA + 참고문서(train split) 모두 활용
- `무릎이`, `허리가`, `붓고`, `열감`, `계단` 같은 일상 표현을 의료 용어/동의어와 함께 검색
- Groq 무료 서버 AI 우선 지원: `qwen/qwen3.8-27b`
- Gemini 무료 API를 선택적 예비 공급자로 지원
- 서버 AI가 없거나 실패할 때만 브라우저 WebGPU AI를 보조 수단으로 시도
- 의미 없던 흰색 `의료자료 검색` 공급자 배지 제거
- 근거가 있으면 `MEDI 근거 N건` 및 실제 검색 자료를 표시
- 라이트/다크 설정창 글자 대비 수정
- 사용자 말풍선 가독성 수정
- 첫 질문 전 안전 안내 1회 + `다시 보지 않기` + 설정에서 재활성화
- 비로그인 채팅, 로그인 사용자 대화 저장 구조 유지
- 이미지 파일은 현재 텍스트 AI로 보내지 않음. X-ray/MRI/상처 분석은 검증된 영상 모델을 별도로 붙이기 전까지 판독하지 않음

## 1. GitHub에서 교체할 파일

아래 파일을 같은 경로에 **통째로 덮어쓰기** 하세요.

```text
app/config.py
app/provider.py
app/main.py
app/retrieval.py
static/index.html
static/app.js
static/app.css
static/local_ai.js
render.yaml
env.example
```

`knowledge_bundle`은 그대로 둡니다.

## 2. 가장 추천하는 무료 AI 연결: Groq

OpenAI API 키는 필요하지 않습니다.
다만 휴대폰/PC 어디서나 안정적으로 생성형 답변을 받으려면 **무료 Groq API 키** 1개가 필요합니다.

Groq Console에서 계정을 만들고 API Key를 만든 뒤, 키는 GitHub 코드에 넣지 말고 Render의 Environment에만 저장하세요.

MEDI v0.5.2는 외부 텍스트 AI로 보내기 전에 주민등록번호 형식, 휴대전화번호, 이메일처럼 명확한 직접 식별자를 한 번 더 마스킹합니다. 다만 완전한 비식별화 기능은 아니므로 실명·환자번호 등 식별 가능한 정보는 처음부터 입력하지 않는 것이 좋습니다. Groq를 사용할 경우 Console의 Data Controls에서 Zero Data Retention(ZDR)을 켤 수 있다면 켜는 것을 권장합니다.

Render > MEDI Web Service > Environment:

```text
MEDI_AI_PROVIDER=groq
GROQ_API_KEY=여기에_본인의_Groq_키
GROQ_MODEL=qwen/qwen3.8-27b
```

기존에 아래 값이 있으면 삭제해도 됩니다.

```text
OPENAI_API_KEY
OPENAI_MODEL
```

다음 값들은 기존 값을 유지하세요.

```text
DEPLOYMENT_MODE=public
SUPABASE_URL=기존값
SUPABASE_ANON_KEY=기존값
DATA_ENCRYPTION_KEY=기존값
ALLOW_OPEN_SIGNUP=true
```

### 매우 중요: 의료자료 검색 활성화

Render의 `DATASET_RIGHTS_CONFIRMED`가 `false`이면 공개 배포에서는 의료자료를 실제 답변 검색에 사용하지 않습니다.
화면에 67,485건이 표시돼도 검색은 꺼질 수 있습니다.

**해당 데이터셋을 이 연구 웹서비스에서 사용할 권한을 본인이 확인한 경우에만** 다음처럼 바꾸세요.

```text
DATASET_RIGHTS_CONFIRMED=true
```

이용권한을 확인하지 못했다면 `false`를 유지하세요.

## 3. 선택 사항: Gemini를 무료 예비 AI로 같이 사용

Groq 무료 한도에 걸렸을 때 Gemini로 자동 전환하려면:

```text
MEDI_AI_PROVIDER=auto
GROQ_API_KEY=본인의_Groq_키
GROQ_MODEL=qwen/qwen3.8-27b
GEMINI_API_KEY=본인의_Gemini_키
GEMINI_MODEL=gemini-2.5-flash-lite
```

건강 관련 질문에서는 식별 가능한 개인정보를 넣지 않는 것을 권장합니다.
Gemini 무료 등급은 Google의 공개 가격표상 제품 개선에 사용될 수 있다고 표시되어 있으므로, MEDI 기본 추천은 Groq입니다.

## 4. Render 재배포

GitHub Commit 후 Render에서:

```text
Manual Deploy
→ Clear build cache & deploy
```

배포가 끝나면 MEDI > 설정에서 아래처럼 보여야 합니다.

```text
MEDI 의료 AI
Groq 무료 서버 AI 연결됨 · qwen/qwen3.8-27b

내 의료지식 자료
MEDI 의료자료 활성 · 67,485건
```

## 5. 작동 테스트

예를 들어 다음처럼 입력하세요.

```text
무릎이 너무 아파
```

정상 흐름은 다음과 같습니다.

```text
질문
→ MEDI 의료자료 검색
→ 관련 QA/참고문서 최대 5개 선별
→ 해당 근거를 Qwen에 전달
→ 의료 전문 프롬프트로 답변 생성
→ 관련 근거/후속 질문 표시
```

이 버전은 단순 Qwen 챗봇이 아닙니다. 생성 모델 자체를 사용자의 데이터로 새로 파인튜닝한 것은 아니지만, **매 질문마다 사용자가 제공한 MEDI 데이터베이스를 먼저 검색해서 근거로 넣는 RAG 의료 AI**입니다.

## 6. 이미지 기능에 대해

현재 v0.5.2는 X-ray, MRI, 상처 사진을 텍스트 생성 AI에 보내서 진단하는 척하지 않습니다.
실제 이미지 의료 AI는 다음 단계에서 별도로 진행해야 합니다.

```text
영상 데이터셋
→ 학습/검증 분리 점검
→ 영상 분류/탐지 모델 학습
→ 성능 평가
→ Grad-CAM 등 설명가능성 시각화
→ MEDI 연결
```

Grad-CAM은 실제로 학습된 영상 모델에 적용해야 하므로, 검증되지 않은 모델로 가짜 히트맵을 만들지 않습니다.
