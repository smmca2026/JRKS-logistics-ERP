import { create } from "zustand";
import { toast } from "sonner";

export type RecordStatus = "active" | "expiring" | "expired";

export type VehicleType =
  | "LCV"
  | "Lorry"
  | "Taurus"
  | "Trailer"
  | "container SXL"
  | "container XXL";

export interface DocInfo {
  number: string;
  validUpto: string; // ISO date
}

export interface Truck {
  id: string;
  vehicleNumber: string;
  ownerName: string;
  address: string;
  mobileNumber: string;
  panCard: string;
  aadharNumber?: string;
  accountNumber?: string;
  vehicleType: VehicleType;
  engineNumber: string;
  chassisNumber: string;
  nationalPermit: DocInfo;
  insurance: DocInfo;
  pollution: DocInfo;
  taxReceipt: DocInfo;
  fitness: DocInfo;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  created_at?: string;
}

export type BillingParty = "Consignee" | "Consignor" | "Third Party";

export interface Company {
  id: string;
  consigneeName: string;
  address: string;
  contactPerson: string;
  mobileNumber: string;
  gstNumber: string;
  panNumber?: string;
  billingParty: BillingParty;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  created_at?: string;
}

export type AccountType = "Savings" | "Current" | "Cash Credit";

export interface BankAccount {
  id: string;
  accountHolder: string;
  accountNumber: string;
  accountType: AccountType;
  bankName: string;
  branch: string;
  ifsc: string;
  mobileNumber: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  created_at?: string;
}

export interface Broker {
  id: string;
  brokerName: string;
  address: string;
  contactPerson: string;
  mobileNumber: string;
  whatsappNumber: string;
  panCard: string;
  aadharCard: string;
  gstNumber?: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  ifsc: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  created_at?: string;
}

export interface Driver {
  id: string;
  driverName: string;
  driverMobile: string;
  createdAt: string;
  updatedAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Derives a status from the earliest document expiry of a truck. */
export function truckStatus(t: Truck): RecordStatus {
  const dates = [t.nationalPermit, t.insurance, t.pollution, t.taxReceipt, t.fitness]
    .map((d) => d.validUpto)
    .filter(Boolean)
    .map((d) => new Date(d).getTime());
  if (!dates.length) return "active";
  const earliest = Math.min(...dates);
  const now = Date.now();
  const diffDays = (earliest - now) / 86_400_000;
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "active";
}

/** Status for a single document field. */
export function docStatus(validUpto: string): RecordStatus {
  if (!validUpto) return "active";
  const diffDays = (new Date(validUpto).getTime() - Date.now()) / 86_400_000;
  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "active";
}

const seedTrucks: Truck[] = [
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
    nationalPermit: { number: "NP-TN-99812", validUpto: daysFromNow(220) },
    insurance: { number: "INS-7781234", validUpto: daysFromNow(18) },
    pollution: { number: "PUC-554120", validUpto: daysFromNow(96) },
    taxReceipt: { number: "TAX-TN-2231", validUpto: daysFromNow(310) },
    fitness: { number: "FIT-9921", validUpto: daysFromNow(140) },
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
    nationalPermit: { number: "NP-KA-44521", validUpto: daysFromNow(-12) },
    insurance: { number: "INS-9923451", validUpto: daysFromNow(120) },
    pollution: { number: "PUC-118822", validUpto: daysFromNow(60) },
    taxReceipt: { number: "TAX-KA-7782", validUpto: daysFromNow(200) },
    fitness: { number: "FIT-3321", validUpto: daysFromNow(80) },
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
    nationalPermit: { number: "NP-MH-11209", validUpto: daysFromNow(420) },
    insurance: { number: "INS-2231908", validUpto: daysFromNow(340) },
    pollution: { number: "PUC-990012", validUpto: daysFromNow(210) },
    taxReceipt: { number: "TAX-MH-9981", validUpto: daysFromNow(500) },
    fitness: { number: "FIT-7711", validUpto: daysFromNow(360) },
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
    nationalPermit: { number: "NP-GJ-77651", validUpto: daysFromNow(95) },
    insurance: { number: "INS-5512098", validUpto: daysFromNow(25) },
    pollution: { number: "PUC-330091", validUpto: daysFromNow(-5) },
    taxReceipt: { number: "TAX-GJ-1122", validUpto: daysFromNow(150) },
    fitness: { number: "FIT-5521", validUpto: daysFromNow(40) },
    createdAt: daysFromNow(-14),
  },
];

