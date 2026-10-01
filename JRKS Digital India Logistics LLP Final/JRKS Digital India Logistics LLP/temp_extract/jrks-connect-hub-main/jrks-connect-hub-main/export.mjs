import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });

async function exportSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const [tables] = await connection.query("SHOW TABLES");
  let sql = "SET FOREIGN_KEY_CHECKS=0;\n\n";

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sql += createTableResult[0]["Create Table"] + ";\n\n";
  }

  sql += "SET FOREIGN_KEY_CHECKS=1;\n";
  fs.writeFileSync("jrks-db.sql", sql);
  console.log("Exported schema to jrks-db.sql");
  process.exit(0);
}
exportSchema().catch(console.error);
