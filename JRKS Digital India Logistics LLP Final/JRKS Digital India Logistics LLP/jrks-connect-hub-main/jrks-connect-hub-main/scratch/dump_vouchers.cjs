const { initDb, getPool } = require('../server/db.js');

initDb().then(async () => {
  const pool = getPool();
  const [vouchers] = await pool.query("SELECT * FROM vouchers");
  console.log(JSON.stringify(vouchers, null, 2));
  process.exit(0);
}).catch(console.error);
