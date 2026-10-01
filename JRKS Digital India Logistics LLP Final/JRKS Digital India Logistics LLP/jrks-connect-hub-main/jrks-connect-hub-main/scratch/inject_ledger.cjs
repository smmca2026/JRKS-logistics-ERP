const fs = require('fs');

const replacement = `
  const lrMap = new Map();

  if (partyType === "Company") {
    // 4. Collect Billed Amounts from Bills
    const [bills] = await pool.query("SELECT * FROM bills WHERE customerName = ?", [partyName]);
    for (const bill of bills) {
      try {
        const items = JSON.parse(bill.items || "[]");
        // If bill has no items, we might fall back to bill.lrNumber
        if (items.length === 0 && bill.lrNumber) {
          const lrs = bill.lrNumber.split(',').map(s => s.trim()).filter(Boolean);
          const splitAmt = (Number(bill.grandTotalOverride) || 0) / lrs.length;
          for (const lr of lrs) {
            if (!lrMap.has(lr)) {
              lrMap.set(lr, { date: bill.date, refNo: bill.billNo, billedAmount: 0, receivedAmount: 0, timestamp: bill.createdAt || bill.date, sourceId: bill.id });
            }
            lrMap.get(lr).billedAmount += splitAmt;
          }
        } else {
          for (const item of items) {
            const lr = (item.lrNo || item.bookingNo || "").trim();
            if (lr) {
              if (!lrMap.has(lr)) {
                lrMap.set(lr, { date: bill.date, refNo: bill.billNo, billedAmount: 0, receivedAmount: 0, timestamp: bill.createdAt || bill.date, sourceId: bill.id });
              }
              lrMap.get(lr).billedAmount += (Number(item.amount) || 0);
            }
          }
        }
      } catch(e) {}
    }

    // 5. Collect Received Amounts from Money Receipts
    const [mrs] = await pool.query("SELECT * FROM money_receipts WHERE partyName = ?", [partyName]);
    for (const mr of mrs) {
      try {
        const items = JSON.parse(mr.items || "[]");
        for (const item of items) {
          const lr = (item.lrNo || item.bookingNo || "").trim();
          if (lr) {
             if (!lrMap.has(lr)) {
               lrMap.set(lr, { date: mr.receiptDate, refNo: mr.mrNo, billedAmount: 0, receivedAmount: 0, timestamp: mr.createdAt || mr.receiptDate, sourceId: mr.id });
             }
             lrMap.get(lr).receivedAmount += (Number(item.receivedAmount) || 0);
          }
        }
      } catch(e) {}
    }

  } else {
    // 6. Collect Payable from Arrival Reports (Vendor)
    const [arrivals] = await pool.query(
      \`SELECT a.*, c.vehicleNumber as cVehicle, c.lorryHire, c.lessAdvance 
       FROM arrival_reports a 
       JOIN challans c ON (
         a.challan_no = c.challanNo 
         OR a.challan_no = c.manualChallanNo 
         OR a.lr_no = c.challanNo 
         OR (a.lr_no != '' AND c.items LIKE CONCAT('%"cnNo":"', a.lr_no, '"%'))
       ) 
       WHERE c.brokerName = ?\`, 
      [partyName]
    );
    
    for (const ar of arrivals) {
      const lr = (ar.lr_no || "").trim();
      if (lr) {
        if (!lrMap.has(lr)) {
          lrMap.set(lr, { date: ar.arrivalDate || ar.report_date || ar.created_at, refNo: ar.arrival_report_no || ar.arrival_report_id, billedAmount: 0, receivedAmount: 0, timestamp: ar.created_at || ar.arrivalDate || ar.report_date, sourceId: ar.arrival_report_id });
        }
        const hireAmt = Number(ar.lorryHire) || 0;
        const advanceAmt = Number(ar.lessAdvance) || 0;
        const haltingAmt = Number(ar.total_detention_amount) || 0;
        const penaltyAmt = (ar.penalty_type && ar.penalty_type !== 'None') ? (Number(ar.penalty_amount) || 0) : 0;
        const netPayable = hireAmt + haltingAmt - advanceAmt - penaltyAmt;
        lrMap.get(lr).billedAmount += netPayable;
      }
    }

    // 7. Collect Paid Amount from Vouchers (Code 2)
    const [vouchers] = await pool.query("SELECT * FROM vouchers WHERE paidTo = ?", [partyName]);
    for (const v of vouchers) {
      try {
        const items = JSON.parse(v.items || "[]");
        for (const item of items) {
          if (String(item.codeNo) === "2") {
             const refText = ((item.refNo || "") + " " + (item.description || "")).toLowerCase();
             let matchedLr = null;
             for (const lr of lrMap.keys()) {
               if (refText.includes(lr.toLowerCase())) {
                 matchedLr = lr;
                 break;
               }
             }
             if (matchedLr) {
               lrMap.get(matchedLr).receivedAmount += (Number(item.payment) || 0);
             }
          }
        }
      } catch (e) {}
    }
  }

  // 8. Push LR Map records to ledger
  for (const [lrNo, data] of lrMap.entries()) {
    const balance = data.billedAmount - data.receivedAmount;
    const isSettled = balance <= 0.01;
    ledger.push({
       date: data.date,
       refType: partyType === "Company" ? "LR Billed" : "LR Payable",
       refNo: data.refNo,
       lrNo: lrNo,
       description: \`Total: \${data.billedAmount.toFixed(2)} | Received: \${data.receivedAmount.toFixed(2)}\`,
       debit: partyType === "Company" ? data.billedAmount : 0,
       credit: partyType === "Company" ? 0 : data.billedAmount,
       runningBalance: Math.abs(balance),
       runningBalanceType: balance > 0 ? (partyType === "Company" ? "Dr" : "Cr") : "",
       status: isSettled ? "Received" : "Not Received",
       timestamp: data.timestamp,
       sourceId: data.sourceId,
       profitLoss: partyType === "Company" ? data.billedAmount : 0
    });
  }

  // 9. Sort chronologically (with stable tie-breaker)
  ledger.sort((a, b) => {
    const timeDiff = (a.timestamp || "").localeCompare(b.timestamp || "");
    if (timeDiff !== 0) return timeDiff;
    return (a.sourceId || "").localeCompare(b.sourceId || "");
  });
`;

let content = fs.readFileSync('server/ledger-sync.js', 'utf8');
const startLine = 77;
const endLine = 303;

const lines = content.split('\\n');
const newLines = [
  ...lines.slice(0, startLine - 1),
  replacement,
  ...lines.slice(endLine)
];

fs.writeFileSync('server/ledger-sync.js', newLines.join('\\n'));
console.log('Replaced successfully');
