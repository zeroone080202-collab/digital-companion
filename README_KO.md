# MEDI v0.10 — Gemini 동적 의료 AI 패치

이 버전의 핵심은 **고정 답변/브라우저 보조 AI를 답변 생성 경로에서 제거**하고, 일반 의료 질문마다 Gemini가 현재 질문과 최근 대화를 해석해서 새 답변을 만들도록 바꾼 것입니다.

## 이번에 수정한 문제

- `마취제 종류`, `인공심폐기`, `MRI는 왜 찍어?`, `수술 후 붓는 이유`처럼 MEDI 내부 검색어 목록에 정확히 없더라도 의료·건강 질문이면 Gemini가 직접 답변합니다.
- MEDI 자료는 관련 있을 때만 근거로 사용합니다. 자료가 없다고 답변이 멈추지 않습니다.
- Gemini가 연결되지 않았을 때 `MEDI 자료를 찾았습니다. 브라우저 보조 AI...` 같은 고정 답변으로 대체하지 않습니다. 대신 **Gemini API 연결 필요** 오류를 명확히 보여줍니다.
- Gemini 연결 오류 때 검색 결과를 AI 답변인 것처럼 보여주지 않습니다.
- 브라우저 WebGPU/Qwen 자동 폴백을 제거했습니다.
- 이미지가 있으면 Gemini 2.5 Flash에 실제 이미지 데이터를 함께 보내고, 이미지 관찰 + MEDI 자료 + 질문을 같이 사용합니다.
- 그림은 모든 답변에 자동으로 붙이지 않습니다. 사용자가 `그림`, `구조`, `위치`, `해부`, `흐름`, `원리`, `보여줘`처럼 **시각 설명을 명확히 원하는 경우**에만 준비된 교육용 그림 중 관련 그림이 있을 때 표시합니다.
- 질문과 맞는 그림이 없으면 억지로 다른 그림을 붙이지 않습니다.
- 명확한 응급 표현만 서버 안전장치가 먼저 처리하고, 그 밖의 의료 질문은 Gemini가 직접 답변합니다.

## 교체할 파일

- `app/config.py`
- `app/main.py`
- `app/provider.py`
- `app/schemas.py`
- `static/app.js`
- `static/app.css`
- `static/index.html`
- `render.yaml`
- `env.example`

`static/visuals/`도 ZIP에 포함되어 있습니다. 기존 폴더 위에 그대로 덮어써도 됩니다.

`knowledge_bundle`은 건드리지 마세요.

## Render 환경변수

아래 3개가 핵심입니다.

```text
MEDI_AI_PROVIDER=gemini
GEMINI_API_KEY=AI_Studio에서_만든_본인_키
GEMINI_MODEL=gemini-2.5-flash
```

기존 `OPENAI_API_KEY`, `OPENAI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`은 이 버전에서 사용하지 않습니다.

## 배포 후 확인

브라우저에서 다음 주소를 엽니다.

```text
https://본인주소.onrender.com/api/config
```

아래처럼 보여야 합니다.

```json
{
  "ai_connected": true,
  "ai_backend": "gemini",
  "ai_model": "gemini-2.5-flash",
  "image_understanding_enabled": true
}
```

`ai_connected`가 `false`이면 코드 문제가 아니라 Render에 `GEMINI_API_KEY`가 아직 들어가지 않은 상태입니다.

## 테스트 질문

```text
마취제 종류에 대해 알려줘
```

정상이라면 `MEDI 자료를 찾았습니다...` 같은 한 줄 고정문이 아니라, 전신마취/국소마취/부위마취 등 질문 자체를 해석한 새 답변이 나와야 합니다.

```text
무릎 X-ray 사진을 첨부하고: 이 사진에서 보이는 구조와 눈에 띄는 점을 설명해줘
```

정상이라면 실제 첨부 이미지를 Gemini에 보내서 참고용으로 설명합니다.

```text
무릎 구조를 그림으로 보여줘
```

이처럼 시각 설명을 명시했을 때만 관련 교육용 그림이 함께 표시됩니다.

## 주의

Gemini 무료 등급에 보낸 입력은 Google 제품 개선에 사용될 수 있습니다. 실제 환자의 이름, 주민번호, 전화번호, 환자번호, 생년월일 등이 포함된 자료는 가린 뒤 테스트하세요.
