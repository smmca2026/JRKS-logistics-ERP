import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { initDb, getPool, syncRegistersFromBookings } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Helper for generating standard random IDs
const uid = () => Math.random().toString(36).slice(2, 10);

const today = () => new Date().toISOString().slice(0, 10);

// Initialize DB and launch server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend Express server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });

// --- TRUCKS ENDPOINTS ---
app.get("/api/trucks", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM trucks ORDER BY createdAt DESC");
    const mapped = rows.map((row) => ({
      id: row.id,
      vehicleNumber: row.vehicleNumber,
      ownerName: row.ownerName,
      address: row.address,
      mobileNumber: row.mobileNumber,
      panCard: row.panCard,
      aadharNumber: row.aadharNumber || "",
      accountNumber: row.accountNumber || "",
      vehicleType: row.vehicleType,
      engineNumber: row.engineNumber,
      chassisNumber: row.chassisNumber,
      nationalPermit: {
        number: row.nationalPermitNumber || "",
        validUpto: row.nationalPermitValidUpto || "",
      },
      insurance: { number: row.insuranceNumber || "", validUpto: row.insuranceValidUpto || "" },
      pollution: { number: row.pollutionNumber || "", validUpto: row.pollutionValidUpto || "" },
      taxReceipt: { number: row.taxReceiptNumber || "", validUpto: row.taxReceiptValidUpto || "" },
      fitness: { number: row.fitnessNumber || "", validUpto: row.fitnessValidUpto || "" },
      createdAt: row.createdAt,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/trucks error:", err);
    res.status(500).json({ error: "Failed to fetch trucks" });
  }
});

app.post("/api/trucks", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      `INSERT INTO trucks (
        id, vehicleNumber, ownerName, address, mobileNumber, panCard, aadharNumber, accountNumber, vehicleType, engineNumber, chassisNumber, 
        nationalPermitNumber, nationalPermitValidUpto, insuranceNumber, insuranceValidUpto, pollutionNumber, pollutionValidUpto, 
        taxReceiptNumber, taxReceiptValidUpto, fitnessNumber, fitnessValidUpto, createdAt, createdBy
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.vehicleNumber || "",
        body.ownerName || "",
        body.address || "",
        body.mobileNumber || "",
        body.panCard || "",
        body.aadharNumber || "",
        body.accountNumber || "",
        body.vehicleType || "Lorry",
        body.engineNumber || "",
        body.chassisNumber || "",
        body.nationalPermit?.number || "",
        body.nationalPermit?.validUpto || "",
        body.insurance?.number || "",
        body.insurance?.validUpto || "",
        body.pollution?.number || "",
        body.pollution?.validUpto || "",
        body.taxReceipt?.number || "",
        body.taxReceipt?.validUpto || "",
        body.fitness?.number || "",
        body.fitness?.validUpto || "",
        date,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body, createdAt: date });
  } catch (err) {
    console.error("POST /api/trucks error:", err);
    res.status(500).json({ error: "Failed to create truck" });
  }
});

app.put("/api/trucks/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      `UPDATE trucks SET 
        vehicleNumber = ?, ownerName = ?, address = ?, mobileNumber = ?, panCard = ?, aadharNumber = ?, accountNumber = ?, vehicleType = ?, engineNumber = ?, chassisNumber = ?, 
        nationalPermitNumber = ?, nationalPermitValidUpto = ?, insuranceNumber = ?, insuranceValidUpto = ?, pollutionNumber = ?, pollutionValidUpto = ?, 
        taxReceiptNumber = ?, taxReceiptValidUpto = ?, fitnessNumber = ?, fitnessValidUpto = ?
      , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.vehicleNumber || "",
        body.ownerName || "",
        body.address || "",
        body.mobileNumber || "",
        body.panCard || "",
        body.aadharNumber || "",
        body.accountNumber || "",
        body.vehicleType || "Lorry",
        body.engineNumber || "",
        body.chassisNumber || "",
        body.nationalPermit?.number || "",
        body.nationalPermit?.validUpto || "",
        body.insurance?.number || "",
        body.insurance?.validUpto || "",
        body.pollution?.number || "",
        body.pollution?.validUpto || "",
        body.taxReceipt?.number || "",
        body.taxReceipt?.validUpto || "",
        body.fitness?.number || "",
        body.fitness?.validUpto || "",
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body });
  } catch (err) {
    console.error("PUT /api/trucks error:", err);
    res.status(500).json({ error: "Failed to update truck" });
  }
});

app.delete("/api/trucks/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM trucks WHERE id = ?", [id]);
    res.json({ success: true, message: "Truck deleted" });
  } catch (err) {
    console.error("DELETE /api/trucks error:", err);
    res.status(500).json({ error: "Failed to delete truck" });
  }
});

// --- COMPANIES ENDPOINTS ---
app.get("/api/companies", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM companies ORDER BY createdAt DESC");
    const mapped = rows.map((r) => ({ ...r, active: r.active === 1 }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/companies error:", err);
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

app.post("/api/companies", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      "INSERT INTO companies (id, consigneeName, address, contactPerson, mobileNumber, gstNumber, panNumber, billingParty, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        body.consigneeName || "",
        body.address || "",
        body.contactPerson || "",
        body.mobileNumber || "",
        body.gstNumber || "",
        body.panNumber || "",
        body.billingParty || "Consignee",
        body.active ? 1 : 0,
        date,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body, createdAt: date });
  } catch (err) {
    console.error("POST /api/companies error:", err);
    res.status(500).json({ error: "Failed to create company" });
  }
});

app.put("/api/companies/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      "UPDATE companies SET consigneeName = ?, address = ?, contactPerson = ?, mobileNumber = ?, gstNumber = ?, panNumber = ?, billingParty = ?, active = ? , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?",
      [
        body.consigneeName || "",
        body.address || "",
        body.contactPerson || "",
        body.mobileNumber || "",
        body.gstNumber || "",
        body.panNumber || "",
        body.billingParty || "Consignee",
        body.active ? 1 : 0,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body });
  } catch (err) {
    console.error("PUT /api/companies error:", err);
    res.status(500).json({ error: "Failed to update company" });
  }
});

