# 핸드오프

## 현재 상태

`C:\codex\aichat`는 Vite React 프로토타입이며, Supabase Auth/DB/Edge Function을 사용합니다. 최근 작업의 중심은 카카오 소셜 로그인 후 회원 생성, 탈퇴, 카카오 연결 해제, 회원 ID 명칭 정리입니다.

## 최근 완료 작업

- Git 초기 스냅샷 커밋이 만들어졌습니다.
  - 커밋 메시지: `Initial project snapshot`
  - 커밋: `30ad4b6`
- `AGENTS.md`를 정상 한글 지침으로 복구했습니다.
- `chat_log/`는 gitignore 대상입니다.
- Supabase Edge Function 3개가 추가되었습니다.
  - `ensure-app-user`
  - `withdraw-account`
  - `check-rejoin-block`
- Supabase secrets가 설정되었습니다.
  - `WITHDRAWAL_HASH_SECRET`
  - `KAKAO_ADMIN_KEY`
  - 기존 Supabase URL/Anon/Service Role 계열 secret
- 탈퇴 흐름이 구현되었습니다.
  - 탈퇴 사유 입력.
  - 서비스 기록 보존.
  - 탈퇴 기록 저장.
  - 회원 상태를 withdrawn으로 변경.
  - 카카오 연결 해제 시도.
- 재가입 제한은 임시로 해제했습니다.
- 회원 ID 명칭을 정리했습니다.
  - 우리 서비스 회원 ID: `mid`
  - Supabase Auth UID: `uid`
  - `app_users.mid`: 순번형 회원 ID.
  - `app_users.uid`: 현재 연결된 Supabase Auth UID.
- `auth_identities.id`는 삭제했고, `auth_identities.uid`가 primary key입니다.
- `account_withdrawals.id`는 UUID에서 순번형 ID로 변경했습니다.

## 중요한 파일

- `AGENTS.md`
- `CONTEXT.md`
- `HANDOFF.md`
- `NEXT_SESSION.md`
- `frontend/src/auth/authService.ts`
- `frontend/src/auth/AuthContext.tsx`
- `frontend/src/auth/types.ts`
- `frontend/src/pages/AuthCallbackPage.tsx`
- `frontend/src/pages/WithdrawalPage.tsx`
- `frontend/src/db/profileService.ts`
- `frontend/src/db/notificationService.ts`
- `frontend/src/db/walletService.ts`
- `frontend/src/db/blockService.ts`
- `frontend/src/notices/noticeService.ts`
- `frontend/src/support/supportService.ts`
- `frontend/supabase/001_core.sql`
- `frontend/supabase/notices.sql`
- `frontend/supabase/support.sql`
- `frontend/supabase/member_id_uid_migration.sql`
- `frontend/supabase/auth_identities_drop_id.sql`
- `frontend/supabase/functions/ensure-app-user/index.ts`
- `frontend/supabase/functions/withdraw-account/index.ts`
- `frontend/supabase/functions/check-rejoin-block/index.ts`

## 현재 Git 상태

작업트리는 깨끗하지 않습니다. 주요 변경은 회원 ID/탈퇴/Supabase 함수 관련 파일입니다.

새 파일:

- `frontend/supabase/functions/`
- `frontend/supabase/member_id_uid_migration.sql`
- `frontend/supabase/auth_identities_drop_id.sql`

수정 파일:

- `AGENTS.md`
- `CONTEXT.md`
- `HANDOFF.md`
- `NEXT_SESSION.md`
- `frontend/src/auth/*`
- `frontend/src/db/*`
- `frontend/src/notices/noticeService.ts`
- `frontend/src/pages/AdminNoticeFormPage.tsx`
- `frontend/src/pages/AdminNoticeGuard.tsx`
- `frontend/src/pages/WithdrawalPage.tsx`
- `frontend/src/support/supportService.ts`
- `frontend/supabase/001_core.sql`
- `frontend/supabase/notices.sql`
- `frontend/supabase/support.sql`

Git 명령 실행 시 `C:\Users\decca/.config/git/ignore` 권한 경고가 나올 수 있습니다. 현재 작업에는 치명적이지 않습니다.

## 다음 우선 작업

1. 사용자가 요청했던 `notices.id`를 UUID에서 1, 2, 3 형식의 순번 ID로 변경.
2. 변경 후 `frontend/src/notices/noticeService.ts` 타입과 ID 문자열 변환 필요 여부 확인.
3. Supabase 원격 DB에 migration 적용.
4. `npm run lint`, `npm run build`로 검증.
5. 사용자 요청 시 현재 변경분을 Git 커밋.

## 보류/정책 결정

- 재가입 유예기한 정책:
  - 현재는 제한 없음.
  - 추후 벤치마킹 후 없음/7일/30일/조건부 제한 중 결정.
- 탈퇴 후 보존 데이터 범위:
  - 현재 사용자 의사: 탈퇴해도 서비스 내 구매, 방문, 행동 기록은 남겨야 함.
- Kakao에서 수집하는 정보:
  - 현재 명시 범위는 `account_email`.
  - provider user id는 원문 저장하지 않고 hash 저장.

## 검증 기준

최근 검증:

- `frontend`에서 `npm run lint` 통과.
- `frontend`에서 `npm run build` 통과.
- Vite chunk-size 경고는 남아 있습니다.

## 응답 규칙

- 한국어로 답합니다.
- 긴 답변에는 `AGENTS.md` 마커 규칙을 지킵니다.
- 로컬 파일은 가능한 한 `file://` 링크로 보고합니다.
- 긴 코드/로그/diff를 채팅에 붙이지 않습니다.
