/**
 * Demo Data Cleanup Script
 * 
 * This script removes any bills with misleading names like "Late Bill", "Overdue", etc.
 * and ensures only proper bill names are used in the demo account.
 */

// Function to clean up misleading bill names
export function cleanupDemoData() {
    console.log('🧹 Cleaning up demo data...');
    
    // Get current bills from localStorage
    const billsJson = localStorage.getItem('pchk_bills');
    if (!billsJson) {
        console.log('No bills found in localStorage');
        return;
    }
    
    const bills = JSON.parse(billsJson);
    console.log(`Found ${bills.length} bills`);
    
    // List of misleading names to remove
    const misleadingNames = [
        'late bill',
        'overdue',
        'already passed',
        'past due',
        'late',
        'missed'
    ];
    
    // Filter out bills with misleading names
    const cleanedBills = bills.filter((bill: any) => {
        const billName = bill.name?.toLowerCase() || '';
        const companyName = bill.companyName?.toLowerCase() || '';
        
        const isMisleading = misleadingNames.some(name => 
            billName.includes(name) || companyName.includes(name)
        );
        
        if (isMisleading) {
            console.log(`❌ Removing: "${bill.name}" (${bill.companyName})`);
            return false;
        }
        
        return true;
    });
    
    console.log(`✅ Cleaned: ${bills.length - cleanedBills.length} bills removed`);
    console.log(`📊 Remaining: ${cleanedBills.length} bills`);
    
    // Save cleaned bills back to localStorage
    localStorage.setItem('pchk_bills', JSON.stringify(cleanedBills));
    
    console.log('✨ Cleanup complete! Refresh the page to see changes.');
    
    return {
        original: bills.length,
        removed: bills.length - cleanedBills.length,
        remaining: cleanedBills.length
    };
}

// Export for browser console
if (typeof window !== 'undefined') {
    (window as any).cleanupDemoData = cleanupDemoData;
}
