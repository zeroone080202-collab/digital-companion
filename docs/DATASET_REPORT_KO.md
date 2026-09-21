# 데이터 반영 보고서
점검일: 2026-09-21. 업로드된 두 ZIP을 직접 처리한 결과입니다. 추가 메시지에는 새 데이터 첨부가 확인되지 않았습니다.

## 1. `09.필수의료 의학지식 데이터.zip`

| 항목 | 결과 |
|---|---:|
| 전체 레코드 | 69,406 |
| train 구분 레코드 | 67,486 |
| 참고 문서 / QA | 52,126 / 15,360 |
| 검증용 분리 | 1,920 |
| 실제 검색 단위 | 200,492 |
| 중복 제거 후 고유 문서 | 67,485 |
| 중복으로 건너뛴 단위 | 458 |
| 한국어 / 영어 train 레코드 | 29,521 / 37,965 |

검증용 1,920건은 실시간 답변 검색에 넣지 않았습니다. 전체 출처/환자 수준의 독립성까지 입증한 것은 아닙니다. 건강 정보 모드에서는 QA를 제외하고, 학습 모드에서만 QA를 함께 검색합니다.

연도 메타데이터는 1996~2024년 범위와 연도 미상 자료를 포함합니다. 최신 진료지침이라고 보장할 수 없습니다. 원문 일치성·저작권·의학적 정확성은 별도 검토 대상입니다.

검색은 SQLite FTS5의 단어/한글 2글자 조합 기반입니다. 다국어 의미 임베딩을 학습한 것이 아니며, 검색 점수는 의학 정확도가 아닙니다. 출처 ID의 존재는 검사하지만, 인용문이 답변을 실제로 뒷받침하는지는 사람의 평가가 필요합니다.

원본 SHA256:
`8c27ae343c6558ca92cb65e2779f5e8042ef769a2d8994f1f02ca84f7b0eb8ae`

기계 판독 보고서: `reports/8c27ae343c6558ca92cb65e2.import.json`

## 2. `archive.zip` 골절 영상

총 JPEG 1,539장: train 1,347 / valid 128 / test 64. YOLOv8 형식의 10개 라벨 분류가 들어 있습니다. 형식 오류가 있는 라벨 파일은 이 점검에서 발견되지 않았습니다. 이것은 라벨의 의학적 정확성 확인이 아닙니다.

분할 간 바이트가 완전히 같은 이미지 해시는 0개였지만, 같은 원본에서 파생됐을 가능성이 있는 **파일명 계열 100개가 분할 간 겹칩니다.** 동일 환자라는 뜻은 아니며, 환자 구분키가 없어 독립성을 확정하지 못했습니다.

`data.yaml`의 이용허락 표기는 **Private**입니다. 공개 배포·상업적 활용 권한을 확인하기 전 영상을 서비스에 올리지 마세요. 이 프로젝트 ZIP에는 영상 원본을 다시 포함하지 않았습니다.

**수행한 것:** 파일 구성, 라벨 형식, 해시·분할 위험 점검.

**수행하지 않은 것:** 영상 모델 학습, 골절 판독, 민감도·특이도·임상 성능 평가.

```bash
python tools/audit_imaging.py archive.zip --out reports
```

자세한 결과: `reports/imaging_audit.json`, `reports/imaging_manifest.jsonl`.

## 3. 새 지식 데이터 추가

UTF-8 JSON/JSONL/TXT/MD와 이 파일들을 담은 ZIP을 지원합니다. 내부 ZIP도 제한된 깊이로 읽습니다. CSV/PDF/DICOM은 이 버전에서 직접 임포트하지 않습니다. 주소를 넣어 자동 다운로드하는 기능도 없습니다.

추가 권장 JSONL (한 줄에 한 객체):

```json
{"id":"ref-001","title":"Reviewed medical reference","content":"Insert the reviewed medical reference text here.","source":"Original publication, section and license","year":"2026","split":"train"}
{"id":"qa-001","question":"An educational question?","answer":"The independently reviewed answer.","split":"validation"}
```

실제 내용은 한국어로 적어도 됩니다. 본문은 20자 이상이어야 합니다. `validation`, `valid`, `val`, `test`, `evaluation` 구분과 제공 자료의 검증 폴더명을 인식해 검색에서 제외합니다.

웹 서버를 멈추고 DB를 백업한 뒤 로컬 PC에서 실행하세요.

```bash
python tools/ingest.py new_dataset.zip
pytest -q
python tools/pack_knowledge.py
```

그다음 `knowledge_bundle`와 필요한 코드를 저장소에 반영하고 Render를 재배포합니다. 재포장하지 않으면 추가한 로컬 DB가 Render에 반영되지 않습니다. 해시가 같은 원본을 다시 임포트해도 중복 추가하지 않습니다.

개별 텍스트는 64MiB 제한이 있으므로 큰 JSON/JSONL은 더 작은 레코드 묶음으로 나누세요. 검증용 원문 내보내기는 `reports/*.heldout.jsonl`에 생성되며 Git에서는 제외됩니다.

## 4. 612MB 파일을 전달하려면

2026-09-21 확인한 ChatGPT 공식 제한은 파일당 512MB입니다. 612MB는 나누어야 합니다.[1]

가장 쉬운 방법은 압축을 풀고 내부 폴더/파일을 180~200MB 정도씩 **각각 열리는 ZIP**으로 다시 나누는 것입니다. 도구를 사용해도 됩니다.

```bash
python tools/shard_zip.py "dataset.zip" --out upload-parts --target-mb 180
```

출력된 `dataset-part-001.zip`, `002.zip` 등을 차례로 첨부하세요. `.001/.002` 바이너리 분할 방식이 아닙니다. 파일 수는 압축 후 용량이 아닌 내부 파일 크기에 따라 달라집니다. 내부의 단일 파일이 180MiB를 넘으면 그 파일을 먼저 나눠야 합니다.

채팅창으로 보내지 않고 본인 PC의 임포터에 직접 넣는 경로도 있습니다. 이 경우에도 형식·보안·용량 제한은 별도로 적용됩니다.

[1] https://help.openai.com/en/articles/8555545-file-uploads-faq
