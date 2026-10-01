import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  
  try {
    const [ledger] = await pool.query("DELETE FROM outstanding_ledger WHERE partyType = 'Broker'");
    console.log(`Deleted ${ledger.affectedRows} Vendor (Broker) Ledger Entries.`);
    
    // Also clear bookings, challan_notes, arrival_reports, payment_vouchers?
    const [bookings] = await pool.query("DELETE FROM bookings");
    console.log(`Deleted ${bookings.affectedRows} Bookings.`);
    
    const [challans] = await pool.query("DELETE FROM challan_notes");
    console.log(`Deleted ${challans.affectedRows} Challan Notes.`);
    
    const [arrivals] = await pool.query("DELETE FROM arrival_reports");
    console.log(`Deleted ${arrivals.affectedRows} Arrival Reports.`);
    
    const [vouchers] = await pool.query("DELETE FROM payment_vouchers");
    console.log(`Deleted ${vouchers.affectedRows} Payment Vouchers.`);

  } catch (err) {
    console.error("Error deleting records:", err);
  }
  process.exit(0);
}

main();
