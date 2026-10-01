import { getPool } from "./db.js";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Rebuilds the outstanding ledger for a specific party.
 * Fetches all source transactions, groups them by LR Number (as requested),
 * and completely replaces the rows in the `outstanding_ledger` table for this party.
 */
export async function rebuildPartyLedger(partyId, partyType, providedPartyName = "") {
  const pool = getPool();
  let partyName = providedPartyName;
  let finalPartyId = partyId;

  // 1. Resolve ID and Name
  if (partyType === "Company") {
    if (!finalPartyId && partyName) {
      const [[comp]] = await pool.query("SELECT id, consigneeName FROM companies WHERE LOWER(TRIM(consigneeName)) = LOWER(TRIM(?)) LIMIT 1", [partyName]);
      if (comp) {
        finalPartyId = comp.id;
        partyName = comp.consigneeName;
      }
    } else if (finalPartyId && !partyName) {
      const [[comp]] = await pool.query("SELECT consigneeName FROM companies WHERE id = ?", [finalPartyId]);
      if (comp) partyName = comp.consigneeName;
    }
  } else {
    if (!finalPartyId && partyName) {
      const [[brok]] = await pool.query("SELECT id, brokerName FROM brokers WHERE LOWER(TRIM(brokerName)) = LOWER(TRIM(?)) LIMIT 1", [partyName]);
      if (brok) {
        finalPartyId = brok.id;
        partyName = brok.brokerName;
      }
    } else if (finalPartyId && !partyName) {
      const [[brok]] = await pool.query("SELECT brokerName FROM brokers WHERE id = ?", [finalPartyId]);
      if (brok) partyName = brok.brokerName;
    }
  }

  if (!partyName || !finalPartyId) {
    console.log(`rebuildPartyLedger: Party not found in masters yet. ID: ${finalPartyId}, Name: ${partyName}`);
    return;
  }
  
  const ledger = [];
  const lrMap = new Map();
  
  // 2. Collect Opening Balance (Standalone)
  const [[opening]] = await pool.query("SELECT * FROM party_opening_balances WHERE partyId = ?", [finalPartyId]);
  if (opening) {
    const isDebit = opening.balanceType === "Debit";
    const amt = Number(opening.amount);
    ledger.push({
      date: opening.date,
      refType: "Opening Balance",
      refNo: "-",
      lrNo: "",
      description: "Initial Balance",
      debit: isDebit ? amt : 0,
      credit: !isDebit ? amt : 0,
      timestamp: opening.createdAt || opening.date,
      sourceId: opening.id,
      runningBalance: amt,
      runningBalanceType: isDebit ? "Dr" : "Cr",
      status: "Settled", // Standalones
      profitLoss: 0
    });
  }

  // 3. Collect Manual Adjustments (Standalone)
  const [adjustments] = await pool.query("SELECT * FROM manual_adjustments WHERE partyId = ?", [finalPartyId]);
  for (const adj of adjustments) {
    const isDebit = adj.adjustmentType === "Debit";
    const amt = Number(adj.amount);
    ledger.push({
      date: adj.date,
      refType: "Manual Adjustment",
      refNo: adj.id.slice(0,8).toUpperCase(),
      lrNo: "",
      description: adj.reason + (adj.remarks ? ` - ${adj.remarks}` : ""),
      debit: isDebit ? amt : 0,
      credit: !isDebit ? amt : 0,
      timestamp: adj.createdAt || adj.date,
      sourceId: adj.id,
      runningBalance: amt,
      runningBalanceType: isDebit ? "Dr" : "Cr",
      status: "Settled",
      profitLoss: 0
    });
  }

  if (partyType === "Company") {
    // 4. Collect Billed Amounts from Bills
    const [bills] = await pool.query("SELECT * FROM bills WHERE customerName = ?", [partyName]);
    for (const bill of bills) {
      try {
        const items = JSON.parse(bill.items || "[]");
        if (items.length === 0 && bill.lrNumber) {
          const lrs = bill.lrNumber.split(',').map(s => s.trim()).filter(Boolean);
          const splitAmt = (Number(bill.grandTotalOverride) || 0) / (lrs.length || 1);
          for (const lr of lrs) {
            if (!lrMap.has(lr)) lrMap.set(lr, { date: bill.date, refNo: bill.billNo, billedAmount: 0, receivedAmount: 0, timestamp: bill.createdAt || bill.date, sourceId: bill.id });
            lrMap.get(lr).billedAmount += splitAmt;
          }
        } else {
          for (const item of items) {
            const lr = (item.lrNo || item.bookingNo || "").trim();
            if (lr) {
              if (!lrMap.has(lr)) lrMap.set(lr, { date: bill.date, refNo: bill.billNo, billedAmount: 0, receivedAmount: 0, timestamp: bill.createdAt || bill.date, sourceId: bill.id });
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
             if (!lrMap.has(lr)) lrMap.set(lr, { date: mr.receiptDate, refNo: mr.mrNo, billedAmount: 0, receivedAmount: 0, timestamp: mr.createdAt || mr.receiptDate, sourceId: mr.id });
             lrMap.get(lr).receivedAmount += (Number(item.receivedAmount) || 0);
          }
        }
      } catch(e) {}
    }

    // 5.5 Fetch Lorry Cost for each LR to calculate Net Trip Profit
    const [allChallans] = await pool.query("SELECT * FROM challans");
    const [allArrivals] = await pool.query("SELECT * FROM arrival_reports");
    
    for (const [lrNo, data] of lrMap.entries()) {
      let lorryCost = 0;
      for (const chl of allChallans) {
        const isMatch =
          chl.challanNo === lrNo ||
          chl.manualChallanNo === lrNo ||
          (chl.items && chl.items.includes(`"cnNo":"${lrNo}"`));
        if (isMatch) {
          lorryCost += Number(chl.lorryHire || 0);
        }
      }
      const matchedArr = allArrivals.find((a) => a.lr_no === lrNo || a.challan_no === lrNo);
      if (matchedArr) {
        lorryCost += Number(matchedArr.total_detention_amount || 0);
        if (matchedArr.penalty_type && matchedArr.penalty_type !== "None") {
          lorryCost -= Number(matchedArr.penalty_amount || 0);
        }
      }
      data.lorryCost = lorryCost;
    }

  } else {
    // 6. Collect Payable from Arrival Reports (Vendor)
    const [arrivals] = await pool.query(
      `SELECT a.*, c.vehicleNumber as cVehicle, c.lorryHire, c.lessAdvance 
       FROM arrival_reports a 
       JOIN challans c ON (
         a.challan_no = c.challanNo 
         OR a.challan_no = c.manualChallanNo 
         OR a.lr_no = c.challanNo 
         OR (a.lr_no != '' AND c.items LIKE CONCAT('%"cnNo":"', a.lr_no, '"%'))
       ) 
       WHERE c.brokerName = ?`, 
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
    const [vouchers] = await pool.query("SELECT * FROM vouchers WHERE items LIKE '%\"codeNo\":\"2\"%'");
    for (const v of vouchers) {
      try {
        const items = JSON.parse(v.items || "[]");
        for (const item of items) {
          if (String(item.codeNo) === "2") {
             const refText = ((item.refNo || "") + " " + (item.description || "") + " " + (v.voucherNo || "") + " " + (v.manualVoucherNo || "") + " " + (v.narration || "")).toLowerCase();
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
    const rawBalance = data.billedAmount - data.receivedAmount;
    const balance = Math.max(0, rawBalance);
    let status = "Not Received";

    if (partyType === "Company") {
      if (data.billedAmount <= 0.01 && data.receivedAmount <= 0.01) {
        status = "Not Received";
      } else if (rawBalance <= 0.01) {
        status = "Received";
      } else if (data.receivedAmount > 0.01) {
        status = "Pending";
      } else {
        status = "Not Received";
      }
    } else {
      // For Lorry Vendor / Broker: "Paid" / "Not Paid" / "Pending"
      if (data.billedAmount <= 0.01 && data.receivedAmount <= 0.01) {
        status = "Not Paid";
      } else if (rawBalance <= 0.01) {
        status = "Paid";
      } else if (data.receivedAmount > 0.01) {
        status = "Pending";
      } else {
        status = "Not Paid";
      }
    }

    const description = partyType === "Company"
      ? `Total: ${data.billedAmount.toFixed(2)} | Received: ${data.receivedAmount.toFixed(2)}`
      : `Total: ${data.billedAmount.toFixed(2)} | Paid: ${data.receivedAmount.toFixed(2)}`;

    ledger.push({
       date: data.date,
       refType: partyType === "Company" ? "Bill Generated" : "Arrival Report",
       refNo: data.refNo,
       lrNo: lrNo,
       description: description,
       debit: partyType === "Company" ? data.billedAmount : 0,
       credit: partyType === "Company" ? 0 : data.billedAmount,
       runningBalance: balance,
       runningBalanceType: balance > 0.01 ? (partyType === "Company" ? "Dr" : "Cr") : "",
       status: status,
       timestamp: data.timestamp,
       sourceId: data.sourceId,
       profitLoss: partyType === "Company" ? (data.lorryCost > 0 ? (data.billedAmount - data.lorryCost) : data.billedAmount) : 0
    });
  }

  // 9. Sort chronologically (with stable tie-breaker)
  ledger.sort((a, b) => {
    const timeDiff = (a.timestamp || "").localeCompare(b.timestamp || "");
    if (timeDiff !== 0) return timeDiff;
    return (a.sourceId || "").localeCompare(b.sourceId || "");
  });

  // 10. Database Update Transaction
  const dbConnection = await pool.getConnection();
  try {
    await dbConnection.beginTransaction();
    
    // Clear old ledger entries
    await dbConnection.query("DELETE FROM outstanding_ledger WHERE partyId = ?", [finalPartyId]);

    // Insert new computed ledger
    if (ledger.length > 0) {
      const values = ledger.map(l => [
        uid(),
        finalPartyId,
        partyType,
        partyName,
        l.date,
        l.refType,
        l.refNo,
        l.lrNo || "",
        l.description,
        l.debit,
        l.credit,
        l.runningBalance,
        l.runningBalanceType,
        l.status,
        l.timestamp,
        l.sourceId,
        l.profitLoss || 0
      ]);
      await dbConnection.query(
        "INSERT INTO outstanding_ledger (id, partyId, partyType, partyName, date, refType, refNo, lrNo, description, debit, credit, runningBalance, runningBalanceType, status, timestamp, sourceId, profitLoss) VALUES ?",
        [values]
      );
    }
    
    await dbConnection.commit();
  } catch (error) {
    await dbConnection.rollback();
    console.error(`rebuildPartyLedger: Failed to sync ledger for ${partyName}`, error);
  } finally {
    dbConnection.release();
  }
}

export async function rebuildCompanyLedgersByLrNumbers(lrNumbers = []) {
  if (!lrNumbers || lrNumbers.length === 0) return;
  const { getPool } = await import("./db.js");
  const pool = getPool();
  try {
    const [bookings] = await pool.query("SELECT consigneeName, consignorName FROM bookings WHERE lrNo IN (?) OR bookingNo IN (?)", [lrNumbers, lrNumbers]);
    const companiesToRebuild = new Set();
    for (const b of bookings) {
      if (b.consigneeName) companiesToRebuild.add(b.consigneeName);
      if (b.consignorName) companiesToRebuild.add(b.consignorName);
    }
    for (const comp of companiesToRebuild) {
      await rebuildPartyLedger("", "Company", comp);
    }
  } catch(e) {
    console.error("rebuildCompanyLedgersByLrNumbers error:", e);
  }
}
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

export async function rebuildAllLedgers() {
  const { getPool } = await import("./db.js");
  const pool = getPool();
  try {
    const [companies] = await pool.query("SELECT id, consigneeName FROM companies WHERE active = 1");
    for (const c of companies) {
      if (c.consigneeName || c.id) {
        await rebuildPartyLedger(c.id, "Company", c.consigneeName);
      }
    }
    const [brokers] = await pool.query("SELECT id, brokerName FROM brokers WHERE active = 1");
    for (const b of brokers) {
      if (b.brokerName || b.id) {
        await rebuildPartyLedger(b.id, "Broker", b.brokerName);
      }
    }
  } catch(e) {
    console.error("rebuildAllLedgers error:", e);
  }
}

