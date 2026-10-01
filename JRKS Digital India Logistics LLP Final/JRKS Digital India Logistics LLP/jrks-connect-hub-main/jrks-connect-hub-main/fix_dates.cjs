const fs = require('fs');
const path = require('path');
const dir = 'd:/Digiplus/JRKS Digital India Logistics LLP/jrks-connect-hub-main/jrks-connect-hub-main/src/routes';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    if (content.includes('.toLocaleDateString()')) {
      content = content.replace(/\.toLocaleDateString\(\)/g, '.toLocaleDateString("en-GB").replace(/\\//g, "-")');
      fs.writeFileSync(fullPath, content);
      console.log('Updated ' + file);
    }
  }
});
