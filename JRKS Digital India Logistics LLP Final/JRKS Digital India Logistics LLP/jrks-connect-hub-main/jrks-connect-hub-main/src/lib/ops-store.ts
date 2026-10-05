import { create } from "zustand";
import { toast } from "sonner";
import { getIsAdmin } from "./auth";

export type BookingStatus =
  | "Draft"
  | "Booked"
  | "In Transit"
  | "Reached Destination"
  | "Unloaded"
  | "Completed"
  | "Cancelled"
  | "Delivered"
  | "Closed";

export const BOOKING_STATUSES: BookingStatus[] = [
  "Draft",
  "Booked",
  "In Transit",
  "Reached Destination",
  "Unloaded",
  "Completed",
  "Cancelled",
];

export interface ChallanItem {
  cnNo: string;
  noOfPackages: number;
  particulars: string;
  weight: number;
  destination: string;
}

export interface Challan {
  id: string;
  challanNo: string;
  challanDate: string;
  fromLocation: string;
  toLocation: string;
  vehicleNumber: string;
  items: ChallanItem[];
  ownerPan?: string;
  ownerName?: string;
  ownerAadhar?: string;
  ownerAccount?: string;
  ownerMobile?: string;
  declarationAttached?: "Yes" | "No";
  driverName?: string;
  driverMobile?: string;
  dimLength?: string;
  dimWidth?: string;
  dimHeight?: string;
  brokerPan?: string;
  brokerName?: string;
  brokerAadhar?: string;
  brokerAccount?: string;
  brokerMobile?: string;
  freight: number;
  loadingMamul: number;
  comlyCom?: number;
  rtoFine: number;
  extraCharges: number;
  tds: number;
  tdsPercentage?: string;
  lessAdvance: number;
  commission: number;
  balanceAmount: number;
  payableAt?: string;
  brokerNameSec5?: string;
  status: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  archived?: number;
  deliveryToName?: string;
  deliveryToPan?: string;
  deliveryToMobile?: string;
  deliveryCommission?: number;
  halting?: number;
  totalAmount?: number;
  narration?: string;
  manualChallanNo?: string;
  lorryHire?: number;
  isLocked?: number | boolean;
}

export interface ConsignmentNoteItem {
  noOfPackages: number;
  methodOfPacking: string;
  description: string;
  netWeight: number;
  grossWeight: number;
  invoiceValue: number;
  invoiceNoDcNo: string;
  gatePassNo: string;
  remarks: string;
  freightAmount?: number;
  bookingAmount?: number;
}

export interface ConsignmentNote {
  id: string;
  branch: string;
  consignmentNoteNo: string;
  lrNumber: string;
  sac?: string;
  lrDate: string;
  consignorName: string;
  consignorAddress: string;
  consignorGst: string;
  consignorPan?: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneeGst: string;
  consigneePan?: string;
  insuranceType: "Insured" | "Owner Risk" | "Carrier Risk";
  fromLocation: string;
  toLocation: string;
  vehicleNumber: string;
  demandNo: string;
  shipmentNo: string;
  custNo: string;
  schNo: string;
  freightType: "To Pay" | "Paid" | "To be billed";
  demurrageDays: number;
  demurrageRate: number;
  chargeBasis: string;
  demurrageRemarks: string;
  items: ConsignmentNoteItem[];
  createdAt: string;
  created_at?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  updatedAt?: string;
  billNo?: string;
  driverName?: string;
  driverMobile?: string;
  vehicleLength?: string;
  vehicleWidth?: string;
  vehicleHeight?: string;
  isLocked?: number | boolean;
}

export interface ArrivalReport {
  arrival_report_id: string;
  bill_no: string;
  mr_no: string;
  report_date: string;
  delivery_date: string;
  ack_date?: string;
  remarks?: string;
  payment_mode?: string;
  payment_reference?: string;
  bill_reference_no?: string;
  bill_reference_date?: string;
  mr_reference_no?: string;
  mr_reference_date?: string;
  branch_incharge?: string;
  signature_name?: string;
  created_at: string;
  createdAt?: string;
  updated_at?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  arrival_report_no?: string;
  challan_no?: string;
  lr_no?: string;
  arrival_date?: string;
  delivery_status?: string;
  received_by?: string;
  receiver_mobile?: string;
  halting_days?: string;
  halting_amount_per_day?: string;
  total_detention_amount?: string;
  balance_amount?: string;
  uploaded_pdf?: string;
  uploaded_pdf_name?: string;
  condition_of_goods?: string;
  further_action?: string;
  penalty_type?: string;
  penalty_amount?: string;
  door_delivery_charges?: number | string;
  demurrage?: number | string;
  unloading_charges?: number | string;
  local_cartage?: number | string;
  total_charges?: number | string;
  additional_remarks?: string;
  net_amount?: number | string;
}

