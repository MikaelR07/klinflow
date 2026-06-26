const fs = require('fs');

// We have to extract pendingBlock properly.
// Since the file is already patched with the broken pendingBlock, we should grab the original from git or rewrite it manually.
// Actually, FleetFinance.tsx has been modified.
// Let's checkout the file from git to restore it, then run a fixed script.
