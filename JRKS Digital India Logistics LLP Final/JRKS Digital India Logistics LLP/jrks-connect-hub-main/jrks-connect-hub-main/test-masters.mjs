import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });
if (!process.env.DB_HOST) dotenv.config({ path: ".env" });

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jrks",
    port: parseInt(process.env.DB_PORT || "3306", 10),
  });

  const [comps] = await conn.query("SELECT id, consigneeName FROM companies WHERE active = 1 LIMIT 5");
  const [broks] = await conn.query("SELECT id, brokerName FROM brokers WHERE active = 1 LIMIT 5");
  const [trucks] = await conn.query("SELECT id, vehicleNumber FROM trucks LIMIT 5");
  console.log("COMPANIES:", JSON.stringify(comps));
  console.log("BROKERS:", JSON.stringify(broks));
  console.log("TRUCKS:", JSON.stringify(trucks));
  await conn.end();
}
check().catch(console.error);
