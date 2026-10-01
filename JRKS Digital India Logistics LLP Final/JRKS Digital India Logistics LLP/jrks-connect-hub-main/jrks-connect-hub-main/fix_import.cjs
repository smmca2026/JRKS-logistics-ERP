const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

if (!content.includes('import { setupOutstandingAccounts }')) {
  content = 'import { setupOutstandingAccounts } from "./outstanding-accounts.js";\n' + content;
  fs.writeFileSync('server/index.js', content, 'utf8');
  console.log("Added import successfully.");
} else {
  console.log("Import already exists.");
}
