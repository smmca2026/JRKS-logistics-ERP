-- Complete Database Dump for JRKS Logistics
-- Export Date: 2026-10-05T11:50:05.110Z

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `arrival_reports`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `arrival_reports`;
CREATE TABLE `arrival_reports` (
  `arrival_report_id` varchar(50) NOT NULL,
  `bill_no` varchar(100) NOT NULL,
  `mr_no` varchar(100) NOT NULL,
  `report_date` varchar(50) NOT NULL,
  `delivery_date` varchar(50) NOT NULL,
  `ack_date` varchar(50) DEFAULT NULL,
  `remarks` text,
  `payment_mode` varchar(100) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `bill_reference_no` varchar(100) DEFAULT NULL,
  `bill_reference_date` varchar(50) DEFAULT NULL,
  `mr_reference_no` varchar(100) DEFAULT NULL,
  `mr_reference_date` varchar(50) DEFAULT NULL,
  `branch_incharge` varchar(255) DEFAULT NULL,
  `signature_name` varchar(255) DEFAULT NULL,
  `created_at` varchar(50) DEFAULT NULL,
  `updated_at` varchar(50) DEFAULT NULL,
  `arrival_report_no` varchar(100) DEFAULT NULL,
  `challan_no` varchar(100) DEFAULT NULL,
  `lr_no` varchar(100) DEFAULT NULL,
  `arrival_date` varchar(50) DEFAULT NULL,
  `delivery_status` varchar(100) DEFAULT NULL,
  `received_by` varchar(255) DEFAULT NULL,
  `receiver_mobile` varchar(20) DEFAULT NULL,
  `halting_days` varchar(50) DEFAULT NULL,
  `halting_amount_per_day` varchar(50) DEFAULT NULL,
  `total_detention_amount` varchar(50) DEFAULT NULL,
  `balance_amount` varchar(50) DEFAULT NULL,
  `net_amount` varchar(50) DEFAULT '',
  `uploaded_pdf` longtext,
  `uploaded_pdf_name` varchar(255) DEFAULT NULL,
  `penalty_type` varchar(100) DEFAULT '',
  `penalty_amount` varchar(50) DEFAULT '',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`arrival_report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `bank_txns`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `bank_txns`;
CREATE TABLE `bank_txns` (
  `id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `bankName` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `credit` int DEFAULT '0',
  `debit` int DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `banks`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `banks`;
CREATE TABLE `banks` (
  `id` varchar(50) NOT NULL,
  `accountHolder` varchar(255) NOT NULL,
  `accountNumber` varchar(50) NOT NULL,
  `accountType` varchar(50) NOT NULL,
  `bankName` varchar(255) NOT NULL,
  `branch` varchar(255) NOT NULL,
  `ifsc` varchar(50) NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `bills`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `bills`;
CREATE TABLE `bills` (
  `id` varchar(50) NOT NULL,
  `billNo` varchar(50) NOT NULL,
  `lrNumber` varchar(100) DEFAULT NULL,
  `date` varchar(50) NOT NULL,
  `submittedDate` varchar(50) DEFAULT NULL,
  `dueDate` varchar(50) DEFAULT NULL,
  `companyName` varchar(255) NOT NULL,
  `companyAddress` text,
  `companyMobile` varchar(50) DEFAULT NULL,
  `companyWhatsApp` varchar(50) DEFAULT NULL,
  `companyOffice` varchar(50) DEFAULT NULL,
  `companyEmail` varchar(100) DEFAULT NULL,
  `companyGst` varchar(50) DEFAULT NULL,
  `companyPan` varchar(50) DEFAULT NULL,
  `customerName` varchar(255) NOT NULL,
  `customerAddress` text,
  `customerGst` varchar(50) DEFAULT NULL,
  `customerPan` varchar(50) DEFAULT NULL,
  `fromLocation` varchar(255) DEFAULT NULL,
  `toLocation` varchar(255) DEFAULT NULL,
  `bankName` varchar(255) DEFAULT NULL,
  `bankBranch` varchar(255) DEFAULT NULL,
  `accountNo` varchar(50) DEFAULT NULL,
  `ifscCode` varchar(50) DEFAULT NULL,
  `accountHolder` varchar(255) DEFAULT NULL,
  `terms` text,
  `rupeesInWords` varchar(255) DEFAULT NULL,
  `subTotalOverride` varchar(50) DEFAULT NULL,
  `gstOverride` varchar(50) DEFAULT NULL,
  `grandTotalOverride` varchar(50) DEFAULT NULL,
  `gstPercentage` varchar(50) DEFAULT NULL,
  `items` text NOT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT '',
  `sac` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `billNo` (`billNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `bookings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` varchar(50) NOT NULL,
  `bookingNo` varchar(50) NOT NULL,
  `bookingDate` varchar(50) NOT NULL,
  `vehicleNumber` varchar(50) NOT NULL,
  `truckOwner` varchar(255) NOT NULL,
  `brokerName` varchar(255) NOT NULL,
  `companyName` varchar(255) DEFAULT '',
  `loadingLocation` varchar(255) NOT NULL,
  `unloadingLocation` varchar(255) NOT NULL,
  `materialDescription` varchar(255) NOT NULL,
  `weight` varchar(50) NOT NULL,
  `hireAmount` int NOT NULL,
  `advanceAmount` int NOT NULL,
  `balanceAmount` int NOT NULL,
  `commissionAmount` int NOT NULL,
  `commissionPaid` tinyint(1) DEFAULT '0',
  `billAmount` int NOT NULL,
  `receivedAmount` int NOT NULL,
  `dueDate` varchar(50) NOT NULL,
  `remarks` text,
  `status` varchar(50) NOT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `serialNo` varchar(50) DEFAULT '',
  `lrNo` varchar(50) DEFAULT '',
  `lrDate` varchar(50) DEFAULT '',
  `consignorName` varchar(255) DEFAULT '',
  `consigneeName` varchar(255) DEFAULT '',
  `truckType` varchar(50) DEFAULT '',
  `loadType` varchar(50) DEFAULT '',
  `invoiceNo` varchar(255) DEFAULT '',
  `netWeight` varchar(50) DEFAULT '',
  `chargedWeight` varchar(50) DEFAULT '',
  `packageDetails` varchar(255) DEFAULT '',
  `billNo` varchar(50) DEFAULT '',
  `challanNo` varchar(50) DEFAULT '',
  `challanDate` varchar(50) DEFAULT '',
  `distance` varchar(50) DEFAULT '',
  `pmtType` varchar(50) DEFAULT '',
  `odcStatus` varchar(255) DEFAULT '',
  `mamulCharges` int DEFAULT '0',
  `profit` int DEFAULT '0',
  `margin` varchar(50) DEFAULT '',
  `panNumber` varchar(50) DEFAULT '',
  `ewayBillNo` varchar(50) DEFAULT '',
  `ewayBillValidity` varchar(50) DEFAULT '',
  `reportingDate` varchar(50) DEFAULT '',
  `unloadingDate` varchar(50) DEFAULT '',
  `podReceivedDate` varchar(50) DEFAULT '',
  `rtoFine` int DEFAULT '0',
  `paidOn` varchar(50) DEFAULT '',
  `balancePaidOn` varchar(50) DEFAULT '',
  `billPaymentReceivedOn` varchar(50) DEFAULT '',
  `updatedAt` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT '',
  `archived` tinyint(1) DEFAULT '0',
  `branch` varchar(100) DEFAULT 'Trichy',
  `lrNumber` varchar(100) DEFAULT '',
  `consignorAddress` text,
  `consignorGst` varchar(50) DEFAULT '',
  `consigneeAddress` text,
  `consigneeGst` varchar(50) DEFAULT '',
  `insuranceType` varchar(50) DEFAULT 'Owner Risk',
  `demurrageDays` int DEFAULT '0',
  `demurrageRate` int DEFAULT '0',
  `chargeBasis` varchar(100) DEFAULT '',
  `demurrageRemarks` text,
  `items` text,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookingNo` (`bookingNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `brokers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `brokers`;
CREATE TABLE `brokers` (
  `id` varchar(50) NOT NULL,
  `brokerName` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `contactPerson` varchar(255) NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `whatsappNumber` varchar(20) NOT NULL,
  `panCard` varchar(20) NOT NULL,
  `aadharCard` varchar(50) DEFAULT NULL,
  `gstNumber` varchar(50) DEFAULT NULL,
  `accountNumber` varchar(50) NOT NULL,
  `bankName` varchar(255) NOT NULL,
  `branch` varchar(255) NOT NULL,
  `ifsc` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `cash_txns`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `cash_txns`;
CREATE TABLE `cash_txns` (
  `id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `receipt` int DEFAULT '0',
  `payment` int DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `challans`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `challans`;
CREATE TABLE `challans` (
  `id` varchar(50) NOT NULL,
  `manualChallanNo` varchar(50) DEFAULT '',
  `challanNo` varchar(50) NOT NULL,
  `challanDate` varchar(50) NOT NULL,
  `fromLocation` varchar(255) NOT NULL,
  `toLocation` varchar(255) NOT NULL,
  `vehicleNumber` varchar(50) NOT NULL,
  `items` text NOT NULL,
  `ownerPan` varchar(20) DEFAULT NULL,
  `ownerName` varchar(255) DEFAULT NULL,
  `ownerAadhar` varchar(20) DEFAULT NULL,
  `ownerAccount` varchar(50) DEFAULT NULL,
  `ownerMobile` varchar(20) DEFAULT NULL,
  `declarationAttached` varchar(10) DEFAULT NULL,
  `driverName` varchar(255) DEFAULT NULL,
  `driverMobile` varchar(20) DEFAULT NULL,
  `dimLength` varchar(20) DEFAULT NULL,
  `dimWidth` varchar(20) DEFAULT NULL,
  `dimHeight` varchar(20) DEFAULT NULL,
  `brokerPan` varchar(20) DEFAULT NULL,
  `brokerName` varchar(255) DEFAULT NULL,
  `brokerAadhar` varchar(20) DEFAULT NULL,
  `brokerAccount` varchar(50) DEFAULT NULL,
  `brokerMobile` varchar(20) DEFAULT NULL,
  `freight` decimal(12,2) NOT NULL DEFAULT '0.00',
  `loadingMamul` decimal(12,2) NOT NULL DEFAULT '0.00',
  `comlyCom` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rtoFine` decimal(12,2) NOT NULL DEFAULT '0.00',
  `extraCharges` decimal(12,2) NOT NULL DEFAULT '0.00',
  `lorryHire` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tds` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tdsPercentage` varchar(10) DEFAULT '0%',
  `lessAdvance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `commission` decimal(12,2) NOT NULL DEFAULT '0.00',
  `balanceAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `payableAt` varchar(255) DEFAULT NULL,
  `brokerNameSec5` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'In Transit',
  `createdAt` varchar(50) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challanNo` (`challanNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `companies`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
  `id` varchar(50) NOT NULL,
  `consigneeName` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `contactPerson` varchar(255) NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `gstNumber` varchar(50) NOT NULL,
  `panNumber` varchar(50) DEFAULT NULL,
  `billingParty` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `consignment_notes`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `consignment_notes`;
CREATE TABLE `consignment_notes` (
  `id` varchar(50) NOT NULL,
  `branch` varchar(100) NOT NULL,
  `consignmentNoteNo` varchar(100) NOT NULL,
  `lrNumber` varchar(100) NOT NULL,
  `sac` varchar(50) DEFAULT NULL,
  `lrDate` varchar(50) NOT NULL,
  `consignorName` varchar(255) NOT NULL,
  `consignorAddress` text,
  `consignorGst` varchar(50) DEFAULT NULL,
  `consignorPan` varchar(50) DEFAULT NULL,
  `consigneeName` varchar(255) NOT NULL,
  `consigneeAddress` text,
  `consigneeGst` varchar(50) DEFAULT NULL,
  `consigneePan` varchar(50) DEFAULT NULL,
  `insuranceType` varchar(50) NOT NULL,
  `fromLocation` varchar(255) NOT NULL,
  `toLocation` varchar(255) NOT NULL,
  `vehicleNumber` varchar(50) NOT NULL,
  `demandNo` varchar(100) DEFAULT NULL,
  `shipmentNo` varchar(100) DEFAULT NULL,
  `custNo` varchar(100) DEFAULT NULL,
  `schNo` varchar(100) DEFAULT NULL,
  `freightType` varchar(50) NOT NULL,
  `demurrageDays` int DEFAULT NULL,
  `demurrageRate` int DEFAULT NULL,
  `chargeBasis` varchar(100) DEFAULT NULL,
  `demurrageRemarks` text,
  `vehicleLength` varchar(50) DEFAULT NULL,
  `vehicleWidth` varchar(50) DEFAULT NULL,
  `vehicleHeight` varchar(50) DEFAULT NULL,
  `items` text NOT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `drivers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `drivers`;
CREATE TABLE `drivers` (
  `id` varchar(50) NOT NULL,
  `driverName` varchar(255) NOT NULL,
  `driverMobile` varchar(20) NOT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `manual_adjustments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `manual_adjustments`;
CREATE TABLE `manual_adjustments` (
  `id` varchar(50) NOT NULL,
  `partyType` varchar(50) NOT NULL,
  `partyId` varchar(50) NOT NULL,
  `partyName` varchar(255) NOT NULL,
  `adjustmentType` varchar(50) NOT NULL,
  `amount` int NOT NULL,
  `date` varchar(50) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `remarks` text,
  `createdAt` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT '',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `money_receipts`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `money_receipts`;
CREATE TABLE `money_receipts` (
  `id` varchar(50) NOT NULL,
  `mrNo` varchar(50) NOT NULL,
  `lrNo` varchar(100) DEFAULT NULL,
  `branch` varchar(100) NOT NULL,
  `receiptDate` varchar(50) NOT NULL,
  `partyName` varchar(255) NOT NULL,
  `paymentFor` varchar(255) DEFAULT NULL,
  `amountReceived` decimal(12,2) DEFAULT '0.00',
  `amountInWords` varchar(255) DEFAULT NULL,
  `narration` text,
  `items` text NOT NULL,
  `status` varchar(50) DEFAULT 'Active',
  `createdAt` varchar(50) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `outstanding_ledger`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `outstanding_ledger`;
CREATE TABLE `outstanding_ledger` (
  `id` varchar(50) NOT NULL,
  `partyId` varchar(50) NOT NULL,
  `partyType` varchar(50) NOT NULL,
  `partyName` varchar(255) NOT NULL,
  `date` varchar(50) NOT NULL,
  `refType` varchar(100) NOT NULL,
  `refNo` varchar(100) NOT NULL,
  `lrNo` varchar(100) DEFAULT '',
  `description` text,
  `debit` decimal(12,2) DEFAULT '0.00',
  `credit` decimal(12,2) DEFAULT '0.00',
  `runningBalance` decimal(12,2) DEFAULT '0.00',
  `runningBalanceType` varchar(10) DEFAULT '',
  `status` varchar(50) DEFAULT 'Receivable',
  `timestamp` varchar(50) NOT NULL,
  `sourceId` varchar(50) DEFAULT NULL,
  `profitLoss` int DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `party_opening_balances`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `party_opening_balances`;
CREATE TABLE `party_opening_balances` (
  `id` varchar(50) NOT NULL,
  `partyType` varchar(50) NOT NULL,
  `partyId` varchar(50) NOT NULL,
  `partyName` varchar(255) NOT NULL,
  `balanceType` varchar(50) NOT NULL,
  `amount` int NOT NULL,
  `date` varchar(50) NOT NULL,
  `createdAt` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT '',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `trucks`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `trucks`;
CREATE TABLE `trucks` (
  `id` varchar(50) NOT NULL,
  `vehicleNumber` varchar(50) NOT NULL,
  `ownerName` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `mobileNumber` varchar(20) NOT NULL,
  `panCard` varchar(20) NOT NULL,
  `aadharNumber` varchar(50) DEFAULT NULL,
  `accountNumber` varchar(50) DEFAULT NULL,
  `vehicleType` varchar(50) NOT NULL,
  `engineNumber` varchar(100) NOT NULL,
  `chassisNumber` varchar(100) NOT NULL,
  `nationalPermitNumber` varchar(100) DEFAULT NULL,
  `nationalPermitValidUpto` varchar(50) DEFAULT NULL,
  `insuranceNumber` varchar(100) DEFAULT NULL,
  `insuranceValidUpto` varchar(50) DEFAULT NULL,
  `pollutionNumber` varchar(100) DEFAULT NULL,
  `pollutionValidUpto` varchar(50) DEFAULT NULL,
  `taxReceiptNumber` varchar(100) DEFAULT NULL,
  `taxReceiptValidUpto` varchar(50) DEFAULT NULL,
  `fitnessNumber` varchar(100) DEFAULT NULL,
  `fitnessValidUpto` varchar(50) DEFAULT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `createdAt` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `users`
INSERT INTO `users` VALUES
('muj1drmc', 'Trichybranch', 'Trichy@123', 'branch', '2026-10-01T07:13:51.187Z'),
('oom6czas', 'admin', 'jrks123', 'admin', '2026-10-01T07:13:51.187Z');

-- --------------------------------------------------------
-- Table structure for table `voucher_codes`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `voucher_codes`;
CREATE TABLE `voucher_codes` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `expenseAccountName` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `createdAt` varchar(50) DEFAULT '',
  `updatedAt` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT '',
  `updatedBy` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `voucher_codes`
INSERT INTO `voucher_codes` VALUES
('0x5stet9', '12', 'OFFICE MAINTENANCE EXP.', 'OFFICE MAINTENANCE, SWEEPER, WATER, ANY PURCHASE FOR OFFICE USE', 1, '2026-09-29', '', 'System', ''),
('2gqulasg', '8', 'HALTING (DETENTION) EXP.', 'DETENTION AT LOADING OR UNLOADING POINT', 1, '2026-09-29', '', 'System', ''),
('676hnnlk', '25', 'TRAVELLING EXP.', 'BUS, RAIL, AIR TICKET, HOTEL, FOOD AND OTHER TRAVEL EXPENSES', 1, '2026-09-29', '', 'System', ''),
('73vuci9a', '24', 'LOCAL CONVENIENCE EXP.', 'LOCAL BUS, AUTO, TAXI EXPENSES', 1, '2026-09-29', '', 'System', ''),
('7nbtvjy4', '9', 'HAND LOAN EXP.', 'IF TAKEN HAND LOAN FROM BANK, CREDIT CARD OR FINANCER', 1, '2026-09-29', '', 'System', ''),
('88rsfz1x', '23', 'PETROL & BIKE EXP.', 'PETROL, BIKE SERVICE, OR NEW PURCHASE EXPENSES', 1, '2026-09-29', '', 'System', ''),
('8mjrkxqt', '7', 'SELF TRANSFER EXP.', 'SELF ACCOUNT TRANSFER ANY BANK TO ANY BANK', 1, '2026-09-29', '', 'System', ''),
('8tbmt9c4', '30', 'STAFF WELFARE EXP.', 'STAFF MEDICAL, UNIFORM, BONUS AND OTHER WELFARE EXPENSES', 1, '2026-09-29', '', 'System', ''),
('9zkuvshc', '10', 'HAND LOAN RETURN EXP.', 'LOAN RETURN TO BANK OR OTHERS PERSON', 1, '2026-09-29', '', 'System', ''),
('d62alt7e', '19', 'AUDITING FEES EXP.', 'AUDITOR FEES ONLY', 1, '2026-09-29', '', 'System', ''),
('dneyof6r', '27', 'TEA, COFFEE EXP.', 'TEA, SNACKS, LUNCH, DINNER EXPENSES', 1, '2026-09-29', '', 'System', ''),
('fexggtav', '28', 'POOJA EXP.', 'OFFICE DAILY POOJA, AYUDH POOJA, DIWALI POOJA EXPENSES', 1, '2026-09-29', '', 'System', ''),
('gbr5190e', '6', 'CASH WITH DRAWL EXP.', 'CASH WITHDRAWL BY CHEQUE OR ATM OR QR CODE', 1, '2026-09-29', '', 'System', ''),
('gl0i8ch8', '32', 'TRTA SUBSCRIPTION EXP.', 'TRTA SUBSCRIPTION AND OTHER SUBSCRIPTIONS', 1, '2026-09-29', '', 'System', ''),
('gts4x2p9', '4', 'LOADING EXP.', 'VEHICLE LOADING AMOUNT', 1, '2026-09-29', '', 'System', ''),
('gzj6jpl9', '16', 'TELEPHONE & MOBILE EXP.', 'OFFICE TELEPHONE, WIFI BILL, STAFF, MANAGER, OWNER MOBILE RECHARGE', 1, '2026-09-29', '', 'System', ''),
('hqh0ej55', '5', 'SALARY EXP.', 'STAFF, MANAGER, OWNER, PARTNER SALARY', 1, '2026-09-29', '', 'System', ''),
('id1869ru', '26', 'MISCELLANEOUS EXP.', 'OTHER EXPENSES', 1, '2026-09-29', '', 'System', ''),
('j10w5ui8', '31', 'BUSINESS DEVELOPMENT EXP.', 'COMMISSION AND BUSINESS DEVELOPMENT EXPENSES', 1, '2026-09-29', '', 'System', ''),
('jacg7zea', '14', 'HOUSE RENT EXP.', 'STAFF, MANAGER, OWNER, HOUSE RENT ALLOWANCE', 1, '2026-09-29', '', 'System', ''),
('k8wfk2yj', '29', 'XEROX & PRINTING EXP.', 'XEROX, STATIONERY AND PRINTING EXPENSES', 1, '2026-09-29', '', 'System', ''),
('kxtbk2jy', '21', 'UNLOADING EXP.', 'VEHICLE UNLOADING AMOUNT', 1, '2026-09-29', '', 'System', ''),
('ll67chx7', '22', 'POSTAGE & COURIER EXP.', 'POST, SPEED POST, REGISTRY, AND COURIER EXPENSES', 1, '2026-09-29', '', 'System', ''),
('n37i05nc', '20', 'BANK CHARGES EXP.', 'CHEQUE BOOK, STATEMENT, ATM CHARGE, MESSAGE ALERT, RTGS/NEFT DEBIT BY BANK', 1, '2026-09-29', '', 'System', ''),
('om28rfcq', '3', 'RTO FINE EXP.', 'ODC LOAD RTO FINE ON LINE FINE ONLY', 1, '2026-09-29', '', 'System', ''),
('p4qynx5z', '15', 'ELECTRICITY BILL EXP.', 'OFFICE ELECTRICITY, HOUSE ELECTRICITY BILL ONLY', 1, '2026-09-29', '', 'System', ''),
('phhmuufn', '1', 'L H ADVANCE EXP.', 'LORRY HIRE ADVANCE, DIESEL AMOUNT', 1, '2026-09-29', '', 'System', ''),
('tbzreh85', '33', 'DONATION EXP.', 'DONATION FOR FESTIVALS, TEMPLE, GOUSALA, PONGAL VIZHA AND OTHER CHARITABLE PURPOSES', 1, '2026-09-29', '', 'System', ''),
('w6fscx94', '17', 'COMPUTER SERVICE EXP.', 'OFFICE COMPUTERS, LAPTOPS, PRINTERS REPAIR OR NEW PURCHASE', 1, '2026-09-29', '', 'System', ''),
('xewaits4', '13', 'OFFICE RENT EXP.', 'OFFICE RENT ONLY', 1, '2026-09-29', '', 'System', ''),
('z29czk2o', '11', 'INTEREST & EMI EXP.', 'HAND LOAN INTEREST, CREDIT CARD EMI', 1, '2026-09-29', '', 'System', ''),
('zl50jxd8', '18', 'GPS RECHARGE (ROADO) EXP.', 'GPS RECHARGE ONLY', 1, '2026-09-29', '', 'System', ''),
('zy11v3eh', '2', 'L H BALANCE EXP.', 'LORRY HIRE BALANCE', 1, '2026-09-29', '', 'System', '');

-- --------------------------------------------------------
-- Table structure for table `vouchers`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id` varchar(50) NOT NULL,
  `manualVoucherNo` varchar(50) DEFAULT '',
  `voucherNo` varchar(50) NOT NULL,
  `voucherDate` varchar(50) NOT NULL,
  `narration` text,
  `items` text NOT NULL,
  `branch` varchar(100) DEFAULT 'Trichy',
  `paidTo` varchar(255) DEFAULT '',
  `receivedFrom` varchar(255) DEFAULT '',
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
