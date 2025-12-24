# Cycle-Based Planning Screen - Test Plan

## Test Scenarios

### Scenario 1: Current Cycle Bills Display

**Objective:** Verify bills with `cycle: 'current'` appear in Current Cycle section

**Steps:**

1. Navigate to Planning screen
2. Locate "Current Cycle" section (blue header)
3. Verify all bills shown have `cycle: 'current'`
4. Check bill count badge matches actual bills displayed

**Expected Results:**

- ✅ Current Cycle section visible with blue header
- ✅ Only current cycle bills displayed
- ✅ Bill count accurate
- ✅ Section icon is "event_available"

**Pass/Fail:** ⏳ Pending

---

### Scenario 2: Upcoming Cycle Bills Display

**Objective:** Verify bills with `cycle: 'next'` appear in Upcoming Cycle section

**Steps:**

1. Navigate to Planning screen
2. Scroll to "Upcoming Cycle" section (green header)
3. Verify all bills shown have `cycle: 'next'`
4. Check bill count badge matches actual bills displayed

**Expected Results:**

- ✅ Upcoming Cycle section visible with green header
- ✅ Only upcoming cycle bills displayed
- ✅ Bill count accurate
- ✅ Section icon is "event_upcoming"

**Pass/Fail:** ⏳ Pending

---

### Scenario 3: Overdue Bills Subsection

**Objective:** Verify overdue bills appear in red subsection within Current Cycle

**Steps:**

1. Create or identify a bill with past due date and `cycle: 'current'`
2. Navigate to Planning screen
3. Look for "Overdue" subsection within Current Cycle
4. Verify overdue bills appear with red background

**Expected Results:**

- ✅ Overdue subsection visible with red background
- ✅ Warning icon displayed
- ✅ Count shows number of overdue bills
- ✅ Only past-due bills in this subsection

**Pass/Fail:** ⏳ Pending

---

### Scenario 4: Due Soon Bills Subsection

**Objective:** Verify non-overdue current cycle bills appear in Due Soon subsection

**Steps:**

1. Navigate to Planning screen
2. Look for "Due Soon" subsection within Current Cycle
3. Verify bills are not past due
4. Check subsection only appears when there are overdue bills

**Expected Results:**

- ✅ Due Soon subsection visible when overdue bills exist
- ✅ Schedule icon displayed
- ✅ Count shows number of due soon bills
- ✅ Only non-overdue current cycle bills shown

**Pass/Fail:** ⏳ Pending

---

### Scenario 5: Empty Current Cycle State

**Objective:** Verify proper empty state when no current cycle bills exist

**Steps:**

1. Mark all current cycle bills as paid
2. Navigate to Planning screen
3. Check Current Cycle section display

**Expected Results:**

- ✅ Current Cycle section still visible
- ✅ Empty state message: "All caught up!"
- ✅ Celebration icon displayed
- ✅ Message: "No bills due this cycle"

**Pass/Fail:** ⏳ Pending

---

### Scenario 6: No Upcoming Cycle Bills

**Objective:** Verify Upcoming Cycle section hidden when no bills exist

**Steps:**

1. Ensure no bills have `cycle: 'next'`
2. Navigate to Planning screen
3. Check if Upcoming Cycle section appears

**Expected Results:**

- ✅ Upcoming Cycle section NOT displayed
- ✅ Only Current Cycle section visible
- ✅ No empty state for Upcoming Cycle

**Pass/Fail:** ⏳ Pending

---

### Scenario 7: Countdown Timer Display

**Objective:** Verify countdown timers show days only

**Steps:**

1. Navigate to Planning screen
2. Check countdown display on bills
3. Verify format is "X days" not "Xd Xh"

**Expected Results:**

- ✅ Format: "7 days" or "1 day"
- ✅ Singular/plural handled correctly
- ✅ Color-coded by urgency
- ✅ Updates in real-time

**Pass/Fail:** ⏳ Pending

---

### Scenario 8: Comment Functionality

**Objective:** Verify comment buttons work on all bills

**Steps:**

1. Navigate to Planning screen
2. Click comment icon on a Current Cycle bill
3. Add a comment
4. Verify comment count badge updates
5. Repeat for Upcoming Cycle bill

**Expected Results:**

- ✅ Comment modal opens
- ✅ Comment saves successfully
- ✅ Badge shows correct count
- ✅ Works in both sections

**Pass/Fail:** ⏳ Pending

---

### Scenario 9: Mark as Paid Functionality

**Objective:** Verify bills can be marked as paid from Planning screen

**Steps:**

1. Navigate to Planning screen
2. Click "Pay" button on a bill
3. Confirm payment
4. Verify bill moves to Paid History

