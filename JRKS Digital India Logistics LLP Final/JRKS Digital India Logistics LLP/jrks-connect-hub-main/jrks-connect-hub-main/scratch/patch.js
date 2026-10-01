
export async function rebuildVendorLedgersFromVoucherText(text = "") {
  if (!text) return;
  const { getPool } = await import("./db.js");
  const pool = getPool();
  try {
    const [arrivals] = await pool.query("SELECT a.lr_no, c.brokerName FROM arrival_reports a JOIN challans c ON (a.challan_no = c.challanNo OR a.challan_no = c.manualChallanNo OR a.lr_no = c.challanNo OR (a.lr_no != '' AND c.items LIKE CONCAT('%\"cnNo\":\"', a.lr_no, '\"%')))");
    const brokers = new Set();
    const textLower = text.toLowerCase();
    for (const ar of arrivals) {
      const lr = (ar.lr_no || "").trim().toLowerCase();
      if (lr && textLower.includes(lr) && ar.brokerName) {
        brokers.add(ar.brokerName);
      }
    }
    for (const b of brokers) {
      await rebuildPartyLedger("", "Broker", b);
    }
  } catch(e) {
    console.error("rebuildVendorLedgersFromVoucherText error:", e);
  }
}
