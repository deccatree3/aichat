# Roadmap and Scale Notes

이 문서는 지금 당장 처리하지 않지만, 운영 전 또는 트래픽 증가 시 반드시 재검토할 항목을 기록합니다.

## 1. 운영 전 수정 필요: OAuth 동의 화면 도메인

현재 Google OAuth 동의 화면에 Supabase 프로젝트 도메인이 크게 표시됩니다.

```text
wigacihtewiugeluulhb.supabase.co
```

원인:

- 현재 Google OAuth callback이 Supabase Auth 도메인으로 연결됩니다.
- Google 동의 화면은 `App name`뿐 아니라 실제 OAuth 처리 도메인을 사용자에게 크게 보여줄 수 있습니다.

운영 전 목표:

- `supabase.co` 도메인이 사용자에게 노출되지 않게 합니다.
- 예: `auth.aichat.com`, `api.aichat.com` 같은 서비스 소유 도메인 사용
- Google OAuth 동의 화면의 앱 도메인 항목을 서비스 소유 URL로 채웁니다.
  - 애플리케이션 홈페이지
  - 개인정보처리방침 링크
  - 서비스 약관 링크

수정 옵션:

1. Supabase Custom Domain 설정
   - Supabase 유료 플랜 또는 add-on 필요 가능
   - 소유 도메인 필요
   - DNS CNAME/TXT 설정 필요
   - Google/Kakao/Apple developer console에 새 callback URL 추가 필요

2. 자체 OAuth 백엔드로 이전
   - 예: `https://api.aichat.com/auth/google/callback`
   - Supabase Auth 의존 제거 또는 축소
   - 세션 쿠키/JWT 발급을 백엔드가 담당

현재 판단:

- 개발/검증 단계에서는 그대로 둡니다.
- 일반 사용자에게 공개하기 전에는 반드시 수정합니다.

추가 메모:

- Google Branding의 `App domain` 입력값은 동의 화면의 개인정보처리방침/서비스 약관 문구에 노출됩니다.
- 아직 운영 도메인과 `/privacy`, `/terms` 페이지가 없으므로 현재는 비워둘 수 있습니다.
- 운영 전에는 최소 아래 URL을 준비합니다.

```text
https://서비스도메인/
https://서비스도메인/privacy
https://서비스도메인/terms
```

## 2. Supabase로 시작하되 유지할 경계

현재 인증 로직은 아래 파일에 격리되어 있습니다.

- `frontend/src/auth/authService.ts`
- `frontend/src/auth/supabase.ts`

나중에 인증 제공자를 바꿀 때는 `authService` 내부 구현을 교체합니다.

UI 컴포넌트는 계속 `useAuth()`만 사용해야 합니다.

지켜야 할 원칙:

- 화면 컴포넌트에서 Supabase를 직접 import하지 않습니다.
- 결제, 피스 차감, 채팅, LLM 호출은 프론트에서 직접 처리하지 않습니다.
- 사용자 ID는 내부 `profiles` 테이블에서 별도로 관리할 수 있게 설계합니다.

## 3. Zeta급 트래픽 상승 시 변경해야 할 항목

### Auth

초기:

- Supabase Auth 사용

트래픽/운영 증가 시:

- Supabase Custom Domain 적용
- 자체 OAuth 백엔드, Auth0, AWS Cognito 중 재검토
- 세션 전략을 HTTP-only secure cookie 중심으로 전환 검토

변경 신호:

- OAuth 동의 화면 브랜딩 문제가 운영 리스크가 됨
- 사용자/조직/권한 정책이 복잡해짐
- 자체 계정 병합, 정지, 탈퇴, 재가입 정책이 필요해짐

### Database

초기:

- Supabase Postgres 사용 가능

트래픽 증가 시:

- 독립 Postgres 운영 검토: RDS, Cloud SQL, Neon 등
- 읽기 replica, connection pool, query plan 관리
- 주요 테이블 partitioning 검토

변경 신호:

- 홈 피드/랭킹 조회가 느려짐
- 채팅 메시지 테이블이 빠르게 커짐
- 단일 DB에 인증/채팅/결제/랭킹 부하가 몰림

### Ranking and Feed

초기:

- DB 조회 기반 구현 가능

트래픽 증가 시:

- Redis 캐시 도입
- 랭킹 점수 계산을 batch/queue job으로 분리
- `트렌딩`, `베스트`, `신작`을 별도 materialized view 또는 cache key로 관리

