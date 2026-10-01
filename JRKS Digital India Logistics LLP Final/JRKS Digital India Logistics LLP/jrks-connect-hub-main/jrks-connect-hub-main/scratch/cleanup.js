import { initDb, getPool } from "../server/db.js";
import { rebuildPartyLedger } from "../server/ledger-sync.js";

async function run() {
  await initDb();
  await getPool().query("DELETE FROM vouchers WHERE id IN ('huxxa1nf', 'utlwgs5n', 'ygdhxth7')");
  await rebuildPartyLedger("", "Broker", "NAMAKKAL TRAILOR OWNER ASSOCIATION ");
  console.log("Cleanup and rebuild complete. Only the 6000 voucher remains.");
  process.exit(0);
}
run();