app.delete("/api/companies/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM companies WHERE id = ?", [id]);
    res.json({ success: true, message: "Company deleted" });
  } catch (err) {
    console.error("DELETE /api/companies error:", err);
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// --- BANKS ENDPOINTS ---
app.get("/api/banks", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM banks ORDER BY createdAt DESC");
    const mapped = rows.map((r) => ({ ...r, active: r.active === 1 }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/banks error:", err);
    res.status(500).json({ error: "Failed to fetch bank accounts" });
  }
});

app.post("/api/banks", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      "INSERT INTO banks (id, accountHolder, accountNumber, accountType, bankName, branch, ifsc, mobileNumber, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        body.accountHolder || "",
        body.accountNumber || "",
        body.accountType || "Savings",
        body.bankName || "",
        body.branch || "",
        body.ifsc || "",
        body.mobileNumber || "",
        body.active ? 1 : 0,
        date,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body, createdAt: date });
  } catch (err) {
    console.error("POST /api/banks error:", err);
    res.status(500).json({ error: "Failed to create bank account" });
  }
});

app.put("/api/banks/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      "UPDATE banks SET accountHolder = ?, accountNumber = ?, accountType = ?, bankName = ?, branch = ?, ifsc = ?, mobileNumber = ?, active = ? , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?",
      [
        body.accountHolder || "",
        body.accountNumber || "",
        body.accountType || "Savings",
        body.bankName || "",
        body.branch || "",
        body.ifsc || "",
        body.mobileNumber || "",
        body.active ? 1 : 0,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body });
  } catch (err) {
    console.error("PUT /api/banks error:", err);
    res.status(500).json({ error: "Failed to update bank account" });
  }
});

app.delete("/api/banks/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM banks WHERE id = ?", [id]);
    res.json({ success: true, message: "Bank account deleted" });
  } catch (err) {
    console.error("DELETE /api/banks error:", err);
    res.status(500).json({ error: "Failed to delete bank account" });
  }
});

// --- BROKERS ENDPOINTS ---
app.get("/api/brokers", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM brokers ORDER BY createdAt DESC");
    const mapped = rows.map((r) => ({
      ...r,
      active: r.active === 1,
      aadharCard: r.aadharCard || "",
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/brokers error:", err);
    res.status(500).json({ error: "Failed to fetch brokers" });
  }
});

app.post("/api/brokers", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      "INSERT INTO brokers (id, brokerName, address, contactPerson, mobileNumber, whatsappNumber, panCard, aadharCard, gstNumber, accountNumber, bankName, branch, ifsc, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        body.brokerName || "",
        body.address || "",
        body.contactPerson || "",
        body.mobileNumber || "",
        body.whatsappNumber || "",
        body.panCard || "",
        body.aadharCard || "",
        body.gstNumber || "",
        body.accountNumber || "",
        body.bankName || "",
        body.branch || "",
        body.ifsc || "",
        body.active ? 1 : 0,
        date,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body, createdAt: date });
  } catch (err) {
    console.error("POST /api/brokers error:", err);
    res.status(500).json({ error: "Failed to create broker" });
  }
});

app.put("/api/brokers/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      "UPDATE brokers SET brokerName = ?, address = ?, contactPerson = ?, mobileNumber = ?, whatsappNumber = ?, panCard = ?, aadharCard = ?, gstNumber = ?, accountNumber = ?, bankName = ?, branch = ?, ifsc = ?, active = ? , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?",
      [
        body.brokerName || "",
        body.address || "",
        body.contactPerson || "",
        body.mobileNumber || "",
        body.whatsappNumber || "",
        body.panCard || "",
        body.aadharCard || "",
        body.gstNumber || "",
        body.accountNumber || "",
        body.bankName || "",
        body.branch || "",
        body.ifsc || "",
        body.active ? 1 : 0,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body });
  } catch (err) {
    console.error("PUT /api/brokers error:", err);
    res.status(500).json({ error: "Failed to update broker" });
  }
});

app.delete("/api/brokers/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM brokers WHERE id = ?", [id]);
    res.json({ success: true, message: "Broker deleted" });
  } catch (err) {
    console.error("DELETE /api/brokers error:", err);
    res.status(500).json({ error: "Failed to delete broker" });
  }
});

