const fs = require('fs');
const files = [
    'app/(protected)/dashboard/trips/page.tsx',
    'features/dashboard/components/dashboard-trip-card.tsx',
    'features/dashboard/components/dashboard-transaction-item.tsx',
    'features/booking/components/passenger-info-form.tsx',
    'app/(protected)/dashboard/booking/passengers/page.tsx',
    'app/(protected)/dashboard/booking/[tripId]/page.tsx',
    'app/(protected)/dashboard/history/page.tsx',
    'features/booking/components/booking-history-card.tsx',
    'features/wallet/components/wallet-dashboard.tsx',
    'app/(protected)/dashboard/page.tsx',
    'app/(protected)/dashboard/booking/payment-result/page.tsx',
    'features/booking/components/booking-summary.tsx',
    'features/booking/components/conflict-dialog.tsx'
];

files.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        
        // Remove uppercase
        content = content.replace(/\buppercase\b/g, '');
        
        // Remove tracking
        content = content.replace(/\btracking-(widest|wider|tight|tighter|\[.*?\])\b/g, '');
        
        // Remove font-bold from TabsTrigger
        content = content.replace(/(<TabsTrigger[^>]*?\bclassName=["'][^"']*?)\bfont-(?:bold|black|medium)\b([^"']*?["'])/g, '$1$2');

        // Clean up multiple spaces inside className
        content = content.replace(/ {2,}/g, ' ');

        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    } catch (e) {
        console.error('Failed on ' + file, e.message);
    }
});
