# Handoff

## Current State

The project in `C:\codex\aichat` is a working React/Vite prototype with Supabase Auth integration and newly added Supabase-backed service layers for notices and customer center content.

Latest confirmed checks:
- `npm run lint` passed.
- `npm run build` passed.

## Most Recent Completed Work

- Implemented notice management from the previous plan:
  - `notices` service layer with Supabase and static fallback.
  - public `/announcements` and `/announcements/:id` now query service data.
  - admin routes:
    - `/admin/notices`
    - `/admin/notices/new`
    - `/admin/notices/:id/edit`
  - admin guard checks `admin_users`.
  - access failures show explicit login/admin-permission screens.
  - edit form uses status select for draft/published/archived; separate archive button removed.
  - SQL file added: `frontend/supabase/notices.sql`.
- Guided user through Supabase setup:
  - `user_id` means Supabase Auth `User UID`.
  - `admin_users` table must be created by running SQL first.
- Benchmarked `https://support.zeta-ai.io/zeta/ko`:
  - confirmed it is a custom React/Vite SPA backed by Zeta-owned APIs.
  - not an external CMS such as Zendesk/Intercom/Channel.io.
- Implemented customer center:
  - home,
  - FAQ list/detail,
  - search,
  - contact list/create/detail,
  - service layer and fallback content,
  - support SQL schema/RLS.
- Adjusted customer center responsive layout:
  - support routes use `app-shell--support`,
  - PC no longer constrained to 480px,
  - screenshot-like PC layout with wide header/hero/content/footer.
- Updated customer center footer to Katchers info:
  - `(주)캐처스`
  - 대표자/개인정보보호책임자 박은상
  - 주소 `06626 서울 서초구 강남대로 341, 8층 831호`
  - 전화 `1577-6037`
  - 사업자등록번호 `556-81-02489`
  - 통신판매업 신고번호 `제 2022-서울서초-1505호`
  - 이메일 `admin@katchers.co.kr`

## Important Files

- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/src/pages/CustomerCenterPage.tsx`
- `frontend/src/pages/SupportFaqListPage.tsx`
- `frontend/src/pages/SupportFaqDetailPage.tsx`
- `frontend/src/pages/SupportSearchPage.tsx`
- `frontend/src/pages/SupportContactListPage.tsx`
- `frontend/src/pages/SupportContactCreatePage.tsx`
- `frontend/src/pages/SupportContactDetailPage.tsx`
- `frontend/src/support/supportService.ts`
- `frontend/src/support/fallbackData.ts`
- `frontend/supabase/support.sql`
- `frontend/src/notices/noticeService.ts`
- `frontend/src/pages/AdminNoticeGuard.tsx`
- `frontend/src/pages/AdminNoticeListPage.tsx`
- `frontend/src/pages/AdminNoticeFormPage.tsx`
- `frontend/supabase/notices.sql`

## Next Likely Tasks

- If user wants real data:
  - run `frontend/supabase/notices.sql` and `frontend/supabase/support.sql` in Supabase SQL Editor.
  - insert admin Auth UID into `public.admin_users`.
  - populate FAQ/support content.
- If user continues visual tuning:
  - compare `/customer-center` against provided PC/mobile screenshots.
  - adjust spacing, hero crop, and footer alignment.
- If user wants operations:
  - add admin screens for FAQ/category management.
  - add admin contact-reply workflow for 1:1 문의.
- If user wants production readiness:
  - add profiles/onboarding DB.
  - add policies.
  - add real account deletion backend.
  - code-split the frontend to reduce bundle warning.

## Constraints

- Do not paste credentials or secrets into chat or docs.
- Do not guess legal/business information; ask user or verify before changing legal footer/policy text.
- Do not silently redirect admin failure to user home.
- Keep Korean responses concise.
- Use file links for local artifacts in final summaries.

## Dev Server

Dev server may already be running on:
- `http://127.0.0.1:5173`

If needed:
- Workdir: `C:\codex\aichat\frontend`
- Command: `npm run dev -- --host 127.0.0.1 --port 5173`
