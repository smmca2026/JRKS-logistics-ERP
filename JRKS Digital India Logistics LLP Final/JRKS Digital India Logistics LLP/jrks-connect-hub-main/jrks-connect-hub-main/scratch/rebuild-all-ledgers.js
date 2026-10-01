import { getPool, initDb } from "../server/db.js";
import { rebuildPartyLedger } from "../server/ledger-sync.js";

async function main() {
  await initDb();
  const pool = getPool();
  console.log("Rebuilding all company ledgers...");
  const [companies] = await pool.query("SELECT consigneeName FROM companies");
  for (const c of companies) {
    if (c.consigneeName) {
      console.log(`Rebuilding ledger for company: ${c.consigneeName}`);
      await rebuildPartyLedger("", "Company", c.consigneeName);
    }
  }
  console.log("Done!");
  process.exit(0);
}

main();