const seedCompanies: Company[] = [
  {
    id: uid(),
    consigneeName: "Apollo Steel Industries Ltd.",
    address: "Plot 14, Industrial Estate, Chennai, Tamil Nadu",
    contactPerson: "Vikram Nair",
    mobileNumber: "9840011223",
    gstNumber: "33ABCDE1234F1Z5",
    billingParty: "Consignee",
    active: true,
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
    active: true,
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
    active: false,
    createdAt: daysFromNow(-11),
  },
];

const seedBanks: BankAccount[] = [
  {
    id: uid(),
    accountHolder: "JRKS Logistics",
    accountNumber: "50100234567890",
    accountType: "Current",
    bankName: "HDFC Bank",
    branch: "Coimbatore Main",
    ifsc: "HDFC0000123",
    mobileNumber: "9842012345",
    active: true,
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
    active: true,
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
    active: true,
    createdAt: daysFromNow(-13),
  },
];

const seedBrokers: Broker[] = [
  {
    id: uid(),
    brokerName: "Sri Balaji Transport Brokers",
    address: "5, Avinashi Road, Tiruppur, Tamil Nadu",
    contactPerson: "Murali K",
    mobileNumber: "9842099887",
    whatsappNumber: "9842099887",
    panCard: "AABCS1234M",
    aadharCard: "",
    gstNumber: "33SRIBA1234B1Z3",
    accountNumber: "60123456789012",
    bankName: "Axis Bank",
    branch: "Tiruppur",
    ifsc: "UTIB0000456",
    active: true,
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
    aadharCard: "",
    gstNumber: "",
    accountNumber: "98760012345678",
    bankName: "Kotak Mahindra Bank",
    branch: "Guindy",
    ifsc: "KKBK0000789",
    active: true,
    createdAt: daysFromNow(-10),
  },
];

// Base URL for API requests
const API_BASE = "/api";

interface MasterState {
  trucks: Truck[];
  companies: Company[];
  banks: BankAccount[];
  brokers: Broker[];
  drivers: Driver[];
  loading: boolean;
  loadData: () => Promise<void>;
  addTruck: (t: Omit<Truck, "id" | "createdAt">) => Promise<void>;
  updateTruck: (id: string, t: Omit<Truck, "id" | "createdAt">) => Promise<void>;
  deleteTruck: (id: string) => Promise<void>;
  addCompany: (c: Omit<Company, "id" | "createdAt">) => Promise<void>;
  updateCompany: (id: string, c: Omit<Company, "id" | "createdAt">) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addBank: (b: Omit<BankAccount, "id" | "createdAt">) => Promise<void>;
  updateBank: (id: string, b: Omit<BankAccount, "id" | "createdAt">) => Promise<void>;
  deleteBank: (id: string) => Promise<void>;
  addBroker: (b: Omit<Broker, "id" | "createdAt">) => Promise<void>;
  updateBroker: (id: string, b: Omit<Broker, "id" | "createdAt">) => Promise<void>;
  deleteBroker: (id: string) => Promise<void>;
  addDriver: (d: { driverName: string; driverMobile: string }) => Promise<Driver | null>;
}

