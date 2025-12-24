# Fixing Misleading Bill Names in Demo Data

## Problem

Bills with misleading names like "Late Bill", "Overdue", "Already Passed" are appearing in the demo account. These names are confusing because they sound like status labels, not actual bill names.

## Root Cause

These bills were likely created during earlier testing or manual data entry. They exist in your localStorage or Firestore database.

## Solution

### Option 1: Clean Up Existing Data (Recommended)

Use the cleanup script in the browser console:

```javascript
// 1. Open browser console (F12)
// 2. Run the cleanup function
window.cleanupDemoData();

// 3. Refresh the page
location.reload();
```

This will:

- ✅ Remove bills with names like "Late Bill", "Overdue", "Already Passed"
- ✅ Keep all legitimate bills (Rent, Electric, Netflix, etc.)
- ✅ Preserve your other data

---

### Option 2: Fresh Start with Test Data

If you want to start completely fresh:

```javascript
// 1. Clear all existing data
window.testDataGenerator.clear();

// 2. Load fresh test data (with proper bill names)
window.testDataGenerator.load();

// 3. Refresh the page
location.reload();
```

This will:

- ✅ Remove ALL existing bills
- ✅ Generate 12 new bills with proper names
- ✅ Create 2 income sources
- ✅ All bills will have realistic names

---

## Proper Bill Names

The test data generator creates bills with these names:

### Housing & Utilities

- Rent
- Electric Bill
- Water Bill
- Internet
- Phone Bill

### Transportation

- Car Payment
- Car Insurance

### Healthcare & Insurance

- Health Insurance
- Gym Membership

### Entertainment

- Netflix
- Spotify

### Debt

- Credit Card

---

## What Gets Removed

The cleanup script removes bills with these misleading names:

- "Late Bill"
- "Overdue"
- "Already Passed"
- "Past Due"
- "Late"
- "Missed"

---

## Files Modified

1. **src/utils/cleanupDemoData.ts** (NEW)

   - Cleanup script to remove misleading bill names
   - Filters bills by name
   - Preserves legitimate bills

2. **src/main.tsx**
   - Imported cleanup script
   - Available in browser console as `window.cleanupDemoData()`

---

## Usage Instructions

### Step 1: Open Browser Console

Press `F12` or right-click → Inspect → Console

### Step 2: Run Cleanup

```javascript
window.cleanupDemoData();
```

### Step 3: Check Results

The console will show:

```
🧹 Cleaning up demo data...
Found 15 bills
❌ Removing: "Late Bill" (Test Company)
❌ Removing: "Overdue" (Another Company)
✅ Cleaned: 2 bills removed
📊 Remaining: 13 bills
✨ Cleanup complete! Refresh the page to see changes.
```

### Step 4: Refresh Page

```javascript
location.reload();
```

---

## Verification

After cleanup, verify that:

- [ ] No bills named "Late Bill", "Overdue", etc.
- [ ] All bills have proper company names
- [ ] Bills are categorized correctly (Current Cycle / Upcoming Cycle)
- [ ] Countdown timers show correct urgency colors

---

## Prevention

To prevent this in the future:

1. ✅ Use test data generator for demo data
2. ✅ Don't manually create bills with status-like names
3. ✅ Bill names should be company/service names (e.g., "Netflix", "Rent")
4. ✅ Status is shown separately (red bar, countdown timer, subsections)

---

## Quick Reference

```javascript
// Clean up misleading bill names
window.cleanupDemoData();

// OR start fresh with proper test data
window.testDataGenerator.clear();
window.testDataGenerator.load();

// Refresh to see changes
location.reload();
```

---

**Status:** ✅ Cleanup script ready  
**Date:** December 23, 2025  
**Action Required:** Run cleanup in browser console
