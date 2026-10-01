import { initDb, getPool } from "../server/db.js";

async function run() {
  await initDb();
  const p = getPool();
  await p.query("DELETE FROM arrival_reports WHERE lr_no='0016'");
  await p.query("DELETE FROM vouchers WHERE voucherNo='0016'");
  await p.query("DELETE FROM outstanding_ledger WHERE lrNo='0016'");
  console.log("Cleaned up 0016");
  process.exit(0);
}
run();
