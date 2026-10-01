import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: "server/.env" });
if (!process.env.DB_HOST) {
  dotenv.config({ path: ".env" });
}

async function exportCompleteDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jrks",
    port: parseInt(process.env.DB_PORT || "3306", 10),
  });

  const [tables] = await connection.query("SHOW TABLES");
  const dbName = process.env.DB_NAME || "jrks";

  let sql = `-- Complete Database Dump for JRKS Logistics
-- Export Date: ${new Date().toISOString()}

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

`;

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    console.log(`Exporting table: ${tableName}`);

    // Drop table
    sql += `-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table \`${tableName}\`\n`;
    sql += `-- --------------------------------------------------------\n\n`;
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

    // Create table schema
    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    sql += createTableResult[0]["Create Table"] + ";\n\n";

    // Dump data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sql += `-- Dumping data for table \`${tableName}\`\n`;
      sql += `INSERT INTO \`${tableName}\` VALUES\n`;

      const valueRows = rows.map((r) => {
        const vals = Object.values(r).map((val) => {
          if (val === null || val === undefined) return "NULL";
          if (typeof val === "number") return val;
          if (typeof val === "boolean") return val ? 1 : 0;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
          // Escape string
          const escaped = String(val)
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "''")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r");
          return `'${escaped}'`;
        });
        return `(${vals.join(", ")})`;
      });

      sql += valueRows.join(",\n") + ";\n\n";
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\nCOMMIT;\n`;

  const outputFile = "jrks_complete_db.sql";
  fs.writeFileSync(outputFile, sql, "utf8");
  console.log(`\nSuccessfully exported complete database with schema and data to ${outputFile}`);
  await connection.end();
}

exportCompleteDatabase().catch(console.error);
