import { getPool, initDb } from "./server/db.js";

async function cleanAllExceptVoucherCodesAndUsers() {
  console.log("Connecting to Database...");
  await initDb();
  const pool = getPool();

  const tablesToClear = [
    // Masters to clear
    "companies",
    "brokers",
    "trucks",
    "banks",
    "drivers",
    // Transactions to clear
    "consignment_notes",
    "challans",
    "arrival_reports",
    "bills",
    "money_receipts",
    "vouchers",
    "bookings",
    "outstanding_ledger",
    "manual_adjustments",
    "party_opening_balances",
    "bank_txns",
    "cash_txns",
  ];

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of tablesToClear) {
    try {
      await pool.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`[✓] Cleared table: ${table}`);
    } catch (e) {
      console.log(`[Notice] ${table}:`, e.message);
    }
  }
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");

  const [users] = await pool.query("SELECT username, role FROM users");
  console.log(`\n[✓] Master Users PRESERVED (${users.length}):`, users.map(u => u.username).join(", "));

  const [codes] = await pool.query("SELECT COUNT(*) as cnt FROM voucher_codes");
  console.log(`[✓] Master Voucher Codes PRESERVED: ${codes[0].cnt} codes`);

  console.log("\n============================================================");
  console.log("✓ ALL MASTERS (EXCEPT VOUCHER CODES & USERS) AND DATA CLEARED!");
  console.log("============================================================\n");
  process.exit(0);
}

cleanAllExceptVoucherCodesAndUsers().catch((err) => {
  console.error("Clean Error:", err);
  process.exit(1);
});