// --- BOOKINGS ENDPOINTS ---
app.get("/api/bookings", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM bookings WHERE archived = 0 OR archived IS NULL ORDER BY bookingDate DESC",
    );
    const mapped = rows.map((r) => ({
      ...r,
      commissionPaid: r.commissionPaid === 1,
      odcStatus:
        r.odcStatus === 1 || r.odcStatus === "1"
          ? "Yes"
          : r.odcStatus === 0 || r.odcStatus === "0"
            ? "No"
            : r.odcStatus || "",
      items: JSON.parse(r.items || "[]"),
      fromLocation: r.loadingLocation || "",
      toLocation: r.unloadingLocation || "",
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/bookings error:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    const [existing] = await pool.query(
      "SELECT bookingNo FROM bookings WHERE bookingNo LIKE 'JRKS%'",
    );
    let maxSeq = 0;
    for (const r of existing) {
      if (r.bookingNo && r.bookingNo.startsWith("JRKS")) {
        const numStr = r.bookingNo.substring(4);
        const seq = parseInt(numStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const bookingNo = `JRKS${String(maxSeq + 1).padStart(3, "0")}`;

    await pool.query(
      `INSERT INTO bookings (
        id, bookingNo, bookingDate, vehicleNumber, truckOwner, brokerName, companyName, loadingLocation, unloadingLocation, 
        materialDescription, weight, hireAmount, advanceAmount, balanceAmount, commissionAmount, commissionPaid, 
        billAmount, receivedAmount, dueDate, remarks, status, createdAt,
        serialNo, lrNo, lrDate, consignorName, consigneeName, truckType, loadType, invoiceNo, netWeight, chargedWeight, 
        packageDetails, billNo, challanNo, challanDate, distance, pmtType, odcStatus, mamulCharges, profit, margin, 
        panNumber, ewayBillNo, ewayBillValidity, reportingDate, unloadingDate, podReceivedDate, rtoFine, paidOn, balancePaidOn, billPaymentReceivedOn,
        updatedAt, createdBy, archived,
        branch, lrNumber, consignorAddress, consignorGst, consigneeAddress, consigneeGst, insuranceType, demurrageDays, demurrageRate, chargeBasis, demurrageRemarks, items
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        bookingNo,
        body.bookingDate || date,
        body.vehicleNumber || "",
        body.truckOwner || "",
        body.brokerName || "",
        body.companyName || "",
        body.loadingLocation || body.fromLocation || "",
        body.unloadingLocation || body.toLocation || "",
        body.materialDescription || "",
        body.weight || "",
        Number(body.hireAmount || 0),
        Number(body.advanceAmount || 0),
        Number(body.balanceAmount || 0),
        Number(body.commissionAmount || 0),
        body.commissionPaid ? 1 : 0,
        Number(body.billAmount || 0),
        Number(body.receivedAmount || 0),
        body.dueDate || date,
        body.remarks || "",
        body.status || "Booked",
        date,
        body.serialNo || "",
        body.lrNo || "",
        body.lrDate || "",
        body.consignorName || "",
        body.consigneeName || "",
        body.truckType || "",
        body.loadType || "",
        body.invoiceNo || "",
        body.netWeight || "",
        body.chargedWeight || "",
        body.packageDetails || "",
        body.billNo || "",
        body.challanNo || "",
        body.challanDate || "",
        body.distance || "",
        body.pmtType || "",
        body.odcStatus || "",
        Number(body.mamulCharges || 0),
        Number(body.profit || 0),
        body.margin || "",
        body.panNumber || "",
        body.ewayBillNo || "",
        body.ewayBillValidity || "",
        body.reportingDate || "",
        body.unloadingDate || "",
        body.podReceivedDate || "",
        Number(body.rtoFine || 0),
        body.paidOn || "",
        body.balancePaidOn || "",
        body.billPaymentReceivedOn || "",
        date,
        body.createdBy || "Admin",
        0,
        body.branch || "Trichy",
        body.lrNumber || "",
        body.consignorAddress || "",
        body.consignorGst || "",
        body.consigneeAddress || "",
        body.consigneeGst || "",
        body.insuranceType || "Owner Risk",
        Number(body.demurrageDays || 0),
        Number(body.demurrageRate || 0),
        body.chargeBasis || "",
        body.demurrageRemarks || "",
        JSON.stringify(body.items || []),
      ],
    );

    try {
      await syncRegistersFromBookings();
    } catch (syncErr) {
      console.error("Booking sync failed:", syncErr);
    }

    res.status(201).json({
      id,
      bookingNo,
      ...body,
      commissionPaid: !!body.commissionPaid,
      odcStatus: body.odcStatus || "",
      createdAt: date,
      updatedAt: date,
      createdBy: body.createdBy || "Admin",
      archived: 0,
      fromLocation: body.loadingLocation || body.fromLocation || "",
      toLocation: body.unloadingLocation || body.toLocation || "",
    });
  } catch (err) {
    console.error("POST /api/bookings error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

app.put("/api/bookings/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();

    await pool.query(
      `UPDATE bookings SET 
        bookingDate = ?, vehicleNumber = ?, truckOwner = ?, brokerName = ?, companyName = ?, loadingLocation = ?, unloadingLocation = ?, 
        materialDescription = ?, weight = ?, hireAmount = ?, advanceAmount = ?, balanceAmount = ?, commissionAmount = ?, commissionPaid = ?, 
        billAmount = ?, receivedAmount = ?, dueDate = ?, remarks = ?, status = ?,
        serialNo = ?, lrNo = ?, lrDate = ?, consignorName = ?, consigneeName = ?, truckType = ?, loadType = ?, invoiceNo = ?, netWeight = ?, chargedWeight = ?, 
        packageDetails = ?, billNo = ?, challanNo = ?, challanDate = ?, distance = ?, pmtType = ?, odcStatus = ?, mamulCharges = ?, profit = ?, margin = ?, 
        panNumber = ?, ewayBillNo = ?, ewayBillValidity = ?, reportingDate = ?, unloadingDate = ?, podReceivedDate = ?, rtoFine = ?, paidOn = ?, balancePaidOn = ?, billPaymentReceivedOn = ?,
        updatedAt = ?,
        branch = ?, lrNumber = ?, consignorAddress = ?, consignorGst = ?, consigneeAddress = ?, consigneeGst = ?, insuranceType = ?, demurrageDays = ?, demurrageRate = ?, chargeBasis = ?, demurrageRemarks = ?, items = ?
      , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.bookingDate || "",
        body.vehicleNumber || "",
        body.truckOwner || "",
        body.brokerName || "",
        body.companyName || "",
        body.loadingLocation || body.fromLocation || "",
        body.unloadingLocation || body.toLocation || "",
        body.materialDescription || "",
        body.weight || "",
        Number(body.hireAmount || 0),
        Number(body.advanceAmount || 0),
        Number(body.balanceAmount || 0),
        Number(body.commissionAmount || 0),
        body.commissionPaid ? 1 : 0,
        Number(body.billAmount || 0),
        Number(body.receivedAmount || 0),
        body.dueDate || "",
        body.remarks || "",
        body.status || "Booked",
        body.serialNo || "",
        body.lrNo || "",
        body.lrDate || "",
        body.consignorName || "",
        body.consigneeName || "",
        body.truckType || "",
        body.loadType || "",
        body.invoiceNo || "",
        body.netWeight || "",
        body.chargedWeight || "",
        body.packageDetails || "",
        body.billNo || "",
        body.challanNo || "",
        body.challanDate || "",
        body.distance || "",
        body.pmtType || "",
        body.odcStatus || "",
        Number(body.mamulCharges || 0),
        Number(body.profit || 0),
        body.margin || "",
        body.panNumber || "",
        body.ewayBillNo || "",
        body.ewayBillValidity || "",
        body.reportingDate || "",
        body.unloadingDate || "",
        body.podReceivedDate || "",
        Number(body.rtoFine || 0),
        body.paidOn || "",
        body.balancePaidOn || "",
        body.billPaymentReceivedOn || "",
        date,
        body.branch || "Trichy",
        body.lrNumber || "",
        body.consignorAddress || "",
        body.consignorGst || "",
        body.consigneeAddress || "",
        body.consigneeGst || "",
        body.insuranceType || "Owner Risk",
        Number(body.demurrageDays || 0),
        Number(body.demurrageRate || 0),
        body.chargeBasis || "",
        body.demurrageRemarks || "",
        JSON.stringify(body.items || []),
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    try {
      await syncRegistersFromBookings();
    } catch (syncErr) {
      console.error("Booking sync failed:", syncErr);
    }

    const [[updatedRecord]] = await pool.query("SELECT * FROM bookings WHERE id = ?", [id]);
    if (updatedRecord) {
      const mapped = {
        ...updatedRecord,
        commissionPaid: updatedRecord.commissionPaid === 1,
        odcStatus:
          updatedRecord.odcStatus === 1 || updatedRecord.odcStatus === "1"
            ? "Yes"
            : updatedRecord.odcStatus === 0 || updatedRecord.odcStatus === "0"
              ? "No"
              : updatedRecord.odcStatus || "",
        items: JSON.parse(updatedRecord.items || "[]"),
        fromLocation: updatedRecord.loadingLocation || "",
        toLocation: updatedRecord.unloadingLocation || "",
      };
      res.json(mapped);
    } else {
      res.json({ id, ...body, updatedAt: date });
    }
  } catch (err) {
    console.error("PUT /api/bookings error:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM bookings WHERE id = ?", [id]);
    res.json({ success: true, message: "Booking deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/bookings error:", err);
    res.status(500).json({ error: "Failed to soft-delete booking" });
  }
});

// --- BANK TRANSACTIONS ENDPOINTS ---
app.get("/api/bank-txns", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM bank_txns ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/bank-txns error:", err);
    res.status(500).json({ error: "Failed to fetch bank transactions" });
  }
});

app.post("/api/bank-txns", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;

    await pool.query(
      "INSERT INTO bank_txns (id, date, bankName, description, credit, debit, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        body.date || today(),
        body.bankName || "",
        body.description || "",
        Number(body.credit || 0),
        Number(body.debit || 0),
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body });
  } catch (err) {
    console.error("POST /api/bank-txns error:", err);
    res.status(500).json({ error: "Failed to create bank transaction" });
  }
});

