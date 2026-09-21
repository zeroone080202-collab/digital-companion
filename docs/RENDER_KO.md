# Render 배포 안내
## 처음에는 초대형 연구 베타로 운영하세요

이 파일은 설정 안내이며, 사용자의 Render/Supabase/OpenAI 계정에 실제 배포한 결과가 아닙니다.

## 1. 프로젝트 준비

전체 ZIP을 풀고 `MEDI_CHAT_STARTER` 폴더의 내용을 **비공개 GitHub 저장소**에 올리세요. 기존 게임 저장소와 합치지 마세요. 저장소 루트에 `render.yaml`, `requirements.txt`, `app`, `static`, `knowledge_bundle`이 보이게 합니다.

`knowledge_bundle`의 14개 `.bin`과 `manifest.json`을 모두 포함하세요. 각 조각은 최대 20MiB입니다. 압축 파일 하나를 저장소에 그대로 올리는 것이 아닙니다. 지식 본문이 포함되므로 이용권한 확인 전 공개하지 마세요.

`.env`, `.venv`, `data/knowledge.sqlite`, 실제 대화 내보내기 파일, 단순 원본 영상은 올리지 마세요. `.gitignore`를 유지하세요.

## 2. Supabase 계정·저장소

새 Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql` 전체를 실행하세요. 기존 운영 DB에 백업 없이 실행하지 마세요.

프로젝트 URL과 **publishable key 또는 anon key**를 확인합니다. Render 웹 서버에는 `service_role`/secret 관리자 키를 주지 않습니다. 웹 서버는 각 이용자의 JWT와 데이터베이스 행 접근제어(RLS)를 사용합니다.[3]

로컬 가상환경에서 다음 두 명령으로 암호화 키와 초대 코드를 만드세요.

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

Windows에서 가상환경을 활성화하지 않았다면 `python` 대신 `.venv\Scripts\python.exe`를 쓰면 됩니다. 암호화 키를 잊으면 저장된 대화를 복호화할 수 없습니다. 재배포할 때마다 키를 다시 만들지 마세요.

SQL Editor에서 아래 `YOUR_RANDOM_INVITE_CODE`를 새로 만든 초대 코드로 바꾸어 실행하세요.

```sql
update medi_private.access_settings
set invite_sha256 = encode(sha256(convert_to('YOUR_RANDOM_INVITE_CODE','UTF8')),'hex')
where singleton = true;
```

이 코드와 Render의 `SIGNUP_INVITE_CODE`는 **반드시 같아야 합니다.** 테스터에게만 전달하세요.

## 3. Render Web Service

Render에서 New > Web Service로 비공개 저장소를 연결하세요. 또는 Blueprint에서 포함된 `render.yaml`을 사용할 수 있습니다.

| 항목 | 값 |
|---|---|
| Runtime | Python 3 |
| Instance | Free (소규모 시험용) |
| Build Command | `pip install -r requirements.txt && python tools/bootstrap.py` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --no-access-log` |
| Health Check | `/api/health` |

다음 환경변수를 Render Environment에 설정합니다.

| 변수 | 입력 |
|---|---|
| `DEPLOYMENT_MODE` | `public` |
| `PYTHON_VERSION` | `3.13.5` (Blueprint 기본) |
| `SUPABASE_URL` | 본인 프로젝트의 HTTPS URL |
| `SUPABASE_ANON_KEY` | publishable/anon key |
| `DATA_ENCRYPTION_KEY` | 위에서 만든 Fernet 키 |
| `SIGNUP_INVITE_CODE` | DB에 등록한 것과 같은 초대 코드 |
| `OPENAI_API_KEY` | 본인 API 프로젝트 키; 비워 두면 AI 미연결 |
| `OPENAI_MODEL` | `gpt-5.4-mini` |
| `OPERATOR_CONTACT` | 운영자 문의·삭제 요청 이메일 |
| `DATASET_RIGHTS_CONFIRMED` | 기본 `false`; 지식 데이터의 제3자 제공/API 전송 권한 확인 후만 `true` |
| `ALLOW_OPEN_SIGNUP` | 기본 `false` 유지 |

권한 플래그는 허가를 대신하지 않습니다. `false`이면 공개 모드에서 포함 자료 검색을 비활성화합니다. 지식 자료의 권한과 골절 영상의 권한은 따로 확인하세요.

배포가 완료되면 Render가 부여한 HTTPS 주소를 Supabase Authentication의 Site URL에 등록합니다. 이메일 확인을 사용하면 가입 후 확인 메일을 열고 챗봇으로 돌아와 로그인합니다. 첫 로그인에는 초대 코드도 입력하세요. 이메일 발송 제한과 운영용 SMTP 설정은 Supabase 공식 안내를 확인하세요.[4]

## 4. 배포 후 필수 확인

A계정과 B계정을 만들어 대화 분리·삭제를 확인하세요. 계정 저장을 선택한 대화가 재배포 후에도 보이는지, 피드백 동의·삭제가 작동하는지 확인합니다. 환자 사진 대신 식별 정보가 없는 합성 이미지로 전송을 시험하세요. 이 단계는 제작 환경에서 실제 클라우드 계정으로 수행하지 않았습니다.

웹 서버의 `--workers 1`을 유지하세요. 동시 채팅 요청은 2개로 제한됩니다. 기본 일일 한도는 사용자당 20회, 전체 100회의 **API 호출 시도**입니다. UTC 자정 기준이며, 실패·중단 요청도 한도를 소모할 수 있습니다. 이것은 금액 상한 보장이 아닙니다. OpenAI 결제·사용량도 관리하세요.

## 5. 무료의 범위

Render는 OpenAI의 무료 GPT 서버가 아닙니다. 웹 앱의 호스팅과 AI 모델 이용료는 다릅니다. ChatGPT 구독에 API 사용료가 포함되지 않습니다.[2]

Render Free는 15분 비활성 후 쉬며 다음 접속에 시동 대기가 생길 수 있습니다. 재시작·재배포시 로컬 파일 변경이 유지되지 않으므로, 지식 DB는 배포 빌드에서 복원하고 계정·대화는 Supabase에 두었습니다. Render도 무료 인스턴스를 상용 운영에 쓰지 말라고 안내합니다.[1]

Supabase와 Render의 저장·트래픽·인증 정책을 배포시 다시 확인하세요. 무제한 무료 운영을 보장하지 않습니다.

## 문제 해결

`membership_required`/`invalid_invite`: Supabase SQL의 초대 코드 해시와 Render의 값이 같은지 확인하세요. 로그인창의 초대 코드도 입력합니다.

`encryption_key_mismatch`: 대화 저장시 사용했던 기존 키를 복구하세요. 임의 새 키로 해결되지 않습니다.

`knowledge`가 0: `knowledge_bundle` 조각 누락과 빌드 로그를 확인하세요. 기본 DB가 다르다는 오류는 새 데이터를 보존하라는 의미입니다. 로컬 추가 데이터를 백업·재포장한 뒤 조치하세요.

`model_access`/`quota`: 모델 권한, API 결제·한도를 확인합니다. ChatGPT에 로그인되어 있어도 API가 자동으로 연결되지 않습니다.

## 공식 출처
[1] https://render.com/docs/free

[2] https://help.openai.com/en/articles/9039756-billing-settings-in-chatgpt-vs-platform

[3] https://supabase.com/docs/guides/database/postgres/row-level-security

[4] https://supabase.com/docs/guides/auth/passwords