변경 신호:

- 랭킹 탭 접속 시 DB 부하 급증
- 실시간 점수 계산이 API latency를 악화시킴
- 홈 피드 개인화가 필요해짐

### Chat and Realtime

초기:

- 단순 API polling 또는 제한적 realtime 사용

트래픽 증가 시:

- WebSocket 서버 분리
- 메시지 저장 API와 실시간 broadcast 분리
- Redis pub/sub, NATS, Kafka 등 이벤트 계층 검토

변경 신호:

- 동시 접속 채팅방이 많아짐
- 메시지 전송 지연 또는 중복 처리 문제가 생김
- 알림/채팅/피드 이벤트가 한 realtime 채널에 섞임

### LLM Calls

초기:

- 백엔드 API에서 provider 호출

트래픽 증가 시:

- rate limit, quota, retry, timeout, fallback model 정책 도입
- 사용자별 사용량/피스 차감 ledger와 연결
- moderation/logging/abuse detection 분리

변경 신호:

- LLM 비용 예측이 어려워짐
- 악성 사용자가 반복 호출
- 피스 차감과 응답 생성 사이 정합성 문제가 생김

### Payment and Pieces

초기:

- 결제 provider 연동은 백엔드에서 처리

트래픽 증가 시:

- 피스는 단순 balance가 아니라 ledger 기반으로 관리
- 결제 webhook idempotency key 필수
- 환불/취소/중복지급 방지 로직 강화

변경 신호:

- 결제 성공했는데 피스 미지급/중복지급 사례 발생
- 환불/이의제기 처리 필요
- 프로모션/보너스/구독 상품이 늘어남

### Storage and Media

초기:

- Supabase Storage 사용 가능

트래픽 증가 시:

- S3 또는 Cloudflare R2 + CDN 검토
- 이미지 변환/썸네일 생성 작업 큐 분리

변경 신호:

- 캐릭터 이미지/채팅 첨부 이미지 트래픽 증가
- 이미지 로딩 속도가 UX 병목이 됨
- 저장소 비용 또는 egress 비용이 커짐

### Search

초기:

- DB `LIKE`/간단 검색 가능

트래픽 증가 시:

- Meilisearch, Typesense, OpenSearch 도입 검토
- 플롯명, 태그, 캐릭터 설명 검색 인덱스 분리

변경 신호:

- 검색 결과가 느림
- 태그/랭킹/추천 검색 조건이 복잡해짐
- 오타/초성/동의어 검색이 필요해짐

## 4. 다음 구현 우선순위

1. Google 로그인 완료 상태 유지 확인
2. Kakao provider 설정
3. Apple provider는 마지막에 설정
4. Kakao 로그인 동의항목/수집 메타를 원본 서비스 수준으로 재검토
5. 신규 회원가입 운영 알림 설계
6. `profiles` 테이블 설계
7. 마이페이지 로그인 사용자 데이터와 `profiles` 연결
8. 피스 ledger 테이블 초안 작성
9. OAuth custom domain은 운영 전 작업으로 보류

## 5. 운영 알림: 신규 회원가입 알림 설정

현재 Google/Kakao/Apple로 신규 회원가입이 발생해도 담당자에게 자동 메일이 가지 않습니다.

운영 전 목표:

- 신규 회원가입 시 담당자에게 알림이 가도록 설정합니다.
- 우선순위는 자체 개발이 아니라, 사용하는 인증/운영 채널에서 제공하는 알림 기능을 활성화하는 것입니다.
- 최소 포함 정보:
  - 가입 시각
  - provider: Google/Kakao/Apple
  - 이메일
  - 닉네임 또는 표시 이름
  - Supabase/Auth user id

처리 순서:

1. Supabase 또는 연결된 Auth/운영 채널에서 신규 유저 알림 기능을 제공하는지 확인
   - 제공한다면 담당자 이메일을 등록하고 알림을 활성화
   - 설정 완료 후 Google/Kakao/Apple 가입 테스트로 실제 메일 수신 확인

2. 제공 기능이 없다면 no-code/managed 알림 채널 확인
   - Supabase integration
   - provider dashboard notification
   - 이메일 forwarding
   - Slack/Discord integration

