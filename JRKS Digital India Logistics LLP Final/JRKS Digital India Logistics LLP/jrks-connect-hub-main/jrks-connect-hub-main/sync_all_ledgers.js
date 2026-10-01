import { getPool, initDb } from "./server/db.js";
import { rebuildPartyLedger } from "./server/ledger-sync.js";

async function syncAll() {
  try {
    await initDb();
    const pool = getPool();

    console.log("Fetching all companies and brokers...");
    const [companies] = await pool.query("SELECT id, consigneeName as partyName FROM companies WHERE active = 1");
    const [brokers] = await pool.query("SELECT id, brokerName as partyName FROM brokers WHERE active = 1");

    console.log(`Found ${companies.length} companies and ${brokers.length} brokers.`);

    for (const c of companies) {
      console.log(`Rebuilding ledger for Company: ${c.partyName}`);
      await rebuildPartyLedger(c.id, "Company", c.partyName);
    }

    for (const b of brokers) {
      console.log(`Rebuilding ledger for Broker: ${b.partyName}`);
      await rebuildPartyLedger(b.id, "Broker", b.partyName);
    }

    console.log("All ledgers rebuilt successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing ledgers:", err);
    process.exit(1);
  }
}

syncAll();
