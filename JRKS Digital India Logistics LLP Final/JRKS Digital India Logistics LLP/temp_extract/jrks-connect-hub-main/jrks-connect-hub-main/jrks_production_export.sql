-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: jrks
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `jrks`
--

/*!40000 DROP DATABASE IF EXISTS `jrks`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `jrks` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `jrks`;

--
-- Table structure for table `arrival_reports`
--

DROP TABLE IF EXISTS `arrival_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`arrival_report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arrival_reports`
--

LOCK TABLES `arrival_reports` WRITE;
/*!40000 ALTER TABLE `arrival_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `arrival_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_txns`
--

DROP TABLE IF EXISTS `bank_txns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_txns`
--

LOCK TABLES `bank_txns` WRITE;
/*!40000 ALTER TABLE `bank_txns` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_txns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banks`
--

DROP TABLE IF EXISTS `banks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banks`
--

LOCK TABLES `banks` WRITE;
/*!40000 ALTER TABLE `banks` DISABLE KEYS */;
INSERT INTO `banks` VALUES ('jptvf90t','Mock Account Holder','12345678901234','Current','Mock Bank','Mock Branch','MOCK0001234','9123456789',1,'2026-07-23',NULL,NULL,'');
/*!40000 ALTER TABLE `banks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bills`
--

DROP TABLE IF EXISTS `bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `billNo` (`billNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bills`
--

LOCK TABLES `bills` WRITE;
/*!40000 ALTER TABLE `bills` DISABLE KEYS */;
/*!40000 ALTER TABLE `bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brokers`
--

DROP TABLE IF EXISTS `brokers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brokers`
--

LOCK TABLES `brokers` WRITE;
/*!40000 ALTER TABLE `brokers` DISABLE KEYS */;
INSERT INTO `brokers` VALUES ('27gol3oj','Mock Broker Agency','200 Mock Avenue, Mumbai','Mrs. Mock Broker','9876543211','9876543211','MOCKB5678L','123456789012','27MOCKB5678L1Z9','98765432109876','Mock Broker Bank','Mock Broker Branch','MBBK0005678',1,'2026-07-23',NULL,NULL,'');
/*!40000 ALTER TABLE `brokers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_txns`
--

DROP TABLE IF EXISTS `cash_txns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_txns` (
  `id` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `receipt` int DEFAULT '0',
  `payment` int DEFAULT '0',
  `lastEditedBy` varchar(255) DEFAULT NULL,
  `lastEditedAt` varchar(50) DEFAULT NULL,
  `manualVoucherNo` varchar(50) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_txns`
--

LOCK TABLES `cash_txns` WRITE;
/*!40000 ALTER TABLE `cash_txns` DISABLE KEYS */;
/*!40000 ALTER TABLE `cash_txns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `challans`
--

DROP TABLE IF EXISTS `challans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `challanNo` (`challanNo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challans`
--

LOCK TABLES `challans` WRITE;
/*!40000 ALTER TABLE `challans` DISABLE KEYS */;
INSERT INTO `challans` VALUES ('nv8psf93','002','2026-07-24','Trichy','Chennai','TN 99 XX 9999','[{\"cnNo\":\"002\",\"noOfPackages\":15,\"particulars\":\"test\",\"weight\":20,\"destination\":\"Chennai\"}]','MOCKT1234K','Mock Truck Owner','547896321456','02626262959','9876543210','No','pk','9345527655','10','10','10','MOCKB5678L','Mock Broker Agency','123456789012','98765432109876','9876543211',1000,1000,1000,1000,20,1000,0,-220,'trichy','Mock Broker Agency','In Transit','2026-07-24','2026-07-24',1,200,'1%',NULL,NULL,1000,'002',''),('ufztyv82','001','2026-07-23','Trichy','madurai','TN 99 XX 9999','[{\"cnNo\":\"001\",\"noOfPackages\":15,\"particulars\":\"15\",\"weight\":15,\"destination\":\"madurai\"}]','MOCKT1234K','','','','9876543210','No','','','','','','MOCKB5678L','Mock Broker Agency','123456789012','98765432109876','9876543211',1000,0,0,0,0,0,0,1000,'','Mock Broker Agency','In Transit','2026-07-23','2026-07-23',1,0,'0%','Staff User','2026-07-23T11:40:24.979Z',0,'','');
/*!40000 ALTER TABLE `challans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES ('0na8mqff','Auto Company HJOC Ltd.','272 Industrial Area, City 15','Manager 15','9876060527','36ZFUKNNHDSNL24','2452742752','Consignor',1,'2026-07-23','Staff User','2026-07-23T12:20:14.673Z',''),('276qjln3','Auto Company NKOV Ltd.','949 Industrial Area, City 1','Manager 1','9846973920','544I2CIPRHFKH6D','','Consignor',1,'2026-07-23',NULL,NULL,''),('48229eyd','Auto Company LPDK Ltd.','94 Industrial Area, City 20','Manager 20','9865983526','68O71AP8RC1BXEC','','Consignee',1,'2026-07-23',NULL,NULL,''),('6rzznv2l','Auto Company LV6Z Ltd.','52 Industrial Area, City 13','Manager 13','9865260029','7134UMCU0EKVHPO','','Consignor',1,'2026-07-23',NULL,NULL,''),('7lyvcuzr','Auto Company FQWA Ltd.','874 Industrial Area, City 2','Manager 2','9815774783','39RDG8SUTYVOF0V','','Consignee',1,'2026-07-23',NULL,NULL,''),('7qunkrco','Auto Company 8RSS Ltd.','122 Industrial Area, City 5','Manager 5','9883224645','1774KRZKLYO1I4K','','Consignor',1,'2026-07-23',NULL,NULL,''),('8n7c6ffi','Auto Company 1D45 Ltd.','486 Industrial Area, City 17','Manager 17','9897862819','35VK0TXJG2X6PM7','','Consignor',1,'2026-07-23',NULL,NULL,''),('9xavul5b','Auto Company ONZ1 Ltd.','190 Industrial Area, City 4','Manager 4','9867201749','7840ACNU9PGGPQW','','Consignee',1,'2026-07-23',NULL,NULL,''),('b9ovztec','Auto Company 47IY Ltd.','286 Industrial Area, City 7','Manager 7','9889582287','52F7FJ9DSV9QD7H','','Consignor',1,'2026-07-23',NULL,NULL,''),('bruuvtg1','Auto Company 1X0G Ltd.','223 Industrial Area, City 16','Manager 16','9860545784','83U3MZIMJ9TNFJF','','Consignee',1,'2026-07-23',NULL,NULL,''),('btgg9ujt','Auto Company US3V Ltd.','316 Industrial Area, City 19','Manager 19','9811403558','74HO8S5XXU0F8JR','','Consignor',1,'2026-07-23',NULL,NULL,''),('d6i5ap4f','Auto Company 9JLT Ltd.','981 Industrial Area, City 8','Manager 8','9809416465','5507IXGS3PSBJ30','','Consignee',1,'2026-07-23',NULL,NULL,''),('gp19hy8l','Auto Company IIX9 Ltd.','147 Industrial Area, City 10','Manager 10','9822751055','32XEHK19X2WRN5C','','Consignee',1,'2026-07-23',NULL,NULL,''),('ipvuaica','Auto Company U6BB Ltd.','593 Industrial Area, City 12','Manager 12','9854355299','51KX52PIQDID2X2','','Consignee',1,'2026-07-23',NULL,NULL,''),('jsn7393v','Auto Company GB2W Ltd.','139 Industrial Area, City 6','Manager 6','9883075432','28HB1NV3CIO4PDM','','Consignee',1,'2026-07-23',NULL,NULL,''),('kz17rumn','Auto Company FPVE Ltd.','536 Industrial Area, City 9','Manager 9','9828194807','91XD788CPQ7WCTF','','Consignor',1,'2026-07-23',NULL,NULL,''),('o0g574tj','Mock Company Ltd.','100 Mock Street, Bangalore','Mr. Mock','9988776655','29MOCKC1234D1Z5','','Consignee',1,'2026-07-23',NULL,NULL,''),('o1kmjpp1','Auto Company F7O9 Ltd.','176 Industrial Area, City 3','Manager 3','9858923294','17ZSG5D0AMFV5EZ','','Consignor',1,'2026-07-23',NULL,NULL,''),('p9miljgs','Auto Company WR1F Ltd.','701 Industrial Area, City 18','Manager 18','9831316098','197VHJKWEHGS3RS','','Consignee',1,'2026-07-23',NULL,NULL,''),('pfnh3p9j','Auto Company KY5L Ltd.','437 Industrial Area, City 11','Manager 11','9861278446','64SE5VHKBGXHK80','','Consignor',1,'2026-07-23',NULL,NULL,''),('t13zkbkd','Auto Company 0ZMQ Ltd.','812 Industrial Area, City 14','Manager 14','9842393586','386MI93HH9Y870I','','Consignee',1,'2026-07-23',NULL,NULL,'');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consignment_notes`
--

DROP TABLE IF EXISTS `consignment_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consignment_notes`
--

LOCK TABLES `consignment_notes` WRITE;
/*!40000 ALTER TABLE `consignment_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `consignment_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `drivers`
--

DROP TABLE IF EXISTS `drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `drivers`
--

LOCK TABLES `drivers` WRITE;
/*!40000 ALTER TABLE `drivers` DISABLE KEYS */;
INSERT INTO `drivers` VALUES ('9vdr289k','Mock Driver','9988776611','2026-07-21','2026-07-21',0,NULL,NULL,''),('akjruqwe','Mock Driver 2','9988776622','2026-07-23','2026-07-23',0,NULL,NULL,'');
/*!40000 ALTER TABLE `drivers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `money_receipts`
--

DROP TABLE IF EXISTS `money_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `money_receipts`
--

LOCK TABLES `money_receipts` WRITE;
/*!40000 ALTER TABLE `money_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `money_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trucks`
--

DROP TABLE IF EXISTS `trucks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trucks`
--

LOCK TABLES `trucks` WRITE;
/*!40000 ALTER TABLE `trucks` DISABLE KEYS */;
INSERT INTO `trucks` VALUES ('4di00fgv','TN 99 XX 9999','Mock Truck Owner','Mock Address, Chennai','9876543210','MOCKT1234K','','','Lorry','ENG9999XX','CHS9999XX','NP-MOCK-1','2027-12-31','INS-MOCK-1','2027-12-31','PUC-MOCK-1','2027-12-31','TAX-MOCK-1','2027-12-31','FIT-MOCK-1','2027-12-31','2026-07-23',NULL,NULL,'');
/*!40000 ALTER TABLE `trucks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'jrks'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-24 17:55:27
