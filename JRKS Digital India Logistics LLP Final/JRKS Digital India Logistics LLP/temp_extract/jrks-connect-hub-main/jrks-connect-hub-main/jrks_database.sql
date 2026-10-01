-- JRKS Database Schema Dump

SET FOREIGN_KEY_CHECKS=0;

-- Table structure for table `arrival_reports`
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
  `lr_no` varchar(100) DEFAULT NULL,
  `arrival_date` varchar(50) DEFAULT NULL,
  `delivery_status` varchar(100) DEFAULT NULL,
  `received_by` varchar(255) DEFAULT NULL,
  `receiver_mobile` varchar(20) DEFAULT NULL,
  `halting_days` varchar(50) DEFAULT NULL,
  `halting_amount_per_day` varchar(50) DEFAULT NULL,
  `total_detention_amount` varchar(50) DEFAULT NULL,
  `balance_amount` varchar(100) DEFAULT NULL,
  `uploaded_pdf` longtext,
  `uploaded_pdf_name` varchar(255) DEFAULT NULL,
  `penalty_type` varchar(100) DEFAULT '',
  `penalty_amount` varchar(50) DEFAULT '',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `net_amount` varchar(50) DEFAULT '',
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`arrival_report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `bank_txns`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `banks`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `bills`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `billNo` (`billNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `bookings`
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

-- Table structure for table `brokers`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `cash_txns`
DROP TABLE IF EXISTS `cash_txns`;
CREATE TABLE `cash_txns` (
  `id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `receipt` int DEFAULT '0',
  `payment` int DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `challans`
DROP TABLE IF EXISTS `challans`;
CREATE TABLE `challans` (
  `id` varchar(50) NOT NULL,
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
  `freight` int NOT NULL DEFAULT '0',
  `loadingMamul` int NOT NULL DEFAULT '0',
  `rtoFine` int NOT NULL DEFAULT '0',
  `extraCharges` int NOT NULL DEFAULT '0',
  `tds` int NOT NULL DEFAULT '0',
  `lessAdvance` int NOT NULL DEFAULT '0',
  `commission` int NOT NULL DEFAULT '0',
  `balanceAmount` int NOT NULL DEFAULT '0',
  `payableAt` varchar(255) DEFAULT NULL,
  `brokerNameSec5` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'In Transit',
  `createdAt` varchar(50) DEFAULT NULL,
  `updatedAt` varchar(50) DEFAULT NULL,
  `archived` tinyint(1) DEFAULT '0',
  `comlyCom` int NOT NULL DEFAULT '0',
  `tdsPercentage` varchar(10) DEFAULT '0%',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `lorryHire` int NOT NULL DEFAULT '0',
  `manualChallanNo` varchar(50) DEFAULT '',
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `challanNo` (`challanNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `companies`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `consignment_notes`
DROP TABLE IF EXISTS `consignment_notes`;
CREATE TABLE `consignment_notes` (
  `id` varchar(50) NOT NULL,
  `branch` varchar(100) NOT NULL,
  `consignmentNoteNo` varchar(100) NOT NULL,
  `lrNumber` varchar(100) NOT NULL,
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
  `items` text NOT NULL,
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `manualVoucherNo` varchar(50) DEFAULT '',
  `vehicleLength` varchar(50) DEFAULT NULL,
  `vehicleWidth` varchar(50) DEFAULT NULL,
  `vehicleHeight` varchar(50) DEFAULT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `drivers`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `money_receipts`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `mrNo` (`mrNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `trucks`
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
  `manualVoucherNo` varchar(50) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `vouchers`
DROP TABLE IF EXISTS `vouchers`;
CREATE TABLE `vouchers` (
  `id` varchar(50) NOT NULL,
  `voucherNo` varchar(50) NOT NULL,
  `voucherDate` varchar(50) NOT NULL,
  `narration` text,
  `items` text NOT NULL,
  `branch` varchar(100) DEFAULT 'Trichy',
  `createdAt` varchar(50) DEFAULT NULL,
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `manualVoucherNo` varchar(50) DEFAULT '',
  `paidTo` varchar(255) DEFAULT '',
  `receivedFrom` varchar(255) DEFAULT '',
  `createdBy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
