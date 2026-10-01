import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  try {
    const [rows] = await pool.query('SELECT * FROM money_receipts');
    console.log(rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