export interface Booking {
  id: string;
  bookingNo: string;
  bookingDate: string; // ISO date
  vehicleNumber: string;
  truckOwner: string;
  brokerName: string;
  companyName: string;
  loadingLocation: string;
  unloadingLocation: string;
  materialDescription: string;
  weight: string; // free text e.g. "18 MT"
  hireAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  commissionAmount: number;
  commissionPaid: boolean;
  billAmount: number;
  receivedAmount: number;
  dueDate: string; // ISO date
  remarks: string;
  status: BookingStatus;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  archived?: number;

  // New visual fields for Booking Entry 2026-2027
  serialNo?: string;
  lrNo?: string;
  lrDate?: string;
  consignorName?: string;
  consigneeName?: string;
  truckType?: string;
  loadType?: string;
  invoiceNo?: string;
  netWeight?: string;
  chargedWeight?: string;
  packageDetails?: string;
  billNo?: string;
  challanNo?: string;
  challanDate?: string;
  distance?: string;
  pmtType?: string;
  odcStatus?: string;
  mamulCharges?: number;
  profit?: number;
  margin?: string;
  panNumber?: string;
  ewayBillNo?: string;
  ewayBillValidity?: string;
  reportingDate?: string;
  unloadingDate?: string;
  podReceivedDate?: string;
  rtoFine?: number;
  paidOn?: string;
  balancePaidOn?: string;
  billPaymentReceivedOn?: string;

  // Consignment note match fields
  branch?: string;
  lrNumber?: string;
  consignorAddress?: string;
  consignorGst?: string;
  consigneeAddress?: string;
  consigneeGst?: string;
  insuranceType?: "Insured" | "Owner Risk" | "Carrier Risk";
  fromLocation?: string;
  toLocation?: string;
  demandNo?: string;
  shipmentNo?: string;
  custNo?: string;
  schNo?: string;
  freightType?: "To Pay" | "Paid" | "To be billed";
  demurrageDays?: number;
  demurrageRate?: number;
  chargeBasis?: string;
  demurrageRemarks?: string;
  items?: ConsignmentNoteItem[];
  driverName?: string;
  driverMobile?: string;
  totalPackages?: number;
  totalWeight?: number;
  totalAmount?: number;
  advance?: number;
  balance?: number;
  deliveryType?: string;
  gstPaidBy?: string;
  narration?: string;
}

export interface VoucherItem {
  sNo: number;
  codeNo: string;
  expenseAccountName: string;
  description: string;
  refNo: string;
  chequeDkNo: string;
  modeOfPayment: string;
  payment: number;
  receipt?: number;
  creditDebit: string;
}

export interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: string;
  narration: string;
  items: VoucherItem[];
  branch?: string;
  createdAt?: string;
  book?: "CASH" | "BANK";
  manualVoucherNo?: string;
  paidTo?: string;
  receivedFrom?: string;
}

export interface BillRow {
  id: string;
  sNo: string;
  date: string;
  from: string;
  to: string;
  lrNo: string;
  goods: string;
  partyInvoiceNo: string;
  arvDate: string;
  unldDate: string;
  noOfPkg: string;
  weight: string;
  rate: string;
  haltingAmount?: string;
  rtoFine?: string;
  ratePer?: string;
  amount: string;
}

export interface Bill {
  id: string;
  billNo: string;
  lrNumber?: string;
  sac?: string;
  date: string;
  submittedDate?: string;
  dueDate?: string;
  companyName: string;
  companyAddress?: string;
  companyMobile?: string;
  companyWhatsApp?: string;
  companyOffice?: string;
  companyEmail?: string;
  companyGst?: string;
  companyPan?: string;
  customerName: string;
  customerAddress?: string;
  customerGst?: string;
  customerPan?: string;
  fromLocation?: string;
  toLocation?: string;
  bankName?: string;
  bankBranch?: string;
  accountNo?: string;
  ifscCode?: string;
  accountHolder?: string;
  terms?: string;
  rupeesInWords?: string;
  subTotalOverride?: string;
  gstOverride?: string;
  grandTotalOverride?: string;
  gstPercentage?: string;
  items: BillRow[];
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
}

export interface MoneyReceiptRow {
  lrNo?: string;
  billNo: string;
  billDate: string;
  billAmount: string;
  receivedAmount: string;
  tdsPercentage: string;
  tdsAmount: string;
  claimAmount?: string;
  netAmount?: string;
}

export interface MoneyReceipt {
  id: string;
  mrNo: string;
  lrNo?: string;
  branch: string;
  receiptDate: string;
  partyName: string;
  paymentFor: string;
  amountReceived: string;
  amountInWords: string;
  narration: string;
  items: MoneyReceiptRow[];
  status?: string;
  createdAt: string;
  updatedAt?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  createdBy?: string;
  created_at?: string;
}

