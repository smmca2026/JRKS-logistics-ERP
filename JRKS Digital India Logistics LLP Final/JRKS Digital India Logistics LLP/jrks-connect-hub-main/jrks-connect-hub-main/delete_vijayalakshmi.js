import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  const partyName = "M/S SRI VIJAYALAKSHMI ENGINEERING WORKS.";
  
  // Delete from outstanding_ledger
  await pool.query("DELETE FROM outstanding_ledger WHERE partyName = ?", [partyName]);
  console.log(`Deleted from outstanding_ledger table.`);
  
  process.exit(0);
}

main().catch(console.error);
