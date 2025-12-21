# Agent Guide: pchk2pchk

## Project Snapshot
- **Type**: Single-project React SPA
- **Stack**: React 19, Vite, TypeScript, Tailwind (CDN-based config), React Router 7
- **Style**: Neumorphic/Skeuomorphic via custom classes in `index.html` + Tailwind
- **State**: LocalStorage for persistence (user, theme)

## Root Setup Commands
- **Install**: `npm install`
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Universal Conventions
- **Styling**: Use functional classes (`neo-card`, `neo-btn`) defined in `index.html` combined with Tailwind utility classes.
- **Components**: Functional components only. No class components.
- **Icons**: Material Symbols Outlined (via Google Fonts).
- **Theme**: Dark/Light mode supported via `dark` class on html element.

## JIT Index
### Directory Map
- **Screens (Pages)**: `screens/` → [see screens/AGENTS.md](screens/AGENTS.md)
- **Components (Reusable)**: `components/` → [see components/AGENTS.md](components/AGENTS.md)
- **Entry**: `App.tsx` (Routing), `index.tsx` (Mount), `index.html` (Styles/Config)

### Quick Find Commands
- **Find Screen**: `grep -r "export default function" screens`
- **Find Component**: `grep -r "export .* function" components`
- **Find Route**: `grep "Route path" App.tsx`

## Definition of Done
- Types check (no red squiggles).
- UI matches the Neumorphic/Skeuomorphic aesthetic.
- Feature works in both Light and Dark modes.
