import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "jrks",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const [ar] = await pool.query("SELECT * FROM arrival_reports WHERE lr_no = '0015'");
  console.log("Arrival Reports for 0015:", JSON.stringify(ar, null, 2));

  const [ch] = await pool.query("SELECT * FROM challans");
  const matchingChallans = ch.filter(c => {
    try {
      const items = JSON.parse(c.items || "[]");
      return items.some(i => i.cnNo === '0015');
    } catch(e) { return false; }
  });
  console.log("Challans for 0015:", JSON.stringify(matchingChallans, null, 2));

  process.exit(0);
}
check();
