# QA 검증 보고서
검사일: 2026-09-21. 실제 수행한 항목과 미수행 항목을 구분합니다.

| 항목 | 결과 | 범위 |
|---|---|---|
| Python 자동 테스트 | 66개 통과 | 로컬 pytest |
| 화면·조작 | 5개 크기, 43개 확인 통과 | Chromium + 메모리 FastAPI 연결 |
| 발견된 미처리 JS 예외 | 0 | 해당 화면 테스트 시나리오 내 |
| 전체 지식 DB 복원 | 통과 | 14개 조각 SHA256 + DB SHA256 + SQLite quick_check |
| 복원된 자료 조회 | 통과 | 67,485문서, 200,492검색 단위 |
| 문법 | 통과 | Python compileall, node --check |

화면 크기: 1440x1000, 1024x768, 768x1024, 390x844, 360x800.

테스트 항목에는 중착 ZIP 임포트, 검증 데이터 제외, 중복 처리, 실패시 롤백, 이미지 형식·용량 검사, 인용 ID 검사, 동의, 요청 중복 실행 방지, 계정별 접근, 암호화, 피드백 철회 확인, API 성공/오류 응답 형식이 포함됩니다.

## 반드시 알아야 할 제한

**OpenAI API와 Supabase는 모의 응답/모의 저장소로 검사했습니다.** 실제 비용이 발생하는 모델 추론, 실제 Supabase 이메일 발송·SQL 실행, Render 외부 배포는 수행하지 않았습니다. 클라우드 RLS의 실행 성공을 이 테스트로 보장하지 않습니다.

화면은 실제 HTML/CSS/JS를 Chromium에 렌더링했지만, 테스트 환경의 브라우저 네트워크 제한으로 로컬 URL에 직접 접속하지 않았습니다. 대신 TestClient를 이용한 메모리 연결으로 서버 응답을 전달했습니다. 화면 미리보기는 **API 미연결 상태의 실행 화면**입니다. 모델이 실제 생성한 의학 답변의 예시가 아닙니다.

실제 휴대폰/Safari/Firefox, 다수 사용자 부하, Render 무료 메모리 한도 내 장기 운영, 임상 안전성·의학 정확도는 미검증입니다. 응급 규칙 테스트 통과는 민감도나 환자 안전성 수치가 아닙니다.

## 재현

```bash
pip install -r requirements-dev.txt
pytest -q
node --check static/app.js
python -m compileall -q app tools tests
python tools/bootstrap.py --db temporary-restored.sqlite
```

선택적 화면 검사: Playwright Chromium을 설치한 후 `python tests/browser_smoke.py`를 실행합니다. 다른 Chromium을 사용하려면 `CHROMIUM_PATH`에 실행 파일 경로를 설정합니다. 이 테스트는 포함된 기본 지식 DB의 건수를 기준으로 작성되었습니다. 데이터를 추가하면 기대 건수도 조정하세요.
