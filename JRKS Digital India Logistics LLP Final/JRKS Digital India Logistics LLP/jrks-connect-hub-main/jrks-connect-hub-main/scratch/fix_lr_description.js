import { getPool, initDb } from "../server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  console.log("Updating outstanding_ledger descriptions...");
  const [result] = await pool.query(`UPDATE outstanding_ledger SET description = REPLACE(description, 'Bill for LRs:', 'Bill for LR:') WHERE description LIKE 'Bill for LRs:%'`);
  console.log("Affected rows:", result.affectedRows);
  
  console.log("Updating bills descriptions if there is any...");
  try {
     // If bills table has a description column, though it probably doesn't based on ledger-sync.js
     // ledger-sync dynamically builds it. But just in case.
     // No wait, ledger-sync dynamically builds it from billNo and lrNumber.
  } catch(e) {}

  console.log("Done!");
  process.exit(0);
}

main();
