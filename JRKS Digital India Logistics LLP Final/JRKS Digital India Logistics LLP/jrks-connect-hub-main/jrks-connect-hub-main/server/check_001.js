import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Digi@2024',
    database: 'jrks'
  });

  const [cns] = await conn.query('SELECT id, lrNumber, consignmentNoteNo, fromLocation, toLocation, vehicleNumber, consignorName, consigneeName, items FROM consignment_notes');
  console.log('=== ALL CONSIGNMENT NOTES ===');
  console.log(JSON.stringify(cns, null, 2));

  const [chs] = await conn.query('SELECT id, challanNo, manualChallanNo, fromLocation, toLocation, vehicleNumber, brokerName, lessAdvance, balanceAmount, freight, loadingMamul, rtoFine, items FROM challans');
  console.log('=== ALL CHALLANS ===');
  console.log(JSON.stringify(chs, null, 2));

  const [bks] = await conn.query('SELECT id, bookingNo, lrNo, lrNumber, loadingLocation, unloadingLocation, vehicleNumber, hireAmount, advanceAmount, balanceAmount FROM bookings');
  console.log('=== ALL BOOKINGS ===');
  console.log(JSON.stringify(bks, null, 2));

  await conn.end();
}

main().catch(console.error);
