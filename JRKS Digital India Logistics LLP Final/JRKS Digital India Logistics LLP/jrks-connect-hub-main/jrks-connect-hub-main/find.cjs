const fs = require('fs');
const lines = fs.readFileSync('server/index.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.match(/app\.(post|put|delete)\(['"]\/api\/(bills|money-receipts|bookings|vouchers)/)) {
    console.log(i + 1 + ': ' + l.trim());
  }
});