app.delete("/api/bank-txns/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM bank_txns WHERE id = ?", [id]);
    res.json({ success: true, message: "Bank transaction deleted" });
  } catch (err) {
    console.error("DELETE /api/bank-txns error:", err);
    res.status(500).json({ error: "Failed to delete bank transaction" });
  }
});

// --- CASH TRANSACTIONS ENDPOINTS ---
app.get("/api/cash-txns", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM cash_txns ORDER BY date DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/cash-txns error:", err);
    res.status(500).json({ error: "Failed to fetch cash transactions" });
  }
});

app.post("/api/cash-txns", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;

    await pool.query(
      "INSERT INTO cash_txns (id, date, description, receipt, payment, createdBy) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        body.date || today(),
        body.description || "",
        Number(body.receipt || 0),
        Number(body.payment || 0),
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({ id, ...body });
  } catch (err) {
    console.error("POST /api/cash-txns error:", err);
    res.status(500).json({ error: "Failed to create cash transaction" });
  }
});

app.delete("/api/cash-txns/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM cash_txns WHERE id = ?", [id]);
    res.json({ success: true, message: "Cash transaction deleted" });
  } catch (err) {
    console.error("DELETE /api/cash-txns error:", err);
    res.status(500).json({ error: "Failed to delete cash transaction" });
  }
});

// --- CHALLANS ENDPOINTS ---
app.get("/api/challans", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM challans WHERE archived = 0 OR archived IS NULL ORDER BY challanDate DESC",
    );
    const mapped = rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items || "[]"),
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/challans error:", err);
    res.status(500).json({ error: "Failed to fetch challans" });
  }
});

app.get("/api/challans/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM challans WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Challan not found" });
    }
    const row = rows[0];
    res.json({
      ...row,
      items: JSON.parse(row.items || "[]"),
    });
  } catch (err) {
    console.error("GET /api/challans/:id error:", err);
    res.status(500).json({ error: "Failed to fetch challan" });
  }
});

app.post("/api/challans", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    // Generate financial year based on challanDate
    const cDate = body.challanDate || date;
    let finYear = "";
    try {
      const d = new Date(cDate);
      if (!isNaN(d.getTime())) {
        const yr = d.getFullYear();
        const month = d.getMonth(); // 0 is Jan, 3 is Apr
        if (month >= 3) {
          finYear = `${yr}-${String(yr + 1).slice(-2)}`;
        } else {
          finYear = `${yr - 1}-${String(yr).slice(-2)}`;
        }
      } else {
        throw new Error("Invalid date");
      }
    } catch (e) {
      const d = new Date();
      const yr = d.getFullYear();
      const month = d.getMonth();
      if (month >= 3) {
        finYear = `${yr}-${String(yr + 1).slice(-2)}`;
      } else {
        finYear = `${yr - 1}-${String(yr).slice(-2)}`;
      }
    }

    const [existing] = await pool.query("SELECT challanNo FROM challans WHERE challanNo LIKE ?", [
      `CHL/${finYear}/%`,
    ]);
    let maxSeq = 0;
    for (const r of existing) {
      const parts = r.challanNo.split("/");
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const challanNo = body.challanNo || `CHL/${finYear}/${String(maxSeq + 1).padStart(4, "0")}`;

    await pool.query(
      `INSERT INTO challans (
        id, manualChallanNo, challanNo, challanDate, fromLocation, toLocation, vehicleNumber, items,
        ownerPan, ownerName, ownerAadhar, ownerAccount, ownerMobile, declarationAttached,
        driverName, driverMobile, dimLength, dimWidth, dimHeight,
        brokerPan, brokerName, brokerAadhar, brokerAccount, brokerMobile,
        freight, loadingMamul, comlyCom, rtoFine, extraCharges, lorryHire, tds, tdsPercentage, lessAdvance, commission, balanceAmount, payableAt,
        brokerNameSec5, status, createdAt, updatedAt, archived
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.manualChallanNo || "",
        challanNo,
        body.challanDate || date,
        body.fromLocation || "",
        body.toLocation || "",
        body.vehicleNumber || "",
        JSON.stringify(body.items || []),
        body.ownerPan || "",
        body.ownerName || "",
        body.ownerAadhar || "",
        body.ownerAccount || "",
        body.ownerMobile || "",
        body.declarationAttached || "No",
        body.driverName || "",
        body.driverMobile || "",
        body.dimLength || "",
        body.dimWidth || "",
        body.dimHeight || "",
        body.brokerPan || "",
        body.brokerName || "",
        body.brokerAadhar || "",
        body.brokerAccount || "",
        body.brokerMobile || "",
        Number(body.freight || 0),
        Number(body.loadingMamul || 0),
        Number(body.comlyCom || 0),
        Number(body.rtoFine || 0),
        Number(body.extraCharges || 0),
        Number(body.lorryHire || 0),
        Number(body.tds || 0),
        body.tdsPercentage || "0%",
        Number(body.lessAdvance || 0),
        Number(body.commission || 0),
        Number(body.balanceAmount || 0),
        body.payableAt || "",
        body.brokerNameSec5 || "",
        body.status || "In Transit",
        date,
        date,
        0,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({
      ...body,
      id,
      challanNo,
      createdAt: date,
      updatedAt: date,
      status: body.status || "In Transit",
      archived: 0,
    });
  } catch (err) {
    console.error("POST /api/challans error:", err);
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
      return res.status(409).json({
        error: `Challan Number '${req.body.challanNo || ""}' already exists. Please enter a unique Challan Number.`,
      });
    }
    res.status(500).json({ error: "Failed to create challan" });
  }
});

app.put("/api/challans/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();

    await pool.query(
      `UPDATE challans SET 
        manualChallanNo = ?, challanNo = ?, challanDate = ?, fromLocation = ?, toLocation = ?, vehicleNumber = ?, items = ?,
        ownerPan = ?, ownerName = ?, ownerAadhar = ?, ownerAccount = ?, ownerMobile = ?, declarationAttached = ?,
        driverName = ?, driverMobile = ?, dimLength = ?, dimWidth = ?, dimHeight = ?,
        brokerPan = ?, brokerName = ?, brokerAadhar = ?, brokerAccount = ?, brokerMobile = ?,
        freight = ?, loadingMamul = ?, comlyCom = ?, rtoFine = ?, extraCharges = ?, lorryHire = ?, tds = ?, tdsPercentage = ?, lessAdvance = ?, commission = ?, balanceAmount = ?, payableAt = ?,
        brokerNameSec5 = ?, status = ?, updatedAt = ?
      , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.manualChallanNo || "",
        body.challanNo || "",
        body.challanDate || "",
        body.fromLocation || "",
        body.toLocation || "",
        body.vehicleNumber || "",
        JSON.stringify(body.items || []),
        body.ownerPan || "",
        body.ownerName || "",
        body.ownerAadhar || "",
        body.ownerAccount || "",
        body.ownerMobile || "",
        body.declarationAttached || "No",
        body.driverName || "",
        body.driverMobile || "",
        body.dimLength || "",
        body.dimWidth || "",
        body.dimHeight || "",
        body.brokerPan || "",
        body.brokerName || "",
        body.brokerAadhar || "",
        body.brokerAccount || "",
        body.brokerMobile || "",
        Number(body.freight || 0),
        Number(body.loadingMamul || 0),
        Number(body.comlyCom || 0),
        Number(body.rtoFine || 0),
        Number(body.extraCharges || 0),
        Number(body.lorryHire || 0),
        Number(body.tds || 0),
        body.tdsPercentage || "0%",
        Number(body.lessAdvance || 0),
        Number(body.commission || 0),
        Number(body.balanceAmount || 0),
        body.payableAt || "",
        body.brokerNameSec5 || "",
        body.status || "In Transit",
        date,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body, updatedAt: date });
  } catch (err) {
    console.error("PUT /api/challans error:", err);
    if (err.code === "ER_DUP_ENTRY" || err.errno === 1062) {
      return res.status(409).json({
        error: `Challan Number '${req.body.challanNo || ""}' already exists. Please enter a unique Challan Number.`,
      });
    }
    res.status(500).json({ error: "Failed to update challan" });
  }
});

