# MEDI v0.8 이미지 분석·연결 안정화 패치

이번 패치는 현재 MEDI v0.7.x 위에 덮어쓰는 패치입니다. `knowledge_bundle`은 건드리지 않습니다.

## 고친 내용

- 이미지가 첨부됐는데도 실제 이미지 분석 없이 일반 문장만 나오던 문제 수정
- Groq/Gemini 호출 실패 시 자동 재시도
- `MEDI_AI_PROVIDER=auto`에서 한 제공자가 실패하면 다른 제공자로 자동 전환
- 이미지 분석 실패 시 가짜 분석을 하지 않고 `이미지 다시 분석` 버튼 표시
- 브라우저가 열려 있는 동안 4분마다 `/healthz`를 가볍게 호출해 사용 중 Render가 잠드는 가능성을 줄임
- 502/503/504 및 일시적 네트워크 실패 시 브라우저에서도 자동 재연결
- 짧은 후속질문(`왜이래`)에 이전 답변 단어만 보고 엉뚱한 그림을 붙이던 문제 수정
- 단순한 그림 11종을 구조·라벨·확인 포인트가 들어간 상세 교육용 도식으로 교체
- 법률/보험 질문에는 무릎 같은 일반 해부 그림을 억지로 붙이지 않음
- 모델이 단순 통증을 `응급`으로 과하게 표시하지 않도록 서버에서 한 번 더 제한
- 캐시 문제 방지를 위해 CSS/JS 버전을 `v=0800`으로 갱신

## GitHub에서 교체할 파일

ZIP 안의 경로 그대로 덮어쓰세요.

- `app/config.py`
- `app/provider.py`
- `app/main.py`
- `app/schemas.py`
- `static/app.js`
- `static/app.css`
- `static/index.html`
- `static/visuals/*.svg` 11개
- `render.yaml`
- `env.example` (참고용)

## Render Environment 권장값

이미지 분석에는 **최소 하나의 정상적인 멀티모달 AI 키**가 반드시 필요합니다.

### Groq만 쓰는 경우

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GROQ_API_KEY=본인키
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b
```

### Gemini만 쓰는 경우

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GEMINI_API_KEY=본인키
GEMINI_MODEL=gemini-2.5-flash-lite
```

### 가장 안정적인 무료 구성

Groq와 Gemini 키를 **둘 다** 넣고 `MEDI_AI_PROVIDER=auto`로 두면 됩니다.

```text
MEDI_AI_PROVIDER=auto
MEDI_PROVIDER_FAILOVER=true
MEDI_AI_RETRIES=2
MEDI_AI_TIMEOUT=90

GROQ_API_KEY=본인키
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_VISION_MODEL=qwen/qwen3.8-27b

GEMINI_API_KEY=본인키
GEMINI_MODEL=gemini-2.5-flash-lite
```

한쪽이 일시적으로 실패하면 다른 쪽으로 넘어갑니다.

## 기존 환경변수는 유지

다음 값은 삭제하지 마세요.

```text
DEPLOYMENT_MODE=public
SUPABASE_URL=기존값
SUPABASE_ANON_KEY=기존값
DATA_ENCRYPTION_KEY=기존값
ALLOW_OPEN_SIGNUP=true
DATASET_RIGHTS_CONFIRMED=권한 확인 결과에 따라 true 또는 false
```

OpenAI API 키는 사용하지 않습니다.

## 배포

1. GitHub에 패치 파일 덮어쓰기
2. Commit
3. Render → Manual Deploy
4. `Clear build cache & deploy`
5. Settings의 Health Check Path가 `/healthz`인지 확인

## 꼭 알아둘 점

Render Free는 사용자가 아무도 없을 때 플랫폼 정책상 잠들 수 있습니다. 이 패치는 **페이지를 열어 사용하는 동안** 가벼운 keep-alive와 자동 재시도로 끊김을 줄이지만, 무료 플랜의 장시간 무중단 운영 자체를 보장하지는 못합니다.

또한 X-ray/CT/MRI 분석은 멀티모달 언어모델의 참고 설명입니다. 별도로 학습·검증한 영상진단 모델의 판독을 대신하지 않습니다.
