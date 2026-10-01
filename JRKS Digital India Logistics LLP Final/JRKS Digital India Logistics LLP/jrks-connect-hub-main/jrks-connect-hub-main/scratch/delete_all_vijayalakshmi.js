import { getPool, initDb } from "./server/db.js";
import { rebuildPartyLedger } from "./server/ledger-sync.js";

async function main() {
  await initDb();
  const pool = getPool();
  const partyName = "M/S SRI VIJAYALAKSHMI ENGINEERING WORKS.";
  
  console.log(`Deleting all records for ${partyName}...`);

  await pool.query("DELETE FROM bills WHERE customerName = ?", [partyName]);
  await pool.query("DELETE FROM consignment_notes WHERE consignorName = ? OR consigneeName = ?", [partyName, partyName]);
  await pool.query("DELETE FROM money_receipts WHERE partyName = ?", [partyName]);
  await pool.query("DELETE FROM vouchers WHERE paidTo = ? OR receivedFrom = ?", [partyName, partyName]);
  await pool.query("DELETE FROM challan_notes WHERE brokerName = ?", [partyName]);
  
  // Also wipe out outstanding ledger so it's clean
  await pool.query("DELETE FROM outstanding_ledger WHERE partyName = ?", [partyName]);
  
  console.log("Records deleted. Rebuilding ledger just to be safe...");
  await rebuildPartyLedger("", "Company", partyName);
  
  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
