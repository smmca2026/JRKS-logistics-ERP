import { initDb, getPool } from "../server/db.js";
import { rebuildPartyLedger } from "../server/ledger-sync.js";

async function run() {
  await initDb();
  const pool = getPool();
  const [companies] = await pool.query("SELECT id, consigneeName as name FROM companies");
  const [brokers] = await pool.query("SELECT id, brokerName as name FROM brokers");
  
  console.log("Rebuilding ledgers...");
  
  for (const c of companies) {
    if (c.name) {
      await rebuildPartyLedger(c.id, "Company", c.name);
    }
  }
  
  for (const b of brokers) {
    if (b.name) {
      await rebuildPartyLedger(b.id, "Broker", b.name);
    }
  }
  
  console.log("All ledgers rebuilt successfully!");
  process.exit(0);
}
run();
