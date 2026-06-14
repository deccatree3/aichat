# 다음 세션 시작 프롬프트

`C:\codex\aichat`에서 이어서 작업하세요.

먼저 읽을 파일:

- `AGENTS.md`
- `CONTEXT.md`
- `HANDOFF.md`
- 최신 `chat_log/*_digest.md`

현재 프로젝트는 Vite React 프로토타입이며 Supabase Auth/DB/Edge Function을 사용합니다. 최근 작업은 카카오 소셜 로그인, 앱 회원 생성, 탈퇴 처리, 카카오 연결 해제, 회원 ID 명칭 통일입니다.

중요한 현재 기준:

- 우리 서비스 회원 ID는 `mid`.
- Supabase Auth UID는 `uid`.
- `app_users.mid`는 순번형 `bigint identity`.
- `app_users.uid`는 현재 연결된 Supabase Auth UID.
- `auth_identities.uid`는 primary key.
- `auth_identities.id`는 제거됨.
- `account_withdrawals.id`는 순번형 ID로 변경됨.
- 재가입 제한은 현재 해제됨.
- 추후 정책 검토: 벤치마킹 참고 재가입 유예기한 설정.

현재 추가된 Edge Functions:

- `frontend/supabase/functions/ensure-app-user/index.ts`
- `frontend/supabase/functions/withdraw-account/index.ts`
- `frontend/supabase/functions/check-rejoin-block/index.ts`

Supabase secrets:

- `WITHDRAWAL_HASH_SECRET` 설정됨.
- `KAKAO_ADMIN_KEY` 설정됨.

다음 우선 작업:

1. `notices.id`를 UUID에서 1, 2, 3 형식의 순번 ID로 변경.
2. 원격 Supabase DB migration 적용.
3. 공지 서비스 타입/라우팅에서 순번 ID가 문제 없는지 확인.
4. `npm run lint`, `npm run build` 실행.
5. 필요하면 변경분 커밋.

주의:

- 긴 답변에는 `AGENTS.md`의 답변 시작/끝 마커를 적용.
- 파일 본문, raw stdout, diff를 채팅에 길게 붙이지 말 것.
- 로컬 파일은 가능한 한 `file://` 링크로 보고.
- 민감 정보는 채팅이나 파일에 쓰지 말 것.
