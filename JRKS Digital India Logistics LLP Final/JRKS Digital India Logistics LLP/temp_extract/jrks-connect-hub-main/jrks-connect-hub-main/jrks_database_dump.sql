-- ============================================================
-- JRKS Digital India Logistics LLP - Complete Database Schema Dump
-- Host: localhost | Database: jrks
-- Target Database User: jrksdb
-- Target Database Password: Malaveeka@20
-- ============================================================

CREATE DATABASE IF NOT EXISTS `jrks` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jrks`;

-- --------------------------------------------------------
-- Table structure for `trucks`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `trucks` (
  `id` VARCHAR(50) PRIMARY KEY,
  `vehicleNumber` VARCHAR(50) NOT NULL,
  `ownerName` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `mobileNumber` VARCHAR(20) NOT NULL,
  `panCard` VARCHAR(20) NOT NULL,
  `aadharNumber` VARCHAR(50),
  `accountNumber` VARCHAR(50),
  `vehicleType` VARCHAR(50) NOT NULL,
  `engineNumber` VARCHAR(100) NOT NULL,
  `chassisNumber` VARCHAR(100) NOT NULL,
  `nationalPermitNumber` VARCHAR(100),
  `nationalPermitValidUpto` VARCHAR(50),
  `insuranceNumber` VARCHAR(100),
  `insuranceValidUpto` VARCHAR(50),
  `pollutionNumber` VARCHAR(100),
  `pollutionValidUpto` VARCHAR(50),
  `taxReceiptNumber` VARCHAR(100),
  `taxReceiptValidUpto` VARCHAR(50),
  `fitnessNumber` VARCHAR(100),
  `fitnessValidUpto` VARCHAR(50),
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `companies`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(50) PRIMARY KEY,
  `companyName` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `gstin` VARCHAR(20) NOT NULL,
  `contactPerson` VARCHAR(255) NOT NULL,
  `contactNumber` VARCHAR(20) NOT NULL,
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `banks`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `banks` (
  `id` VARCHAR(50) PRIMARY KEY,
  `bankName` VARCHAR(255) NOT NULL,
  `accountNumber` VARCHAR(50) NOT NULL,
  `ifscCode` VARCHAR(20) NOT NULL,
  `branchName` VARCHAR(255) NOT NULL,
  `openingBalance` DECIMAL(15,2) DEFAULT 0.00,
  `currentBalance` DECIMAL(15,2) DEFAULT 0.00,
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `brokers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `brokers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `brokerName` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `contactNumber` VARCHAR(20) NOT NULL,
  `panCard` VARCHAR(20) NOT NULL,
  `bankName` VARCHAR(255),
  `accountNumber` VARCHAR(50),
  `ifscCode` VARCHAR(20),
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `bookings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` VARCHAR(50) PRIMARY KEY,
  `bookingNo` VARCHAR(50) NOT NULL,
  `bookingDate` VARCHAR(50) NOT NULL,
  `consignorName` VARCHAR(255),
  `consigneeName` VARCHAR(255),
  `companyName` VARCHAR(255),
  `fromLocation` VARCHAR(255) NOT NULL,
  `toLocation` VARCHAR(255) NOT NULL,
  `vehicleNumber` VARCHAR(50) NOT NULL,
  `truckOwnerName` VARCHAR(255),
  `driverMobile` VARCHAR(20),
  `materialDescription` TEXT,
  `weight` VARCHAR(50),
  `freightRate` DECIMAL(15,2),
  `totalFreight` DECIMAL(15,2),
  `advanceAmount` DECIMAL(15,2),
  `balanceAmount` DECIMAL(15,2),
  `paymentTerms` VARCHAR(50),
  `remarks` TEXT,
  `lrNo` VARCHAR(50),
  `billAmount` DECIMAL(15,2),
  `hireAmount` DECIMAL(15,2),
  `status` VARCHAR(50) DEFAULT 'Active',
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `bank_txns`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bank_txns` (
  `id` VARCHAR(50) PRIMARY KEY,
  `bankId` VARCHAR(50) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `balanceAfter` DECIMAL(15,2) NOT NULL,
  `refType` VARCHAR(50),
  `refId` VARCHAR(50),
  `createdAt` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `cash_txns`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cash_txns` (
  `id` VARCHAR(50) PRIMARY KEY,
  `date` VARCHAR(50) NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `balanceAfter` DECIMAL(15,2) NOT NULL,
  `refType` VARCHAR(50),
  `refId` VARCHAR(50),
  `createdAt` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `consignment_notes`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consignment_notes` (
  `id` VARCHAR(50) PRIMARY KEY,
  `consignmentNoteNo` VARCHAR(50) NOT NULL,
  `lrNumber` VARCHAR(50) NOT NULL,
  `lrDate` VARCHAR(50) NOT NULL,
  `consignorName` VARCHAR(255),
  `consignorAddress` TEXT,
  `consignorGstin` VARCHAR(20),
  `consigneeName` VARCHAR(255),
  `consigneeAddress` TEXT,
  `consigneeGstin` VARCHAR(20),
  `fromLocation` VARCHAR(255),
  `toLocation` VARCHAR(255),
  `vehicleNumber` VARCHAR(50),
  `truckOwnerName` VARCHAR(255),
  `driverMobile` VARCHAR(20),
  `freightType` VARCHAR(50),
  `itemsJson` LONGTEXT,
  `taxPayableBy` VARCHAR(50),
  `remarks` TEXT,
  `status` VARCHAR(50) DEFAULT 'Active',
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `challans`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `challans` (
  `id` VARCHAR(50) PRIMARY KEY,
  `challanNo` VARCHAR(50) NOT NULL,
  `challanDate` VARCHAR(50) NOT NULL,
  `vehicleNumber` VARCHAR(50),
  `driverName` VARCHAR(255),
  `driverMobile` VARCHAR(20),
  `ownerName` VARCHAR(255),
  `fromLocation` VARCHAR(255),
  `toLocation` VARCHAR(255),
  `brokerName` VARCHAR(255),
  `freightAmount` DECIMAL(15,2),
  `advanceAmount` DECIMAL(15,2),
  `balanceAmount` DECIMAL(15,2),
  `haltingCharges` DECIMAL(15,2),
  `otherCharges` DECIMAL(15,2),
  `deductions` DECIMAL(15,2),
  `payableAmount` DECIMAL(15,2),
  `itemsJson` LONGTEXT,
  `remarks` TEXT,
  `status` VARCHAR(50) DEFAULT 'Active',
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `arrival_reports`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `arrival_reports` (
  `arrival_report_id` VARCHAR(50) PRIMARY KEY,
  `arrival_report_no` VARCHAR(50),
  `bill_no` VARCHAR(50),
  `mr_no` VARCHAR(50),
  `lr_no` VARCHAR(50),
  `report_date` VARCHAR(50),
  `delivery_date` VARCHAR(50),
  `ack_date` VARCHAR(50),
  `remarks` TEXT,
  `payment_mode` VARCHAR(50),
  `payment_reference` VARCHAR(100),
  `bill_reference_no` VARCHAR(50),
  `bill_reference_date` VARCHAR(50),
  `mr_reference_no` VARCHAR(50),
  `mr_reference_date` VARCHAR(50),
  `branch_incharge` VARCHAR(255),
  `signature_name` VARCHAR(255),
  `created_at` VARCHAR(50),
  `updated_at` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `drivers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `driverName` VARCHAR(255) NOT NULL,
  `licenseNumber` VARCHAR(50) NOT NULL,
  `mobileNumber` VARCHAR(20) NOT NULL,
  `address` TEXT,
  `createdAt` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `vouchers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vouchers` (
  `id` VARCHAR(50) PRIMARY KEY,
  `voucherNo` VARCHAR(50) NOT NULL,
  `voucherDate` VARCHAR(50) NOT NULL,
  `narration` TEXT,
  `itemsJson` LONGTEXT,
  `totalAmount` DECIMAL(15,2),
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `bills`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bills` (
  `id` VARCHAR(50) PRIMARY KEY,
  `billNo` VARCHAR(50) NOT NULL,
  `date` VARCHAR(50) NOT NULL,
  `customerName` VARCHAR(255),
  `lrNumber` VARCHAR(50),
  `fromLocation` VARCHAR(255),
  `toLocation` VARCHAR(255),
  `subTotalOverride` VARCHAR(50),
  `gstPercentage` VARCHAR(20),
  `gstOverride` VARCHAR(50),
  `grandTotalOverride` VARCHAR(50),
  `itemsJson` LONGTEXT,
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `money_receipts`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `money_receipts` (
  `id` VARCHAR(50) PRIMARY KEY,
  `mrNo` VARCHAR(50) NOT NULL,
  `receiptDate` VARCHAR(50) NOT NULL,
  `lrNo` VARCHAR(50),
  `partyName` VARCHAR(255),
  `paymentFor` VARCHAR(255),
  `amountReceived` DECIMAL(15,2),
  `amountInWords` TEXT,
  `paymentMode` VARCHAR(50),
  `bankName` VARCHAR(255),
  `chequeNo` VARCHAR(100),
  `chequeDate` VARCHAR(50),
  `itemsJson` LONGTEXT,
  `narration` TEXT,
  `createdAt` VARCHAR(50),
  `lastEditedBy` VARCHAR(255),
  `lastEditedAt` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
