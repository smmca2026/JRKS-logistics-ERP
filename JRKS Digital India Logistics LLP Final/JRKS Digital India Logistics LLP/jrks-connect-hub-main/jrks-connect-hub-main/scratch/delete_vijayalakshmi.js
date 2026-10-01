import { getPool, initDb } from "./server/db.js";
import { rebuildPartyLedger } from "./server/ledger-sync.js";

async function main() {
  await initDb();
  const pool = getPool();
  const partyName = "M/S SRI VIJAYALAKSHMI ENGINEERING WORKS.";
  
  // Find Bills
  const [bills] = await pool.query("SELECT id FROM bills WHERE customerName = ?", [partyName]);
  console.log(`Found ${bills.length} bills for ${partyName}`);

  // Find LRs (Consignment Notes)
  const [lrs] = await pool.query("SELECT id FROM consignment_notes WHERE consignorName = ? OR consigneeName = ?", [partyName, partyName]);
  console.log(`Found ${lrs.length} LRs for ${partyName}`);

  // Find Money Receipts
  const [receipts] = await pool.query("SELECT id FROM money_receipts WHERE receivedFrom = ?", [partyName]);
  console.log(`Found ${receipts.length} Money Receipts for ${partyName}`);

  // Find Payment Vouchers
  const [vouchers] = await pool.query("SELECT id FROM payment_vouchers WHERE paidTo = ?", [partyName]);
  console.log(`Found ${vouchers.length} Payment Vouchers for ${partyName}`);
  
  // Find Challans
  const [challans] = await pool.query("SELECT id FROM challan_notes WHERE brokerName = ?", [partyName]);
  console.log(`Found ${challans.length} Challans for ${partyName}`);

  // Delete from ledger
  await pool.query("DELETE FROM ledgers WHERE partyName = ?", [partyName]);
  console.log(`Deleted from ledgers table.`);
  
  console.log("To permanently delete all these records, uncomment the DELETE queries.");
  /*
  await pool.query("DELETE FROM bills WHERE customerName = ?", [partyName]);
  await pool.query("DELETE FROM consignment_notes WHERE consignorName = ? OR consigneeName = ?", [partyName, partyName]);
  await pool.query("DELETE FROM money_receipts WHERE receivedFrom = ?", [partyName]);
  await pool.query("DELETE FROM payment_vouchers WHERE paidTo = ?", [partyName]);
  await pool.query("DELETE FROM challan_notes WHERE brokerName = ?", [partyName]);
  console.log("Records deleted.");
  */
  process.exit(0);
}

main().catch(console.error);
