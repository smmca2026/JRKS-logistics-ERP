import { getPool, initDb } from "./server/db.js";

async function main() {
  await initDb();
  const pool = getPool();
  try {
    await pool.query(`
      ALTER TABLE challans 
        MODIFY freight DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY loadingMamul DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY comlyCom DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY rtoFine DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY extraCharges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY lorryHire DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY tds DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY lessAdvance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        MODIFY balanceAmount DECIMAL(12,2) NOT NULL DEFAULT 0.00
    `);
    console.log("Successfully altered challans columns to DECIMAL(12,2)");
    const [cols] = await pool.query("DESCRIBE challans");
    const fields = ["freight", "loadingMamul", "comlyCom", "rtoFine", "extraCharges", "lorryHire", "tds", "balanceAmount"];
    console.log(cols.filter(c => fields.includes(c.Field)).map(c => c.Field + ': ' + c.Type).join('\n'));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();
