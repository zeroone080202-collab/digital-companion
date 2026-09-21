# 사용할수록 개선하는 구조

## 자동 학습과 구분하세요

사용자가 말한 내용을 정답으로 보고 즉시 모델에 주입하지 않습니다. 이 버전은 가중치 학습이 아닌 **검토된 지식 추가**로 개선하는 구조입니다. 기본 `gpt-5.4-mini`는 현재 공식 문서에서 fine-tuning 미지원으로 표시됩니다.[1]

흐름: 이용자 별도 동의 -> 피드백 대기 -> 비식별·의학 검토 -> 수정된 질문/답변·근거 기록 -> 검증용 분리 -> 지식 임포트 -> 성능 재평가 -> 재배포.

## 운영자 검토 도구

Render가 아닌 접근이 제한된 운영자 PC에서 실행합니다. 별도 환경변수 `REVIEW_SUPABASE_SERVICE_KEY`, `SUPABASE_URL`, `DATA_ENCRYPTION_KEY`가 필요합니다. 관리자 키를 공개 서버에 설정하지 마세요.

```bash
python tools/review_feedback.py export --out feedback-export.json
```

출력을 `reviewed-feedback.json`으로 복사한 후, 승인할 항목에 다음을 입력합니다.

| 필드 | 의미 |
|---|---|
| `decision` | `approved` |
| `reviewer`, `reviewed_at` | 실제 검토자, YYYY-MM-DD |
| `medical_reviewed`, `privacy_reviewed` | 실제 검토 후만 `true` |
| `evidence_reference` | 직접 확인한 원문·위치 |
| `reviewed_question`, `reviewed_answer` | 식별 정보가 제거된 검토본 |

```bash
python tools/review_feedback.py promote --reviewed reviewed-feedback.json --out curated.jsonl --attest-human-review
python tools/ingest.py curated.jsonl
pytest -q
python tools/pack_knowledge.py
```

이 도구는 승인 전 피드백이 삭제/철회되었는지 다시 확인합니다. 질문 해시로 약 20%를 검증용으로 분리하지만, 거의 같은 질문이나 같은 환자를 다른 그룹으로 나누지 않도록 사람이 추가 점검해야 합니다. 반영된 지식을 개별 삭제하는 관리 화면과 모델 학습 자동화는 아직 없습니다.

## 데이터가 어디로 가나요?

**AI 연결시:** 질문, 최근 대화, 검색된 일부 자료, 이미지를 처리하는 경우 재인코딩한 이미지가 OpenAI API로 전송됩니다. 전체 데이터셋을 매번 전송하지 않습니다. `store:false`를 설정했지만 이것은 외부 제공자의 모든 로그·저장이 없어진다는 뜻이 아닙니다. OpenAI API는 기본적으로 학습에 사용하지 않지만, 악용 모니터링 등 보존 정책가 별도로 적용됩니다.[2]

**대화 저장 선택시:** 제목·질문·답변은 서버 키로 암호화해 Supabase에 저장합니다. 운영자는 키를 보유하므로 종단간 암호화가 아닙니다. 계정 이메일, 식별자, 시간 메타데이터는 본문과 다른 방식으로 관리됩니다. 파일 이미지는 저장하지 않지만, 사진에서 읽은 글이 답변에 포함되면 함께 저장될 수 있습니다.

**저장하지 않을 때:** 브라우저 탭 메모리와 서버의 단기 중복 요청 처리 캐시를 사용합니다. 캐시는 5분 기준으로 30초마다 정리합니다. 외부 API의 보존 정책까지 이 앱이 삭제하지는 못합니다.

**피드백:** 대화 저장과 별개의 동의를 받습니다. 전화번호·이메일 등 일부 패턴 검사는 완전한 비식별화가 아닙니다. 운영자 내보내기 사본, 이미 반영된 파생 지식·백업은 별도 삭제 관리가 필요합니다. 피드백 철회만으로 모든 파생물이 자동 삭제되지는 않습니다.

EXIF는 제거하지만 사진 픽셀에 찍힌 성명·병원번호는 자동 제거하지 못합니다. 처음에는 가상/완전히 비식별화된 자료로만 시험하세요.

## 아직 필요한 일

의료 전문가의 답변 검토, 인용 정확성 평가, 우회 질문 테스트, 의도된 사용자 범위와 개인정보 정책, 계약·인허가 검토, 백업·장애 대응·모니터링은 운영 전 별도 준비가 필요합니다. 이 문서는 법적 적합성 판정이 아닙니다.

[1] https://developers.openai.com/api/docs/models/gpt-5.4-mini

[2] https://developers.openai.com/api/docs/guides/your-data
