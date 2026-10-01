import { initDB, getPool } from "./server/db.js";
(async () => {
  await initDB();
  const pool = getPool();
  const [idx] = await pool.query("SHOW INDEX FROM vouchers");
  console.log(idx);
  process.exit(0);
})();