export interface BankTxn {
  id: string;
  date: string;
  bankName: string;
  description: string;
  credit: number;
  debit: number;
}

export interface CashTxn {
  id: string;
  date: string;
  description: string;
  receipt: number;
  payment: number;
}

export interface Advance {
  id: string;
  voucherNo: string;
  date: string;
  vehicleId: string;
  driverId: string;
  brokerId: string;
  advanceAmount: number;
  paymentMode: string;
  referenceNo: string;
  remarks: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
  vehicleNumber: string;
  driverName: string;
  driverMobile: string;
  brokerName: string;
}

export interface Outstanding {
  id: string;
  customerId: string;
  billId: string;
  billDate: string;
  dueDate: string;
  creditDays: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  companyName: string;
  bookingNo: string;
}

export interface Commission {
  id: string;
  brokerId: string;
  vehicleId: string;
  bookingId: string;
  freightAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paidStatus: string;
  settlementDate?: string;
  createdAt: string;
  updatedAt: string;
  brokerName: string;
  vehicleNumber: string;
  bookingNo: string;
  bookingDate: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const dayISO = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

let bkSeq = 0;
const nextNo = () => {
  bkSeq += 1;
  return `JRKS${String(bkSeq).padStart(3, "0")}`;
};

/** Payment status used across Outstanding / Advance / Commission registers. */
export type PayState = "cleared" | "partial" | "pending";

export function outstandingState(b: Booking): PayState {
  const out = b.billAmount - b.receivedAmount;
  if (out <= 0 && b.billAmount > 0) return "cleared";
  if (b.receivedAmount > 0) return "partial";
  return "pending";
}

const seedBookings: Booking[] = [
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-1),
    vehicleNumber: "TN 38 BC 4521",
    truckOwner: "Rajesh Kumar",
    brokerName: "Sri Balaji Transport Brokers",
    companyName: "Apollo Steel Industries Ltd.",
    loadingLocation: "Coimbatore",
    unloadingLocation: "Chennai",
    materialDescription: "TMT Steel Bars",
    weight: "21 MT",
    hireAmount: 48000,
    advanceAmount: 30000,
    balanceAmount: 18000,
    commissionAmount: 2400,
    commissionPaid: false,
    billAmount: 52000,
    receivedAmount: 0,
    dueDate: dayISO(14),
    remarks: "Priority delivery",
    status: "In Transit",
    createdAt: dayISO(-1),
  },
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-3),
    vehicleNumber: "KA 05 MN 8890",
    truckOwner: "Suresh Transport Co.",
    brokerName: "National Freight Agency",
    companyName: "Sundaram Cements Pvt. Ltd.",
    loadingLocation: "Bengaluru",
    unloadingLocation: "Salem",
    materialDescription: "Cement Bags",
    weight: "25 MT",
    hireAmount: 38000,
    advanceAmount: 20000,
    balanceAmount: 18000,
    commissionAmount: 1900,
    commissionPaid: true,
    billAmount: 41000,
    receivedAmount: 41000,
    dueDate: dayISO(-2),
    remarks: "",
    status: "Delivered",
    createdAt: dayISO(-3),
  },
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-5),
    vehicleNumber: "MH 12 AB 1209",
    truckOwner: "Pawan Singh",
    brokerName: "Sri Balaji Transport Brokers",
    companyName: "GreenField Agro Exports",
    loadingLocation: "Pune",
    unloadingLocation: "Madurai",
    materialDescription: "Packaged Foods",
    weight: "12 MT",
    hireAmount: 56000,
    advanceAmount: 25000,
    balanceAmount: 31000,
    commissionAmount: 2800,
    commissionPaid: false,
    billAmount: 60000,
    receivedAmount: 30000,
    dueDate: dayISO(9),
    remarks: "Partial collection done",
    status: "Delivered",
    createdAt: dayISO(-5),
  },
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-7),
    vehicleNumber: "GJ 01 KL 7765",
    truckOwner: "Mehta Carriers",
    brokerName: "National Freight Agency",
    companyName: "Apollo Steel Industries Ltd.",
    loadingLocation: "Ahmedabad",
    unloadingLocation: "Coimbatore",
    materialDescription: "Steel Coils",
    weight: "28 MT",
    hireAmount: 72000,
    advanceAmount: 40000,
    balanceAmount: 32000,
    commissionAmount: 3600,
    commissionPaid: true,
    billAmount: 78000,
    receivedAmount: 78000,
    dueDate: dayISO(-1),
    remarks: "",
    status: "Closed",
    createdAt: dayISO(-7),
  },
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-9),
    vehicleNumber: "TN 38 BC 4521",
    truckOwner: "Rajesh Kumar",
    brokerName: "Sri Balaji Transport Brokers",
    companyName: "Sundaram Cements Pvt. Ltd.",
    loadingLocation: "Coimbatore",
    unloadingLocation: "Bengaluru",
    materialDescription: "Cement Bags",
    weight: "24 MT",
    hireAmount: 34000,
    advanceAmount: 0,
    balanceAmount: 34000,
    commissionAmount: 1700,
    commissionPaid: false,
    billAmount: 37000,
    receivedAmount: 0,
    dueDate: dayISO(20),
    remarks: "Booked, awaiting loading",
    status: "Booked",
    createdAt: dayISO(-9),
  },
  {
    id: uid(),
    bookingNo: nextNo(),
    bookingDate: dayISO(-12),
    vehicleNumber: "KA 05 MN 8890",
    truckOwner: "Suresh Transport Co.",
    brokerName: "National Freight Agency",
    companyName: "GreenField Agro Exports",
    loadingLocation: "Bengaluru",
    unloadingLocation: "Chennai",
    materialDescription: "Agro Produce",
    weight: "16 MT",
    hireAmount: 42000,
    advanceAmount: 20000,
    balanceAmount: 22000,
    commissionAmount: 2100,
    commissionPaid: false,
    billAmount: 45000,
    receivedAmount: 20000,
    dueDate: dayISO(5),
    remarks: "",
    status: "Delivered",
    createdAt: dayISO(-12),
  },
];

