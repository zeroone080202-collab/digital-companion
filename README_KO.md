# MEDI v0.7.2 - Render Timed Out 수정 패치

이번 패치는 Render 로그에서 Uvicorn이 정상적으로 `0.0.0.0:$PORT`에 올라왔는데도 배포가 `Timed Out` 되는 경우를 위한 패치입니다.

## 교체 파일
GitHub에서 아래 3개 파일을 같은 경로에 **통째로 덮어쓰기** 하세요.

- `app/main.py`
- `app/config.py`
- `render.yaml`

`knowledge_bundle`, `static`, 의료자료 DB는 건드리지 않습니다.

## 무엇이 바뀌었나
1. `/healthz` 추가
   - 로그인 없음
   - Supabase 조회 없음
   - 의료자료 검색 없음
   - Groq/Gemini 호출 없음
   - 즉시 200 응답만 반환
2. `render.yaml`의 `healthCheckPath`를 `/healthz`로 변경
3. TrustedHost에 `*.onrender.com`을 허용해 Render 헬스체크가 Host 검사에서 막히는 상황을 방지

## Render에서 확인할 것
GitHub에 3개 파일을 Commit한 뒤:

1. Render > MEDI Web Service > Settings
2. Health Check Path가 `/healthz`인지 확인
3. 다르면 직접 `/healthz`로 수정 후 Save Changes
4. Manual Deploy > Clear build cache & deploy

정상이라면 배포 중 `/healthz`가 2xx로 응답하고 서비스가 Live로 전환됩니다.

## 사용자 지정 도메인을 쓰는 경우
별도 도메인(예: `medi.example.com`)을 연결했다면 Render Environment에 다음처럼 추가할 수 있습니다.

`ALLOWED_HOSTS=medi.example.com,www.medi.example.com,*.onrender.com,localhost,127.0.0.1`

## 기존 환경변수
Groq, Gemini, Supabase 등 기존 환경변수는 그대로 두세요. 이 패치는 API 설정을 바꾸지 않습니다.
