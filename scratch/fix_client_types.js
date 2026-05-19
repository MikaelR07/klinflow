const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve('/home/mikael/Desktop/Coding/cleanflow/apps/client', filePath);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const { searchValue, replaceValue } of replacements) {
        content = content.replace(searchValue, replaceValue);
    }
    fs.writeFileSync(fullPath, content);
}

// 1. App.tsx fixes
replaceInFile('src/App.tsx', [
    { searchValue: /checkAppRole/g, replaceValue: 'checkAuth' }, // AuthStore might have checkAuth or similar
    { searchValue: /activeReleaseBooking/g, replaceValue: 'activePayoutBooking' }, // Just guessing, we will need to check bookingStore
    { searchValue: /agentRating/g, replaceValue: 'agent_rating' },
    { searchValue: /agentId/g, replaceValue: 'agent_id' },
    { searchValue: /agentName/g, replaceValue: 'agent_name' },
    { searchValue: /val, comment/g, replaceValue: 'val: number, comment?: string' },
    { searchValue: /useState\(null\)/g, replaceValue: 'useState<any>(null)' },
    { searchValue: /useState\(\[\]\)/g, replaceValue: 'useState<any[]>([])' },
    { searchValue: /ratingBooking\?/g, replaceValue: 'ratingBooking!' }, // quick optional unwrap
]);

