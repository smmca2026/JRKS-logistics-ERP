const fs = require('fs');
let code = fs.readFileSync('server/index.js', 'utf8');

code = code.replace(/res\.status\(201\)\.json\(\{([\s\S]*?)\}\);/g, (match, inner) => {
  if (!inner.includes('createdBy')) {
    // Add createdBy to the end of the JSON object returned
    return `res.status(201).json({${inner.replace(/,(\s*)$/, '$1')}, createdBy: body.createdBy || "Admin" });`;
  }
  return match;
});

fs.writeFileSync('server/index.js', code);
console.log('JSON responses updated in server/index.js');