app.delete("/api/challans/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM challans WHERE id = ?", [id]);
    res.json({ success: true, message: "Challan deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/challans error:", err);
    res.status(500).json({ error: "Failed to delete challan" });
  }
});

// --- CONSIGNMENT NOTES ENDPOINTS ---

app.get("/api/consignment-notes", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM consignment_notes ORDER BY createdAt DESC");
    const mapped = rows.map((row) => ({
      ...row,
      items: JSON.parse(row.items || "[]"),
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/consignment-notes error:", err);
    res.status(500).json({ error: "Failed to fetch consignment notes" });
  }
});

app.get("/api/consignment-notes/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM consignment_notes WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Consignment note not found" });
    }
    const row = rows[0];
    res.json({ ...row, items: JSON.parse(row.items || "[]") });
  } catch (err) {
    console.error("GET /api/consignment-notes/:id error:", err);
    res.status(500).json({ error: "Failed to fetch consignment note" });
  }
});

app.post("/api/consignment-notes", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    // Auto-generate LR number and consignment note number based on count
    const [countRows] = await pool.query("SELECT COUNT(*) as count FROM consignment_notes");
    const count = (countRows[0].count || 0) + 1;
    const autoNum = String(count).padStart(3, "0");
    const lrNumber = body.lrNumber || autoNum;
    const consignmentNoteNo = body.consignmentNoteNo || String(count);

    await pool.query(
      `INSERT INTO consignment_notes (
        id, branch, consignmentNoteNo, lrNumber, lrDate,
        consignorName, consignorAddress, consignorGst, consignorPan,
        consigneeName, consigneeAddress, consigneeGst, consigneePan,
        insuranceType, fromLocation, toLocation, vehicleNumber,
        demandNo, shipmentNo, custNo, schNo, freightType,
        demurrageDays, demurrageRate, chargeBasis, demurrageRemarks,
        vehicleLength, vehicleWidth, vehicleHeight,
        items, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.branch || "Trichy",
        consignmentNoteNo,
        lrNumber,
        body.lrDate || date,
        body.consignorName || "",
        body.consignorAddress || "",
        body.consignorGst || "",
        body.consignorPan || "",
        body.consigneeName || "",
        body.consigneeAddress || "",
        body.consigneeGst || "",
        body.consigneePan || "",
        body.insuranceType || "Owner Risk",
        body.fromLocation || "",
        body.toLocation || "",
        body.vehicleNumber || "",
        body.demandNo || "",
        body.shipmentNo || "",
        body.custNo || "",
        body.schNo || "",
        body.freightType || "To Pay",
        Number(body.demurrageDays || 0),
        Number(body.demurrageRate || 0),
        body.chargeBasis || "",
        body.demurrageRemarks || "",
        body.vehicleLength || "",
        body.vehicleWidth || "",
        body.vehicleHeight || "",
        JSON.stringify(body.items || []),
        date,
        body.createdBy || "Admin",
      ],
    );

    res.status(201).json({
      id,
      ...body,
      consignmentNoteNo,
      lrNumber,
      createdAt: date,
    });
  } catch (err) {
    console.error("POST /api/consignment-notes error:", err);
    res.status(500).json({ error: "Failed to create consignment note" });
  }
});

app.put("/api/consignment-notes/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      `UPDATE consignment_notes SET
        branch = ?, consignmentNoteNo = ?, lrNumber = ?, lrDate = ?,
        consignorName = ?, consignorAddress = ?, consignorGst = ?, consignorPan = ?,
        consigneeName = ?, consigneeAddress = ?, consigneeGst = ?, consigneePan = ?,
        insuranceType = ?, fromLocation = ?, toLocation = ?, vehicleNumber = ?,
        demandNo = ?, shipmentNo = ?, custNo = ?, schNo = ?, freightType = ?,
        demurrageDays = ?, demurrageRate = ?, chargeBasis = ?, demurrageRemarks = ?,
        vehicleLength = ?, vehicleWidth = ?, vehicleHeight = ?,
        items = ?
      , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.branch || "Trichy",
        body.consignmentNoteNo || "",
        body.lrNumber || "",
        body.lrDate || "",
        body.consignorName || "",
        body.consignorAddress || "",
        body.consignorGst || "",
        body.consignorPan || "",
        body.consigneeName || "",
        body.consigneeAddress || "",
        body.consigneeGst || "",
        body.consigneePan || "",
        body.insuranceType || "Owner Risk",
        body.fromLocation || "",
        body.toLocation || "",
        body.vehicleNumber || "",
        body.demandNo || "",
        body.shipmentNo || "",
        body.custNo || "",
        body.schNo || "",
        body.freightType || "To Pay",
        Number(body.demurrageDays || 0),
        Number(body.demurrageRate || 0),
        body.chargeBasis || "",
        body.demurrageRemarks || "",
        body.vehicleLength || "",
        body.vehicleWidth || "",
        body.vehicleHeight || "",
        JSON.stringify(body.items || []),
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ id, ...body });
  } catch (err) {
    console.error("PUT /api/consignment-notes/:id error:", err);
    res.status(500).json({ error: "Failed to update consignment note" });
  }
});

