import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  const [rows] = await pool.query("SELECT * FROM bills ORDER BY createdAt DESC LIMIT 1");
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

main().catch(console.error);
