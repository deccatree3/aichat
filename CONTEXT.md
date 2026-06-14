# 프로젝트 컨텍스트

## 프로젝트

`C:\codex\aichat`는 Zeta 계열 AI 채팅 서비스 UI를 참고해 만든 프로토타입입니다. 현재는 `frontend/`의 Vite + React + TypeScript 앱과 Supabase Auth/DB/Edge Function을 연결하는 구조입니다.

## 주요 구조

- `frontend/`: Vite React 앱.
- `frontend/src/auth/`: Supabase Auth 래퍼와 로그인/탈퇴 흐름.
- `frontend/src/db/`: 프로필, 알림, 지갑, 차단 등 앱 DB 서비스.
- `frontend/src/notices/`: 공지 서비스.
- `frontend/src/support/`: 고객센터 서비스.
- `frontend/supabase/`: Supabase SQL과 Edge Function.
- `chat_log/`: 컨저 로그, digest, raw trace manifest.

## 현재 구현 상태

- 홈/랭킹/마이페이지/더보기/설정/고객센터/공지/관리자 공지 화면이 존재합니다.
- Supabase Auth 기반 소셜 로그인이 연결되어 있습니다.
- Google 로그인은 사용자가 동작을 확인했습니다.
- Kakao 로그인은 `account_email` 동의 범위를 사용합니다.
- Apple 로그인 코드는 남아 있으나 설정은 보류입니다.
- 고객센터는 Zeta 고객센터를 벤치마킹한 자체 React/Supabase 구조입니다.
- 공지와 고객센터는 Supabase 서비스 레이어와 fallback 데이터를 함께 사용합니다.
- 개발 서버는 보통 `http://127.0.0.1:5173/`에서 실행합니다.

## 회원/인증 ID 기준

- 우리 서비스 회원 고유 ID는 `mid`입니다.
- `app_users.mid`는 `bigint identity` 형식의 순번 ID입니다.
- Supabase Auth 사용자 ID는 `uid`입니다.
- `app_users.uid`는 현재 연결된 Supabase Auth UID입니다.
- `auth_identities.uid`는 Supabase Auth UID이며, 현재 `auth_identities`의 primary key입니다.
- `auth_identities.id` 컬럼은 제거했습니다.
- 앱 사용자 소유 데이터는 가능한 한 `mid` 컬럼을 사용하도록 정리했습니다.
- 관리자/인증 주체 컬럼은 `uid`, `created_by_uid`, `updated_by_uid`, `author_uid`처럼 Supabase Auth UID 의미가 드러나게 정리했습니다.

## 탈퇴/카카오 연결 해제

- 탈퇴 UI는 `/withdrawal`에 있습니다.
- 탈퇴 사유와 상세 사유를 입력받습니다.
- 탈퇴 요청은 Supabase Edge Function `withdraw-account`로 보냅니다.
- 탈퇴 시 현재 의도는 다음과 같습니다.
  - 서비스 이용 기록은 삭제하지 않고 보존합니다.
  - `account_withdrawals`에 탈퇴 기록을 남깁니다.
  - `app_users.status`와 `profiles.account_status`를 `withdrawn`으로 바꿉니다.
  - `auth_identities.unlinked_at`을 기록합니다.
  - Kakao 계정이면 Kakao Admin Key로 카카오 연결 해제를 시도합니다.
- `KAKAO_ADMIN_KEY`는 Supabase secret으로 설정되었습니다.
- `WITHDRAWAL_HASH_SECRET`도 Supabase secret으로 설정되었습니다.
- 재가입 제한은 현재 해제되어 있습니다.
- 추후 검토 항목: 벤치마킹을 참고해 재가입 유예기한 없음/7일/30일/조건부 제한 중 정책 결정.

## Edge Functions

현재 추가된 함수:

- `ensure-app-user`: 로그인 후 `app_users`와 `auth_identities`를 보장하고 `{ mid, uid }`를 반환합니다.
- `withdraw-account`: 탈퇴 기록, 상태 변경, 카카오 연결 해제를 처리합니다.
- `check-rejoin-block`: 현재는 재가입 제한 비활성 상태로 `{ blocked: false }`를 반환합니다.

## 데이터 수집 기준

Kakao에서 명시적으로 요청하는 동의 범위는 현재 `account_email`입니다.

카카오/소셜에서 들어오는 주요 값:

- 이메일: Supabase Auth `auth.users.email` 및 필요 시 profile 계열 데이터에 반영될 수 있습니다.
- 카카오 provider user id: 원문 저장하지 않고 `provider_user_id_hash`로 해시 저장합니다.
- 닉네임/프로필 이미지: 카카오 설정과 Supabase metadata에 따라 들어올 수 있으나, 우리 코드에서 필수 범위로 강제한 것은 이메일입니다.

## 최근 DB 변경

- `app_users.id` 계열 UUID 중심 구조를 `mid` 순번 ID 중심으로 재정리했습니다.
- `primary_auth_user_id` 의미는 `uid`로 통일했습니다.
- `account_withdrawals.id`는 UUID에서 순번 `bigint identity`로 변경했습니다.
- `auth_identities.id`는 제거했습니다.
- `notices.id`는 아직 UUID입니다. 사용자가 순번 변경을 요청했으므로 다음 작업으로 남아 있습니다.

## 검증 상태

최근 확인 기준:

- `frontend`에서 `npm run lint` 통과.
- `frontend`에서 `npm run build` 통과.
- 빌드는 Vite chunk size 경고만 남습니다.

## 작업 원칙

- 사용자 응답은 한국어로 간결하게 작성합니다.
- 긴 답변에는 `AGENTS.md`의 시작/끝 이모지 마커 규칙을 적용합니다.
- 파일 본문, 긴 stdout, diff, raw 코드를 채팅에 길게 붙이지 않습니다.
- 로컬 산출물은 가능한 한 `file://` 링크로 보고합니다.
- 다른 사람이 만든 변경은 되돌리지 않습니다.
