# MEDI v0.10.4 질문 전송 오류 수정 패치

이번 패치는 화면 콘솔의 아래 오류를 수정합니다.

`Cannot set properties of null (setting 'checked')`

원인은 `static/index.html`에는 더 이상 `consentCheck` 체크박스가 없는데, 이전 v0.10.3의 `static/app.js`가 계속 `consentCheck.checked`를 조작하려고 했기 때문입니다.

## 교체할 파일

아래 3개만 GitHub에서 같은 경로에 덮어쓰세요.

- `static/app.js`
- `static/app.css`
- `static/index.html`

## 같이 수정된 내용

- 첫 질문 전 안전 안내 동작을 현재 HTML 구조에 맞게 복구
- `다시 보지 않기` 동작 복구
- 설정의 `첫 질문 전 주의 안내` 토글 복구
- 질문 전송 버튼이 막히는 문제 수정
- 이미지 단독 전송 유지
- v0.10.3의 증상 핵심 강조 박스 유지
- 입력창의 `이미지는 Ctrl+V로 붙여넣기도 가능` 문구 제거
- 입력 안내문에서도 `사진은 붙여넣어도 돼요` 문구 제거
- 브라우저 캐시가 이전 JS를 계속 쓰지 않도록 파일 버전을 `v=1040`으로 변경

## 적용 순서

1. GitHub에서 위 3개 파일을 통째로 교체
2. Commit
3. Render -> Manual Deploy -> Clear build cache & deploy
4. 배포 후 브라우저에서 `Ctrl + Shift + R`로 강력 새로고침

이미지 Ctrl+V 붙여넣기 기능 자체는 유지됩니다. 화면에 설명 문구만 보이지 않게 했습니다.
