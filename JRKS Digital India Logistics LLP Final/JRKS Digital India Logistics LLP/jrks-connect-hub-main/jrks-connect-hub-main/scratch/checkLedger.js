import { initDb, getPool } from "../server/db.js";
import { rebuildVendorLedgersFromVoucherText } from "../server/ledger-sync.js";

async function run() {
  await initDb();
  await rebuildVendorLedgersFromVoucherText('0016');
  const [res] = await getPool().query("SELECT lrNo, debit, credit, runningBalance, status, description FROM outstanding_ledger WHERE lrNo='0016'");
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
