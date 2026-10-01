import { initDb, getPool } from "../server/db.js";

async function run() {
  await initDb();
  const pool = getPool();
  const [tables] = await pool.query("SHOW TABLES");
  console.log(tables);
  process.exit(0);
}
run();