export const useMasterStore = create<MasterState>((set) => ({
  trucks: [],
  companies: [],
  banks: [],
  brokers: [],
  drivers: [],
  loading: false,

  loadData: async () => {
    set({ loading: true });
    try {
      const [trucksRes, companiesRes, banksRes, brokersRes, driversRes] = await Promise.all([
        fetch(`${API_BASE}/trucks`),
        fetch(`${API_BASE}/companies`),
        fetch(`${API_BASE}/banks`),
        fetch(`${API_BASE}/brokers`),
        fetch(`${API_BASE}/drivers`),
      ]);
      const trucks = await trucksRes.json();
      const companies = await companiesRes.json();
      const banks = await banksRes.json();
      const brokers = await brokersRes.json();
      const drivers = await driversRes.json();
      set({ trucks, companies, banks, brokers, drivers });
    } catch (error) {
      console.error("Failed to load master data from API:", error);
    } finally {
      set({ loading: false });
    }
  },

  addTruck: async (t) => {
    try {
      const res = await fetch(`${API_BASE}/trucks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({ trucks: [data, ...s.trucks] }));
    } catch (error) {
      console.error("Failed to add truck:", error);
    }
  },
  updateTruck: async (id, t) => {
    try {
      const res = await fetch(`${API_BASE}/trucks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({
        trucks: s.trucks.map((x) => (x.id === id ? data : x)),
      }));
    } catch (error) {
      console.error("Failed to update truck:", error);
    }
  },
  deleteTruck: async (id) => {
    try {
      await fetch(`${API_BASE}/trucks/${id}`, { method: "DELETE" });
      set((s) => ({ trucks: s.trucks.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete truck:", error);
    }
  },

  addCompany: async (c) => {
    try {
      const res = await fetch(`${API_BASE}/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({ companies: [data, ...s.companies] }));
    } catch (error) {
      console.error("Failed to add company:", error);
    }
  },
  updateCompany: async (id, c) => {
    try {
      const res = await fetch(`${API_BASE}/companies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...c, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({
        companies: s.companies.map((x) => (x.id === id ? data : x)),
      }));
    } catch (error) {
      console.error("Failed to update company:", error);
    }
  },
  deleteCompany: async (id) => {
    try {
      await fetch(`${API_BASE}/companies/${id}`, { method: "DELETE" });
      set((s) => ({ companies: s.companies.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete company:", error);
    }
  },

  addBank: async (b) => {
    try {
      const res = await fetch(`${API_BASE}/banks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({ banks: [data, ...s.banks] }));
    } catch (error) {
      console.error("Failed to add bank account:", error);
    }
  },
  updateBank: async (id, b) => {
    try {
      const res = await fetch(`${API_BASE}/banks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({
        banks: s.banks.map((x) => (x.id === id ? data : x)),
      }));
    } catch (error) {
      console.error("Failed to update bank account:", error);
    }
  },
  deleteBank: async (id) => {
    try {
      await fetch(`${API_BASE}/banks/${id}`, { method: "DELETE" });
      set((s) => ({ banks: s.banks.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete bank account:", error);
    }
  },

  addBroker: async (b) => {
    try {
      const res = await fetch(`${API_BASE}/brokers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({ brokers: [data, ...s.brokers] }));
    } catch (error) {
      console.error("Failed to add broker:", error);
    }
  },
  updateBroker: async (id, b) => {
    try {
      const res = await fetch(`${API_BASE}/brokers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...b, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin", lastEditedBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      const data = await res.json();
      set((s) => ({
        brokers: s.brokers.map((x) => (x.id === id ? data : x)),
      }));
    } catch (error) {
      console.error("Failed to update broker:", error);
    }
  },
  deleteBroker: async (id) => {
    try {
      await fetch(`${API_BASE}/brokers/${id}`, { method: "DELETE" });
      set((s) => ({ brokers: s.brokers.filter((x) => x.id !== id) }));
    } catch (error) {
      console.error("Failed to delete broker:", error);
    }
  },

  addDriver: async (d) => {
    try {
      const res = await fetch(`${API_BASE}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, createdBy: typeof window !== "undefined" ? sessionStorage.getItem("userName") || "Admin" : "Admin" }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add driver");
      }
      const data = await res.json();
      set((s) => ({ drivers: [data, ...s.drivers] }));
      return data;
    } catch (error) {
      const err = error as Error;
      console.error("Failed to add driver:", err);
      toast.error(err.message || "Failed to add driver");
      return null;
    }
  },
}));
