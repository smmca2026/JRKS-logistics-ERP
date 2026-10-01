import { initDb, getPool } from "../server/db.js";
async function run() {
  await initDb();
  const [res] = await getPool().query("SELECT * FROM vouchers WHERE items LIKE '%\"codeNo\":\"2\"%'");
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