const seedBank: BankTxn[] = [
  {
    id: uid(),
    date: dayISO(-7),
    bankName: "HDFC Bank",
    description: "Opening transfer",
    credit: 250000,
    debit: 0,
  },
  {
    id: uid(),
    date: dayISO(-6),
    bankName: "HDFC Bank",
    description: "Advance paid — TN 38 BC 4521",
    credit: 0,
    debit: 30000,
  },
  {
    id: uid(),
    date: dayISO(-4),
    bankName: "HDFC Bank",
    description: "Collection — Apollo Steel",
    credit: 78000,
    debit: 0,
  },
  {
    id: uid(),
    date: dayISO(-3),
    bankName: "ICICI Bank",
    description: "Hire balance paid — Mehta Carriers",
    credit: 0,
    debit: 32000,
  },
  {
    id: uid(),
    date: dayISO(-2),
    bankName: "HDFC Bank",
    description: "Collection — Sundaram Cements",
    credit: 41000,
    debit: 0,
  },
  {
    id: uid(),
    date: dayISO(-1),
    bankName: "HDFC Bank",
    description: "Commission paid — National Freight",
    credit: 0,
    debit: 1900,
  },
];

const seedCash: CashTxn[] = [
  { id: uid(), date: dayISO(-5), description: "Opening balance", receipt: 50000, payment: 0 },
  {
    id: uid(),
    date: dayISO(-4),
    description: "Diesel & toll — KA 05 MN 8890",
    receipt: 0,
    payment: 8500,
  },
  {
    id: uid(),
    date: dayISO(-3),
    description: "Cash collection — GreenField",
    receipt: 30000,
    payment: 0,
  },
  { id: uid(), date: dayISO(-2), description: "Driver bata", receipt: 0, payment: 4000 },
  { id: uid(), date: dayISO(-1), description: "Office expenses", receipt: 0, payment: 2200 },
];

const API_BASE = "/api";

