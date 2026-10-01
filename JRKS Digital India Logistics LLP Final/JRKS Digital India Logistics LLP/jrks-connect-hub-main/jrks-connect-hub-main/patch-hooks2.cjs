const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

if (!content.includes('import { rebuildPartyLedger }')) {
  content = content.replace(
    'import { getPool',
    'import { rebuildPartyLedger } from "./ledger-sync.js";\nimport { getPool'
  );
}

const lines = content.split('\n');

const injectHooks = [
  {
    triggerLine: 'app.post("/api/bookings", async (req, res) => {',
    targetLines: ['res.status(201).json({'],
    injectCode: '    await rebuildPartyLedger("", "Broker", body.brokerName);'
  },
  {
    triggerLine: 'app.put("/api/bookings/:id", async (req, res) => {',
    targetLines: ['res.json({ id, ...body, updatedAt: date });'],
    injectCode: '      await rebuildPartyLedger("", "Broker", body.brokerName);'
  },
  {
    triggerLine: 'app.delete("/api/bookings/:id", async (req, res) => {',
    targetLines: ['const { id } = req.params;'],
    injectCode: '    const [[rec]] = await pool.query("SELECT brokerName FROM bookings WHERE id = ?", [id]);\n    const partyName = rec ? rec.brokerName : null;',
    insertAfter: true
  },
  {
    triggerLine: 'app.delete("/api/bookings/:id", async (req, res) => {',
    targetLines: ['res.json({ success: true, message: "Booking deleted successfully." });'],
    injectCode: '    if (partyName) await rebuildPartyLedger("", "Broker", partyName);'
  },
  
  // Vouchers
  {
    triggerLine: 'app.post("/api/vouchers", async (req, res) => {',
    targetLines: ['res.status(201).json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Broker", body.paidTo);'
  },
  {
    triggerLine: 'app.put("/api/vouchers/:id", async (req, res) => {',
    targetLines: ['res.json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Broker", body.paidTo);'
  },
  {
    triggerLine: 'app.delete("/api/vouchers/:id", async (req, res) => {',
    targetLines: ['const { id } = req.params;'],
    injectCode: '    const [[rec]] = await pool.query("SELECT paidTo FROM vouchers WHERE id = ?", [id]);\n    const partyName = rec ? rec.paidTo : null;',
    insertAfter: true
  },
  {
    triggerLine: 'app.delete("/api/vouchers/:id", async (req, res) => {',
    targetLines: ['res.json({ success: true, message: "Voucher deleted" });'],
    injectCode: '    if (partyName) await rebuildPartyLedger("", "Broker", partyName);'
  },

  // Bills
  {
    triggerLine: 'app.post("/api/bills", async (req, res) => {',
    targetLines: ['res.status(201).json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Company", body.companyName);'
  },
  {
    triggerLine: 'app.put("/api/bills/:id", async (req, res) => {',
    targetLines: ['res.json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Company", body.companyName);'
  },
  {
    triggerLine: 'app.delete("/api/bills/:id", async (req, res) => {',
    targetLines: ['const { id } = req.params;'],
    injectCode: '    const [[rec]] = await pool.query("SELECT companyName FROM bills WHERE id = ?", [id]);\n    const partyName = rec ? rec.companyName : null;',
    insertAfter: true
  },
  {
    triggerLine: 'app.delete("/api/bills/:id", async (req, res) => {',
    targetLines: ['res.json({ success: true, message: "Bill deleted successfully" });'],
    injectCode: '    if (partyName) await rebuildPartyLedger("", "Company", partyName);'
  },

  // Money Receipts
  {
    triggerLine: 'app.post("/api/money-receipts", async (req, res) => {',
    targetLines: ['res.status(201).json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Company", body.partyName);'
  },
  {
    triggerLine: 'app.put("/api/money-receipts/:id", async (req, res) => {',
    targetLines: ['res.json({ id, ...body'],
    injectCode: '    await rebuildPartyLedger("", "Company", body.partyName);'
  },
  {
    triggerLine: 'app.delete("/api/money-receipts/:id", async (req, res) => {',
    targetLines: ['const { id } = req.params;'],
    injectCode: '    const [[rec]] = await pool.query("SELECT partyName FROM money_receipts WHERE id = ?", [id]);\n    const partyName = rec ? rec.partyName : null;',
    insertAfter: true
  },
  {
    triggerLine: 'app.delete("/api/money-receipts/:id", async (req, res) => {',
    targetLines: ['res.json({ success: true, message: "Receipt deleted" });'],
    injectCode: '    if (partyName) await rebuildPartyLedger("", "Company", partyName);'
  }
];

let currentRoute = null;

const newLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track active route
  if (line.startsWith('app.')) {
    currentRoute = line.trim();
  }
  
  newLines.push(line);
  
  // Check hooks for current active route
  if (currentRoute) {
    for (const hook of injectHooks) {
      if (currentRoute === hook.triggerLine) {
        for (const tLine of hook.targetLines) {
          if (line.includes(tLine)) {
             // Avoid double injection
             const nextLine = lines[i+1] || "";
             const prevLine = newLines[newLines.length-2] || "";
             
             if (!nextLine.includes('rebuildPartyLedger') && !prevLine.includes('rebuildPartyLedger')) {
                if (hook.insertAfter) {
                   newLines.push(hook.injectCode);
                } else {
                   // Insert before the current line
                   newLines.pop();
                   newLines.push(hook.injectCode);
                   newLines.push(line);
                }
             }
             break;
          }
        }
      }
    }
  }
}

fs.writeFileSync('server/index.js', newLines.join('\n'), 'utf8');
console.log("Hooks injected securely!");
