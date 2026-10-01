import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const dbHost = process.env.DB_HOST || "localhost";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "Digi@2024";
const dbPort = parseInt(process.env.DB_PORT || "3306", 10);

const connectionConfig = {
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  port: dbPort,
};

let pool;

const uid = () => Math.random().toString(36).slice(2, 10);

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

async function startMySQLProcess() {
  const mysqldPaths = [
    "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqld.exe",
    "mysqld",
  ];
  const datadirs = [
    "C:\\Users\\ELCOT\\mysql_data",
    path.resolve(process.env.USERPROFILE || "C:\\Users\\ELCOT", "mysql_data"),
  ];

  let mysqldPath =
    mysqldPaths.find((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    }) || "mysqld";

  let datadir =
    datadirs.find((d) => {
      try {
        return fs.existsSync(d);
      } catch {
        return false;
      }
    }) || "C:\\Users\\ELCOT\\mysql_data";

  console.log(`[*] Auto-starting MySQL server (${mysqldPath} --datadir="${datadir}")...`);
  try {
    const child = spawn(mysqldPath, [`--datadir=${datadir}`, `--port=${dbPort}`], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
  } catch (err) {
    console.error("Failed to spawn mysqld process:", err?.message || err);
  }
}

export async function initDb() {
  console.log(`Connecting to MySQL at ${dbHost}:${dbPort} as ${dbUser}...`);

  let connection;
  let attempts = 0;
  const maxAttempts = 6;

  while (attempts < maxAttempts) {
    try {
      connection = await mysql.createConnection(connectionConfig);
      break;
    } catch (err) {
      const isConnRefused =
        err.code === "ECONNREFUSED" ||
        err.errno === -4078 ||
        (err.errors && err.errors.some((e) => e.code === "ECONNREFUSED"));

      if (isConnRefused && attempts === 0) {
        console.log("[!] MySQL is not running. Starting MySQL server automatically...");
        await startMySQLProcess();
        await new Promise((resolve) => setTimeout(resolve, 3500));
        attempts++;
      } else if (isConnRefused && attempts < maxAttempts - 1) {
        console.log(`[*] Waiting for MySQL to become ready (attempt ${attempts + 1}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      } else {
        throw err;
      }
    }
  }

  // 1. Create database if it doesn't exist
  const dbName = process.env.DB_NAME || "jrks";
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  await connection.end();

  // 2. Establish connection pool with the database specified
  pool = mysql.createPool({
    ...connectionConfig,
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // 3. Create tables
  await createTables();

  // 4. Seed database if empty (DISABLED BY USER REQUEST)
  // await seedDb();

  // 5. Sync registers from existing bookings
  await syncRegistersFromBookings();

  console.log("MySQL database setup complete!");
}

async function createTables() {
  const connection = await pool.getConnection();
  try {
    // Users Table (For login authentication)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        createdAt VARCHAR(50)
      )
    `);

    // Seed default users if table is empty
    const [existingUsers] = await connection.query("SELECT COUNT(*) as count FROM users");
    if (existingUsers[0].count === 0) {
      const defaultDate = new Date().toISOString();
      await connection.query(`
        INSERT INTO users (id, username, password, role, createdAt) VALUES 
        (?, 'admin', 'jrks123', 'admin', ?),
        (?, 'Trichybranch', 'Trichy@123', 'branch', ?)
      `, [uid(), defaultDate, uid(), defaultDate]);
      console.log("Seeded default users (admin, Trichybranch)");
    }

    // Trucks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS trucks (
        id VARCHAR(50) PRIMARY KEY,
        vehicleNumber VARCHAR(50) NOT NULL,
        ownerName VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        mobileNumber VARCHAR(20) NOT NULL,
        panCard VARCHAR(20) NOT NULL,
        aadharNumber VARCHAR(50),
        accountNumber VARCHAR(50),
        vehicleType VARCHAR(50) NOT NULL,
        engineNumber VARCHAR(100) NOT NULL,
        chassisNumber VARCHAR(100) NOT NULL,
        nationalPermitNumber VARCHAR(100),
        nationalPermitValidUpto VARCHAR(50),
        insuranceNumber VARCHAR(100),
        insuranceValidUpto VARCHAR(50),
        pollutionNumber VARCHAR(100),
        pollutionValidUpto VARCHAR(50),
        taxReceiptNumber VARCHAR(100),
        taxReceiptValidUpto VARCHAR(50),
        fitnessNumber VARCHAR(100),
        fitnessValidUpto VARCHAR(50),
        createdAt VARCHAR(50)
      )
    `);

    // Migration to add aadharNumber if table exists without it
    try {
      await connection.query("ALTER TABLE trucks ADD COLUMN aadharNumber VARCHAR(50)");
      console.log("Added column aadharNumber to trucks table");
    } catch (e) {
      // Ignored if column already exists (ER_DUP_FIELDNAME)
    }

    // Migration to add accountNumber if table exists without it
    try {
      await connection.query("ALTER TABLE trucks ADD COLUMN accountNumber VARCHAR(50)");
      console.log("Added column accountNumber to trucks table");
    } catch (e) {
      // Ignored if column already exists
    }

    // Companies Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(50) PRIMARY KEY,
        consigneeName VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        contactPerson VARCHAR(255) NOT NULL,
        mobileNumber VARCHAR(20) NOT NULL,
        gstNumber VARCHAR(50) NOT NULL,
        panNumber VARCHAR(50),
        billingParty VARCHAR(50) NOT NULL,
        active TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(50)
      )
    `);

    // Migration to add panNumber if table exists without it
    try {
      await connection.query("ALTER TABLE companies ADD COLUMN panNumber VARCHAR(50)");
      console.log("Added column panNumber to companies table");
    } catch (e) {
      // Ignored if column already exists
    }

    // Banks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS banks (
        id VARCHAR(50) PRIMARY KEY,
        accountHolder VARCHAR(255) NOT NULL,
        accountNumber VARCHAR(50) NOT NULL,
        accountType VARCHAR(50) NOT NULL,
        bankName VARCHAR(255) NOT NULL,
        branch VARCHAR(255) NOT NULL,
        ifsc VARCHAR(50) NOT NULL,
        mobileNumber VARCHAR(20) NOT NULL,
        active TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(50)
      )
    `);

    // Brokers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS brokers (
        id VARCHAR(50) PRIMARY KEY,
        brokerName VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        contactPerson VARCHAR(255) NOT NULL,
        mobileNumber VARCHAR(20) NOT NULL,
        whatsappNumber VARCHAR(20) NOT NULL,
        panCard VARCHAR(20) NOT NULL,
        aadharCard VARCHAR(50),
        gstNumber VARCHAR(50),
        accountNumber VARCHAR(50) NOT NULL,
        bankName VARCHAR(255) NOT NULL,
        branch VARCHAR(255) NOT NULL,
        ifsc VARCHAR(50) NOT NULL,
        active TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(50)
      )
    `);

    // Migration to add aadharCard if table exists without it
    try {
      await connection.query("ALTER TABLE brokers ADD COLUMN aadharCard VARCHAR(50)");
      console.log("Added column aadharCard to brokers table");
    } catch (e) {
      // Ignored if column already exists
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        bookingNo VARCHAR(50) NOT NULL UNIQUE,
        bookingDate VARCHAR(50) NOT NULL,
        vehicleNumber VARCHAR(50) NOT NULL,
        truckOwner VARCHAR(255) NOT NULL,
        brokerName VARCHAR(255) NOT NULL,
        companyName VARCHAR(255) DEFAULT '',
        loadingLocation VARCHAR(255) NOT NULL,
        unloadingLocation VARCHAR(255) NOT NULL,
        materialDescription VARCHAR(255) NOT NULL,
        weight VARCHAR(50) NOT NULL,
        hireAmount INT NOT NULL,
        advanceAmount INT NOT NULL,
        balanceAmount INT NOT NULL,
        commissionAmount INT NOT NULL,
        commissionPaid TINYINT(1) DEFAULT 0,
        billAmount INT NOT NULL,
        receivedAmount INT NOT NULL,
        dueDate VARCHAR(50) NOT NULL,
        remarks TEXT,
        status VARCHAR(50) NOT NULL,
        createdAt VARCHAR(50),
        serialNo VARCHAR(50) DEFAULT '',
        lrNo VARCHAR(50) DEFAULT '',
        lrDate VARCHAR(50) DEFAULT '',
        consignorName VARCHAR(255) DEFAULT '',
        consigneeName VARCHAR(255) DEFAULT '',
        truckType VARCHAR(50) DEFAULT '',
        loadType VARCHAR(50) DEFAULT '',
        invoiceNo VARCHAR(255) DEFAULT '',
        netWeight VARCHAR(50) DEFAULT '',
        chargedWeight VARCHAR(50) DEFAULT '',
        packageDetails VARCHAR(255) DEFAULT '',
        billNo VARCHAR(50) DEFAULT '',
        challanNo VARCHAR(50) DEFAULT '',
        challanDate VARCHAR(50) DEFAULT '',
        distance VARCHAR(50) DEFAULT '',
        pmtType VARCHAR(50) DEFAULT '',
        odcStatus VARCHAR(255) DEFAULT '',
        mamulCharges INT DEFAULT 0,
        profit INT DEFAULT 0,
        margin VARCHAR(50) DEFAULT '',
        panNumber VARCHAR(50) DEFAULT '',
        ewayBillNo VARCHAR(50) DEFAULT '',
        ewayBillValidity VARCHAR(50) DEFAULT '',
        reportingDate VARCHAR(50) DEFAULT '',
        unloadingDate VARCHAR(50) DEFAULT '',
        podReceivedDate VARCHAR(50) DEFAULT '',
        rtoFine INT DEFAULT 0,
        paidOn VARCHAR(50) DEFAULT '',
        balancePaidOn VARCHAR(50) DEFAULT '',
        billPaymentReceivedOn VARCHAR(50) DEFAULT '',
        updatedAt VARCHAR(50) DEFAULT '',
        createdBy VARCHAR(255) DEFAULT '',
        archived TINYINT(1) DEFAULT 0,
        branch VARCHAR(100) DEFAULT 'Trichy',
        lrNumber VARCHAR(100) DEFAULT '',
        consignorAddress TEXT,
        consignorGst VARCHAR(50) DEFAULT '',
        consigneeAddress TEXT,
        consigneeGst VARCHAR(50) DEFAULT '',
        insuranceType VARCHAR(50) DEFAULT 'Owner Risk',
        demurrageDays INT DEFAULT 0,
        demurrageRate INT DEFAULT 0,
        chargeBasis VARCHAR(100) DEFAULT '',
        demurrageRemarks TEXT,
        items TEXT
      )
    `);

    // Modify companyName to be nullable/default on existing installations
    try {
      await connection.query("ALTER TABLE bookings MODIFY companyName VARCHAR(255) DEFAULT ''");
    } catch (err) {
      console.warn("Could not modify companyName column definition:", err);
    }

    // Modify odcStatus to be a varchar for manual text entry
    try {
      await connection.query("ALTER TABLE bookings MODIFY odcStatus VARCHAR(255) DEFAULT ''");
    } catch (err) {
      console.warn("Could not modify odcStatus column definition:", err);
    }

    // Add any missing columns on existing tables
    const columnsToVerify = [
      { name: "serialNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "lrNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "lrDate", type: "VARCHAR(50) DEFAULT ''" },
      { name: "consignorName", type: "VARCHAR(255) DEFAULT ''" },
      { name: "consigneeName", type: "VARCHAR(255) DEFAULT ''" },
      { name: "truckType", type: "VARCHAR(50) DEFAULT ''" },
      { name: "loadType", type: "VARCHAR(50) DEFAULT ''" },
      { name: "invoiceNo", type: "VARCHAR(255) DEFAULT ''" },
      { name: "netWeight", type: "VARCHAR(50) DEFAULT ''" },
      { name: "chargedWeight", type: "VARCHAR(50) DEFAULT ''" },
      { name: "packageDetails", type: "VARCHAR(255) DEFAULT ''" },
      { name: "billNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "challanNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "challanDate", type: "VARCHAR(50) DEFAULT ''" },
      { name: "distance", type: "VARCHAR(50) DEFAULT ''" },
      { name: "pmtType", type: "VARCHAR(50) DEFAULT ''" },
      { name: "odcStatus", type: "VARCHAR(255) DEFAULT ''" },
      { name: "mamulCharges", type: "INT DEFAULT 0" },
      { name: "profit", type: "INT DEFAULT 0" },
      { name: "margin", type: "VARCHAR(50) DEFAULT ''" },
      { name: "panNumber", type: "VARCHAR(50) DEFAULT ''" },
      { name: "ewayBillNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "ewayBillValidity", type: "VARCHAR(50) DEFAULT ''" },
      { name: "reportingDate", type: "VARCHAR(50) DEFAULT ''" },
      { name: "unloadingDate", type: "VARCHAR(50) DEFAULT ''" },
      { name: "podReceivedDate", type: "VARCHAR(50) DEFAULT ''" },
      { name: "rtoFine", type: "INT DEFAULT 0" },
      { name: "paidOn", type: "VARCHAR(50) DEFAULT ''" },
      { name: "balancePaidOn", type: "VARCHAR(50) DEFAULT ''" },
      { name: "billPaymentReceivedOn", type: "VARCHAR(50) DEFAULT ''" },
      { name: "updatedAt", type: "VARCHAR(50) DEFAULT ''" },
      { name: "createdBy", type: "VARCHAR(255) DEFAULT ''" },
      { name: "archived", type: "TINYINT(1) DEFAULT 0" },
      { name: "branch", type: "VARCHAR(100) DEFAULT 'Trichy'" },
      { name: "lrNumber", type: "VARCHAR(100) DEFAULT ''" },
      { name: "consignorAddress", type: "TEXT" },
      { name: "consignorGst", type: "VARCHAR(50) DEFAULT ''" },
      { name: "consigneeAddress", type: "TEXT" },
      { name: "consigneeGst", type: "VARCHAR(50) DEFAULT ''" },
      { name: "insuranceType", type: "VARCHAR(50) DEFAULT 'Owner Risk'" },
      { name: "demurrageDays", type: "INT DEFAULT 0" },
      { name: "demurrageRate", type: "INT DEFAULT 0" },
      { name: "chargeBasis", type: "VARCHAR(100) DEFAULT ''" },
      { name: "demurrageRemarks", type: "TEXT" },
      { name: "items", type: "TEXT" },
    ];

    for (const col of columnsToVerify) {
      try {
        const [existing] = await connection.query(
          `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bookings' 
            AND COLUMN_NAME = ?
        `,
          [col.name],
        );
        if (existing.length === 0) {
          console.log(`Migration: Adding column ${col.name} to bookings table...`);
          await connection.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}`);
        }
      } catch (colErr) {
        console.error(`Migration error for column ${col.name}:`, colErr);
      }
    }

    // Bank Transactions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bank_txns (
        id VARCHAR(50) PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        bankName VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        credit INT DEFAULT 0,
        debit INT DEFAULT 0
      )
    `);

    // Cash Transactions Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cash_txns (
        id VARCHAR(50) PRIMARY KEY,
        date VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        receipt INT DEFAULT 0,
        payment INT DEFAULT 0
      )
    `);

    // Consignment Notes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS consignment_notes (
        id VARCHAR(50) PRIMARY KEY,
        branch VARCHAR(100) NOT NULL,
        consignmentNoteNo VARCHAR(100) NOT NULL,
        lrNumber VARCHAR(100) NOT NULL,
        sac VARCHAR(50),
        lrDate VARCHAR(50) NOT NULL,
        consignorName VARCHAR(255) NOT NULL,
        consignorAddress TEXT,
        consignorGst VARCHAR(50),
        consignorPan VARCHAR(50),
        consigneeName VARCHAR(255) NOT NULL,
        consigneeAddress TEXT,
        consigneeGst VARCHAR(50),
        consigneePan VARCHAR(50),
        insuranceType VARCHAR(50) NOT NULL,
        fromLocation VARCHAR(255) NOT NULL,
        toLocation VARCHAR(255) NOT NULL,
        vehicleNumber VARCHAR(50) NOT NULL,
        demandNo VARCHAR(100),
        shipmentNo VARCHAR(100),
        custNo VARCHAR(100),
        schNo VARCHAR(100),
        freightType VARCHAR(50) NOT NULL,
        demurrageDays INT,
        demurrageRate INT,
        chargeBasis VARCHAR(100),
        demurrageRemarks TEXT,
        vehicleLength VARCHAR(50),
        vehicleWidth VARCHAR(50),
        vehicleHeight VARCHAR(50),
        items TEXT NOT NULL,
        createdAt VARCHAR(50)
      )
    `);

    // Migration to add sac if table exists without it
    try {
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN sac VARCHAR(50)");
      console.log("Added column sac to consignment_notes table");
    } catch (e) {}

    // Migration to add consignorPan if table exists without it
    try {
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN consignorPan VARCHAR(50)");
      console.log("Added column consignorPan to consignment_notes table");
    } catch (e) {}

    // Migration to add consigneePan if table exists without it
    try {
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN consigneePan VARCHAR(50)");
      console.log("Added column consigneePan to consignment_notes table");
    } catch (e) {}

    // Migration to add vehicle dimensions if table exists without it
    try {
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN vehicleLength VARCHAR(50)");
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN vehicleWidth VARCHAR(50)");
      await connection.query("ALTER TABLE consignment_notes ADD COLUMN vehicleHeight VARCHAR(50)");
      console.log("Added vehicle dimensions to consignment_notes table");
    } catch (e) {}

    // Challans Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS challans (
        id VARCHAR(50) PRIMARY KEY,
        manualChallanNo VARCHAR(50) DEFAULT '',
        challanNo VARCHAR(50) NOT NULL UNIQUE,
        challanDate VARCHAR(50) NOT NULL,
        fromLocation VARCHAR(255) NOT NULL,
        toLocation VARCHAR(255) NOT NULL,
        vehicleNumber VARCHAR(50) NOT NULL,
        items TEXT NOT NULL,
        ownerPan VARCHAR(20),
        ownerName VARCHAR(255),
        ownerAadhar VARCHAR(20),
        ownerAccount VARCHAR(50),
        ownerMobile VARCHAR(20),
        declarationAttached VARCHAR(10),
        driverName VARCHAR(255),
        driverMobile VARCHAR(20),
        dimLength VARCHAR(20),
        dimWidth VARCHAR(20),
        dimHeight VARCHAR(20),
        brokerPan VARCHAR(20),
        brokerName VARCHAR(255),
        brokerAadhar VARCHAR(20),
        brokerAccount VARCHAR(50),
        brokerMobile VARCHAR(20),
        freight INT NOT NULL DEFAULT 0,
        loadingMamul INT NOT NULL DEFAULT 0,
        comlyCom INT NOT NULL DEFAULT 0,
        rtoFine INT NOT NULL DEFAULT 0,
        extraCharges INT NOT NULL DEFAULT 0,
        lorryHire INT NOT NULL DEFAULT 0,
        tds INT NOT NULL DEFAULT 0,
        tdsPercentage VARCHAR(10) DEFAULT '0%',
        lessAdvance INT NOT NULL DEFAULT 0,
        commission INT NOT NULL DEFAULT 0,
        balanceAmount INT NOT NULL DEFAULT 0,
        payableAt VARCHAR(255),
        brokerNameSec5 VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'In Transit',
        createdAt VARCHAR(50),
        updatedAt VARCHAR(50),
        archived TINYINT(1) DEFAULT 0
      )
    `);

    // Migrations for challans table (for existing installations)
    const challanColumnsToVerify = [
      { name: "manualChallanNo", type: "VARCHAR(50) DEFAULT ''" },
      { name: "ownerPan", type: "VARCHAR(20)" },
      { name: "ownerName", type: "VARCHAR(255)" },
      { name: "ownerAadhar", type: "VARCHAR(20)" },
      { name: "ownerAccount", type: "VARCHAR(50)" },
      { name: "ownerMobile", type: "VARCHAR(20)" },
      { name: "declarationAttached", type: "VARCHAR(10)" },
      { name: "driverName", type: "VARCHAR(255)" },
      { name: "driverMobile", type: "VARCHAR(20)" },
      { name: "dimLength", type: "VARCHAR(20)" },
      { name: "dimWidth", type: "VARCHAR(20)" },
      { name: "dimHeight", type: "VARCHAR(20)" },
      { name: "brokerPan", type: "VARCHAR(20)" },
      { name: "brokerName", type: "VARCHAR(255)" },
      { name: "brokerAadhar", type: "VARCHAR(20)" },
      { name: "brokerAccount", type: "VARCHAR(50)" },
      { name: "brokerMobile", type: "VARCHAR(20)" },
      { name: "freight", type: "INT NOT NULL DEFAULT 0" },
      { name: "loadingMamul", type: "INT NOT NULL DEFAULT 0" },
      { name: "comlyCom", type: "INT NOT NULL DEFAULT 0" },
      { name: "rtoFine", type: "INT NOT NULL DEFAULT 0" },
      { name: "extraCharges", type: "INT NOT NULL DEFAULT 0" },
      { name: "lorryHire", type: "INT NOT NULL DEFAULT 0" },
      { name: "tds", type: "INT NOT NULL DEFAULT 0" },
      { name: "tdsPercentage", type: "VARCHAR(10) DEFAULT '0%'" },
      { name: "lessAdvance", type: "INT NOT NULL DEFAULT 0" },
      { name: "commission", type: "INT NOT NULL DEFAULT 0" },
      { name: "balanceAmount", type: "INT NOT NULL DEFAULT 0" },
      { name: "payableAt", type: "VARCHAR(255)" },
      { name: "brokerNameSec5", type: "VARCHAR(255)" },
      { name: "status", type: "VARCHAR(50) NOT NULL DEFAULT 'In Transit'" },
      { name: "updatedAt", type: "VARCHAR(50)" },
      { name: "archived", type: "TINYINT(1) DEFAULT 0" },
    ];

    for (const col of challanColumnsToVerify) {
      try {
        const [existing] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'challans' AND COLUMN_NAME = ?`,
          [col.name],
        );
        if (existing.length === 0) {
          console.log(`Migration: Adding column ${col.name} to challans table...`);
          await connection.query(`ALTER TABLE challans ADD COLUMN ${col.name} ${col.type}`);
        }
      } catch (colErr) {
        console.error(`Migration error for challans column ${col.name}:`, colErr);
      }
    }

    // Arrival Reports Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS arrival_reports (
        arrival_report_id VARCHAR(50) PRIMARY KEY,
        bill_no VARCHAR(100) NOT NULL,
        mr_no VARCHAR(100) NOT NULL,
        report_date VARCHAR(50) NOT NULL,
        delivery_date VARCHAR(50) NOT NULL,
        ack_date VARCHAR(50),
        remarks TEXT,
        payment_mode VARCHAR(100),
        payment_reference VARCHAR(255),
        bill_reference_no VARCHAR(100),
        bill_reference_date VARCHAR(50),
        mr_reference_no VARCHAR(100),
        mr_reference_date VARCHAR(50),
        branch_incharge VARCHAR(255),
        signature_name VARCHAR(255),
        created_at VARCHAR(50),
        updated_at VARCHAR(50),
        arrival_report_no VARCHAR(100),
        challan_no VARCHAR(100),
        lr_no VARCHAR(100),
        arrival_date VARCHAR(50),
        delivery_status VARCHAR(100),
        received_by VARCHAR(255),
        receiver_mobile VARCHAR(20),
        halting_days VARCHAR(50),
        halting_amount_per_day VARCHAR(50),
        total_detention_amount VARCHAR(50),
        balance_amount VARCHAR(50),
        net_amount VARCHAR(50) DEFAULT '',
        uploaded_pdf LONGTEXT,
        uploaded_pdf_name VARCHAR(255),
        penalty_type VARCHAR(100) DEFAULT '',
        penalty_amount VARCHAR(50) DEFAULT ''
      )
    `);

    // Verify and add missing columns to arrival_reports table
    const arrivalReportColumnsToVerify = [
      { name: "arrival_report_no", type: "VARCHAR(100)" },
      { name: "challan_no", type: "VARCHAR(100)" },
      { name: "lr_no", type: "VARCHAR(100)" },
      { name: "arrival_date", type: "VARCHAR(50)" },
      { name: "delivery_status", type: "VARCHAR(100)" },
      { name: "received_by", type: "VARCHAR(255)" },
      { name: "receiver_mobile", type: "VARCHAR(20)" },
      { name: "halting_days", type: "VARCHAR(50)" },
      { name: "halting_amount_per_day", type: "VARCHAR(50)" },
      { name: "total_detention_amount", type: "VARCHAR(50)" },
      { name: "balance_amount", type: "VARCHAR(50)" },
      { name: "net_amount", type: "VARCHAR(50) DEFAULT ''" },
      { name: "uploaded_pdf", type: "LONGTEXT" },
      { name: "uploaded_pdf_name", type: "VARCHAR(255)" },
      { name: "penalty_type", type: "VARCHAR(100) DEFAULT ''" },
      { name: "penalty_amount", type: "VARCHAR(50) DEFAULT ''" },
    ];

    for (const col of arrivalReportColumnsToVerify) {
      try {
        const [existing] = await connection.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'arrival_reports' AND COLUMN_NAME = ?`,
          [col.name],
        );
        if (existing.length === 0) {
          console.log(`Migration: Adding column ${col.name} to arrival_reports table...`);
          await connection.query(`ALTER TABLE arrival_reports ADD COLUMN ${col.name} ${col.type}`);
        }
      } catch (colErr) {
        console.error(`Migration error for arrival_reports column ${col.name}:`, colErr);
      }
    }

    // Drivers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        driverName VARCHAR(255) NOT NULL,
        driverMobile VARCHAR(20) NOT NULL,
        createdAt VARCHAR(50),
        updatedAt VARCHAR(50),
        isDeleted TINYINT(1) DEFAULT 0
      )
    `);

    // Vouchers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(50) PRIMARY KEY,
        manualVoucherNo VARCHAR(50) DEFAULT '',
        voucherNo VARCHAR(50) NOT NULL,
        voucherDate VARCHAR(50) NOT NULL,
        narration TEXT,
        items TEXT NOT NULL,
        branch VARCHAR(100) DEFAULT 'Trichy',
        paidTo VARCHAR(255) DEFAULT '',
        receivedFrom VARCHAR(255) DEFAULT '',
        createdAt VARCHAR(50)
      )
    `);

    // Migrations for vouchers table (for existing installations)
    try {
      const [existing] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'manualVoucherNo'`,
      );
      if (existing.length === 0) {
        console.log(`Migration: Adding column manualVoucherNo to vouchers table...`);
        await connection.query(
          `ALTER TABLE vouchers ADD COLUMN manualVoucherNo VARCHAR(50) DEFAULT ''`,
        );
      }
    } catch (colErr) {
      console.error(`Migration error for vouchers column manualVoucherNo:`, colErr);
    }

    try {
      const [existing] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'paidTo'`,
      );
      if (existing.length === 0) {
        console.log(`Migration: Adding columns paidTo and receivedFrom to vouchers table...`);
        await connection.query(`ALTER TABLE vouchers ADD COLUMN paidTo VARCHAR(255) DEFAULT ''`);
        await connection.query(
          `ALTER TABLE vouchers ADD COLUMN receivedFrom VARCHAR(255) DEFAULT ''`,
        );
      }
    } catch (colErr) {
      console.error(`Migration error for vouchers columns paidTo/receivedFrom:`, colErr);
    }

    try {
      // Check if voucherNo has a UNIQUE index (usually named voucherNo in MySQL) and drop it
      const [indexes] = await connection.query(
        `SHOW INDEX FROM vouchers WHERE Key_name = 'voucherNo'`,
      );
      if (indexes.length > 0) {
        console.log(`Migration: Dropping UNIQUE index on voucherNo from vouchers table...`);
        await connection.query(`ALTER TABLE vouchers DROP INDEX voucherNo`);
      }
    } catch (idxErr) {
      console.error(`Migration error for dropping voucherNo index:`, idxErr);
    }

    // Bills Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id VARCHAR(50) PRIMARY KEY,
        billNo VARCHAR(50) NOT NULL UNIQUE,
        lrNumber VARCHAR(100),
        sac VARCHAR(50) DEFAULT '',
        date VARCHAR(50) NOT NULL,
        submittedDate VARCHAR(50),
        dueDate VARCHAR(50),
        companyName VARCHAR(255) NOT NULL,
        companyAddress TEXT,
        companyMobile VARCHAR(50),
        companyWhatsApp VARCHAR(50),
        companyOffice VARCHAR(50),
        companyEmail VARCHAR(100),
        companyGst VARCHAR(50),
        companyPan VARCHAR(50),
        customerName VARCHAR(255) NOT NULL,
        customerAddress TEXT,
        customerGst VARCHAR(50),
        customerPan VARCHAR(50),
        fromLocation VARCHAR(255),
        toLocation VARCHAR(255),
        bankName VARCHAR(255),
        bankBranch VARCHAR(255),
        accountNo VARCHAR(50),
        ifscCode VARCHAR(50),
        accountHolder VARCHAR(255),
        terms TEXT,
        rupeesInWords VARCHAR(255),
        subTotalOverride VARCHAR(50),
        gstOverride VARCHAR(50),
        grandTotalOverride VARCHAR(50),
        gstPercentage VARCHAR(50),
        items TEXT NOT NULL,
        createdAt VARCHAR(50)
      )
    `);

    try {
      const [existing] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills' AND COLUMN_NAME = 'sac'`,
      );
      if (existing.length === 0) {
        await connection.query(`ALTER TABLE bills ADD COLUMN sac VARCHAR(50) DEFAULT ''`);
      }
    } catch (e) {}

    // Money Receipts Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS money_receipts (
        id VARCHAR(50) PRIMARY KEY,
        mrNo VARCHAR(50) NOT NULL UNIQUE,
        lrNo VARCHAR(100),
        branch VARCHAR(100) NOT NULL,
        receiptDate VARCHAR(50) NOT NULL,
        partyName VARCHAR(255) NOT NULL,
        paymentFor VARCHAR(255),
        amountReceived DECIMAL(12,2) DEFAULT 0,
        amountInWords VARCHAR(255),
        narration TEXT,
        items TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Active',
        createdAt VARCHAR(50),
        updatedAt VARCHAR(50),
        createdBy VARCHAR(50)
      )
    `);

    // Global migration for edit audit trail (lastEditedBy and lastEditedAt)
    try {
      // Check if mrNo has a UNIQUE index and drop it
      const [indexes] = await connection.query(
        `SHOW INDEX FROM money_receipts WHERE Key_name = 'mrNo'`,
      );
      if (indexes.length > 0) {
        console.log(`Migration: Dropping UNIQUE index on mrNo from money_receipts table...`);
        await connection.query(`ALTER TABLE money_receipts DROP INDEX mrNo`);
      }
    } catch (idxErr) {
      console.error(`Migration error for dropping mrNo index:`, idxErr);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS voucher_codes (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        expenseAccountName VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        active TINYINT(1) DEFAULT 1,
        createdAt VARCHAR(50) DEFAULT '',
        updatedAt VARCHAR(50) DEFAULT '',
        createdBy VARCHAR(255) DEFAULT '',
        updatedBy VARCHAR(255) DEFAULT ''
      )
    `);

    const defaultCodes = [
      { code: "1", name: "L H ADVANCE EXP.", desc: "LORRY HIRE ADVANCE, DIESEL AMOUNT" },
      { code: "2", name: "L H BALANCE EXP.", desc: "LORRY HIRE BALANCE" },
      { code: "3", name: "RTO FINE EXP.", desc: "ODC LOAD RTO FINE ON LINE FINE ONLY" },
      { code: "4", name: "LOADING EXP.", desc: "VEHICLE LOADING AMOUNT" },
      { code: "5", name: "SALARY EXP.", desc: "STAFF, MANAGER, OWNER, PARTNER SALARY" },
      { code: "6", name: "CASH WITH DRAWL EXP.", desc: "CASH WITHDRAWL BY CHEQUE OR ATM OR QR CODE" },
      { code: "7", name: "SELF TRANSFER EXP.", desc: "SELF ACCOUNT TRANSFER ANY BANK TO ANY BANK" },
      { code: "8", name: "HALTING (DETENTION) EXP.", desc: "DETENTION AT LOADING OR UNLOADING POINT" },
      { code: "9", name: "HAND LOAN EXP.", desc: "IF TAKEN HAND LOAN FROM BANK, CREDIT CARD OR FINANCER" },
      { code: "10", name: "HAND LOAN RETURN EXP.", desc: "LOAN RETURN TO BANK OR OTHERS PERSON" },
      { code: "11", name: "INTEREST & EMI EXP.", desc: "HAND LOAN INTEREST, CREDIT CARD EMI" },
      { code: "12", name: "OFFICE MAINTENANCE EXP.", desc: "OFFICE MAINTENANCE, SWEEPER, WATER, ANY PURCHASE FOR OFFICE USE" },
      { code: "13", name: "OFFICE RENT EXP.", desc: "OFFICE RENT ONLY" },
      { code: "14", name: "HOUSE RENT EXP.", desc: "STAFF, MANAGER, OWNER, HOUSE RENT ALLOWANCE" },
      { code: "15", name: "ELECTRICITY BILL EXP.", desc: "OFFICE ELECTRICITY, HOUSE ELECTRICITY BILL ONLY" },
      { code: "16", name: "TELEPHONE & MOBILE EXP.", desc: "OFFICE TELEPHONE, WIFI BILL, STAFF, MANAGER, OWNER MOBILE RECHARGE" },
      { code: "17", name: "COMPUTER SERVICE EXP.", desc: "OFFICE COMPUTERS, LAPTOPS, PRINTERS REPAIR OR NEW PURCHASE" },
      { code: "18", name: "GPS RECHARGE (ROADO) EXP.", desc: "GPS RECHARGE ONLY" },
      { code: "19", name: "AUDITING FEES EXP.", desc: "AUDITOR FEES ONLY" },
      { code: "20", name: "BANK CHARGES EXP.", desc: "CHEQUE BOOK, STATEMENT, ATM CHARGE, MESSAGE ALERT, RTGS/NEFT DEBIT BY BANK" },
      { code: "21", name: "UNLOADING EXP.", desc: "VEHICLE UNLOADING AMOUNT" },
      { code: "22", name: "POSTAGE & COURIER EXP.", desc: "POST, SPEED POST, REGISTRY, AND COURIER EXPENSES" },
      { code: "23", name: "PETROL & BIKE EXP.", desc: "PETROL, BIKE SERVICE, OR NEW PURCHASE EXPENSES" },
      { code: "24", name: "LOCAL CONVENIENCE EXP.", desc: "LOCAL BUS, AUTO, TAXI EXPENSES" },
      { code: "25", name: "TRAVELLING EXP.", desc: "BUS, RAIL, AIR TICKET, HOTEL, FOOD AND OTHER TRAVEL EXPENSES" },
      { code: "26", name: "MISCELLANEOUS EXP.", desc: "OTHER EXPENSES" },
      { code: "27", name: "TEA, COFFEE EXP.", desc: "TEA, SNACKS, LUNCH, DINNER EXPENSES" },
      { code: "28", name: "POOJA EXP.", desc: "OFFICE DAILY POOJA, AYUDH POOJA, DIWALI POOJA EXPENSES" },
      { code: "29", name: "XEROX & PRINTING EXP.", desc: "XEROX, STATIONERY AND PRINTING EXPENSES" },
      { code: "30", name: "STAFF WELFARE EXP.", desc: "STAFF MEDICAL, UNIFORM, BONUS AND OTHER WELFARE EXPENSES" },
      { code: "31", name: "BUSINESS DEVELOPMENT EXP.", desc: "COMMISSION AND BUSINESS DEVELOPMENT EXPENSES" },
      { code: "32", name: "TRTA SUBSCRIPTION EXP.", desc: "TRTA SUBSCRIPTION AND OTHER SUBSCRIPTIONS" },
      { code: "33", name: "DONATION EXP.", desc: "DONATION FOR FESTIVALS, TEMPLE, GOUSALA, PONGAL VIZHA AND OTHER CHARITABLE PURPOSES" }
    ];

    for (const c of defaultCodes) {
      await connection.query(
        `INSERT IGNORE INTO voucher_codes (id, code, expenseAccountName, description, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uid(), c.code, c.name, c.desc, 1, daysFromNow(0), 'System']
      );
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS party_opening_balances (
        id VARCHAR(50) PRIMARY KEY,
        partyType VARCHAR(50) NOT NULL,
        partyId VARCHAR(50) NOT NULL,
        partyName VARCHAR(255) NOT NULL,
        balanceType VARCHAR(50) NOT NULL,
        amount INT NOT NULL,
        date VARCHAR(50) NOT NULL,
        createdAt VARCHAR(50) DEFAULT '',
        createdBy VARCHAR(255) DEFAULT ''
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS manual_adjustments (
        id VARCHAR(50) PRIMARY KEY,
        partyType VARCHAR(50) NOT NULL,
        partyId VARCHAR(50) NOT NULL,
        partyName VARCHAR(255) NOT NULL,
        adjustmentType VARCHAR(50) NOT NULL,
        amount INT NOT NULL,
        date VARCHAR(50) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        remarks TEXT,
        createdAt VARCHAR(50) DEFAULT '',
        createdBy VARCHAR(255) DEFAULT ''
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS outstanding_ledger (
        id VARCHAR(50) PRIMARY KEY,
        partyId VARCHAR(50) NOT NULL,
        partyType VARCHAR(50) NOT NULL,
        partyName VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        refType VARCHAR(100) NOT NULL,
        refNo VARCHAR(100) NOT NULL,
        lrNo VARCHAR(100) DEFAULT '',
        description TEXT,
        debit DECIMAL(12,2) DEFAULT 0,
        credit DECIMAL(12,2) DEFAULT 0,
        runningBalance DECIMAL(12,2) DEFAULT 0,
        runningBalanceType VARCHAR(10) DEFAULT '',
        status VARCHAR(50) DEFAULT 'Receivable',
        timestamp VARCHAR(50) NOT NULL,
        sourceId VARCHAR(50),
        profitLoss INT DEFAULT 0
      )
    `);

    // Migration to add profitLoss if table exists without it
    try {
      await connection.query("ALTER TABLE outstanding_ledger ADD COLUMN profitLoss INT DEFAULT 0");
      console.log("Added column profitLoss to outstanding_ledger table");
    } catch (e) {
      if (e.code !== "ER_DUP_FIELDNAME") {
        console.error("Migration error for profitLoss:", e.message);
      }
    }

    // Migration to add lrNo if table exists without it
    try {
      await connection.query("ALTER TABLE outstanding_ledger ADD COLUMN lrNo VARCHAR(100) DEFAULT ''");
      console.log("Added column lrNo to outstanding_ledger table");
    } catch (e) {
      // Ignored if column already exists
    }

    const allRecordTables = [
      "trucks",
      "companies",
      "banks",
      "brokers",
      "bookings",
      "bank_txns",
      "cash_txns",
      "consignment_notes",
      "challans",
      "arrival_reports",
      "drivers",
      "vouchers",
      "bills",
      "money_receipts",
      "party_opening_balances",
      "manual_adjustments",
      "outstanding_ledger",
    ];

    for (const tableName of allRecordTables) {
      const auditCols = [
        { name: "lastEditedBy", type: "VARCHAR(255)" },
        { name: "lastEditedAt", type: "VARCHAR(50)" },
        { name: "createdBy", type: "VARCHAR(255)" },
      ];

      for (const col of auditCols) {
        try {
          const [existing] = await connection.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [tableName, col.name],
          );
          if (existing.length === 0) {
            console.log(`Migration: Adding column ${col.name} to ${tableName} table...`);
            await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${col.name} ${col.type}`);
          }
        } catch (colErr) {
          console.error(`Migration error for ${tableName} column ${col.name}:`, colErr);
        }
      }
    }

    console.log("Database tables verified/created successfully.");
  } finally {
    connection.release();
  }
}

async function seedDb() {
  const connection = await pool.getConnection();
  try {
    // 1. Seed Trucks
    const [truckRows] = await connection.query("SELECT COUNT(*) as count FROM trucks");
    if (truckRows[0].count === 0) {
      console.log("Seeding trucks table...");
      const seedTrucks = [
        {
          id: uid(),
          vehicleNumber: "TN 38 BC 4521",
          ownerName: "Rajesh Kumar",
          address: "12, Gandhi Road, Coimbatore, Tamil Nadu",
          mobileNumber: "9842012345",
          panCard: "ABCPK1234L",
          aadharNumber: "984212345678",
          vehicleType: "Trailer",
          engineNumber: "ENG4521TR",
          chassisNumber: "CHS4521TR9087",
          nationalPermitNumber: "NP-TN-99812",
          nationalPermitValidUpto: daysFromNow(220),
          insuranceNumber: "INS-7781234",
          insuranceValidUpto: daysFromNow(18),
          pollutionNumber: "PUC-554120",
          pollutionValidUpto: daysFromNow(96),
          taxReceiptNumber: "TAX-TN-2231",
          taxReceiptValidUpto: daysFromNow(310),
          fitnessNumber: "FIT-9921",
          fitnessValidUpto: daysFromNow(140),
          createdAt: daysFromNow(-2),
        },
        {
          id: uid(),
          vehicleNumber: "KA 05 MN 8890",
          ownerName: "Suresh Transport Co.",
          address: "45, Hosur Road, Bengaluru, Karnataka",
          mobileNumber: "9886045671",
          panCard: "FGHPS9087Q",
          aadharNumber: "554433221100",
          vehicleType: "Lorry",
          engineNumber: "ENG8890LR",
          chassisNumber: "CHS8890LR1122",
          nationalPermitNumber: "NP-KA-44521",
          nationalPermitValidUpto: daysFromNow(-12),
          insuranceNumber: "INS-9923451",
          insuranceValidUpto: daysFromNow(120),
          pollutionNumber: "PUC-118822",
          pollutionValidUpto: daysFromNow(60),
          taxReceiptNumber: "TAX-KA-7782",
          taxReceiptValidUpto: daysFromNow(200),
          fitnessNumber: "FIT-3321",
          fitnessValidUpto: daysFromNow(80),
          createdAt: daysFromNow(-6),
        },
        {
          id: uid(),
          vehicleNumber: "MH 12 AB 1209",
          ownerName: "Pawan Singh",
          address: "7, MIDC, Pune, Maharashtra",
          mobileNumber: "9011223344",
          panCard: "LMNPS5512R",
          aadharNumber: "778899001122",
          vehicleType: "LCV",
          engineNumber: "ENG1209LC",
          chassisNumber: "CHS1209LC8765",
          nationalPermitNumber: "NP-MH-11209",
          nationalPermitValidUpto: daysFromNow(420),
          insuranceNumber: "INS-2231908",
          insuranceValidUpto: daysFromNow(340),
          pollutionNumber: "PUC-990012",
          pollutionValidUpto: daysFromNow(210),
          taxReceiptNumber: "TAX-MH-9981",
          taxReceiptValidUpto: daysFromNow(500),
          fitnessNumber: "FIT-7711",
          fitnessValidUpto: daysFromNow(360),
          createdAt: daysFromNow(-9),
        },
        {
          id: uid(),
          vehicleNumber: "GJ 01 KL 7765",
          ownerName: "Mehta Carriers",
          address: "23, Ring Road, Ahmedabad, Gujarat",
          mobileNumber: "9925011234",
          panCard: "QRSPM7781T",
          aadharNumber: "332211445566",
          vehicleType: "Taurus",
          engineNumber: "ENG7765TS",
          chassisNumber: "CHS7765TS4433",
          nationalPermitNumber: "NP-GJ-77651",
          nationalPermitValidUpto: daysFromNow(95),
          insuranceNumber: "INS-5512098",
          insuranceValidUpto: daysFromNow(25),
          pollutionNumber: "PUC-330091",
          pollutionValidUpto: daysFromNow(-5),
          taxReceiptNumber: "TAX-GJ-1122",
          taxReceiptValidUpto: daysFromNow(150),
          fitnessNumber: "FIT-5521",
          fitnessValidUpto: daysFromNow(40),
          createdAt: daysFromNow(-14),
        },
      ];

      for (const t of seedTrucks) {
        await connection.query(
          `INSERT INTO trucks (
            id, vehicleNumber, ownerName, address, mobileNumber, panCard, aadharNumber, vehicleType, engineNumber, chassisNumber, 
            nationalPermitNumber, nationalPermitValidUpto, insuranceNumber, insuranceValidUpto, pollutionNumber, pollutionValidUpto, 
            taxReceiptNumber, taxReceiptValidUpto, fitnessNumber, fitnessValidUpto, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            t.id,
            t.vehicleNumber,
            t.ownerName,
            t.address,
            t.mobileNumber,
            t.panCard,
            t.aadharNumber,
            t.vehicleType,
            t.engineNumber,
            t.chassisNumber,
            t.nationalPermitNumber,
            t.nationalPermitValidUpto,
            t.insuranceNumber,
            t.insuranceValidUpto,
            t.pollutionNumber,
            t.pollutionValidUpto,
            t.taxReceiptNumber,
            t.taxReceiptValidUpto,
            t.fitnessNumber,
            t.fitnessValidUpto,
            t.createdAt,
          ],
        );
      }
    }

    // 2. Seed Companies
    const [companyRows] = await connection.query("SELECT COUNT(*) as count FROM companies");
    if (companyRows[0].count === 0) {
      console.log("Seeding companies table...");
      const seedCompanies = [
        {
          id: uid(),
          consigneeName: "Apollo Steel Industries Ltd.",
          address: "Plot 14, Industrial Estate, Chennai, Tamil Nadu",
          contactPerson: "Vikram Nair",
          mobileNumber: "9840011223",
          gstNumber: "33ABCDE1234F1Z5",
          billingParty: "Consignee",
          active: 1,
          createdAt: daysFromNow(-3),
        },
        {
          id: uid(),
          consigneeName: "Sundaram Cements Pvt. Ltd.",
          address: "78, Trichy Road, Salem, Tamil Nadu",
          contactPerson: "Deepa Raman",
          mobileNumber: "9952234455",
          gstNumber: "33FGHIJ5678K2Z1",
          billingParty: "Consignor",
          active: 1,
          createdAt: daysFromNow(-7),
        },
        {
          id: uid(),
          consigneeName: "GreenField Agro Exports",
          address: "9, Market Road, Madurai, Tamil Nadu",
          contactPerson: "Arun Prasad",
          mobileNumber: "9003344556",
          gstNumber: "33KLMNO9012P3Z9",
          billingParty: "Third Party",
          active: 0,
          createdAt: daysFromNow(-11),
        },
      ];

      for (const c of seedCompanies) {
        await connection.query(
          "INSERT INTO companies (id, consigneeName, address, contactPerson, mobileNumber, gstNumber, billingParty, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            c.id,
            c.consigneeName,
            c.address,
            c.contactPerson,
            c.mobileNumber,
            c.gstNumber,
            c.billingParty,
            c.active,
            c.createdAt,
          ],
        );
      }
    }

    // 3. Seed Banks
    const [bankRows] = await connection.query("SELECT COUNT(*) as count FROM banks");
    if (bankRows[0].count === 0) {
      console.log("Seeding banks table...");
      const seedBanks = [
        {
          id: uid(),
          accountHolder: "JRKS Logistics",
          accountNumber: "50100234567890",
          accountType: "Current",
          bankName: "HDFC Bank",
          branch: "Coimbatore Main",
          ifsc: "HDFC0000123",
          mobileNumber: "9842012345",
          active: 1,
          createdAt: daysFromNow(-4),
        },
        {
          id: uid(),
          accountHolder: "Rajesh Kumar",
          accountNumber: "32109876543210",
          accountType: "Savings",
          bankName: "State Bank of India",
          branch: "Gandhipuram",
          ifsc: "SBIN0007781",
          mobileNumber: "9842012345",
          active: 1,
          createdAt: daysFromNow(-8),
        },
        {
          id: uid(),
          accountHolder: "Mehta Carriers",
          accountNumber: "11220033445566",
          accountType: "Cash Credit",
          bankName: "ICICI Bank",
          branch: "Ahmedabad Ring Road",
          ifsc: "ICIC0001122",
          mobileNumber: "9925011234",
          active: 1,
          createdAt: daysFromNow(-13),
        },
      ];

      for (const b of seedBanks) {
        await connection.query(
          "INSERT INTO banks (id, accountHolder, accountNumber, accountType, bankName, branch, ifsc, mobileNumber, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            b.id,
            b.accountHolder,
            b.accountNumber,
            b.accountType,
            b.bankName,
            b.branch,
            b.ifsc,
            b.mobileNumber,
            b.active,
            b.createdAt,
          ],
        );
      }
    }

    // 4. Seed Brokers
    const [brokerRows] = await connection.query("SELECT COUNT(*) as count FROM brokers");
    if (brokerRows[0].count === 0) {
      console.log("Seeding brokers table...");
      const seedBrokers = [
        {
          id: uid(),
          brokerName: "Sri Balaji Transport Brokers",
          address: "5, Avinashi Road, Tiruppur, Tamil Nadu",
          contactPerson: "Murali K",
          mobileNumber: "9842099887",
          whatsappNumber: "9842099887",
          panCard: "AABCS1234M",
          gstNumber: "33SRIBA1234B1Z3",
          accountNumber: "60123456789012",
          bankName: "Axis Bank",
          branch: "Tiruppur",
          ifsc: "UTIB0000456",
          active: 1,
          createdAt: daysFromNow(-5),
        },
        {
          id: uid(),
          brokerName: "National Freight Agency",
          address: "21, GST Road, Chennai, Tamil Nadu",
          contactPerson: "Iqbal Ahmed",
          mobileNumber: "9003322110",
          whatsappNumber: "9003322110",
          panCard: "AACFN8899P",
          gstNumber: "",
          accountNumber: "98760012345678",
          bankName: "Kotak Mahindra Bank",
          branch: "Guindy",
          ifsc: "KKBK0000789",
          active: 1,
          createdAt: daysFromNow(-10),
        },
      ];

      for (const br of seedBrokers) {
        await connection.query(
          "INSERT INTO brokers (id, brokerName, address, contactPerson, mobileNumber, whatsappNumber, panCard, gstNumber, accountNumber, bankName, branch, ifsc, active, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            br.id,
            br.brokerName,
            br.address,
            br.contactPerson,
            br.mobileNumber,
            br.whatsappNumber,
            br.panCard,
            br.gstNumber,
            br.accountNumber,
            br.bankName,
            br.branch,
            br.ifsc,
            br.active,
            br.createdAt,
          ],
        );
      }
    }

    // 5. Seed Bookings
    const [bookingRows] = await connection.query("SELECT COUNT(*) as count FROM bookings");
    if (bookingRows[0].count === 0) {
      console.log("Seeding bookings table...");
      const seedBookings = [
        {
          id: uid(),
          bookingNo: "JRKS001",
          bookingDate: daysFromNow(-1),
          vehicleNumber: "TN 38 BC 4521",
          truckOwner: "Rajesh Kumar",
          brokerName: "Sri Balaji Transport Brokers",
          companyName: "Apollo Steel Industries Ltd.",
          loadingLocation: "Coimbatore",
          unloadingLocation: "Chennai",
          materialDescription: "TMT Steel Bars",
          weight: "21 MT",
          maxWeight: "",
          hireAmount: 48000,
          advanceAmount: 30000,
          balanceAmount: 18000,
          commissionAmount: 2400,
          commissionPaid: 0,
          billAmount: 52000,
          receivedAmount: 0,
          dueDate: daysFromNow(14),
          remarks: "Priority delivery",
          status: "In Transit",
          createdAt: daysFromNow(-1),
        },
        {
          id: uid(),
          bookingNo: "JRKS002",
          bookingDate: daysFromNow(-3),
          vehicleNumber: "KA 05 MN 8890",
          truckOwner: "Suresh Transport Co.",
          brokerName: "National Freight Agency",
          companyName: "Sundaram Cements Pvt. Ltd.",
          loadingLocation: "Bengaluru",
          unloadingLocation: "Salem",
          materialDescription: "Cement Bags",
          weight: "25 MT",
          maxWeight: "",
          hireAmount: 38000,
          advanceAmount: 20000,
          balanceAmount: 18000,
          commissionAmount: 1900,
          commissionPaid: 1,
          billAmount: 41000,
          receivedAmount: 41000,
          dueDate: daysFromNow(-2),
          remarks: "",
          status: "Delivered",
          createdAt: daysFromNow(-3),
        },
        {
          id: uid(),
          bookingNo: "JRKS003",
          bookingDate: daysFromNow(-5),
          vehicleNumber: "MH 12 AB 1209",
          truckOwner: "Pawan Singh",
          brokerName: "Sri Balaji Transport Brokers",
          companyName: "GreenField Agro Exports",
          loadingLocation: "Pune",
          unloadingLocation: "Madurai",
          materialDescription: "Packaged Foods",
          weight: "12 MT",
          maxWeight: "",
          hireAmount: 56000,
          advanceAmount: 25000,
          balanceAmount: 31000,
          commissionAmount: 2800,
          commissionPaid: 0,
          billAmount: 60000,
          receivedAmount: 30000,
          dueDate: daysFromNow(9),
          remarks: "Partial collection done",
          status: "Delivered",
          createdAt: daysFromNow(-5),
        },
        {
          id: uid(),
          bookingNo: "JRKS004",
          bookingDate: daysFromNow(-7),
          vehicleNumber: "GJ 01 KL 7765",
          truckOwner: "Mehta Carriers",
          brokerName: "National Freight Agency",
          companyName: "Apollo Steel Industries Ltd.",
          loadingLocation: "Ahmedabad",
          unloadingLocation: "Coimbatore",
          materialDescription: "Steel Coils",
          weight: "28 MT",
          maxWeight: "",
          hireAmount: 72000,
          advanceAmount: 40000,
          balanceAmount: 32000,
          commissionAmount: 3600,
          commissionPaid: 1,
          billAmount: 78000,
          receivedAmount: 78000,
          dueDate: daysFromNow(-1),
          remarks: "",
          status: "Closed",
          createdAt: daysFromNow(-7),
        },
        {
          id: uid(),
          bookingNo: "JRKS005",
          bookingDate: daysFromNow(-9),
          vehicleNumber: "TN 38 BC 4521",
          truckOwner: "Rajesh Kumar",
          brokerName: "Sri Balaji Transport Brokers",
          companyName: "Sundaram Cements Pvt. Ltd.",
          loadingLocation: "Coimbatore",
          unloadingLocation: "Bengaluru",
          materialDescription: "Cement Bags",
          weight: "24 MT",
          maxWeight: "",
          hireAmount: 34000,
          advanceAmount: 0,
          balanceAmount: 34000,
          commissionAmount: 1700,
          commissionPaid: 0,
          billAmount: 37000,
          receivedAmount: 0,
          dueDate: daysFromNow(20),
          remarks: "Booked, awaiting loading",
          status: "Booked",
          createdAt: daysFromNow(-9),
        },
        {
          id: uid(),
          bookingNo: "JRKS006",
          bookingDate: daysFromNow(-12),
          vehicleNumber: "KA 05 MN 8890",
          truckOwner: "Suresh Transport Co.",
          brokerName: "National Freight Agency",
          companyName: "GreenField Agro Exports",
          loadingLocation: "Bengaluru",
          unloadingLocation: "Chennai",
          materialDescription: "Agro Produce",
          weight: "16 MT",
          maxWeight: "",
          hireAmount: 42000,
          advanceAmount: 20000,
          balanceAmount: 22000,
          commissionAmount: 2100,
          commissionPaid: 0,
          billAmount: 45000,
          receivedAmount: 20000,
          dueDate: daysFromNow(5),
          remarks: "",
          status: "Delivered",
          createdAt: daysFromNow(-12),
        },
      ];

      for (const b of seedBookings) {
        await connection.query(
          `INSERT INTO bookings (
            id, bookingNo, bookingDate, vehicleNumber, truckOwner, brokerName, companyName, loadingLocation, unloadingLocation, 
            materialDescription, weight, hireAmount, advanceAmount, balanceAmount, commissionAmount, commissionPaid, 
            billAmount, receivedAmount, dueDate, remarks, status, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            b.bookingNo,
            b.bookingDate,
            b.vehicleNumber,
            b.truckOwner,
            b.brokerName,
            b.companyName,
            b.loadingLocation,
            b.unloadingLocation,
            b.materialDescription,
            b.weight,
            b.hireAmount,
            b.advanceAmount,
            b.balanceAmount,
            b.commissionAmount,
            b.commissionPaid,
            b.billAmount,
            b.receivedAmount,
            b.dueDate,
            b.remarks,
            b.status,
            b.createdAt,
          ],
        );
      }
    }

    // 6. Seed Bank Transactions
    const [bankTxnRows] = await connection.query("SELECT COUNT(*) as count FROM bank_txns");
    if (bankTxnRows[0].count === 0) {
      console.log("Seeding bank transactions table...");
      const seedBankTxns = [
        {
          id: uid(),
          date: daysFromNow(-7),
          bankName: "HDFC Bank",
          description: "Opening transfer",
          credit: 250000,
          debit: 0,
        },
        {
          id: uid(),
          date: daysFromNow(-6),
          bankName: "HDFC Bank",
          description: "Advance paid — TN 38 BC 4521",
          credit: 0,
          debit: 30000,
        },
        {
          id: uid(),
          date: daysFromNow(-4),
          bankName: "HDFC Bank",
          description: "Collection — Apollo Steel",
          credit: 78000,
          debit: 0,
        },
        {
          id: uid(),
          date: daysFromNow(-3),
          bankName: "ICICI Bank",
          description: "Hire balance paid — Mehta Carriers",
          credit: 0,
          debit: 32000,
        },
        {
          id: uid(),
          date: daysFromNow(-2),
          bankName: "HDFC Bank",
          description: "Collection — Sundaram Cements",
          credit: 41000,
          debit: 0,
        },
        {
          id: uid(),
          date: daysFromNow(-1),
          bankName: "HDFC Bank",
          description: "Commission paid — National Freight",
          credit: 0,
          debit: 1900,
        },
      ];

      for (const bt of seedBankTxns) {
        await connection.query(
          "INSERT INTO bank_txns (id, date, bankName, description, credit, debit) VALUES (?, ?, ?, ?, ?, ?)",
          [bt.id, bt.date, bt.bankName, bt.description, bt.credit, bt.debit],
        );
      }
    }

    // 7. Seed Cash Transactions
    const [cashTxnRows] = await connection.query("SELECT COUNT(*) as count FROM cash_txns");
    if (cashTxnRows[0].count === 0) {
      console.log("Seeding cash transactions table...");
      const seedCashTxns = [
        {
          id: uid(),
          date: daysFromNow(-5),
          description: "Opening balance",
          receipt: 50000,
          payment: 0,
        },
        {
          id: uid(),
          date: daysFromNow(-4),
          description: "Diesel & toll — KA 05 MN 8890",
          receipt: 0,
          payment: 8500,
        },
        {
          id: uid(),
          date: daysFromNow(-3),
          description: "Cash collection — GreenField",
          receipt: 30000,
          payment: 0,
        },
        { id: uid(), date: daysFromNow(-2), description: "Driver bata", receipt: 0, payment: 4000 },
        {
          id: uid(),
          date: daysFromNow(-1),
          description: "Office expenses",
          receipt: 0,
          payment: 2200,
        },
      ];

      for (const ct of seedCashTxns) {
        await connection.query(
          "INSERT INTO cash_txns (id, date, description, receipt, payment) VALUES (?, ?, ?, ?, ?)",
          [ct.id, ct.date, ct.description, ct.receipt, ct.payment],
        );
      }
    }

    // Seed Drivers
    const [driverRows] = await connection.query("SELECT COUNT(*) as count FROM drivers");
    if (driverRows[0].count === 0) {
      console.log("Seeding drivers table...");
      const seedDrivers = [
        {
          id: uid(),
          driverName: "Ramesh Singh",
          driverMobile: "9876543210",
          createdAt: daysFromNow(-15),
        },
        {
          id: uid(),
          driverName: "Karthik Raja",
          driverMobile: "9123456789",
          createdAt: daysFromNow(-15),
        },
        {
          id: uid(),
          driverName: "Amit Patel",
          driverMobile: "9012345678",
          createdAt: daysFromNow(-15),
        },
      ];
      for (const d of seedDrivers) {
        await connection.query(
          "INSERT INTO drivers (id, driverName, driverMobile, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
          [d.id, d.driverName, d.driverMobile, d.createdAt, d.createdAt],
        );
      }
    }

    console.log("Seeding process checked/completed successfully.");
  } finally {
    connection.release();
  }
}

export async function syncRegistersFromBookings() {
  // Registers and commission reports have been completely removed from the application
  return;
}

export function getPool() {
  if (!pool) {
    throw new Error("Pool is not initialized. Call initDb() first.");
  }
  return pool;
}
