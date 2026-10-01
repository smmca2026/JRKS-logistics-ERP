const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

if (!content.includes('import { rebuildPartyLedger }')) {
  content = content.replace(
    'import { setupOutstandingAccounts } from "./outstanding-accounts.js";',
    'import { setupOutstandingAccounts } from "./outstanding-accounts.js";\nimport { rebuildPartyLedger } from "./ledger-sync.js";'
  );
}

const hooks = [
  {
    regex: /(app\.post\("\/api\/bookings",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.status\(2[0-9]{2}\)\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Broker\", body.brokerName);\n    $2"
  },
  {
    regex: /(app\.put\("\/api\/bookings\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Broker\", body.brokerName);\n    $2"
  },
  {
    regex: /(app\.delete\("\/api\/bookings\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const pool = getPool\(\);\s*const \{ id \} = req\.params;)/,
    inject: "$1\n    const [[rec]] = await pool.query(\"SELECT brokerName FROM bookings WHERE id = ?\", [id]);\n    const partyName = rec ? rec.brokerName : null;"
  },
  {
    regex: /(app\.delete\("\/api\/bookings\/:id",[\s\S]*?)(res\.json\(\{ success: true[^}]+\}\);)/,
    inject: "$1if (partyName) await rebuildPartyLedger(\"\", \"Broker\", partyName);\n    $2"
  },
  
  // Vouchers
  {
    regex: /(app\.post\("\/api\/vouchers",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.status\(2[0-9]{2}\)\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Broker\", body.paidTo);\n    $2"
  },
  {
    regex: /(app\.put\("\/api\/vouchers\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Broker\", body.paidTo);\n    $2"
  },
  {
    regex: /(app\.delete\("\/api\/vouchers\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const pool = getPool\(\);\s*const \{ id \} = req\.params;)/,
    inject: "$1\n    const [[rec]] = await pool.query(\"SELECT paidTo FROM vouchers WHERE id = ?\", [id]);\n    const partyName = rec ? rec.paidTo : null;"
  },
  {
    regex: /(app\.delete\("\/api\/vouchers\/:id",[\s\S]*?)(res\.json\(\{ success: true[^}]+\}\);)/,
    inject: "$1if (partyName) await rebuildPartyLedger(\"\", \"Broker\", partyName);\n    $2"
  },

  // Bills
  {
    regex: /(app\.post\("\/api\/bills",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.status\(2[0-9]{2}\)\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Company\", body.companyName);\n    $2"
  },
  {
    regex: /(app\.put\("\/api\/bills\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Company\", body.companyName);\n    $2"
  },
  {
    regex: /(app\.delete\("\/api\/bills\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const pool = getPool\(\);\s*const \{ id \} = req\.params;)/,
    inject: "$1\n    const [[rec]] = await pool.query(\"SELECT companyName FROM bills WHERE id = ?\", [id]);\n    const partyName = rec ? rec.companyName : null;"
  },
  {
    regex: /(app\.delete\("\/api\/bills\/:id",[\s\S]*?)(res\.json\(\{ success: true[^}]+\}\);)/,
    inject: "$1if (partyName) await rebuildPartyLedger(\"\", \"Company\", partyName);\n    $2"
  },

  // Money Receipts
  {
    regex: /(app\.post\("\/api\/money-receipts",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.status\(2[0-9]{2}\)\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Company\", body.partyName);\n    $2"
  },
  {
    regex: /(app\.put\("\/api\/money-receipts\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?)(res\.json\([^)]+\);)/,
    inject: "await rebuildPartyLedger(\"\", \"Company\", body.partyName);\n    $2"
  },
  {
    regex: /(app\.delete\("\/api\/money-receipts\/:id",\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const pool = getPool\(\);\s*const \{ id \} = req\.params;)/,
    inject: "$1\n    const [[rec]] = await pool.query(\"SELECT partyName FROM money_receipts WHERE id = ?\", [id]);\n    const partyName = rec ? rec.partyName : null;"
  },
  {
    regex: /(app\.delete\("\/api\/money-receipts\/:id",[\s\S]*?)(res\.json\(\{ success: true[^}]+\}\);)/,
    inject: "$1if (partyName) await rebuildPartyLedger(\"\", \"Company\", partyName);\n    $2"
  }
];

hooks.forEach(h => {
  content = content.replace(h.regex, h.inject);
});

fs.writeFileSync('server/index.js', content, 'utf8');
console.log("Hooks injected!");
