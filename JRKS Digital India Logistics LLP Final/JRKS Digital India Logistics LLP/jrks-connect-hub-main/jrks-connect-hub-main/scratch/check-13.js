import { getPool, initDb } from '../server/db.js';

async function check() {
  await initDb();
  const pool = getPool();
  
  const [cn] = await pool.query("SELECT items FROM consignment_notes WHERE lrNumber='0013'");
  console.log('Consignment Notes items:', cn[0]?.items);
  
  const [ch] = await pool.query("SELECT challanNo, lorryHire FROM challans WHERE items LIKE '%0013%'");
  console.log('Challans:', ch);
  
  const [ar] = await pool.query("SELECT challan_no, total_detention_amount FROM arrival_reports WHERE lr_no='0013' OR challan_no IN (SELECT challanNo FROM challans WHERE items LIKE '%0013%')");
  console.log('Arrival Reports:', ar);
  
  process.exit(0);
}
check();
