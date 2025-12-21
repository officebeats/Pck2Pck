# Application Specification: pchk2PCHK

This document serves as the master blueprint for the **pchk2PCHK** application. It describes the design system, data architecture, and functional requirements for every screen to allow for an exact reproduction of the codebase.

## 1. Core Concept
**pchk2PCHK** is a mobile-first budgeting application designed for "paycheck-to-paycheck" cash flow management. It emphasizes "Safe Spend" (money left after bills), bill timing relative to paydays, and family coordination.

**Key Technical Constraints:**
*   **No Backend:** All data persists locally in the browser via `localStorage`.
*   **Zero-Config Build:** The app uses standard ES Modules (ESM) via `importmap` in `index.html` (or standard Vite/CRA structure).
*   **React 19:** Uses functional components and Hooks.

## 2. Design System (Neo-Skeuomorphism)

The UI uses a custom blend of Neumorphism (soft shapes, low contrast) and Skeuomorphism (tactile depth, insets).

### 2.1 Colors
*   **Background (Light):** `#e0e5ec` (The "Clay" base).
*   **Background (Dark):** `#1a1b1e`.
*   **Primary Green:** `#007a33` (Actions, positive states).
*   **Card Dark:** `#25262b`.

### 2.2 Global CSS Classes
The following utility classes **must** be defined in the global styles (e.g., in `index.html` or a global CSS file) to achieve the look:

*   **`.neo-card`**: A raised surface with double shadows (light top-left, dark bottom-right).
    *   *Light:* `background: linear-gradient(145deg, #ffffff, #dcdfe6); box-shadow: 5px 5px 10px #bec3c9, -5px -5px 10px #ffffff;`
    *   *Dark:* `background: linear-gradient(145deg, #28292e, #212227); box-shadow: 5px 5px 10px #161719, -5px -5px 10px #2e3035;`
    *   *Transition:* `transform 0.2s ease`.
*   **`.neo-card-hover`**: Adds a hover effect that lifts the card (`translateY(-2px)`) and increases shadow spread.
*   **`.neo-btn`**: A tactile secondary button.
    *   Similar gradients to `.neo-card` but with tighter border radius (`0.75rem`).
    *   Active state: inverts shadows (inset).
*   **`.neo-btn-primary`**: A glossy, vibrant green button.
    *   `background: linear-gradient(145deg, #008337, #006e2e);`
    *   Includes a white top border (`1px solid rgba(255,255,255,0.4)`) and subtle text shadow to create a "gem" effect.
*   **`.neo-inset`**: Recessed areas for inputs, progress bar tracks, and containers.
    *   `box-shadow: inset 3px 3px 6px [darker], inset -3px -3px 6px [lighter];`
    *   *Light:* Background `#eef2f6`.
    *   *Dark:* Background `#18191c`.

## 3. Data Architecture & Persistence

Data is persisted in `localStorage`. The app must handle two states: **Fresh User** (empty data) vs **Demo Mode** (fallback mock data).

### 3.1 Storage Keys
| Key | Type | Description |
| :--- | :--- | :--- |
| `user` | JSON Object | `{ name, email, avatar }` |
| `theme` | String | `'light' | 'dark'` |
| `pchk_dashboard_bills` | Array | Bills displayed on Home. |
| `pchk_planning_bills` | Array | Bills used in Planning drag-and-drop. |
| `pchk_recurring_bills` | Array | Templates/definitions in Recurring screen. |
| `pchk_income_sources` | Array | Income items in Income screen. |
| `pchk_chats` | Array | Chat threads and messages. |
| `pchk_notifications` | Array | Alert items. |
| `pchk_bill_payments` | Array | Comprehensive list for Bills screen. |

