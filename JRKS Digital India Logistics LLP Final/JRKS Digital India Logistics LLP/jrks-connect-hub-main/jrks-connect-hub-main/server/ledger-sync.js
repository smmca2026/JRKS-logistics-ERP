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
      } else {
        finalPartyId = partyName;
      }
    } else if (finalPartyId && !partyName) {
      const [[brok]] = await pool.query("SELECT brokerName FROM brokers WHERE id = ?", [finalPartyId]);
      if (brok) partyName = brok.brokerName;
      else partyName = finalPartyId;
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

  } else {
    // 6. Collect Payable for Broker/Vendor from Challans and Arrival Reports
    const [challanRows] = await pool.query(
      `SELECT c.* FROM challans c WHERE LOWER(TRIM(c.brokerName)) = LOWER(TRIM(?)) AND (c.archived = 0 OR c.archived IS NULL)`,
      [partyName]
    );

    const [arrivalRows] = await pool.query(
      `SELECT a.* FROM arrival_reports a`
    );

    const cleanStr = (s) => (s || "").toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const c of challanRows) {
      let cItems = [];
      try { cItems = JSON.parse(c.items || "[]"); } catch(e){}
      
      const lrList = cItems.map(i => (i.cnNo || i.lrNo || i.bookingNo || "").trim()).filter(Boolean);
      const mainLr = lrList.length > 0 ? lrList.join(", ") : (c.challanNo || c.manualChallanNo || "").trim();
      if (!mainLr) continue;

      // Exact mathematical calculation for Challan Balance
      const lorryHire = Number(c.lorryHire) || Number(c.freight) || 0;
      const extraCharges = Number(c.extraCharges) || 0;
      const lessAdvance = Number(c.lessAdvance) || 0;
      const tds = Number(c.tds) || 0;
      const loadingMamul = Number(c.loadingMamul) || 0;
      const comlyCom = Number(c.comlyCom) || 0;
      const rtoFine = Number(c.rtoFine) || 0;

      const challanGross = lorryHire + extraCharges;
      const challanDeductions = lessAdvance + tds + loadingMamul + comlyCom + rtoFine;
      const challanBalance = challanGross - challanDeductions;

      let matchedAr = null;
      for (const ar of arrivalRows) {
        const arLrClean = cleanStr(ar.lr_no || ar.bill_no);
        const arChClean = cleanStr(ar.challan_no);
        const cNoClean = cleanStr(c.challanNo);
        const mNoClean = cleanStr(c.manualChallanNo);

        // Check if arrival report matches challan number
        if (arChClean && (arChClean === cNoClean || arChClean === mNoClean)) {
          matchedAr = ar;
          break;
        }

        // Check if arrival report matches any LR number in challan
        if (arLrClean) {
          const matchedByLr = lrList.some(l => {
            const singleClean = cleanStr(l);
            return singleClean && (singleClean === arLrClean || singleClean.replace(/^0+/, "") === arLrClean.replace(/^0+/, ""));
          });
          if (matchedByLr) {
            matchedAr = ar;
            break;
          }
        }
      }

      let netPayable = challanBalance;
      if (matchedAr) {
        const haltingAmt = Number(matchedAr.total_detention_amount) || 0;
        const penaltyAmt = (matchedAr.penalty_type && matchedAr.penalty_type !== 'None' && matchedAr.penalty_type !== '') ? (Number(matchedAr.penalty_amount) || 0) : 0;
        netPayable = challanBalance + haltingAmt - penaltyAmt;
      }

      const refNo = matchedAr ? (matchedAr.arrival_report_no || matchedAr.arrival_report_id || c.challanNo || c.manualChallanNo) : (c.challanNo || c.manualChallanNo || "-");
      const txDate = matchedAr ? (matchedAr.arrival_date || matchedAr.arrivalDate || matchedAr.report_date || c.challanDate) : c.challanDate;

      lrMap.set(mainLr, {
        date: txDate,
        refNo: refNo,
        refType: matchedAr ? "Arrival Report" : "Challan Generated",
        lrList: lrList.length > 0 ? lrList : [mainLr],
        billedAmount: Math.max(0, netPayable),
        receivedAmount: 0,
        timestamp: c.createdAt || txDate,
        sourceId: c.id
      });
    }

    // 7. Collect Paid Amount ONLY from Vouchers issued to this Vendor (paidTo = partyName)
    const [vouchers] = await pool.query(
      "SELECT * FROM vouchers WHERE LOWER(TRIM(paidTo)) = LOWER(TRIM(?))",
      [partyName]
    );

    for (const v of vouchers) {
      try {
        const items = JSON.parse(v.items || "[]");
        for (const item of items) {
          const itemAmt = Number(item.payment) || 0;
          if (itemAmt <= 0) continue;

          const refNo = (item.refNo || "").trim().toLowerCase();
          const desc = (item.description || "").trim().toLowerCase();
          const narr = (v.narration || "").trim().toLowerCase();

          let matchedKey = null;

          if (refNo) {
            for (const [key, data] of lrMap.entries()) {
              if (data.lrList.some(l => l.toLowerCase() === refNo || l.toLowerCase().replace(/[^a-z0-9]/g,'') === refNo.replace(/[^a-z0-9]/g,''))) {
                matchedKey = key;
                break;
              }
              if (key.toLowerCase() === refNo) {
                matchedKey = key;
                break;
              }
            }
          }

          if (!matchedKey) {
            for (const [key, data] of lrMap.entries()) {
              for (const singleLr of data.lrList) {
                const cleanLr = singleLr.trim();
                if (cleanLr.length >= 2) {
                  const escapedLr = cleanLr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                  const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escapedLr}(?:$|[^a-zA-Z0-9])`, 'i');
                  if (regex.test(desc) || regex.test(narr)) {
                    matchedKey = key;
                    break;
                  }
                }
              }
              if (matchedKey) break;
            }
          }

          if (matchedKey) {
            lrMap.get(matchedKey).receivedAmount += itemAmt;
          } else {
            ledger.push({
              date: v.voucherDate,
              refType: "Payment Voucher",
              refNo: v.voucherNo || v.manualVoucherNo || "-",
              lrNo: item.refNo || "-",
              description: item.expenseAccountName ? `${item.expenseAccountName}: ${item.description || v.narration || ""}` : (v.narration || "Vendor Payment"),
              debit: 0,
              credit: itemAmt,
              runningBalance: itemAmt,
              runningBalanceType: "Dr",
              status: "Received",
              timestamp: v.createdAt || v.voucherDate,
              sourceId: v.id,
              profitLoss: 0
            });
          }
        }
      } catch(e) {}
    }
  }

  // 8. Push LR Map records to ledger
  for (const [lrNo, data] of lrMap.entries()) {
    const balance = data.billedAmount - data.receivedAmount;
    const isSettled = balance <= 0.01;
    const isCompany = partyType === "Company";
    ledger.push({
       date: data.date,
       refType: isCompany ? "Bill Generated" : "Arrival Report",
       refNo: data.refNo,
       lrNo: lrNo,
       description: isCompany
         ? `Total: ${data.billedAmount.toFixed(2)} | Received: ${data.receivedAmount.toFixed(2)}`
         : `Total: ${data.billedAmount.toFixed(2)} | Paid: ${data.receivedAmount.toFixed(2)}`,
       debit: isCompany ? data.billedAmount : 0,
       credit: isCompany ? 0 : data.billedAmount,
       runningBalance: Math.abs(balance),
       runningBalanceType: balance > 0 ? (isCompany ? "Dr" : "Cr") : "",
       status: isSettled 
         ? (isCompany ? "Received" : "Paid")
         : "Pending",
       timestamp: data.timestamp,
       sourceId: data.sourceId,
       profitLoss: isCompany ? data.billedAmount : 0
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
