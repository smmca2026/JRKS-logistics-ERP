import { initDb, getPool } from "../server/db.js";
import { rebuildPartyLedger } from "../server/ledger-sync.js";

async function run() {
  await initDb();
  await rebuildPartyLedger(null, "Broker", "NAMAKKAL TRAILOR OWNER ASSOCIATION ");
  console.log("Rebuilt!");
  process.exit(0);
}
run();