### 3.2 Initialization Strategy
1.  **On Component Mount:** Components attempt to load data from `localStorage`.
    *   If key exists (even if empty array `[]`), use it.
    *   If key is `null` (missing), fallback to **Mock Data** defined in the component (so the app looks populated for first-time visitors who haven't registered).
2.  **On Registration:** When a new user signs up via `/register`, the app **MUST** explicitly set all `pchk_*` keys to `[]` (empty arrays). This ensures a clean slate for the new user, overriding any potential mock data fallbacks.

## 4. Navigation Structure

### 4.1 Routing (`App.tsx`)
*   Uses `HashRouter` (preferred for static hosting compatibility).
*   **Auth Routes:** `/` (SignIn), `/register`.
*   **Protected Routes:** `/home`, `/bills`, `/planning`, `/income`, `/chat`, `/notifications`, `/settings`, `/recurring`, `/bill-discussion`, `/member/:id`.
*   **ScrollToTop:** A helper component ensures the window scrolls to top on route change.

### 4.2 Sidebar (Desktop)
*   Visible on `md` breakpoints and up.
*   Displays Logo, Navigation Links, Dark Mode Toggle, and User Mini-profile.
*   **Chat Logic:** The Chat link expands to show nested "Direct Message" shortcuts if the URL contains `userId`.

### 4.3 BottomNav (Mobile)
*   Fixed bottom bar.
*   Tabs: Home, Bills, Plan, Chat, Settings.
*   **Active State:** The active icon features a "glow" background and translates upward (`-translate-y-1`) with a colored indicator bar at the top.

## 5. Screen Specifications

### 5.1 Sign In (`/`)
*   **Auto-Login:** On mount, check if `localStorage.getItem('user')` exists. If yes, redirect to `/home`.
*   **Bypass:** Hardcoded credentials `test` / `test` trigger an instant login with a "Test User" profile.
*   **Demo Fallback:** Any other email/password (except 'error') logs in as "Demo User".

### 5.2 Register (`/register`)
*   **Inputs:** Email, Password, Confirm Password.
*   **Action:**
    1.  Validates matching passwords.
    2.  Sets `user` in local storage.
    3.  **CRITICAL:** Sets all `pchk_*` storage keys to `JSON.stringify([])`.
    4.  Redirects to `/home`.

### 5.3 Dashboard (`/home`)
*   **Header:** Shows current date and "Days to Payday". "I Got Paid" button opens a confirmation modal.
*   **Progress Card:** Visualizes Safe Spend.
    *   Formula: `(Paid Bills in Cycle / Total Bills in Cycle) * 100`.
    *   Visual: A progress bar inside a `.neo-inset` track.
*   **Priority List:**
    *   Filters bills to show only *unpaid* bills for the *current* cycle.
    *   Sorts by urgency: Overdue > Due Today > Upcoming.
    *   **Countdown:** Displays `Xd Xh Xm` remaining. Pulses red if overdue.

### 5.4 Planning (`/planning`)
*   **View Modes:** Toggle between "Allocations" (Kanban/Buckets) and "List".
*   **Allocations View:**
    *   Columns represent Paychecks (e.g., Oct #1, Oct #2).
    *   **Drag & Drop:** Uses native HTML5 DnD API (`draggable`, `onDragStart`, `onDrop`).
    *   Dropping a bill on a paycheck updates its `assignedPaycheckId`.
    *   Header calculates "Safe Spend" (`Income - Sum of Bills in Bucket`).
*   **Add/Edit Modal:** Allows creating bills. Fields include frequency (Weekly/Monthly/Yearly), auto-calculating dates.

### 5.5 Bills (`/bills`)
*   **Filters:** "Current Cycle", "Next Cycle", "History".
*   **Search/Sort:** Text search and dropdown sort (Date/Amount).
*   **Pay All:** Bulk action. Requires user to type "i got paid" to confirm.
*   **Interactions:** Clicking "Pay" opens a modal to enter the *actual* amount paid (allowing for variable bills).

### 5.6 Recurring Expenses (`/recurring`)
*   **Purpose:** CRUD interface for bill templates.
*   **Fields:** Icon selection, Color coding, Reminder settings (Time/Days Before).
*   **Logic:** Updates `pchk_recurring_bills`.

### 5.7 Income (`/income`)
*   **Purpose:** Define income sources to calculate paydays.
*   **Logic:** Supports complex recurrence (e.g., "Bi-weekly", "Every Friday").
*   **UI:** Shows "Next Payday" calculation (e.g., "Tomorrow", "In 5 days").

### 5.8 Chat (`/chat`)
*   **Structure:** List of threads (Group & DM).
*   **Features:**
    *   **Mentions:** Typing `@` opens a user picker.
    *   **Bill Reference:** A "Receipt" button allows attaching a bill object to a message.
    *   **System Messages:** "User added to group".
*   **Deep Linking:** URL params `chatId` or `userId` open specific threads automatically.

### 5.9 Notifications (`/notifications`)
*   **Tabs:** Inbox / Archived.
*   **Actions:** Hovering (on desktop) reveals Archive/Delete buttons.
*   **Types:** Bill Due, Budget Warning, Income Received.

### 5.10 Settings (`/settings`)
*   **Profile:** Edit name/email.
*   **App Config:** Toggles for Dark Mode and Notifications.
*   **Data Management:** "Reset App Data" button.
    *   **Logic:** `window.confirm` -> `localStorage.removeItem` (user + all `pchk_` keys) -> Redirect to `/`.

## 6. Shared Components

### 6.1 `CommentModal`
*   Reusable modal for discussion threads attached to specific bills.
*   Used in Dashboard, Bills, and Recurring screens.
*   Supports editing/adding comments.

## 7. Interfaces (TypeScript)

**Bill:**
```typescript
interface Bill {
  id: number;
  name: string;
  amount: number;
  dueDate: string; // ISO
  status: 'overdue' | 'due_soon' | 'paid' | 'upcoming';
  cycle: 'current' | 'next';
  paycheckLabel: string;
  icon: string;
  category: string;
  comments?: Comment[];
}
```

**IncomeSource:**
```typescript
interface IncomeSource {
  id: number;
  name: string;
  amount: number;
  recurrence: { type: 'weekly' | 'monthly' | 'bi-weekly' | 'custom', ... };
  nextPayday: string;
}
```

This specification covers all functional and visual requirements to rebuild the application.
