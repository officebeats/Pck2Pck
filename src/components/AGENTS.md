# Agent Guide: Components

## Package Identity
- **Purpose**: Reusable UI widgets used across multiple screens.
- **Location**: `components/`

## Patterns & Conventions
- **Structure**:
  - Export named or default functions.
  - Props should be typed via interface.
- **Styling**:
  - Components should be flexible or have `className` prop to merge styles via `clsx`.
  - Prefer `neo-` global classes for consistency.

## Key Files
- `components/CommentModal.tsx`: Example of a modal/interactive component.

## JIT Index Hints
- **Find Usage**: `grep -r "ComponentName" screens/`
