# Zeta UI Benchmark Prototype

Zeta-AI UI/UX reference captures and a React prototype that recreates the guest/login/my-page purchase surfaces in a mobile-first centered column.

## Structure

- `frontend/`: Vite + React + TypeScript prototype.
- `tools/capture/`: Playwright + headed Chrome capture utilities.
- `docs/reference/screenshots/`: Captured Zeta reference screens and capture log.

## Run

```powershell
cd frontend
npm install
npm run dev
```

## Implemented

- Social login page mock with rotating story preview.
- Guest-accessible my page, matching the captured Zeta flow where `/my-page` is not hard-redirected to login.
- Login-required bottom sheet for protected actions.
- More/settings menu mock.
- Piece charge and history screens.
- Local mock auth via `localStorage`.

## Reference

Start with `docs/reference/screenshots/capture-log.json` and the numbered PNGs to compare flows and visual priorities.

## Social Login

The frontend supports Supabase OAuth for Kakao, Google, and Apple. Setup details are in `docs/OAUTH_SETUP.md`.

## Roadmap

Deferred production and scale concerns are tracked in `docs/ROADMAP_SCALE_NOTES.md`.
