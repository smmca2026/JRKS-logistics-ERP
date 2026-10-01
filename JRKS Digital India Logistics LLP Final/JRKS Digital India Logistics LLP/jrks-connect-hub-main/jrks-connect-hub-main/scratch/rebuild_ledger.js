import { getPool, initDb } from "./server/db.js";
import { rebuildPartyLedger } from "./server/ledger-sync.js";

async function main() {
  await initDb();
  const partyName = "M/S SRI VIJAYALAKSHMI ENGINEERING WORKS.";
  console.log("Rebuilding ledger for:", partyName);
  await rebuildPartyLedger("", "Company", partyName);
  console.log("Done!");
  process.exit(0);
}

main();
