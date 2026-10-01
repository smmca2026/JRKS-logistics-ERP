import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  const partyName = "M/S SRI VIJAYALAKSHMI ENGINEERING WORKS.";
  
  try {
    // 1. Delete Consignment Notes
    const [cns] = await pool.query(
      "DELETE FROM consignment_notes WHERE consigneeName = ? OR consignorName = ?",
      [partyName, partyName]
    );
    console.log(`Deleted ${cns.affectedRows} Consignment Notes.`);

    // 2. Delete Bills
    const [bills] = await pool.query(
      "DELETE FROM bills WHERE customerName = ?",
      [partyName]
    );
    console.log(`Deleted ${bills.affectedRows} Bills.`);

    // 3. Delete Money Receipts
    const [mrs] = await pool.query(
      "DELETE FROM money_receipts WHERE partyName = ?",
      [partyName]
    );
    console.log(`Deleted ${mrs.affectedRows} Money Receipts.`);

    // 4. Delete Outstanding Ledger
    const [ledger] = await pool.query(
      "DELETE FROM outstanding_ledger WHERE partyName = ?",
      [partyName]
    );
    console.log(`Deleted ${ledger.affectedRows} Ledger Entries.`);

  } catch (err) {
    console.error("Error deleting records:", err);
  }
  process.exit(0);
}

main();