**Expected Results:**

- ✅ Payment modal opens
- ✅ Bill marked as paid
- ✅ Bill removed from Current/Upcoming Cycle
- ✅ Bill appears in Paid History tab

**Pass/Fail:** ⏳ Pending

---

### Scenario 10: Add Bill from Planning

**Objective:** Verify new bills can be added and appear in correct cycle

**Steps:**

1. Navigate to Planning screen
2. Click "+ ADD BILL" button
3. Fill in bill details
4. Set due date for current cycle
5. Save bill
6. Verify bill appears in Current Cycle section

**Expected Results:**

- ✅ Bill form opens
- ✅ Bill saves successfully
- ✅ Bill appears in correct cycle section
- ✅ Cycle automatically determined by due date

**Pass/Fail:** ⏳ Pending

---

### Scenario 11: Edit Bill from Planning

**Objective:** Verify bills can be edited and cycle updates if needed

**Steps:**

1. Navigate to Planning screen
2. Click on a bill to view details
3. Edit bill (change due date to different cycle)
4. Save changes
5. Verify bill moves to correct cycle section

**Expected Results:**

- ✅ Bill details modal opens
- ✅ Changes save successfully
- ✅ Bill moves to correct cycle if due date changed
- ✅ Countdown timer updates

**Pass/Fail:** ⏳ Pending

---

### Scenario 12: Visual Hierarchy

**Objective:** Verify clear visual distinction between sections

**Steps:**

1. Navigate to Planning screen
2. Review overall layout
3. Check color coding
4. Verify subsection clarity

**Expected Results:**

- ✅ Current Cycle: Blue header, clear separation
- ✅ Upcoming Cycle: Green header, clear separation
- ✅ Overdue subsection: Red background, stands out
- ✅ Due Soon subsection: Subtle, not distracting
- ✅ Proper spacing between sections

**Pass/Fail:** ⏳ Pending

---

### Scenario 13: Mobile Responsiveness

**Objective:** Verify cycle organization works on mobile

**Steps:**

1. Resize browser to mobile width (375px)
2. Navigate to Planning screen
3. Check section layout
4. Test interactions

**Expected Results:**

- ✅ Sections stack vertically
- ✅ Headers remain readable
- ✅ Bills display properly
- ✅ Touch targets adequate size
- ✅ Scrolling smooth

**Pass/Fail:** ⏳ Pending

---

### Scenario 14: Bills Screen Removed

**Objective:** Verify Bills screen no longer accessible

**Steps:**

1. Check navigation menu (sidebar and bottom nav)
2. Try navigating to /bills directly
3. Verify no Bills link visible

**Expected Results:**

- ✅ No "Bills" link in sidebar
- ✅ No "Bills" tab in bottom nav
- ✅ /bills route not accessible
- ✅ Only "Planner" link visible

**Pass/Fail:** ⏳ Pending

---

## UX/UI Best Practices Checklist

### Visual Design

- [ ] Clear visual hierarchy (sections, subsections)
- [ ] Consistent color coding (blue, green, red)
- [ ] Adequate spacing between elements
- [ ] Readable typography
- [ ] Proper contrast ratios

### Information Architecture

- [ ] Logical grouping (cycle-based)
- [ ] Clear section labels
- [ ] Accurate bill counts
- [ ] Intuitive subsection organization

### Interaction Design

- [ ] Clickable areas clearly indicated
- [ ] Hover states provide feedback
- [ ] Loading states for async operations
- [ ] Error states handled gracefully

### Accessibility

- [ ] Semantic HTML structure
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Screen reader friendly

### Performance

- [ ] Fast initial load
- [ ] Smooth scrolling
- [ ] No layout shifts
- [ ] Efficient re-renders

---

## Known Issues to Investigate

1. **Cycle Assignment Logic**

   - How is `cycle` property determined?
   - Does it update automatically based on due date?
   - What happens when a new pay period starts?

2. **Empty States**

   - Is Upcoming Cycle section properly hidden when empty?
   - Is Current Cycle empty state clear and helpful?

3. **Subsection Logic**

   - Do subsections only appear when needed?
   - Is the "Due Soon" label clear enough?

4. **Bill Transitions**
   - What happens when a bill moves from upcoming to current cycle?
   - Does the UI update automatically?

---

## Test Results Summary

**Total Scenarios:** 14  
**Passed:** 0  
**Failed:** 0  
**Pending:** 14

**Status:** ⏳ Testing in Progress

---

**Last Updated:** December 23, 2025  
**Tester:** AI Assistant  
**Environment:** Local Development (http://localhost:3001)