app.delete("/api/consignment-notes/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM consignment_notes WHERE id = ?", [id]);
    res.json({ success: true, message: "Consignment note deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/consignment-notes/:id error:", err);
    res.status(500).json({ error: "Failed to delete consignment note" });
  }
});

// --- ARRIVAL REPORTS ENDPOINTS ---
app.get("/api/arrival-reports", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM arrival_reports ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/arrival-reports error:", err);
    res.status(500).json({ error: "Failed to fetch arrival reports" });
  }
});

app.get("/api/arrival-reports/next-number", async (req, res) => {
  try {
    const pool = getPool();
    const [existing] = await pool.query(
      "SELECT arrival_report_no FROM arrival_reports WHERE arrival_report_no LIKE 'AR-%'",
    );
    let maxSeq = 0;
    for (const r of existing) {
      if (r.arrival_report_no && r.arrival_report_no.startsWith("AR-")) {
        const numStr = r.arrival_report_no.substring(3);
        const seq = parseInt(numStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    const nextNo = `AR-${String(maxSeq + 1).padStart(3, "0")}`;
    res.json({ nextNumber: nextNo });
  } catch (err) {
    console.error("GET /api/arrival-reports/next-number error:", err);
    res.status(500).json({ error: "Failed to get next arrival report number" });
  }
});

app.get("/api/arrival-reports/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM arrival_reports WHERE arrival_report_id = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Arrival report not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /api/arrival-reports/:id error:", err);
    res.status(500).json({ error: "Failed to fetch arrival report" });
  }
});

