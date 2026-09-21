# MEDI v0.2 패치 안내

## 초대코드는 무엇이었나요?
기존 버전에서 아무나 회원가입하지 못하도록 운영자가 테스터에게만 알려 주는 베타 입장 비밀번호였습니다. 이번 패치에서는 기본적으로 제거합니다.

## 변경점
- 로그인하지 않아도 바로 의료 채팅 사용
- 로그인한 사람만 `내 계정에 저장`을 켜서 대화 기록 보관
- 비로그인 페이지 진입 때 `/api/auth/me`, `/api/auth/refresh` 401이 반복되지 않도록 `/api/auth/session` 추가
- 회원가입 초대코드 기본 제거
- 앱 입력 기준 비밀번호 최소 5자
- 설정 메뉴: 라이트/다크/기기 설정, 글자 100/112/125/140%
- 화면 설정은 브라우저에 저장

## 적용 순서
1. 이 ZIP의 파일을 기존 GitHub 저장소 같은 경로에 덮어씁니다. `knowledge_bundle`은 다시 올리지 않습니다.
2. Supabase > SQL Editor에서 `supabase/OPEN_SIGNUP_PATCH.sql` 전체를 한 번 실행합니다.
3. Render > Environment에서 `ALLOW_OPEN_SIGNUP`을 `true`로 바꿉니다.
4. `SIGNUP_INVITE_CODE`는 삭제해도 됩니다.
5. 선택: `GUEST_DAILY_LIMIT=5`를 추가합니다. API가 연결된 경우 비회원 남용 방지를 위한 기본 제한입니다.
6. GitHub 커밋 후 Render에서 최신 커밋을 재배포합니다.

## 비밀번호 5자
웹앱 자체는 5자부터 받도록 바뀌었습니다. 다만 Supabase Auth의 Password Security에서 최소 길이를 더 길게 설정했다면 Supabase 정책이 우선합니다. 5자를 꼭 허용하려면 Supabase의 최소 길이도 5로 맞춰야 합니다. Supabase는 보안상 8자 이상을 권장합니다.

## 게스트 기록
게스트 대화는 서버 DB에 저장하지 않습니다. 로그인 후 `내 계정에 저장`을 켠 대화만 계정 기록으로 남습니다.
