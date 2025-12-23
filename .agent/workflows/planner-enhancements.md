# Planning Screen Enhancements - Implementation Summary

## Changes Made

### 1. ✅ Added Payment URL Field

- Updated `Bill` interface in `useBills.ts` to include `paymentUrl?: string`
- Created `CountdownTimer.tsx` component for real-time countdowns

### 2. 🔄 Next: Update Planning.tsx

#### A. Add Payment URL to Bill Form

- Add input field for `paymentUrl` in the bill modal (around line 1000-1100)
- Include validation for URL format
- Save to formData state

#### B. Add Countdown Timers to Bills

- Import `CountdownTimer` component
- Add countdown display to `CompactBillCard` or inline in bill list
- Show time remaining until due date (updates every second)

#### C. Add Countdown Timers to Paychecks

- Add countdown to paycheck headers showing time until payday
- Display in compact format with icon

#### D. Add Comment Functionality

- Add comment button to bill cards
- Open `CommentModal` when clicked
- Show comment count badge if bill has comments
- Wire up to existing `handleAddComment` function

#### E. Implement Drag & Drop (Advanced)

- Install `@dnd-kit/core` and `@dnd-kit/sortable`
- Make bill cards draggable
- Create drop zones for each paycheck bucket
- Update `assignedPaycheckId` on drop
- Add visual feedback during drag

### 3. Update CompactBillCard Component

- Add comment button with count badge
- Add countdown timer display
- Add payment URL link button

### 4. Update Bill Details Modal

- Display payment URL as clickable link
- Add "Pay Now" button that opens URL in new tab
- Show countdown timer in modal header

## File Changes Required

1. ✅ `src/hooks/useBills.ts` - Add paymentUrl field
2. ✅ `src/components/CountdownTimer.tsx` - Create component
3. 🔄 `src/screens/Planning.tsx` - Add features
4. 🔄 `src/components/CompactBillCard.tsx` - Add UI elements
5. 🔄 `src/screens/BillPayments.tsx` - Add payment URL display
6. 🔄 `src/screens/Dashboard.tsx` - Add payment URL display

## Priority Order

1. Payment URL field (easiest, high value)
2. Countdown timers (moderate, high visual impact)
3. Comment buttons (easy, uses existing modal)
4. Drag & drop (complex, requires library)
