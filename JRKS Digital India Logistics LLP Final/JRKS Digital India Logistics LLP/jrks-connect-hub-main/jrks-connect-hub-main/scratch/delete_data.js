import { initDb, getPool } from "../server/db.js";

async function run() {
  await initDb();
  const pool = getPool();
  const partyName = "NAMAKKAL TRAILOR OWNER ASSOCIATION ";
  
  console.log(`Deleting data for ${partyName}...`);

  // 1. Delete outstanding ledger
  await pool.query("DELETE FROM outstanding_ledger WHERE partyName = ?", [partyName]);
  
  // 2. Delete manual adjustments
  await pool.query("DELETE FROM manual_adjustments WHERE partyName = ?", [partyName]);

  // 3. Delete opening balances
  const [brokers] = await pool.query("SELECT id FROM brokers WHERE brokerName = ?", [partyName]);
  if (brokers.length > 0) {
    await pool.query("DELETE FROM party_opening_balances WHERE partyId = ?", [brokers[0].id]);
  }

  // 4. Find all challans for this broker to delete linked arrival reports
  const [challans] = await pool.query("SELECT challanNo, manualChallanNo FROM challans WHERE brokerName = ?", [partyName]);
  
  for (const ch of challans) {
    if (ch.challanNo) {
      await pool.query("DELETE FROM arrival_reports WHERE challan_no = ?", [ch.challanNo]);
      await pool.query("DELETE FROM arrival_reports WHERE lr_no = ?", [ch.challanNo]);
    }
    if (ch.manualChallanNo) {
      await pool.query("DELETE FROM arrival_reports WHERE challan_no = ?", [ch.manualChallanNo]);
      await pool.query("DELETE FROM arrival_reports WHERE lr_no = ?", [ch.manualChallanNo]);
    }
  }

  // 5. Delete challans
  await pool.query("DELETE FROM challans WHERE brokerName = ?", [partyName]);

  console.log("Deleted all transactional data for " + partyName);
  process.exit(0);
}
run();
