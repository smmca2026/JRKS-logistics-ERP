const fs = require("fs");

let content = fs.readFileSync("server/index.js", "utf8");

function insertHook(marker, hookCode) {
  if (content.includes(hookCode)) {
    console.log("Hook already exists for marker:", marker.trim());
    return;
  }
  const parts = content.split(marker);
  if (parts.length === 2) {
    content = parts[0] + hookCode + "\n    " + marker + parts[1];
    console.log("Injected hook before:", marker.trim());
  } else {
    console.log("Marker not found or multiple found:", marker.trim());
  }
}

// 1. Consignment Notes
insertHook(
  'res.status(201).json({ id, ...body,',
  'try { await rebuildPartyLedger(null, "Company", body.consigneeName); await rebuildPartyLedger(null, "Company", body.consignorName); } catch(e){}'
);
insertHook(
  'res.json({ id, ...body,',
  'try { await rebuildPartyLedger(null, "Company", body.consigneeName); await rebuildPartyLedger(null, "Company", body.consignorName); } catch(e){}'
);

// 2. Challans
// POST Challan response
insertHook(
  'res.status(201).json({\n      ...body,\n      id,\n      challanNo,',
  'try { await rebuildPartyLedger(null, "Broker", body.brokerName); } catch(e){}'
);
// PUT Challan response
insertHook(
  'res.json({\n      ...body,\n      id,\n      updatedAt: date,',
  'try { await rebuildPartyLedger(null, "Broker", body.brokerName); } catch(e){}'
);

// 3. Arrival Reports
// POST Arrival Report response
insertHook(
  'res.status(201).json({ arrival_report_id: id, ...body,',
  `try {
      const pool = getPool();
      const [[challan]] = await pool.query("SELECT brokerName FROM challans WHERE challanNo = ?", [body.challan_no]);
      if (challan) await rebuildPartyLedger(null, "Broker", challan.brokerName);
    } catch(e){}`
);
// PUT Arrival Report response
insertHook(
  'res.json({ arrival_report_id: id, ...body,',
  `try {
      const pool = getPool();
      const [[challan]] = await pool.query("SELECT brokerName FROM challans WHERE challanNo = ?", [body.challan_no]);
      if (challan) await rebuildPartyLedger(null, "Broker", challan.brokerName);
    } catch(e){}`
);

fs.writeFileSync("server/index.js", content, "utf8");
console.log("Done patching extra hooks.");