export interface VoucherCode {
  id: string;
  code: string;
  expenseAccountName: string;
  description: string;
  active: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface OutstandingSummary {
  id: string;
  partyName: string;
  accountType: "Company" | "Lorry Vendor";
  mobileNumber: string;
  openingBalance: number;
  openingType: "Debit" | "Credit";
  totalReceivable: number;
  totalPayable: number;
  totalReceived: number;
  totalPaid: number;
  outstandingBalance: number;
  status: "Receivable" | "Payable" | "Settled";
  lastTransactionDate: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: string;
  refNo: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  runningBalanceType: "Dr" | "Cr" | "";
  timestamp: string;
  partyId?: string;
  partyName?: string;
  partyType?: string;
  status?: string;
}

interface OpsState {
  voucherCodes: VoucherCode[];
  bookings: Booking[];
  bankTxns: BankTxn[];
  cashTxns: CashTxn[];
  cashOpening: number;
  loading: boolean;
  consignmentNotes: ConsignmentNote[];
  challans: Challan[];
  arrivalReports: ArrivalReport[];
  advances: Advance[];
  outstandings: Outstanding[];
  commissions: Commission[];
  vouchers: Voucher[];
  outstandingSummaries: OutstandingSummary[];
  ledgers: Record<string, LedgerEntry[]>;
  globalLedger: LedgerEntry[];
  loadData: () => Promise<void>;
  addBooking: (b: Omit<Booking, "id" | "createdAt" | "bookingNo">) => Promise<string>;
  updateBooking: (id: string, b: Omit<Booking, "id" | "createdAt" | "bookingNo">) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  nextBookingNo: () => string;
  addConsignmentNote: (cn: Omit<ConsignmentNote, "id" | "createdAt">) => Promise<boolean>;
  updateConsignmentNote: (
    id: string,
    cn: Omit<ConsignmentNote, "id" | "createdAt">,
  ) => Promise<boolean>;
  deleteConsignmentNote: (id: string) => Promise<void>;
  addChallan: (c: Omit<Challan, "id" | "createdAt">) => Promise<string>;
  updateChallan: (
    id: string,
    c: Omit<Challan, "id" | "createdAt">,
  ) => Promise<boolean>;
  deleteChallan: (id: string) => Promise<void>;
  nextChallanNo: () => string;
  addArrivalReport: (
    ar: Omit<ArrivalReport, "arrival_report_id" | "created_at" | "updated_at">,
  ) => Promise<boolean>;
  updateArrivalReport: (
    id: string,
    ar: Omit<ArrivalReport, "arrival_report_id" | "created_at" | "updated_at">,
  ) => Promise<boolean>;
  deleteArrivalReport: (id: string) => Promise<void>;
  addVoucher: (v: Omit<Voucher, "id" | "createdAt">) => Promise<string>;
  updateVoucher: (id: string, v: Omit<Voucher, "id" | "createdAt">) => Promise<boolean>;
  deleteVoucher: (id: string) => Promise<void>;
  nextVoucherNo: (book?: string) => string;
  nextArrivalReportNo: () => string;
  bills: Bill[];
  addBill: (bill: Partial<Bill>) => Promise<boolean>;
  updateBill: (id: string, bill: Partial<Bill>) => Promise<boolean>;
  deleteBill: (id: string) => Promise<void>;
  nextBillNo: () => string;
  moneyReceipts: MoneyReceipt[];
  addMoneyReceipt: (mr: Partial<MoneyReceipt>) => Promise<boolean>;
  updateMoneyReceipt: (id: string, mr: Partial<MoneyReceipt>) => Promise<boolean>;
  deleteMoneyReceipt: (id: string) => Promise<void>;
  nextMoneyReceiptNo: () => string;
  loadVoucherCodes: () => Promise<void>;
  addVoucherCode: (vc: Omit<VoucherCode, "id" | "createdAt">) => Promise<boolean>;
  updateVoucherCode: (id: string, vc: Omit<VoucherCode, "id" | "createdAt">) => Promise<boolean>;
  deleteVoucherCode: (id: string) => Promise<boolean>;
  loadOutstandingSummaries: () => Promise<void>;
  loadLedger: (partyType: string, partyId: string) => Promise<void>;
  loadGlobalLedger: (partyType: string) => Promise<void>;
  saveOpeningBalance: (payload: any) => Promise<boolean>;
  saveManualAdjustment: (payload: any) => Promise<boolean>;
}

export const useOpsStore = create<OpsState>((set, get) => ({
  bookings: [],
  bankTxns: [],
  cashTxns: [],
  consignmentNotes: [],
  challans: [],
  arrivalReports: [],
  advances: [],
  outstandings: [],
  commissions: [],
  vouchers: [],
  bills: [],
  moneyReceipts: [],
  voucherCodes: [],
  cashOpening: 50000,
  loading: false,
  outstandingSummaries: [],
  ledgers: {},
  globalLedger: [],

  loadData: async () => {
    set({ loading: true });
    try {
      const [bookingsRes, bankRes, cashRes, cnRes, challanRes, arRes, vouchersRes, billsRes, mrRes, vcRes] = await Promise.all([
        fetch(`${API_BASE}/bookings`),
        fetch(`${API_BASE}/bank-txns`),
        fetch(`${API_BASE}/cash-txns`),
        fetch(`${API_BASE}/consignment-notes`),
        fetch(`${API_BASE}/challans`),
        fetch(`${API_BASE}/arrival-reports`),
        fetch(`${API_BASE}/vouchers`),
        fetch(`${API_BASE}/bills`),
        fetch(`${API_BASE}/money-receipts`),
        fetch(`${API_BASE}/voucher-codes`),
      ]);
      const bookings = await bookingsRes.json();
      const bankTxns = await bankRes.json();
      const cashTxns = await cashRes.json();
      const rawCn = await cnRes.json();
      const rawChallans = await challanRes.json();
      const rawArrivals = await arRes.json();
      const rawVouchers = await vouchersRes.json();
      const rawBills = await billsRes.json();
      const rawMoneyReceipts = await mrRes.json();
      const voucherCodes = await vcRes.json();

      const consignmentNotes = Array.isArray(rawCn)
        ? rawCn.map((cn: any) => ({
            ...cn,
            items: typeof cn.items === "string" ? JSON.parse(cn.items || "[]") : Array.isArray(cn.items) ? cn.items : [],
          }))
        : [];

      const challans = Array.isArray(rawChallans)
        ? rawChallans.map((c: any) => ({
            ...c,
            items: typeof c.items === "string" ? JSON.parse(c.items || "[]") : Array.isArray(c.items) ? c.items : [],
          }))
        : [];

      const vouchers = Array.isArray(rawVouchers)
        ? rawVouchers.map((v: any) => ({
            ...v,
            items: typeof v.items === "string" ? JSON.parse(v.items || "[]") : Array.isArray(v.items) ? v.items : [],
          }))
        : [];

      const bills = Array.isArray(rawBills)
        ? rawBills.map((b: any) => ({
            ...b,
            items: typeof b.items === "string" ? JSON.parse(b.items || "[]") : Array.isArray(b.items) ? b.items : [],
          }))
        : [];

      const arrivalReports = Array.isArray(rawArrivals) ? rawArrivals : [];
      const moneyReceipts = Array.isArray(rawMoneyReceipts) ? rawMoneyReceipts : [];

      set({
        bookings,
        bankTxns,
        cashTxns,
        consignmentNotes,
        challans,
        arrivalReports,
        vouchers,
        bills,
        moneyReceipts,
        voucherCodes,
        advances: [],
        outstandings: [],
        commissions: [],
      });
    } catch (error) {
      console.error("Failed to load operations data from API:", error);
    } finally {
      set({ loading: false });
    }
  },

  nextBookingNo: () => {
    let maxSeq = 0;
    get().bookings.forEach((b) => {
      if (b.bookingNo && b.bookingNo.startsWith("JRKS")) {
        const numStr = b.bookingNo.substring(4);
        const seq = parseInt(numStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });
    return `JRKS${String(maxSeq + 1).padStart(3, "0")}`;
  },

  addBooking: async (b) => {
    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({ bookings: [data, ...s.bookings] }));
      return data.bookingNo;
    } catch (error) {
      console.error("Failed to add booking:", error);
      return "";
    }
  },

  updateBooking: async (id, b) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({
        bookings: s.bookings.map((x) => (x.id === id ? data : x)),
      }));
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  },

  deleteBooking: async (id) => {
    try {
      await fetch(`${API_BASE}/bookings/${id}`, { method: "DELETE" });
      set((s) => ({ bookings: s.bookings.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete booking:", error);
    }
  },

  addConsignmentNote: async (cn) => {
    try {
      const res = await fetch(`${API_BASE}/consignment-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cn, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to save consignment note");
      const data = await res.json();
      set((s) => ({ consignmentNotes: [data, ...s.consignmentNotes] }));
      return true;
    } catch (error) {
      console.error("Failed to add consignment note:", error);
      return false;
    }
  },

  updateConsignmentNote: async (id, cn) => {
    try {
      const res = await fetch(`${API_BASE}/consignment-notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...cn, userRole: getIsAdmin() ? "admin" : "branch", createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to update consignment note");
      const data = await res.json();
      set((s) => ({
        consignmentNotes: s.consignmentNotes.map((x) => (x.id === id ? data : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update consignment note:", error);
      return false;
    }
  },

  deleteConsignmentNote: async (id) => {
    try {
      await fetch(`${API_BASE}/consignment-notes/${id}`, { method: "DELETE" });
      set((s) => ({ consignmentNotes: s.consignmentNotes.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete consignment note:", error);
    }
  },

  addChallan: async (c) => {
    try {
      const res = await fetch(`${API_BASE}/challans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        let errMsg = "Failed to save challan";
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      set((s) => ({ challans: [data, ...s.challans] }));
      return data.challanNo;
    } catch (error) {
      console.error("Failed to add challan:", error);
      throw error;
    }
  },

  updateChallan: async (id, c) => {
    try {
      const res = await fetch(`${API_BASE}/challans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, userRole: getIsAdmin() ? "admin" : "branch", createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        let errMsg = "Failed to update challan";
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      set((s) => ({
        challans: s.challans.map((x) => (x.id === id ? data : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update challan:", error);
      throw error;
    }
  },

  deleteChallan: async (id) => {
    try {
      await fetch(`${API_BASE}/challans/${id}`, { method: "DELETE" });
      set((s) => ({ challans: s.challans.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete challan:", error);
    }
  },

  addArrivalReport: async (ar) => {
    try {
      const res = await fetch(`${API_BASE}/arrival-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ar, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to save arrival report");
      const data = await res.json();
      set((s) => ({ arrivalReports: [data, ...s.arrivalReports] }));
      return true;
    } catch (error) {
      console.error("Failed to add arrival report:", error);
      return false;
    }
  },

  updateArrivalReport: async (id, ar) => {
    try {
      const res = await fetch(`${API_BASE}/arrival-reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ar, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to update arrival report");
      const data = await res.json();
      set((s) => ({
        arrivalReports: s.arrivalReports.map((x) => (x.arrival_report_id === id ? data : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update arrival report:", error);
      return false;
    }
  },

  deleteArrivalReport: async (id) => {
    try {
      await fetch(`${API_BASE}/arrival-reports/${id}`, { method: "DELETE" });
      set((s) => ({ arrivalReports: s.arrivalReports.filter((x) => x.arrival_report_id !== id) }));
    } catch (error) {
      console.error("Failed to delete arrival report:", error);
    }
  },

  addVoucher: async (v) => {
    try {
      const res = await fetch(`${API_BASE}/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to save voucher");
      const data = await res.json();
      set((s) => ({ vouchers: [data, ...s.vouchers] }));
      return data.voucherNo;
    } catch (error) {
      console.error("Failed to add voucher:", error);
      return "";
    }
  },

  updateVoucher: async (id, v) => {
    try {
      const res = await fetch(`${API_BASE}/vouchers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to update voucher");
      const data = await res.json();
      set((s) => ({
        vouchers: s.vouchers.map((x) => (x.id === id ? data : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update voucher:", error);
      return false;
    }
  },

  deleteVoucher: async (id) => {
    try {
      await fetch(`${API_BASE}/vouchers/${id}`, { method: "DELETE" });
      set((s) => ({ vouchers: s.vouchers.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete voucher:", error);
    }
  },

  nextVoucherNo: () => {
    let maxSeq = 0;
    get().vouchers.forEach((v) => {
      const val = v.manualVoucherNo || (v.voucherNo && /^(?:VR-|VCH-)/i.test(v.voucherNo) ? v.voucherNo : "");
      if (val && typeof val === "string") {
        const match = val.trim().match(/^(?:VR-?|VCH-?|C-|V-)?0*(\d+)$/i);
        if (match) {
          let seq = parseInt(match[1], 10);
          if (seq >= 1000) seq = seq - 1000;
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });
    return `VR-${String(maxSeq + 1).padStart(3, "0")}`;
  },

  nextArrivalReportNo: () => {
    let maxSeq = 0;
    get().arrivalReports.forEach((ar) => {
      const nos = [ar.arrival_report_no, (ar as any).arrivalReportNo, (ar as any).report_no];
      for (const no of nos) {
        if (no && typeof no === "string") {
          const match = no.trim().match(/^(?:AR-?)?0*(\d+)$/i);
          if (match) {
            let seq = parseInt(match[1], 10);
            if (seq >= 1000) {
              seq = seq - 1000;
            }
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
    });
    return `AR-${String(maxSeq + 1).padStart(3, "0")}`;
  },

  nextMoneyReceiptNo: () => {
    let maxSeq = 0;
    get().moneyReceipts.forEach((mr) => {
      if (mr.mrNo && typeof mr.mrNo === "string") {
        const match = mr.mrNo.trim().match(/^(?:MR-?)?0*(\d+)$/i);
        if (match) {
          let seq = parseInt(match[1], 10);
          if (seq >= 1000) seq = seq - 1000;
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });
    return `MR-${String(maxSeq + 1).padStart(3, "0")}`;
  },

  nextChallanNo: () => {
    let maxSeq = 0;
    get().challans.forEach((c) => {
      const nos = [c.manualChallanNo, c.challanNo];
      for (const no of nos) {
        if (no && typeof no === "string") {
          const match = no.trim().match(/^(?:CH-?)?0*(\d+)$/i);
          if (match) {
            let seq = parseInt(match[1], 10);
            if (seq >= 1000) seq = seq - 1000;
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
    });
    return `CH-${String(maxSeq + 1).padStart(3, "0")}`;
  },

  addMoneyReceipt: async (mr) => {
    try {
      const res = await fetch(`${API_BASE}/money-receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mr, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to save money receipt");
      const data = await res.json();
      set((s) => ({ moneyReceipts: [data, ...s.moneyReceipts] }));
      return true;
    } catch (error) {
      console.error("Failed to add money receipt:", error);
      return false;
    }
  },

  updateMoneyReceipt: async (id, mr) => {
    try {
      const res = await fetch(`${API_BASE}/money-receipts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...mr, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to update money receipt");
      const data = await res.json();
      set((s) => ({
        moneyReceipts: s.moneyReceipts.map((x) => (x.id === id ? data : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update money receipt:", error);
      return false;
    }
  },

  deleteMoneyReceipt: async (id) => {
    try {
      await fetch(`${API_BASE}/money-receipts/${id}`, { method: "DELETE" });
      set((s) => ({ moneyReceipts: s.moneyReceipts.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete money receipt:", error);
    }
  },

  loadVoucherCodes: async () => {
    try {
      const res = await fetch(`${API_BASE}/voucher-codes`);
      const data = await res.json();
      set({ voucherCodes: data });
    } catch (error) {
      console.error("Failed to load voucher codes:", error);
    }
  },

  addVoucherCode: async (vc) => {
    try {
      const res = await fetch(`${API_BASE}/voucher-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vc, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save voucher code");
        return false;
      }
      const data = await res.json();
      set((s) => ({ voucherCodes: [...s.voucherCodes, data].sort((a, b) => parseInt(a.code) - parseInt(b.code)) }));
      return true;
    } catch (error) {
      console.error("Failed to add voucher code:", error);
      return false;
    }
  },

  updateVoucherCode: async (id, vc) => {
    try {
      const res = await fetch(`${API_BASE}/voucher-codes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vc, updatedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        toast.error("Failed to update voucher code");
        return false;
      }
      const data = await res.json();
      set((s) => ({
        voucherCodes: s.voucherCodes.map((x) => (x.id === id ? data : x)).sort((a, b) => parseInt(a.code) - parseInt(b.code)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update voucher code:", error);
      return false;
    }
  },

  deleteVoucherCode: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/voucher-codes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to delete voucher code");
        return false;
      }
      set((s) => ({ voucherCodes: s.voucherCodes.filter((x) => x.id !== id) }));
      return true;
    } catch (error) {
      console.error("Failed to delete voucher code:", error);
      return false;
    }
  },

  addBill: async (bill) => {
    try {
      const res = await fetch(`${API_BASE}/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bill,
          createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin",
        }),
      });
      if (!res.ok) {
        let errMsg = "Failed to save bill";
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      const parsedData = {
        ...data,
        items: typeof data.items === "string" ? JSON.parse(data.items || "[]") : Array.isArray(data.items) ? data.items : [],
      };
      set((s) => ({ bills: [parsedData, ...s.bills] }));
      return true;
    } catch (error) {
      console.error("Failed to add bill:", error);
      return false;
    }
  },

  updateBill: async (id, bill) => {
    try {
      const res = await fetch(`${API_BASE}/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bill,
          createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin",
          lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin",
        }),
      });
      if (!res.ok) {
        let errMsg = "Failed to update bill";
        try {
          const errData = await res.json();
          if (errData && errData.error) errMsg = errData.error;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      const parsedData = {
        ...data,
        items: typeof data.items === "string" ? JSON.parse(data.items || "[]") : Array.isArray(data.items) ? data.items : [],
      };
      set((s) => ({
        bills: s.bills.map((x) => (x.id === id ? parsedData : x)),
      }));
      return true;
    } catch (error) {
      console.error("Failed to update bill:", error);
      return false;
    }
  },

  deleteBill: async (id) => {
    try {
      await fetch(`${API_BASE}/bills/${id}`, { method: "DELETE" });
      set((s) => ({ bills: s.bills.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete bill:", error);
    }
  },

  nextBillNo: () => {
    let maxSeq = 26000;
    get().bills.forEach((b) => {
      if (b.billNo && typeof b.billNo === "string") {
        const match = b.billNo.trim().match(/^(?:INV-?)?0*(\d+)$/i);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq >= 26000 && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });
    return `INV-${maxSeq + 1}`;
  },

  loadOutstandingSummaries: async () => {
    try {
      const res = await fetch(`${API_BASE}/outstanding-accounts`);
      const data = await res.json();
      set({ outstandingSummaries: data });
    } catch (e) {
      console.error(e);
    }
  },
  loadLedger: async (partyType: string, partyId: string) => {
    try {
      const res = await fetch(`${API_BASE}/outstanding-accounts/${partyType}/${partyId}/ledger`);
      const data = await res.json();
      set((s) => ({
        ledgers: { ...s.ledgers, [`${partyType}-${partyId}`]: data }
      }));
    } catch (e) {
      console.error(e);
    }
  },
  loadGlobalLedger: async (partyType: string) => {
    try {
      const res = await fetch(`${API_BASE}/outstanding-accounts/${partyType}/ledger/all`);
      const data = await res.json();
      set({ globalLedger: data });
    } catch (e) {
      console.error(e);
    }
  },
  saveOpeningBalance: async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/opening-balances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save opening balance");
        return false;
      }
      get().loadOutstandingSummaries();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  saveManualAdjustment: async (payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/manual-adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        toast.error("Failed to save manual adjustment");
        return false;
      }
      get().loadOutstandingSummaries();
      get().loadLedger(payload.partyType, payload.partyId);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
}));
