const fs = require('fs');
const mysql = require('mysql2/promise');

async function importSql() {
  try {
    const sql = fs.readFileSync('C:\\Users\\digip\\Downloads\\jrks.sql', 'utf8');
    console.log(`Loaded SQL file: ${sql.length} bytes`);

    // First connection to drop/create DB without specifying database in config
    let connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Malaveeka@20',
      port: 3306,
      multipleStatements: true
    });

    console.log('Connected to MySQL. Dropping and creating database...');
    await connection.query('DROP DATABASE IF EXISTS `jrks`;');
    await connection.query('CREATE DATABASE `jrks`;');
    await connection.end();

    // Reconnect to the newly created jrks DB
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Malaveeka@20',
      port: 3306,
      database: 'jrks',
      multipleStatements: true
    });

    console.log('Executing import...');
    await connection.query(sql);
    await connection.end();

    console.log('Import successful!');
  } catch (err) {
    console.error('Import failed:', err);
  }
}

importSql();
