# QA Testing Guide for PCK2PCK

This guide provides comprehensive instructions for testing the PCK2PCK application.

## 🎯 Quick Start

### Using the Test Data Generator

The application includes a built-in test data generator for easy QA testing.

#### In Browser Console:

```javascript
// Load test data (creates realistic bills and income)
window.testDataGenerator.load();

// Clear all test data
window.testDataGenerator.clear();

// Generate custom data
const bills = window.testDataGenerator.generateBills(15);
const income = window.testDataGenerator.generateIncome(3);
const paidBills = window.testDataGenerator.generatePaidBills(10);
```

## 📋 Test Scenarios

### 1. Authentication Testing

#### Demo User Login

- **Steps:**
  1. Navigate to sign-in page
  2. Click "INITIATE DEMO SEQUENCE"
  3. Verify redirect to dashboard
- **Expected:** User logged in as "Demo User" with admin permissions

#### Google Authentication

- **Steps:**
  1. Click "Continue with Google"
  2. Complete Google sign-in flow
  3. Verify redirect to dashboard
- **Expected:** User logged in with Google account

#### Phone Authentication

- **Steps:**
  1. Switch to "Phone" tab
  2. Enter phone number with country code (+1)
  3. Click "SEND CODE"
  4. Enter verification code
  5. Click "VERIFY"
- **Expected:** User logged in via phone number

### 2. Bill Management Testing

#### Add New Bill

- **Steps:**
  1. Navigate to Planning screen
  2. Click "+ ADD BILL" button
  3. Fill in bill details:
     - Name: "Test Bill"
     - Amount: $100
     - Due date: Select from calendar
     - Category: Select category
  4. Click "CONFIRM BILL"
- **Expected:** Bill appears in list with correct details

#### Edit Existing Bill

- **Steps:**
  1. Click on any bill in Planning screen
  2. Click edit icon
  3. Modify bill details
  4. Click "CONFIRM BILL"
- **Expected:** Bill updated with new information

#### Delete Bill

- **Steps:**
  1. Click on bill to edit
  2. Click "ELIMINATE" button
  3. Confirm deletion
- **Expected:** Bill removed from list

### 3. Payment Flow Testing

#### Mark Bill as Paid

- **Steps:**
  1. Navigate to Bills screen
  2. Find unpaid bill
  3. Click "PAY" button
  4. Enter actual amount paid
  5. Click "CONFIRM BILL PAYMENT"
- **Expected:**
  - Bill marked as paid
  - Moves to "Paid History"
  - Payment recorded in history

#### Pay All Bills

- **Steps:**
  1. Navigate to Bills screen
  2. Select multiple bills
  3. Click "Pay All" (if available)
  4. Confirm payment
- **Expected:** All selected bills marked as paid

### 4. Income Management Testing

#### Add Income Source

- **Steps:**
  1. Navigate to Planning screen
  2. Switch to "INCOME" tab
  3. Click "+ ADD INCOME"
  4. Fill in details:
     - Name: "Salary"
     - Amount: $3000
     - Next payday: Select date
     - Frequency: Select recurrence
  5. Click "CONFIRM"
- **Expected:** Income source appears in list

#### Edit Income Source

- **Steps:**
  1. Click on income source
  2. Modify details
  3. Save changes
- **Expected:** Income updated correctly

### 5. Financial Calculations Testing

#### Safe to Spend Calculation

- **Formula:** `Income - Total Bills = Safe to Spend`
- **Test Cases:**
  - Positive balance (income > bills)
  - Negative balance (bills > income)
  - Zero balance (income = bills)
- **Expected:** Correct calculation displayed on dashboard

#### Daily Safe Spend

- **Formula:** `Safe to Spend / Days Remaining in Month`
- **Expected:** Accurate daily budget calculation

### 6. Group/Multiplayer Testing

#### Create Group

- **Steps:**
  1. Navigate to Settings
  2. Enter group name
  3. Click "CREATE"
- **Expected:** Group created, user is admin

#### Generate Invite Code

- **Steps:**
  1. In Settings, click "GENERATE INVITE CODE"
  2. Copy code
- **Expected:** 6-character code generated

#### Join Group

- **Steps:**
  1. Navigate to Settings
  2. Enter invite code
  3. Click "JOIN"
- **Expected:** User added to group as member

#### Permission Testing

- **Admin permissions:**
  - ✅ Add/edit/delete bills
  - ✅ Add/edit/delete income
  - ✅ Manage group members
  - ✅ Generate invite codes
- **Member permissions:**
  - ✅ View all bills
  - ✅ Mark bills as paid
  - ❌ Add/edit/delete bills
  - ❌ Manage group

### 7. UI/UX Testing

#### Responsive Design

- **Test on:**
  - Mobile (375px width)
  - Tablet (768px width)
  - Desktop (1920px width)
- **Expected:** Layout adapts correctly

#### Dark Mode (if implemented)

- **Steps:**
  1. Toggle dark mode
  2. Navigate through all screens
- **Expected:** All text readable, proper contrast

#### Animations

- **Check:**
  - Smooth transitions between screens
  - Loading states
  - Modal animations
  - Button hover effects

### 8. Data Persistence Testing

#### LocalStorage (Demo Mode)

- **Steps:**
  1. Add bills/income as demo user
  2. Refresh page
  3. Verify data persists
- **Expected:** All data retained after refresh

#### Firestore (Real Users)

- **Steps:**
  1. Log in with Google
  2. Add bills/income
  3. Log out and log back in
  4. Verify data persists
- **Expected:** Data synced across sessions

### 9. Edge Cases & Error Handling

#### Invalid Input

- **Test:**
  - Negative amounts
  - Empty required fields
  - Invalid dates
  - Special characters
- **Expected:** Proper validation messages

#### Network Errors

- **Test:**
  - Disconnect internet
  - Try to add/edit data
- **Expected:** Graceful error handling with retry option

#### Concurrent Updates

- **Test:**
  - Two users editing same bill
  - Verify conflict resolution
- **Expected:** Last write wins or proper conflict handling

## 🐛 Bug Reporting Template

When reporting bugs, include:

```markdown
### Bug Description

[Clear description of the issue]

### Steps to Reproduce

1. [First step]
2. [Second step]
3. [Third step]

### Expected Behavior

[What should happen]

### Actual Behavior

[What actually happened]

### Environment

- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- User Type: [Demo/Google/Phone]
- Screen Size: [Mobile/Tablet/Desktop]

### Screenshots

[Attach screenshots if applicable]

### Console Errors

[Copy any console errors]
```

## ✅ QA Checklist

### Pre-Release Checklist

- [ ] All authentication methods work
- [ ] Bills can be added, edited, deleted
- [ ] Income can be added, edited, deleted
- [ ] Payment flow works correctly
- [ ] Financial calculations are accurate
- [ ] Group creation and joining works
- [ ] Permissions enforced correctly
- [ ] Data persists correctly
- [ ] No console errors
- [ ] Responsive on all screen sizes
- [ ] All icons and images load
- [ ] No 404 errors
- [ ] PWA manifest valid
- [ ] Service worker functioning (if applicable)

### Performance Checklist

- [ ] Page load time < 3 seconds
- [ ] Smooth animations (60fps)
- [ ] No memory leaks
- [ ] Efficient re-renders

### Accessibility Checklist

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Alt text on images

## 🚀 Automated Testing (Future)

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## 📊 Test Coverage Goals

- Unit Tests: 80%+
- Integration Tests: 60%+
- E2E Tests: Critical paths covered

---

**Last Updated:** December 23, 2025
**Version:** 1.0.0
