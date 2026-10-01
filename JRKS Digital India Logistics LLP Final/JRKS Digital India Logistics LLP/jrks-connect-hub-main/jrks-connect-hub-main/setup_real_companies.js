import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Digi@2024',
    database: 'jrks',
    port: 3306
  });

  console.log('Cleaning up Auto Company and Mock Company dummy records...');
  await conn.query("DELETE FROM companies WHERE consigneeName LIKE 'Auto Company%' OR consigneeName LIKE 'Mock Company%'");

  // Check if M/S SRI VIJAYALAKSHMI ENGINEERING WORKS exists
  const [existing] = await conn.query("SELECT * FROM companies WHERE consigneeName LIKE '%VIJAYALAKSHMI%'");
  if (existing.length === 0) {
    await conn.query(
      "INSERT INTO companies (id, consigneeName, address, contactPerson, mobileNumber, gstNumber, panNumber, billingParty, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
      [
        'cmp_vjlk01',
        'M/S SRI VIJAYALAKSHMI ENGINEERING WORKS',
        'Plot No. 12, SIDCO Industrial Estate, Thuvakudi, Trichy - 620015',
        'Mr. S. Vijayakumar',
        '9842412345',
        '33AAACV1234F1Z5',
        'AAACV1234F',
        'Consignor',
        '2026-08-19'
      ]
    );
    console.log('Added: M/S SRI VIJAYALAKSHMI ENGINEERING WORKS (Consignor)');
  }

  // Check if Consignee exists
  const [consignees] = await conn.query("SELECT * FROM companies WHERE billingParty = 'Consignee'");
  if (consignees.length === 0) {
    await conn.query(
      "INSERT INTO companies (id, consigneeName, address, contactPerson, mobileNumber, gstNumber, panNumber, billingParty, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)",
      [
        'cmp_cnsg01',
        'TATA MOTORS LIMITED',
        'SIPCOT Industrial Park, Irungattukottai, Sriperumbudur, Chennai - 602105',
        'Logistics Head',
        '9876543210',
        '33AABCT1234A1Z9',
        'AABCT1234A',
        'Consignee',
        '2026-08-19'
      ]
    );
    console.log('Added: TATA MOTORS LIMITED (Consignee)');
  }

  // Update existing consignment notes to use M/S SRI VIJAYALAKSHMI ENGINEERING WORKS if they had Auto Company
  await conn.query(
    "UPDATE consignment_notes SET consignorName = 'M/S SRI VIJAYALAKSHMI ENGINEERING WORKS', consignorAddress = 'Plot No. 12, SIDCO Industrial Estate, Thuvakudi, Trichy - 620015', consignorGst = '33AAACV1234F1Z5', consignorPan = 'AAACV1234F' WHERE consignorName LIKE 'Auto Company%' OR consignorName LIKE 'Mock Company%'"
  );
  await conn.query(
    "UPDATE consignment_notes SET consigneeName = 'TATA MOTORS LIMITED', consigneeAddress = 'SIPCOT Industrial Park, Irungattukottai, Sriperumbudur, Chennai - 602105', consigneeGst = '33AABCT1234A1Z9', consigneePan = 'AABCT1234A' WHERE consigneeName LIKE 'Auto Company%' OR consigneeName LIKE 'Mock Company%'"
  );

  const [companies] = await conn.query("SELECT id, consigneeName, billingParty, gstNumber, panNumber, address FROM companies");
  console.log('\nUpdated Companies in Database:');
  console.log(JSON.stringify(companies, null, 2));

  await conn.end();
}

main().catch(console.error);
