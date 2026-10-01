import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "Digi@2024";
const dbPort = parseInt(process.env.DB_PORT || "3306", 10);
const dbName = process.env.DB_NAME || "jrks";

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort,
      database: dbName,
    });

    console.log("Connected to DB, attempting to drop UNIQUE index on voucherNo...");

    // In MySQL, the constraint name for a UNIQUE column is often the column name
    await connection.query("ALTER TABLE vouchers DROP INDEX voucherNo");

    console.log("Successfully dropped UNIQUE index on voucherNo");
  } catch (err) {
    console.error("Error dropping index:", err.message);
  } finally {
    if (connection) await connection.end();
  }
}

run();