app.post("/api/arrival-reports", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    let reportNo = body.arrival_report_no;
    if (!reportNo) {
      const [existing] = await pool.query(
        "SELECT arrival_report_no FROM arrival_reports WHERE arrival_report_no LIKE 'AR-%'",
      );
      let maxSeq = 0;
      for (const r of existing) {
        if (r.arrival_report_no && r.arrival_report_no.startsWith("AR-")) {
          const numStr = r.arrival_report_no.substring(3);
          const seq = parseInt(numStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
      reportNo = `AR-${String(maxSeq + 1).padStart(3, "0")}`;
    }

    await pool.query(
      `INSERT INTO arrival_reports (
        arrival_report_id, bill_no, mr_no, report_date, delivery_date, ack_date, remarks, 
        payment_mode, payment_reference, bill_reference_no, bill_reference_date, 
        mr_reference_no, mr_reference_date, branch_incharge, signature_name, 
        created_at, updated_at, arrival_report_no, lr_no, arrival_date, 
        delivery_status, received_by, receiver_mobile, halting_days, halting_amount_per_day, total_detention_amount,
        balance_amount, net_amount, uploaded_pdf, uploaded_pdf_name, penalty_type, penalty_amount,
        lastEditedBy, lastEditedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.bill_no || "",
        body.mr_no || "",
        body.report_date || date,
        body.delivery_date || date,
        body.ack_date || "",
        body.remarks || "",
        body.payment_mode || "",
        body.payment_reference || "",
        body.bill_reference_no || "",
        body.bill_reference_date || "",
        body.mr_reference_no || "",
        body.mr_reference_date || "",
        body.branch_incharge || "",
        body.signature_name || "",
        date,
        date,
        reportNo,
        body.lr_no || "",
        body.arrival_date || date,
        body.delivery_status || "Delivered",
        body.received_by || "",
        body.receiver_mobile || "",
        body.halting_days || "",
        body.halting_amount_per_day || "",
        body.total_detention_amount || "",
        body.balance_amount || "",
        body.net_amount || "",
        body.uploaded_pdf || "",
        body.uploaded_pdf_name || "",
        body.penalty_type || "",
        body.penalty_amount || "",
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
      ],
    );

    res.status(201).json({
      arrival_report_id: id,
      ...body,
      arrival_report_no: reportNo,
      created_at: date,
      updated_at: date,
    });
  } catch (err) {
    console.error("POST /api/arrival-reports error:", err);
    res.status(500).json({ error: "Failed to create arrival report" });
  }
});

app.put("/api/arrival-reports/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();

    await pool.query(
      `UPDATE arrival_reports SET 
        bill_no = ?, mr_no = ?, report_date = ?, delivery_date = ?, ack_date = ?, remarks = ?, 
        payment_mode = ?, payment_reference = ?, bill_reference_no = ?, bill_reference_date = ?, 
        mr_reference_no = ?, mr_reference_date = ?, branch_incharge = ?, signature_name = ?, 
        updated_at = ?, arrival_report_no = ?, lr_no = ?, arrival_date = ?, 
        delivery_status = ?, received_by = ?, receiver_mobile = ?, halting_days = ?, halting_amount_per_day = ?, total_detention_amount = ?,
        balance_amount = ?, net_amount = ?, uploaded_pdf = ?, uploaded_pdf_name = ?, penalty_type = ?, penalty_amount = ?,
        lastEditedBy = ?, lastEditedAt = ?
      WHERE arrival_report_id = ?`,
      [
        body.bill_no || "",
        body.mr_no || "",
        body.report_date || "",
        body.delivery_date || "",
        body.ack_date || "",
        body.remarks || "",
        body.payment_mode || "",
        body.payment_reference || "",
        body.bill_reference_no || "",
        body.bill_reference_date || "",
        body.mr_reference_no || "",
        body.mr_reference_date || "",
        body.branch_incharge || "",
        body.signature_name || "",
        date,
        body.arrival_report_no || "",
        body.lr_no || "",
        body.arrival_date || "",
        body.delivery_status || "",
        body.received_by || "",
        body.receiver_mobile || "",
        body.halting_days || "",
        body.halting_amount_per_day || "",
        body.total_detention_amount || "",
        body.balance_amount || "",
        body.net_amount || "",
        body.uploaded_pdf || "",
        body.uploaded_pdf_name || "",
        body.penalty_type || "",
        body.penalty_amount || "",
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    res.json({ arrival_report_id: id, ...body, updated_at: date });
  } catch (err) {
    console.error("PUT /api/arrival-reports/:id error:", err);
    res.status(500).json({ error: "Failed to update arrival report" });
  }
});

app.delete("/api/arrival-reports/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM arrival_reports WHERE arrival_report_id = ?", [id]);
    res.json({ success: true, message: "Arrival report deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/arrival-reports/:id error:", err);
    res.status(500).json({ error: "Failed to delete arrival report" });
  }
});

// --- DRIVERS ENDPOINTS ---
app.get("/api/drivers", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM drivers WHERE isDeleted = 0 ORDER BY driverName ASC",
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /api/drivers error:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

app.post("/api/drivers", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    if (!body.driverName || !body.driverMobile) {
      return res.status(400).json({ error: "Name and Mobile are required" });
    }

    const [existing] = await pool.query(
      "SELECT id FROM drivers WHERE driverName = ? AND driverMobile = ? AND isDeleted = 0",
      [body.driverName, body.driverMobile],
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Driver with this name and mobile already exists" });
    }

    await pool.query(
      "INSERT INTO drivers (id, driverName, driverMobile, createdAt, updatedAt, createdBy) VALUES (?, ?, ?, ?, ?, ?)",
      [id, body.driverName, body.driverMobile, date, date],
    );

    res
      .status(201)
      .json({ id, driverName: body.driverName, driverMobile: body.driverMobile, createdAt: date });
  } catch (err) {
    console.error("POST /api/drivers error:", err);
    res.status(500).json({ error: "Failed to create driver" });
  }
});

// --- VOUCHERS ENDPOINTS ---
app.get("/api/vouchers", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT * FROM vouchers ORDER BY voucherDate DESC, createdAt DESC",
    );
    const mapped = rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items || "[]"),
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/vouchers error:", err);
    res.status(500).json({ error: "Failed to fetch vouchers" });
  }
});

app.post("/api/vouchers", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    let voucherNo = body.voucherNo;
    if (!voucherNo) {
      const [existing] = await pool.query(
        "SELECT voucherNo FROM vouchers WHERE voucherNo LIKE 'VCH-%'",
      );
      let maxSeq = 0;
      for (const r of existing) {
        if (r.voucherNo && r.voucherNo.startsWith("VCH-")) {
          const numStr = r.voucherNo.substring(4);
          const seq = parseInt(numStr, 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
      voucherNo = `VCH-${String(maxSeq + 1).padStart(3, "0")}`;
    }

    await pool.query(
      `INSERT INTO vouchers (id, manualVoucherNo, voucherNo, voucherDate, narration, items, branch, paidTo, receivedFrom, createdAt, lastEditedBy, lastEditedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.manualVoucherNo || "",
        voucherNo,
        body.voucherDate || date,
        body.narration || "",
        JSON.stringify(body.items || []),
        body.branch || "Trichy",
        body.paidTo || "",
        body.receivedFrom || "",
        date,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
      ],
    );

    res.status(201).json({
      id,
      voucherNo,
      voucherDate: body.voucherDate || date,
      narration: body.narration || "",
      items: body.items || [],
      branch: body.branch || "Trichy",
      createdAt: date,
      lastEditedBy: body.lastEditedBy || "Admin",
      lastEditedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /api/vouchers error:", err);
    res.status(500).json({ error: "Failed to create voucher" });
  }
});

app.put("/api/vouchers/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;

    await pool.query(
      `UPDATE vouchers SET 
        manualVoucherNo = ?, voucherDate = ?, narration = ?, items = ?, branch = ?, paidTo = ?, receivedFrom = ?
       , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.manualVoucherNo || "",
        body.voucherDate || "",
        body.narration || "",
        JSON.stringify(body.items || []),
        body.branch || "Trichy",
        body.paidTo || "",
        body.receivedFrom || "",
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    const [[updatedRecord]] = await pool.query("SELECT * FROM vouchers WHERE id = ?", [id]);
    if (updatedRecord) {
      res.json({
        ...updatedRecord,
        items: JSON.parse(updatedRecord.items || "[]"),
      });
    } else {
      res.json({ id, ...body });
    }
  } catch (err) {
    console.error("PUT /api/vouchers/:id error:", err);
    res.status(500).json({ error: "Failed to update voucher" });
  }
});

app.delete("/api/vouchers/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM vouchers WHERE id = ?", [id]);
    res.json({ success: true, message: "Voucher deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/vouchers/:id error:", err);
    res.status(500).json({ error: "Failed to delete voucher" });
  }
});

// --- BILLS ENDPOINTS ---
app.get("/api/bills", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM bills ORDER BY date DESC, createdAt DESC");
    const mapped = rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items || "[]"),
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/bills error:", err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

app.post("/api/bills", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      `INSERT INTO bills (
        id, billNo, lrNumber, date, submittedDate, dueDate,
        companyName, companyAddress, companyMobile, companyWhatsApp, companyOffice, companyEmail, companyGst, companyPan,
        customerName, customerAddress, customerGst, customerPan,
        fromLocation, toLocation, bankName, bankBranch, accountNo, ifscCode, accountHolder,
        terms, rupeesInWords, subTotalOverride, gstOverride, grandTotalOverride, gstPercentage,
        items, createdAt, lastEditedBy, lastEditedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.billNo || "",
        body.lrNumber || "",
        body.date || date,
        body.submittedDate || "",
        body.dueDate || "",
        body.companyName || "",
        body.companyAddress || "",
        body.companyMobile || "",
        body.companyWhatsApp || "",
        body.companyOffice || "",
        body.companyEmail || "",
        body.companyGst || "",
        body.companyPan || "",
        body.customerName || "",
        body.customerAddress || "",
        body.customerGst || "",
        body.customerPan || "",
        body.fromLocation || "",
        body.toLocation || "",
        body.bankName || "",
        body.bankBranch || "",
        body.accountNo || "",
        body.ifscCode || "",
        body.accountHolder || "",
        body.terms || "",
        body.rupeesInWords || "",
        body.subTotalOverride || "",
        body.gstOverride || "",
        body.grandTotalOverride || "",
        body.gstPercentage || "",
        JSON.stringify(body.items || []),
        date,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
      ],
    );

    res.status(201).json({
      id,
      ...body,
      items: body.items || [],
      createdAt: date,
      lastEditedBy: body.lastEditedBy || "Admin",
      lastEditedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("POST /api/bills error:", err);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

app.put("/api/bills/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();

    await pool.query(
      `UPDATE bills SET 
        billNo = ?, lrNumber = ?, date = ?, submittedDate = ?, dueDate = ?,
        companyName = ?, companyAddress = ?, companyMobile = ?, companyWhatsApp = ?, companyOffice = ?, companyEmail = ?, companyGst = ?, companyPan = ?,
        customerName = ?, customerAddress = ?, customerGst = ?, customerPan = ?,
        fromLocation = ?, toLocation = ?, bankName = ?, bankBranch = ?, accountNo = ?, ifscCode = ?, accountHolder = ?,
        terms = ?, rupeesInWords = ?, subTotalOverride = ?, gstOverride = ?, grandTotalOverride = ?, gstPercentage = ?,
        items = ?, lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.billNo || "",
        body.lrNumber || "",
        body.date || "",
        body.submittedDate || "",
        body.dueDate || "",
        body.companyName || "",
        body.companyAddress || "",
        body.companyMobile || "",
        body.companyWhatsApp || "",
        body.companyOffice || "",
        body.companyEmail || "",
        body.companyGst || "",
        body.companyPan || "",
        body.customerName || "",
        body.customerAddress || "",
        body.customerGst || "",
        body.customerPan || "",
        body.fromLocation || "",
        body.toLocation || "",
        body.bankName || "",
        body.bankBranch || "",
        body.accountNo || "",
        body.ifscCode || "",
        body.accountHolder || "",
        body.terms || "",
        body.rupeesInWords || "",
        body.subTotalOverride || "",
        body.gstOverride || "",
        body.grandTotalOverride || "",
        body.gstPercentage || "",
        JSON.stringify(body.items || []),
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    const [[updatedRecord]] = await pool.query("SELECT * FROM bills WHERE id = ?", [id]);
    if (updatedRecord) {
      res.json({
        ...updatedRecord,
        items: JSON.parse(updatedRecord.items || "[]"),
      });
    } else {
      res.json({ id, ...body });
    }
  } catch (err) {
    console.error("PUT /api/bills/:id error:", err);
    res.status(500).json({ error: "Failed to update bill" });
  }
});

app.delete("/api/bills/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM bills WHERE id = ?", [id]);
    res.json({ success: true, message: "Bill deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/bills/:id error:", err);
    res.status(500).json({ error: "Failed to delete bill" });
  }
});

// --- MONEY RECEIPTS ENDPOINTS ---
app.get("/api/money-receipts", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM money_receipts ORDER BY createdAt DESC");
    const mapped = rows.map((r) => ({
      ...r,
      items: JSON.parse(r.items || "[]"),
    }));
    res.json(mapped);
  } catch (err) {
    console.error("GET /api/money-receipts error:", err);
    res.status(500).json({ error: "Failed to fetch money receipts" });
  }
});

app.post("/api/money-receipts", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();

    await pool.query(
      `INSERT INTO money_receipts (
        id, mrNo, lrNo, branch, receiptDate, partyName, paymentFor, amountReceived, amountInWords, narration, items, status, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.mrNo || "",
        body.lrNo || "",
        body.branch || "",
        body.receiptDate || "",
        body.partyName || "",
        body.paymentFor || "",
        body.amountReceived || 0,
        body.amountInWords || "",
        body.narration || "",
        JSON.stringify(body.items || []),
        body.status || "Active",
        date,
      ],
    );

    res.status(201).json({ id, ...body, createdAt: date });
  } catch (err) {
    console.error("POST /api/money-receipts error:", err);
    res.status(500).json({ error: "Failed to create money receipt" });
  }
});

app.put("/api/money-receipts/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();

    await pool.query(
      `UPDATE money_receipts SET 
        mrNo = ?, lrNo = ?, branch = ?, receiptDate = ?, partyName = ?, paymentFor = ?, amountReceived = ?, amountInWords = ?, narration = ?, items = ?, status = ?, updatedAt = ?
      , lastEditedBy = ?, lastEditedAt = ? WHERE id = ?`,
      [
        body.mrNo || "",
        body.lrNo || "",
        body.branch || "",
        body.receiptDate || "",
        body.partyName || "",
        body.paymentFor || "",
        body.amountReceived || 0,
        body.amountInWords || "",
        body.narration || "",
        JSON.stringify(body.items || []),
        body.status || "Active",
        date,
        body.lastEditedBy || "Admin",
        new Date().toISOString(),
        id,
      ],
    );

    const [[updatedRecord]] = await pool.query("SELECT * FROM money_receipts WHERE id = ?", [id]);
    if (updatedRecord) {
      res.json({
        ...updatedRecord,
        items: JSON.parse(updatedRecord.items || "[]"),
      });
    } else {
      res.json({ id, ...body });
    }
  } catch (err) {
    console.error("PUT /api/money-receipts/:id error:", err);
    res.status(500).json({ error: "Failed to update money receipt" });
  }
});

app.delete("/api/money-receipts/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM money_receipts WHERE id = ?", [id]);
    res.json({ success: true, message: "Money receipt deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/money-receipts/:id error:", err);
    res.status(500).json({ error: "Failed to delete money receipt" });
  }
});

