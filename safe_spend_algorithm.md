# Safe Spend Algorithm

## Objective
The goal of the Safe Spend Algorithm is to automatically assign recurring bills to specific income paychecks in a way that ensures:
1.  **Zero Overdue Bills**: No bill is assigned to a paycheck that arrives *after* the bill is due.
2.  **Maximized Safe Spend**: Optimizes cash flow by aligning payments closely with income receipt (Just-In-Time) or balancing the load to prevent negative balances.

## Core Logic

### 1. Inputs
*   **Bills**: A list of recurring expenses, each with a `dueDate` and `amount`.
*   **Income Events (Paychecks)**: A list of projected income occurrences, each with a `date` and `amount`.

### 2. Constraints
*   **Time Constraint (Hard Rule)**: A bill valid for assignment to Paycheck $P$ must satisfy:
    $$ P_{date} \le Bill_{dueDate} $$
    *   *Note:* If a bill is due *before* any available paycheck in the current view, it is considered "Past Due" or requires "Previous Cycle" funding.

### 3. Allocation Strategy (Two-Phase Algorithm)

#### Phase 1: Just-In-Time Assignment
1.  **Sort** all Paychecks by date (Ascending).
2.  **Sort** all Bills by due date (Ascending).
3.  **Iterate** through each Bill:
    a.  Identify all Paychecks where `Paycheck.Date <= Bill.DueDate`.
    b.  Select the **Latest** valid paycheck from this set.
    c.  Assign the bill to this paycheck.
    d.  Track the cumulative bill load on each paycheck.

#### Phase 2: Load Smoothing (Early Payment Optimization)
*   **Purpose**: Prevent negative "Safe Spend" on any single paycheck by redistributing bills.
*   **Process**:
    1.  Iterate through paychecks from **latest to earliest**.
    2.  For each paycheck with negative Safe Spend (bills > income):
        a.  Identify bills that could be paid earlier (due date allows earlier paycheck).
        b.  Find an earlier paycheck with **positive capacity** (Safe Spend remains >= 0 after move).
        c.  Move the bill to the earlier paycheck.
        d.  Continue until the current paycheck is no longer negative, or no moves are possible.

### 4. Handling Unassignable Bills
*   Bills with `DueDate < First_Paycheck_Date` in the current view cannot be safely assigned to a displayed paycheck without being "Late".
*   **Action**: These remain in the "Unassigned" or "Overdue" pool for manual intervention.

## Implementation Status: ✅ COMPLETE

The algorithm is fully implemented in `Planning.tsx` with both phases:
- `autoAssignBills()` performs Just-In-Time assignment followed by Load Smoothing.
- Uses `batchUpdateBills()` for efficient Firestore updates.
