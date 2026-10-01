const fs = require('fs');
const code = fs.readFileSync('dist/server/assets/server-DM7a4qA3.js', 'utf8');
const matches = code.match(/from\s*['"]([^'"]+)['"]/g) || [];
const modules = [...new Set(matches.map(m => m.match(/['"]([^'"]+)['"]/)[1]).filter(m => !m.startsWith('.')))];
console.log(modules.join('\n'));
