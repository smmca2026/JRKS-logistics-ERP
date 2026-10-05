import { getPool, initDb } from "./server/db.js";

async function clean() {
  console.log("Connecting to Database using Server Config...");
  await initDb();
  const pool = getPool();

  const transactionTables = [
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
    "cash_txns"
  ];

  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const table of transactionTables) {
    try {
      await pool.query(`TRUNCATE TABLE \`${table}\``);
      console.log(`[✓] Cleared table: ${table}`);
    } catch (e) {
      console.log(`[Notice] ${table}:`, e.message);
    }
  }
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");

  const [users] = await pool.query("SELECT username, role FROM users");
  console.log(`[✓] Master Users safe:`, users.map(u => u.username).join(", "));

  const [codes] = await pool.query("SELECT COUNT(*) as cnt FROM voucher_codes");
  console.log(`[✓] Master Voucher Codes safe: ${codes[0].cnt} codes`);

  console.log("\n==========================================");
  console.log("✓ ALL TRANSACTION DATA CLEARED SUCCESSFULLY!");
  console.log("==========================================\n");
  process.exit(0);
}

clean().catch((err) => {
  console.error("Clean Error:", err);
  process.exit(1);
});