3. 위 기능이 없거나 요구사항을 충족하지 못할 때만 커스텀 구현 검토
   - Supabase Auth Hook 또는 DB trigger + Edge Function
   - Resend, SendGrid, AWS SES 같은 메일 서비스
   - Slack/Discord webhook

4. 관리자 페이지
   - 신규 가입자 목록, provider, 가입 시각 확인
   - 이메일/Slack 알림과 별개로 장기적으로 필요

현재 판단:

- 개발 단계에서는 Supabase Dashboard > Authentication > Users에서 확인합니다.
- 운영 전에는 해당 채널에서 제공하는 신규 가입 알림 설정을 먼저 완료합니다.
- 제공 알림 기능이 없을 경우에만 custom notification 작업으로 전환합니다.
- 트래픽이 늘면 관리자 페이지와 이벤트 로그 테이블을 추가합니다.

## 6. Kakao 로그인 동의항목/수집 메타 정합성

현재 Kakao 로그인 테스트 중 `KOE205`가 발생했습니다.

원인:

- 앱이 요청한 scope:
  - `account_email`
  - `profile_image`
  - `profile_nickname`
- Kakao Developers의 동의항목에서 해당 항목이 아직 설정되지 않음

현재 결정:

- 우선 Kakao는 Supabase built-in provider로 계속 테스트합니다.
- Kakao Developers에서 `account_email`은 필수 동의로 사용합니다.
- `profile_nickname`, `profile_image`는 서비스 정책상 핵심 수집항목은 아니지만, Supabase built-in Kakao provider가 요구하는 것으로 보여 우선 선택 동의로 설정합니다.
- 선택 동의로 설정하더라도 서비스 내부에서는 닉네임/프로필 사진을 핵심 사용자 데이터로 사용하지 않습니다.

운영 전 추가 작업:

- 원본 Zeta 서비스의 Kakao 동의 화면과 비교하되, 우리 서비스에서 실제로 필요하지 않은 항목은 수집하지 않습니다.
- 요청 scope, 동의항목 이름, 필수/선택 여부, 안내 문구를 개인정보 최소수집 원칙에 맞춥니다.
- 개인정보처리방침/서비스 약관과 실제 수집항목을 일치시킵니다.
- 불필요한 개인정보 scope는 제거합니다.

현재 이슈:

- 프론트 코드에서는 Kakao scope를 `account_email`만 요청하도록 줄였습니다.
- 그런데 Supabase Kakao provider OAuth 흐름에서 `profile_nickname`, `profile_image`를 계속 요청하는 것으로 보입니다.
- 빌드 산출물에서도 `profile_nickname`, `profile_image` 문자열이 제거된 것을 확인했습니다.
- 따라서 동일한 `KOE205`가 계속 발생하면 프론트 코드가 아니라 Supabase Kakao provider 또는 Kakao provider 설정 단계에서 profile scope가 추가되는 것으로 봅니다.
- 이 경우 단기적으로는 Kakao Developers에서 profile scope를 선택 동의로 열어 테스트를 진행합니다.

대응 옵션:

1. Kakao는 일단 보류하고 Google 로그인부터 운영 검증
2. Supabase Kakao provider에서 profile scope 제거가 가능한지 추가 확인
3. Supabase built-in Kakao에서 제거가 불가능하면 Kakao만 자체 OAuth 백엔드로 구현
   - Kakao OAuth callback을 우리 백엔드에서 처리
   - 필요한 scope만 요청: `account_email`
   - 이후 Supabase user와 연결하거나 자체 auth로 이전
4. 장기적으로는 Kakao뿐 아니라 Google/Apple까지 모든 채널을 자체 OAuth 백엔드로 구현하는 방안 검토
   - 모든 provider scope와 동의 화면을 서비스 정책에 맞게 직접 통제
   - Auth 세션, 사용자 병합, 탈퇴, 정지, 재가입 정책을 자체 백엔드에서 일관되게 관리
   - Supabase Auth 의존도를 줄이고 `profiles`/내부 user id 중심으로 전환

현재 단기 처리:

- `profile_nickname`, `profile_image`는 필수 동의가 아니라 선택 동의로 둡니다.
- Kakao 로그인 성공 여부를 먼저 확인합니다.
- 운영 전에는 자체 OAuth 백엔드 전환 여부를 다시 판단합니다.

검토 항목:

- 이메일
- 연령대/성별/생일 등 추가 항목이 필요한지 여부
- 각 항목의 필수/선택 동의 처리
