import { getPool } from "./db.js";
import { rebuildPartyLedger } from "./ledger-sync.js";

const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().slice(0, 10);

export function setupOutstandingAccounts(app) {
  // GET /api/outstanding-accounts - Returns summary list for all parties from the dedicated ledger
  app.get("/api/outstanding-accounts", async (req, res) => {
    try {
      const pool = getPool();
      
      const [companies] = await pool.query("SELECT id, consigneeName as partyName, mobileNumber FROM companies WHERE active = 1");
      const [brokers] = await pool.query("SELECT id, brokerName as partyName, mobileNumber FROM brokers WHERE active = 1");
      
      const results = [];

      for (const comp of companies) {
        const [ledger] = await pool.query("SELECT * FROM outstanding_ledger WHERE partyId = ? ORDER BY timestamp DESC LIMIT 1", [comp.id]);
        
        let outstandingBalance = 0;
        let status = "Not Received";
        let lastTransactionDate = "-";

        if (ledger.length > 0) {
          const l = ledger[0];
          outstandingBalance = l.runningBalance;
          status = l.status;
          lastTransactionDate = l.date;
        }

        results.push({
          id: comp.id,
          partyName: comp.partyName,
          accountType: "Company",
          mobileNumber: comp.mobileNumber || "",
          openingBalance: 0, // We can skip breaking this down in the new view, or fetch it if needed.
          openingType: "Debit",
          totalReceivable: 0,
          totalPayable: 0,
          totalReceived: 0,
          totalPaid: 0,
          outstandingBalance: outstandingBalance,
          status: status,
          lastTransactionDate: lastTransactionDate
        });
      }

      for (const brok of brokers) {
        const [ledger] = await pool.query("SELECT * FROM outstanding_ledger WHERE partyId = ? ORDER BY timestamp DESC LIMIT 1", [brok.id]);
        
        let outstandingBalance = 0;
        let status = "Not Paid";
        let lastTransactionDate = "-";

        if (ledger.length > 0) {
          const l = ledger[0];
          outstandingBalance = l.runningBalance;
          status = l.status;
          lastTransactionDate = l.date;
        }

        results.push({
          id: brok.id,
          partyName: brok.partyName,
          accountType: "Lorry Vendor",
          mobileNumber: brok.mobileNumber || "",
          openingBalance: 0,
          openingType: "Credit",
          totalReceivable: 0,
          totalPayable: 0,
          totalReceived: 0,
          totalPaid: 0,
          outstandingBalance: outstandingBalance,
          status: status,
          lastTransactionDate: lastTransactionDate
        });
      }

      res.json(results);
    } catch (err) {
      console.error("GET /api/outstanding-accounts error:", err);
      res.status(500).json({ error: "Failed to fetch outstanding accounts" });
    }
  });

  // GET Ledger for a specific party directly from outstanding_ledger table
  app.get("/api/outstanding-accounts/:partyType/:partyId/ledger", async (req, res) => {
    try {
      const pool = getPool();
      const { partyType, partyId } = req.params;
      
      const pType = partyType === "Company" || partyType === "company" ? "Company" : "Broker";
      try {
        await rebuildPartyLedger(partyId, pType);
      } catch (syncErr) {
        console.warn("Auto-sync error before ledger load:", syncErr);
      }
      
      const [ledger] = await pool.query("SELECT * FROM outstanding_ledger WHERE partyId = ? ORDER BY timestamp ASC, sourceId ASC", [partyId]);
      
      // Ensure frontend format compatibility
      const formatted = ledger.map(l => ({
        id: l.id,
        date: l.date,
        type: l.refType,
        refNo: l.refNo,
        lrNo: l.lrNo,
        description: l.description,
        debit: l.debit,
        credit: l.credit,
        runningBalance: l.runningBalance,
        runningBalanceType: l.runningBalanceType,
        status: l.status,
        timestamp: l.timestamp,
        partyId: l.partyId,
        partyName: l.partyName,
        partyType: l.partyType,
        sourceId: l.sourceId,
        profitLoss: l.profitLoss || 0
      }));

      res.json(formatted);
    } catch (err) {
      console.error("GET /api/outstanding-accounts/ledger error:", err);
      res.status(500).json({ error: "Failed to fetch ledger" });
    }
  });

  // POST /api/opening-balances
  app.post("/api/opening-balances", async (req, res) => {
    try {
      const pool = getPool();
      const { partyType, partyId, partyName, balanceType, amount, date, createdBy } = req.body;
      
      const [[existing]] = await pool.query("SELECT id FROM party_opening_balances WHERE partyId = ?", [partyId]);
      if (existing) {
        return res.status(400).json({ error: "Opening balance already exists for this party." });
      }

      const newId = uid();
      await pool.query(
        "INSERT INTO party_opening_balances (id, partyType, partyId, partyName, balanceType, amount, date, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newId, partyType, partyId, partyName, balanceType, amount, date, today(), createdBy || "Admin"]
      );
      
      await rebuildPartyLedger(partyId, partyType, partyName);
      
      res.json({ success: true });
    } catch (err) {
      console.error("POST /api/opening-balances error:", err);
      res.status(500).json({ error: "Failed to save opening balance" });
    }
  });

  // POST /api/manual-adjustments
  app.post("/api/manual-adjustments", async (req, res) => {
    try {
      const pool = getPool();
      const { partyType, partyId, partyName, adjustmentType, amount, date, reason, remarks, createdBy } = req.body;
      
      const newId = uid();
      await pool.query(
        "INSERT INTO manual_adjustments (id, partyType, partyId, partyName, adjustmentType, amount, date, reason, remarks, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newId, partyType, partyId, partyName, adjustmentType, amount, date, reason, remarks || "", today(), createdBy || "Admin"]
      );
      
      await rebuildPartyLedger(partyId, partyType, partyName);

      res.json({ success: true });
    } catch (err) {
      console.error("POST /api/manual-adjustments error:", err);
      res.status(500).json({ error: "Failed to save manual adjustment" });
    }
  });
}
