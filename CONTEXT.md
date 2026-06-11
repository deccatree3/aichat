# Project Context

## Project

`C:\codex\aichat` is a Codex-built prototype for a Zeta-like AI chat service UI. The app is a frontend-first Vite + React + TypeScript implementation with Supabase Auth wired for social login.

## Structure

- `frontend/`: Vite React app.
- `frontend/supabase/`: SQL files for Supabase tables/RLS.
- `docs/`: OAuth and scaling notes.
- `tools/`: screenshot/capture tooling from earlier setup.
- `chat_log/`: context carryover logs and raw trace manifests.

## Current Features

- Home and ranking pages with benchmark-like headers and bottom nav.
- Auth:
  - Supabase Auth wrapper in `frontend/src/auth`.
  - Google login confirmed working by user.
  - Kakao configured with `account_email` required and profile nickname/image optional.
  - Apple code path exists but setup is deferred.
- My page:
  - guest social login UI,
  - authenticated profile/pass/pieces/company layout.
- More/settings pages:
  - notification settings and category subpages,
  - account settings,
  - withdrawal flow,
  - blocked items pages.
- Signup/onboarding:
  - `/signup` two-step name then birthdate/gender UI.
  - Google callback currently routes to `/signup`; Kakao/Apple route to `/my-page`.
- Announcements:
  - public `/announcements` and `/announcements/:id`.
  - Supabase-backed `notices` service with fallback bundled notices.
  - admin notice management routes:
    - `/admin/notices`
    - `/admin/notices/new`
    - `/admin/notices/:id/edit`
  - admin auth checks `public.admin_users(user_id)`.
  - SQL: `frontend/supabase/notices.sql`.
- Customer center:
  - benchmarked Zeta support and implemented a custom support system, not an external CMS clone.
  - routes:
    - `/customer-center`
    - `/customer-center/search`
    - `/customer-center/faqs`
    - `/customer-center/faqs/:id`
    - `/customer-center/contacts`
    - `/customer-center/contacts/create`
    - `/customer-center/contacts/:id`
  - Supabase support service with fallback categories/FAQs.
  - SQL: `frontend/supabase/support.sql`.
  - responsive PC/mobile layout:
    - PC: wide support shell, black header, cover hero, centered search, 2-column category cards, FAQ list, announcement section, contact CTA, footer.
    - mobile: compact stacked layout.
  - footer now uses Katchers company information.

## Auth Architecture

Short-term auth backend: Supabase Auth.

Important files:
- `frontend/src/auth/authService.ts`
- `frontend/src/auth/supabase.ts`
- `frontend/src/auth/AuthContext.tsx`
- `frontend/src/pages/AuthCallbackPage.tsx`

The UI calls `useAuth()` and avoids direct Supabase calls outside service layers where practical.

Current profile/onboarding limitation:
- Supabase Auth is the auth account layer.
- App profile data tables do not exist yet.
- UI fields such as nickname, avatar, birthdate, gender, bio, pieces, settings, and onboarding completion are still mock/fallback/frontend state.

## Supabase SQL To Apply

Remote DB SQL has not been applied by Codex.

Required SQL files:
- `frontend/supabase/notices.sql`
- `frontend/supabase/support.sql`

For admin access:
- Get the operator's Supabase Auth `User UID`.
- Insert it into `public.admin_users(user_id)`.

## Current Design Rules Learned From User

- Match benchmark screenshots closely when user provides them.
- Customer center PC layout should be a PC web layout, not a 480px mobile shell.
- Customer center mobile layout should remain mobile-friendly on narrow devices.
- Admin routes should not silently redirect to user-facing screens when access fails; show explicit reason.
- Notice `보관` is a status, not a separate edit button.
- Setup explanations should be one step at a time.
- Avoid guessing provider console locations; verify with docs or screenshots.
- Keep responses concise in Korean.

## Known Issues / Follow-ups

- Apply Supabase SQL files manually in Supabase SQL Editor.
- Populate real `support_categories`, `faqs`, `contacts`, and `contact_replies` data.
- Build admin screens for support categories, FAQs, and contact replies if operational support management is required.
- Add DB-backed app profiles and onboarding completion.
- Add real app DB for user settings, chats/plots, blocking, pieces/payment/pass data.
- Implement real account deletion through backend/Edge Function using Supabase Admin API and app-data cleanup.
- Add policy documents:
  - privacy policy,
  - terms,
  - operating policy,
  - youth protection policy,
  - payment/refund/subscription policy.
- Continue implementing remaining More menu child pages and interactions.
- Later, test benchmark creator-report flow end to end and implement resulting UI/state.
- Decide whether Nutty should be implemented or removed from scope.
- Apple social login setup is deferred.
- Consider code splitting; Vite build passes but warns that the main chunk is larger than 500 kB.
- No Git repository is initialized at project root.

## Verification Baseline

After the latest notice/customer-center/footer changes:
- `npm run lint` passes in `frontend`.
- `npm run build` passes in `frontend`.
