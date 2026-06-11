# Next Session Prompt

Continue work in `C:\codex\aichat`.

Read first:
- `CONTEXT.md`
- `HANDOFF.md`
- latest `chat_log/*_digest.md`
- `frontend/src/App.tsx`
- `frontend/src/pages/CustomerCenterPage.tsx`
- `frontend/src/index.css`

Current state:
- Vite React frontend under `frontend/`.
- Supabase Auth is wired through `authService`.
- Google login works.
- Kakao configured for current prototype.
- Apple setup deferred.
- Notice management was implemented:
  - public `/announcements` and detail pages query service data.
  - admin routes exist under `/admin/notices`.
  - admin access requires Supabase `admin_users(user_id)`.
  - SQL file: `frontend/supabase/notices.sql`.
- Customer center was expanded:
  - `/customer-center`
  - `/customer-center/search`
  - `/customer-center/faqs`
  - `/customer-center/faqs/:id`
  - `/customer-center/contacts`
  - `/customer-center/contacts/create`
  - `/customer-center/contacts/:id`
  - SQL file: `frontend/supabase/support.sql`.
- Customer center PC layout was adjusted to match Zeta support screenshots:
  - black header,
  - cover hero image,
  - centered search,
  - category cards,
  - popular FAQ,
  - announcements,
  - contact CTA,
  - Katchers footer.
- Katchers footer info is now:
  - `(주)캐처스`
  - 박은상
  - `06626 서울 서초구 강남대로 341, 8층 831호`
  - `1577-6037`
  - `556-81-02489`
  - `제 2022-서울서초-1505호`
  - `admin@katchers.co.kr`

Verification baseline:
- `npm run lint` passes.
- `npm run build` passes.
- Build emits only a chunk-size warning.

Likely next tasks:
- Continue screenshot-level visual tuning of `/customer-center`.
- Apply Supabase SQL files if moving from fallback data to real DB content:
  - `frontend/supabase/notices.sql`
  - `frontend/supabase/support.sql`
- Build admin management for FAQs/categories/contact replies.
- Populate real FAQ/customer-center content.
- Add app profiles/onboarding DB.

User preferences:
- Korean, concise.
- Match provided screenshots closely.
- Explain setup one step at a time.
- Do not guess provider console or legal/business details.
- Do not paste secrets.
