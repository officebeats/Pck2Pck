# Agent Guide: Screens

## Package Identity
- **Purpose**: Top-level page components mapped to routes.
- **Location**: `screens/`

## Patterns & Conventions
- **Structure**:
  - Export `default function ScreenName() { ... }`
  - Use `clsx` for conditional classes.
  - Fetch/derive data inside the component (or use context if added later).
- **Routing**:
  - New screens must be added to `App.tsx` in the `<Routes>` block.
  - Add navigation item in `NavLinks` array in `App.tsx` if it needs sidebar access.
- **Styling**:
  - use `neo-card` for main containers.
  - use `neo-btn` or `neo-btn-primary` for actions.
  - Ensure `dark:` variants are handled (inherited from `neo-` classes or explicit Tailwind overrides).

## Key Files
- `screens/Dashboard.tsx`: Main landing view.
- `screens/BillPayments.tsx`: Complex interaction example.
- `screens/Settings.tsx`: Theme toggling example.

## Common Gotchas
- **Navigation**: Use `Link` from `react-router-dom`, not `<a>`.
- **Scroll**: `ScrollToTop` in `App.tsx` handles scroll reset on route change.
