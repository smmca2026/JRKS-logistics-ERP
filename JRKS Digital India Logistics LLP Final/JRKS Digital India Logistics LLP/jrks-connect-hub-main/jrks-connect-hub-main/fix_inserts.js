const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

// 1. challans
content = content.replace(
  /INSERT INTO challans \([\s\S]*?archived(\s*)\)/,
  (match, space) => match.replace(/archived\s*\)/, 'archived, createdBy' + space + ')')
);
content = content.replace(
  /VALUES \([\s\S]*?body\.archived \? 1 : 0(\s*)\)/,
  (match, space) => match.replace(/body\.archived \? 1 : 0\s*\)/, 'body.archived ? 1 : 0,\n        body.createdBy || "Admin"' + space + ')')
);

// 2. consignment_notes
content = content.replace(
  /INSERT INTO consignment_notes \([\s\S]*?createdAt(\s*)\)/,
  (match, space) => match.replace(/createdAt\s*\)/, 'createdAt, createdBy' + space + ')')
);
content = content.replace(
  /VALUES \([\s\S]*?date(\s*)\)/,
  (match, space) => {
    // Only target the consignment notes VALUES block (it ends with `date,` or just `date`)
    // Actually, it's safer to target the specific query. Let's do string replacement for the exact lines.
    return match;
  }
);
