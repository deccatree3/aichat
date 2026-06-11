# Zeta Prototype Frontend

This is a mobile-first React prototype based on the Zeta reference captures in `../docs/reference/screenshots`.

## Commands

```powershell
npm install
npm run dev
npm run build
```

## Flow Notes

- `/login`: social login entry mock.
- `/my-page`: renders for guests and signed-in mock users.
- `/more`: settings/more menu.
- `/piece/charge`: piece purchase list.
- `/piece/history`: piece history empty state.

Protected actions use a login bottom sheet instead of redirecting the whole route.

