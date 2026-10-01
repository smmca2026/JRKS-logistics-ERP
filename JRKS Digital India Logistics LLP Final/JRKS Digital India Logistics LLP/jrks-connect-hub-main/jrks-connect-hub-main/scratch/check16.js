import { initDb, getPool } from "../server/db.js";
async function run() {
  await initDb();
  const [res] = await getPool().query("SELECT id, voucherNo, paidTo, items FROM vouchers WHERE voucherNo='0016' OR items LIKE '%0016%'");
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
