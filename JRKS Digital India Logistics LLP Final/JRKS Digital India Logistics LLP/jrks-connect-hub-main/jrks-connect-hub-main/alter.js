import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  try {
    await pool.query('ALTER TABLE outstanding_ledger ADD COLUMN lrNo VARCHAR(255) DEFAULT ""');
    console.log("Added lrNo column");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("lrNo column already exists.");
    } else {
      console.error(err);
    }
  }
  process.exit(0);
}

main();
