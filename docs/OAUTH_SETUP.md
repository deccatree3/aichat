# Social Login Setup

현재 프론트엔드는 Supabase Auth로 카카오, Google, Apple 소셜 로그인/회원가입을 받을 수 있게 연결되어 있습니다.

환경변수가 없으면 로컬 목업 로그인으로 동작하므로, Supabase 설정 전에도 화면 개발은 계속할 수 있습니다.

## 구현 경계

Supabase 직접 의존은 아래 파일에만 모았습니다.

- `frontend/src/auth/authService.ts`
- `frontend/src/auth/supabase.ts`

화면 컴포넌트는 `useAuth()`만 사용합니다. 나중에 Cognito, Auth0, 자체 OAuth 백엔드로 바꿀 때는 `authService`를 교체하는 방향으로 이전합니다.

## 지금 해야 할 일

1. Supabase 프로젝트를 생성합니다.
2. Supabase Project URL과 anon public key를 복사합니다.
3. `frontend/.env.example`을 참고해 `frontend/.env.local`을 만듭니다.
4. Supabase Redirect URL에 `http://127.0.0.1:5173/auth/callback`을 추가합니다.
5. Kakao, Google, Apple 개발자 콘솔에서 OAuth 앱을 만듭니다.
6. 각 provider의 client id/secret/key를 Supabase Auth Provider 설정에 입력합니다.
7. Vite dev server를 재시작합니다.
8. `/login`과 `/my-page`에서 소셜 버튼을 테스트합니다.

## 1. Supabase 환경변수

`frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

변경 후 서버 재시작:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

## 2. Supabase Redirect URL

Supabase Dashboard > Authentication > URL Configuration:

- Site URL: `http://127.0.0.1:5173`
- Additional Redirect URLs:
  - `http://127.0.0.1:5173/auth/callback`
  - 운영 도메인 콜백 URL, 예: `https://your-domain.com/auth/callback`

프론트 앱은 OAuth 완료 후 `/auth/callback`에서 세션을 확정하고 `/my-page`로 이동합니다.

## 3. Kakao 설정

Kakao Developers에서:

- 애플리케이션 생성
- 카카오 로그인 활성화
- Redirect URI 추가: 보통 `https://your-project-ref.supabase.co/auth/v1/callback`
- 동의항목에서 닉네임, 프로필 이미지, 이메일 등 필요한 항목 설정
- Supabase가 요구하는 REST API key/client secret 값을 복사
- Supabase Dashboard > Authentication > Providers > Kakao에 입력

## 4. Google 설정

Google Cloud Console에서:

- OAuth consent screen 구성
- OAuth 2.0 Client ID 생성, 유형은 Web application
- Authorized JavaScript origins: `http://127.0.0.1:5173`
- Authorized redirect URIs: 보통 `https://your-project-ref.supabase.co/auth/v1/callback`
- Client ID와 Client Secret 복사
- Supabase Dashboard > Authentication > Providers > Google에 입력

## 5. Apple 설정

Apple은 준비 항목이 가장 많습니다.

- Apple Developer Program 계정 필요
- App ID 또는 Services ID에서 Sign in with Apple 활성화
- Web login용 Services ID 생성
- Supabase callback URL 등록
- Sign in with Apple private key 생성
- Team ID, Key ID, Services ID, private key를 Supabase에 입력

## 6. 현재 앱 동작

- UI는 `useAuth().login(provider)`를 호출합니다.
- `authService.login(provider)`가 Supabase `signInWithOAuth`를 호출합니다.
- 처음 로그인한 OAuth 사용자는 Supabase Auth에 자동 회원가입됩니다.
- 세션은 Supabase 클라이언트가 브라우저 저장소에 유지합니다.
- `더보기 > 로그아웃`은 Supabase `signOut`을 호출합니다.

## 7. 나중에 업그레이드할 때

Supabase에서 자체 백엔드 OAuth로 이전할 때 목표 인터페이스:

- `authService.getCurrentUser()`
- `authService.login(provider)`
- `authService.completeCallback()`
- `authService.logout()`
- `authService.onAuthStateChange(callback)`

이 함수들의 내부 구현만 바꾸면 화면 코드는 대부분 그대로 둡니다.

## 8. 운영 전 체크리스트

- 운영 도메인을 Supabase URL Configuration에 추가
- 운영 도메인을 Kakao/Google/Apple 개발자 콘솔에도 추가
- 개인정보처리방침, 이용약관 URL 준비
- 로그인 후 내부 `profiles` 테이블 생성 여부 결정
- 결제/피스/채팅/LLM 호출은 프론트 직접 처리 금지, 백엔드 API 뒤로 이동
- 사용자 ID는 Supabase `auth.users.id`를 내부 사용자 테이블과 연결해 향후 이전 가능하게 설계

