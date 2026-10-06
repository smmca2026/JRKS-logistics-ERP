import { getPool } from "./db.js";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Rebuilds the outstanding ledger for a specific party.
 * Fetches all source transactions, calculates chronological running balance,
 * and completely replaces the rows in the `outstanding_ledger` table for this party.
 */
export async function rebuildPartyLedger(partyId, partyType, providedPartyName = "") {
  const pool = getPool();
  let partyName = providedPartyName;
  let finalPartyId = partyId;

  // 1. Resolve ID and Name
  if (partyType === "Company") {
    if (!finalPartyId && partyName) {
      const [[comp]] = await pool.query("SELECT id FROM companies WHERE consigneeName = ?", [partyName]);
      if (comp) finalPartyId = comp.id;
    } else if (finalPartyId && !partyName) {
      const [[comp]] = await pool.query("SELECT consigneeName FROM companies WHERE id = ?", [finalPartyId]);
      if (comp) partyName = comp.consigneeName;
    }
  } else {
    if (!finalPartyId && partyName) {
      const [[brok]] = await pool.query("SELECT id FROM brokers WHERE brokerName = ?", [partyName]);
      if (brok) finalPartyId = brok.id;
    } else if (finalPartyId && !partyName) {
      const [[brok]] = await pool.query("SELECT brokerName FROM brokers WHERE id = ?", [finalPartyId]);
      if (brok) partyName = brok.brokerName;
    }
  }

  if (!partyName || !finalPartyId) {
    console.error(`rebuildPartyLedger: Party ID or Name not found. ID: ${finalPartyId}, Name: ${partyName}`);
    return;
  }
  
  const ledger = [];
  
  // 2. Collect Opening Balance
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
      sourceId: opening.id
    });
  }

  // 3. Collect Manual Adjustments
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
      sourceId: adj.id
    });
  }

  if (partyType === "Company") {
    // 4. Bills (0 impact to avoid double counting with LRs)
    const [bills] = await pool.query("SELECT * FROM bills WHERE customerName = ?", [partyName]);
    for (const bill of bills) {
      let amt = Number(bill.grandTotalOverride);
      if (isNaN(amt) || amt === 0) {
        try {
          const items = JSON.parse(bill.items || "[]");
          let subTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          let gst = 0;
          if (bill.gstPercentage) {
             const pct = Number(bill.gstPercentage.replace('%',''));
             if (!isNaN(pct)) gst = Math.round(subTotal * (pct / 100));
          }
          amt = subTotal + gst;
        } catch(e) {
          amt = 0;
        }
      }

      let profitLoss = 0;
      let lrNumbers = [];
      try {
        const items = JSON.parse(bill.items || "[]");
        lrNumbers = items.map(i => i.lrNo || i.bookingNo).filter(Boolean);
      } catch(e) {}
      if (lrNumbers.length === 0 && bill.lrNumber) {
        lrNumbers = bill.lrNumber.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (lrNumbers.length > 0) {
        let totalFreight = 0;
        let totalLorryHire = 0;
        let totalHalting = 0;
        
        const challanIds = new Set();
        const cnIds = new Set();
        const arIds = new Set();
        
        for (const lr of lrNumbers) {
          // Get Freight from Consignment Notes
          const [cnotes] = await pool.query("SELECT id, items FROM consignment_notes WHERE lrNumber = ? OR consignmentNoteNo = ?", [lr, lr]);
          for (const cn of cnotes) {
            if (!cnIds.has(cn.id)) {
              cnIds.add(cn.id);
              try {
                const cnItems = JSON.parse(cn.items || "[]");
                for (const cItem of cnItems) {
                  totalFreight += Number(cItem.bookingAmount) || 0;
                }
              } catch(e) {}
            }
          }
          
          // Get Lorry Hire from Challans
          const [challans] = await pool.query("SELECT id, challanNo, lorryHire FROM challans WHERE items LIKE ?", [`%${lr}%`]);
          for (const ch of challans) {
            if (!challanIds.has(ch.id)) {
              challanIds.add(ch.id);
              totalLorryHire += Number(ch.lorryHire) || 0;
            }
          }
          
          // Get Halting from arrival_reports
          const [arrivals] = await pool.query("SELECT arrival_report_id as id, total_detention_amount FROM arrival_reports WHERE lr_no = ? OR challan_no IN (SELECT challanNo FROM challans WHERE items LIKE ?)", [lr, `%${lr}%`]);
          for (const ar of arrivals) {
            if (!arIds.has(ar.id)) {
               arIds.add(ar.id);
               totalHalting += Number(ar.total_detention_amount) || 0;
            }
          }
        }
        
        // If there is no freight in the challan, fallback to the Bill's total amount
        if (totalFreight === 0) {
          totalFreight = amt;
        }
        
        profitLoss = totalFreight - totalLorryHire - totalHalting;
      } else {
        // Fallback if no LRs linked: use the original calculation
        profitLoss = 0;
      }

      ledger.push({
        date: bill.date,
        refType: "Bill Generated",
        refNo: bill.billNo,
        lrNo: bill.lrNumber || "",
        description: `Bill for LR: ${bill.lrNumber} (Total: ${amt})`,
        debit: amt, // Debit impact applied here per user instruction
        credit: 0,
        timestamp: bill.createdAt || bill.date,
        sourceId: bill.id,
        profitLoss
      });
    }
    // 5. Money Receipts
    const [mrs] = await pool.query("SELECT * FROM money_receipts WHERE partyName = ?", [partyName]);
    for (const mr of mrs) {
      const amt = Number(mr.amountReceived) || 0;
      ledger.push({
        date: mr.receiptDate,
        refType: "Money Receipt",
        refNo: mr.mrNo,
        lrNo: mr.lrNo || "",
        description: mr.paymentFor || mr.narration || "Payment Received",
        debit: 0,
        credit: amt,
        timestamp: mr.createdAt || mr.receiptDate,
        sourceId: mr.id
      });
    }
    // Consignment Notes (Debit impact)
    const [cns] = await pool.query("SELECT * FROM consignment_notes WHERE consigneeName = ? OR consignorName = ?", [partyName, partyName]);
    for (const cn of cns) {
      let amt = 0;
      try {
        const items = JSON.parse(cn.items || "[]");
        amt = items.reduce((sum, item) => sum + (Number(item.bookingAmount) || 0), 0);
      } catch(e) {}
      
      // We no longer push Consignment Notes to the financial ledger to avoid 0-value clutter.
      // The financial impact is entirely handled by the Bill generation above.
    }
  } else {
    // 6. Bookings (Lorry Hire)
    const [bookings] = await pool.query("SELECT * FROM bookings WHERE brokerName = ?", [partyName]);
    for (const bk of bookings) {
      const amt = Number(bk.hireAmount) || 0;
      ledger.push({
        date: bk.bookingDate,
        refType: "Booking / Lorry Hire",
        refNo: bk.bookingNo,
        lrNo: bk.lrNumber || "",
        description: `Vehicle: ${bk.vehicleNumber}`,
        debit: 0,
        credit: amt,
        timestamp: bk.createdAt || bk.bookingDate,
        sourceId: bk.id
      });
    }
    // 7. Vouchers (Payments)
    const [vouchers] = await pool.query("SELECT * FROM vouchers WHERE paidTo = ?", [partyName]);
    for (const v of vouchers) {
      let amt = 0;
      try {
        const items = JSON.parse(v.items || "[]");
        amt = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      } catch(e) {}
      if (amt > 0) {
        ledger.push({
          date: v.voucherDate,
          refType: "Payment Voucher",
          refNo: v.voucherNo,
          lrNo: "",
          description: v.narration || "Payment Made",
          debit: amt,
          credit: 0,
          timestamp: v.createdAt || v.voucherDate,
          sourceId: v.id
        });
      }
    }
    
    // Arrival Reports (Credit impact for lorryHire and Halting, Debit impact for Advance and Penalty)
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
    
    // Use a Set to prevent double-counting if an Arrival Report matches a Challan multiple ways
    const processedArrivalIds = new Set();
    
    for (const ar of arrivals) {
      if (processedArrivalIds.has(ar.arrival_report_id)) continue;
      processedArrivalIds.add(ar.arrival_report_id);
      
      const hireAmt = Number(ar.lorryHire) || 0;
      const advanceAmt = Number(ar.lessAdvance) || 0;
      const haltingAmt = Number(ar.total_detention_amount) || 0;
      const penaltyAmt = (ar.penalty_type && ar.penalty_type !== 'None') ? (Number(ar.penalty_amount) || 0) : 0;
      
      ledger.push({
        date: ar.arrivalDate || ar.report_date || ar.created_at,
        refType: "Arrival Report",
        refNo: ar.arrival_report_no || ar.arrival_report_id,
        lrNo: ar.lr_no || "",
        description: `Vehicle: ${ar.cVehicle || '-'} | Adv: ${advanceAmt} | Hlt: ${haltingAmt}`,
        debit: advanceAmt + penaltyAmt,
        credit: hireAmt + haltingAmt,
        timestamp: ar.created_at || ar.arrivalDate || ar.report_date,
        sourceId: ar.arrival_report_id
      });
    }
  }

  // 8. Sort chronologically (with stable tie-breaker)
  ledger.sort((a, b) => {
    const timeDiff = a.timestamp.localeCompare(b.timestamp);
    if (timeDiff !== 0) return timeDiff;
    return (a.sourceId || "").localeCompare(b.sourceId || "");
  });

  // 9. Calculate Running Balances
  let chronologicalBalance = 0;
  for (const entry of ledger) {
    if (partyType === "Company") {
      chronologicalBalance += (entry.debit - entry.credit);
      entry.runningBalance = Math.abs(chronologicalBalance);
      entry.runningBalanceType = chronologicalBalance > 0 ? "Dr" : (chronologicalBalance < 0 ? "Cr" : "");
      entry.status = chronologicalBalance > 0 ? "Receivable" : (chronologicalBalance < 0 ? "Payable" : "Settled");
    } else {
      chronologicalBalance += (entry.credit - entry.debit);
      entry.runningBalance = Math.abs(chronologicalBalance);
      entry.runningBalanceType = chronologicalBalance > 0 ? "Cr" : (chronologicalBalance < 0 ? "Dr" : "");
      entry.status = chronologicalBalance > 0 ? "Payable" : (chronologicalBalance < 0 ? "Receivable" : "Settled");
    }
  }

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
\n
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
       description: partyType === "Company" ? `Total: ${data.billedAmount.toFixed(2)} | Received: ${data.receivedAmount.toFixed(2)}` : `Total: ${data.billedAmount.toFixed(2)} | Paid: ${data.receivedAmount.toFixed(2)}`,
       debit: partyType === "Company" ? data.billedAmount : 0,
       credit: partyType === "Company" ? 0 : data.billedAmount,
       runningBalance: Math.abs(balance),
       runningBalanceType: balance > 0 ? (partyType === "Company" ? "Dr" : "Cr") : "",
       status: isSettled ? (partyType === "Company" ? "Received" : "Paid") : "Pending",
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
