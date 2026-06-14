# Team Codex Instructions (Essentials)

이 6개 기능에 필요한 규칙만 담았습니다. 개인 메모리·세션·raw trace·credential 규칙은 포함하지 않습니다.
기존 `~/.codex/AGENTS.md`가 있으면 **백업 후 필요한 섹션만 병합**하세요.

---

## 1. PDF parse

PDF 경로 + "파싱/parse/md로 변환/텍스트로 뽑아/LLM용으로/이 PDF 정리"면 즉시 실행.
- 도구: `pdf_parse_llm.py` (텍스트 레이어 추출 + 부족 페이지만 Gemini Vision OCR, 표는 markdown 표 복원)
- 출력: `~/Downloads/<stem>_LLM.md`. WebFetch 직접 호출·내용 복붙 요청 금지. 결과는 file:// 링크로만 보고

## 2. YouTube 요약 + HTML

URL/영상ID + "요약/정리/자막/summarize"면 실행. 상세는 `AUTOMATIONS.md` §1.
- 자막 추출 → gemini-2.5-flash 요약 → md → HTML 자동 변환·브라우저 오픈
- 채팅에 길게 붙이지 말고 `.md`/`.html` 링크 + 길이/언어만 보고. 시사점은 "독자 맞춤"

## 3. 컨저 / 풀컨저 / 심플컨저

"컨저/심플컨저/풀컨저/컨파/오늘 여기까지"면 세션 맥락 보존. 스킬 `context-carryover` 사용. 상세는 `AUTOMATIONS.md` §3.
- 심플: `NEXT_SESSION.md`+`HANDOFF.md` / 표준: +`CONTEXT.md`+`chat_log/` 요약 / 풀: +`chat_log/raw_traces/` 복사 또는 manifest
- 기준은 **마지막 컨저 이후** 구간(`chat_log/.last_conjo`). raw trace·credential 외부 업로드 금지. `chat_log/`는 gitignore

## 4. 코드 raw 출력 억제

파일 본문·코드블록·stdout raw·diff를 채팅에 출력하지 않음. 변경은 한국어 1~2줄 요약, 산출물은 file:// 링크. 사용자가 "코드 보여줘" 하면 예외.

## 5. 직전 지시·답변을 가독성 HTML로

"크롬/웹/html/html로 띄워줘/가독성 좋게/브라우저로 보여줘"면 직전 답변을 좌3:우1 메모 패널 HTML로 렌더. 스킬 `html-review-memo` 사용.
- 스크립트: `html-review-memo/scripts/render_html_review_memo.py` (제목·본문·--out·--open)
- 우측 메모는 textarea + localStorage 자동저장. 코드 기본 제외(역할·프로세스·리스크 중심)

## 6. 답변 시작/끝 이모지 마커

긴 답변(10줄+ 또는 표·코드·긴 리스트) 맨 앞/뒤에 마커.

시작: 🟦×22 3줄 + `⬜ ▼…답변 시작…▼ ⬜`
끝: 🟧×22 3줄 + `⬜ ▲…답변 끝…▲ ⬜`
(4~9줄은 시작만, 3줄 이하는 생략)

---

## 공통: 파일 경로 file:// 링크

로컬 경로 평문 출력 금지. `📄 [name.ext](file:///C:/abs/path)` / 폴더는 끝에 `/`. 공백만 `%20`, 한글 원문 유지, 코드블럭 안은 원본.

## Git / 안전

- 다른 개발자 변경 되돌리지 않기, destructive git은 명시 요청 시만
- API 키·token·cookie 파일에 쓰지 않기, 민감 파일은 경로·위험만 보고