// Serve static frontend in production
const distClientPath = fs.existsSync(path.resolve(__dirname, "../dist/client"))
  ? path.resolve(__dirname, "../dist/client")
  : path.resolve(__dirname, "dist/client");

if (fs.existsSync(distClientPath)) {
  app.use(express.static(distClientPath));
}

// Serve TanStack Start SSR for non-API routes
const ssrServerPath = fs.existsSync(path.resolve(__dirname, "../dist/server/server.js"))
  ? path.resolve(__dirname, "../dist/server/server.js")
  : path.resolve(__dirname, "dist/server/server.js");

let ssrServer = null;
if (fs.existsSync(ssrServerPath)) {
  try {
    const mod = await import("file://" + ssrServerPath.replace(/\\/g, "/"));
    ssrServer = mod.default || mod;
    console.log("Loaded TanStack Start SSR server bundle successfully.");
  } catch (e) {
    console.error("Could not load SSR bundle:", e);
  }
}

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  if (ssrServer && typeof ssrServer.fetch === "function") {
    try {
      const protocol = req.protocol || "http";
      const host = req.get("host") || "localhost";
      const url = `${protocol}://${host}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      }
      const webReq = new Request(url, {
        method: req.method,
        headers,
      });

      const webRes = await ssrServer.fetch(webReq);
      res.status(webRes.status);
      webRes.headers.forEach((value, key) => res.setHeader(key, value));
      const bodyText = await webRes.text();
      return res.send(bodyText);
    } catch (err) {
      console.error("SSR error:", err);
      return next(err);
    }
  }

  const indexPath = path.join(distClientPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).send("Not Found");
});
