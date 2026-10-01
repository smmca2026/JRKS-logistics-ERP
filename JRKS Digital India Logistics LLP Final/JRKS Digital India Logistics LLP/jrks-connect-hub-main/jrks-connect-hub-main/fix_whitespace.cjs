const fs = require('fs');
const files = fs.readdirSync('src/routes').filter(f => f.endsWith('.tsx'));
files.forEach(f => {
  let c = fs.readFileSync('src/routes/' + f, 'utf8');
  c = c.replace(/className="text-\[10px\] text-slate-500 font-normal font-sans mt-0\.5"/g, 'className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap"');
  fs.writeFileSync('src/routes/' + f, c);
});
console.log('Fixed whitespace in all records files');
