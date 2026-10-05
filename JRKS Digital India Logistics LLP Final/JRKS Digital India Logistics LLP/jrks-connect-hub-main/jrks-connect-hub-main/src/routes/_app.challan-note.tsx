import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  FileText,
  Truck,
  Handshake,
  X,
  Check,
  ChevronDown,
  ArrowLeft,
  RotateCcw,
  Printer,
  Phone,
  MessageCircle,
  Smartphone,
  Save,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { getIsAdmin } from "@/lib/auth";
import { useMasterStore } from "@/lib/master-store";
import { useOpsStore, type Challan, type ChallanItem } from "@/lib/ops-store";
import { cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHALLAN_COPIES = ["CHALLAN COPY", "PAYMENT COPY", "ADVANCE COPY", "ACCOUNTS COPY"];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // YYYY-MM-DD to DD/MM/YYYY
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

const logo = "/logo.png";

export const Route = createFileRoute("/_app/challan-note")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: search.id as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Challan Note — JRKS Logistics ERP" },
      { name: "description", content: "Create and manage transport challan notes." },
    ],
  }),
  component: ChallanNotePage,
});

/* ── REUSABLE CUSTOM INPUT COMPONENTS WITH LABELS ON TOP ── */
interface FloatingInputProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  required?: boolean;
  error?: string;
  readOnly?: boolean;
  list?: string;
}

function FloatingLabelInput({
  label,
  value,
  onChange,
  onBlur,
  onKeyDown,
  type = "text",
  placeholder = "",
  prefix,
  suffix,
  required,
  error,
  readOnly,
  list,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div
        className={cn(
          "relative flex items-center w-full rounded-full border border-slate-200 bg-white transition-all duration-200",
          focused && "border-blue-600 ring-2 ring-blue-500/10 shadow-sm",
          error && "border-red-500 ring-2 ring-red-500/10",
          readOnly && "bg-slate-50 border-slate-200 cursor-not-allowed",
        )}
        style={{ minHeight: "44px" }}
      >
        {prefix && (
          <div className="flex items-center justify-center pl-4 pr-2 text-slate-400 font-bold border-r border-slate-100 select-none">
            {prefix}
          </div>
        )}

        <div className="relative flex-1 py-2">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            onKeyDown={onKeyDown}
            readOnly={readOnly}
            placeholder={placeholder}
            list={list}
            className={cn(
              "w-full px-4 text-sm font-semibold text-slate-800 bg-transparent border-0 outline-none focus:ring-0 focus:outline-none placeholder:text-slate-400",
              readOnly && "cursor-not-allowed text-slate-500",
            )}
          />
        </div>

        {suffix && (
          <div className="flex items-center justify-center pr-4 pl-2 text-slate-400 font-semibold border-l border-slate-100 select-none">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs font-bold text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

interface FloatingSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

function FloatingLabelSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  required,
  error,
}: FloatingSelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "w-full rounded-full border border-slate-200 bg-white px-4 transition-all duration-200",
            error && "border-red-500 ring-2 ring-red-500/10",
          )}
        >
          <span className="truncate pointer-events-none text-left">
            {value ? value : <span className="text-slate-400">{placeholder}</span>}
          </span>
        </SelectTrigger>
        <SelectContent>
          {value && !options.includes(value) && <SelectItem value={value}>{value}</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs font-bold text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

interface FloatingDatePickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}

function FloatingLabelDatePicker({
  label,
  value,
  onChange,
  required,
  error,
}: FloatingDatePickerProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <CustomDatePicker value={value} onChange={onChange} error={!!error} required={required} />
      {error && <p className="text-xs font-bold text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

/* ── SECTION CARD CONTAINER ─────────────────────────────── */
interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
          {icon}
        </div>
        <h2 className="text-sm font-extrabold text-[#1E3A8A] uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function getNextManualChallanNo(
  existingChallans: Array<{ manualChallanNo?: string; challanNo?: string }>,
): string {
  let maxSeq = 0;
  for (const c of existingChallans) {
    const nos = [c.manualChallanNo, c.challanNo];
    for (const no of nos) {
      if (no) {
        let parsed = parseInt(String(no).replace(/[^0-9]/g, ""), 10);
        if (parsed >= 1000) parsed = parsed - 1000;
        if (!isNaN(parsed) && parsed > maxSeq) {
          maxSeq = parsed;
        }
      }
    }
  }
  return `CH-${String(maxSeq + 1).padStart(3, "0")}`;
}

/* ── COMPONENT ENTRY ────────────────────────────────────── */
function ChallanNotePage() {
  const userRole = typeof window !== "undefined" ? sessionStorage.getItem("userRole") : "admin";
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const id = searchParams.id;
  const isEdit = !!id;

  const { trucks, brokers } = useMasterStore();
  const { challans, addChallan, updateChallan, consignmentNotes, bookings, moneyReceipts } = useOpsStore();

  const editChallan = useMemo(() => {
    if (id) return challans.find((c) => String(c.id) === String(id));
    return null;
  }, [challans, id]);

  const isLocked = useMemo(() => {
    if (!editChallan) return false;
    if (
      editChallan.isLocked === 1 ||
      editChallan.isLocked === true ||
      String(editChallan.isLocked) === "1"
    ) {
      return true;
    }
    const chNos = [editChallan.challanNo, editChallan.manualChallanNo]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase().trim());
    const itemLrNos = (Array.isArray(editChallan.items) ? editChallan.items : [])
      .map((it: any) => String(it.cnNo || it.lrNo || "").toLowerCase().trim())
      .filter(Boolean);
    const allRefs = [...chNos, ...itemLrNos];

    return (moneyReceipts || []).some((mr) => {
      const mrLr = String(mr.lrNo || "").toLowerCase().trim();
      if (mrLr && allRefs.some((ref) => ref && (mrLr === ref || mrLr.includes(ref) || ref.includes(mrLr)))) {
        return true;
      }
      const mrItems = JSON.stringify(mr.items || []).toLowerCase();
      if (allRefs.some((ref) => ref && mrItems.includes(ref))) {
        return true;
      }
      return false;
    });
  }, [editChallan, moneyReceipts]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Form Fields State
  const [manualChallanNo, setManualChallanNo] = useState(() => getNextManualChallanNo(challans));
  const [challanDate, setChallanDate] = useState(todayStr);
  const [challanNo, setChallanNo] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  // Package & Particulars (Section 2)
  const [items, setItems] = useState<ChallanItem[]>([
    { cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" },
  ]);

  // Owner Details (Section 3)
  const [ownerPan, setOwnerPan] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerAadhar, setOwnerAadhar] = useState("");
  const [ownerAccount, setOwnerAccount] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [declarationAttached, setDeclarationAttached] = useState<"Yes" | "No">("No");
  const [driverName, setDriverName] = useState("");
  const [driverMobile, setDriverMobile] = useState("");
  const [dimLength, setDimLength] = useState("");
  const [dimWidth, setDimWidth] = useState("");
  const [dimHeight, setDimHeight] = useState("");

  // Broker Details (Section 4)
  const [brokerPan, setBrokerPan] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [brokerAadhar, setBrokerAadhar] = useState("");
  const [brokerAccount, setBrokerAccount] = useState("");
  const [brokerMobile, setBrokerMobile] = useState("");
  const [lorryHire, setLorryHire] = useState("");
  const [freight, setFreight] = useState("");
  const [loadingMamul, setLoadingMamul] = useState("0");
  const [comlyCom, setComlyCom] = useState("0");
  const [rtoFine, setRtoFine] = useState("");
  const [extraCharges, setExtraCharges] = useState("");
  const [tds, setTds] = useState("0.00");
  const [tdsPercentage, setTdsPercentage] = useState("0%");
  const [lessAdvance, setLessAdvance] = useState("");
  const [commission, setCommission] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("0");
  const [payableAt, setPayableAt] = useState("");

  // Broker Name (Section 5)
  const [brokerNameSec5, setBrokerNameSec5] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Lookup options
  const vehicleOptions = useMemo(() => trucks.map((t) => t.vehicleNumber), [trucks]);
  const brokerOptions = useMemo(() => {
    const names = brokers.map((b) => b.brokerName).filter(Boolean);
    if (!names.includes("DIRECT")) {
      names.unshift("DIRECT");
    }
    return names;
  }, [brokers]);
  const ownerOptions = useMemo(() => {
    const names = trucks.map((t) => t.ownerName).filter(Boolean);
    return Array.from(new Set(names));
  }, [trucks]);

  // running totals calculations
  const totalPackages = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.noOfPackages) || 0), 0),
    [items],
  );
  const totalWeight = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0),
    [items],
  );

  // Auto Recalculation of Gross, TDS Amount, and Final Balance
  useEffect(() => {
    const numFreight = parseFloat(freight);
    const numLoadingMamul = parseFloat(loadingMamul);
    const numRtoFine = parseFloat(rtoFine);
    const numExtra = parseFloat(extraCharges);
    const numLessAdvance = parseFloat(lessAdvance);
    const numComlyCom = parseFloat(comlyCom);

    // If any field is invalid or negative, display validation error without breaking calculation
    const fieldErrors: Record<string, string> = {};
    const checkField = (name: string, val: string, num: number, label: string) => {
      if (val.trim() !== "") {
        if (isNaN(num)) fieldErrors[name] = `${label} must be a valid number`;
        else if (num < 0) fieldErrors[name] = `${label} cannot be negative`;
      }
    };
    const numLorryHire = parseFloat(lorryHire);
    checkField("lorryHire", lorryHire, numLorryHire, "Lorry Hire");
    checkField("freight", freight, numFreight, "Freight");
    checkField("loadingMamul", loadingMamul, numLoadingMamul, "Loading Mamul");
    checkField("rtoFine", rtoFine, numRtoFine, "RTO Fine");
    checkField("extraCharges", extraCharges, numExtra, "Extra Charges");
    checkField("lessAdvance", lessAdvance, numLessAdvance, "Less Advance");

    setErrors((prev) => {
      const updated = { ...prev };
      ["lorryHire", "freight", "loadingMamul", "rtoFine", "extraCharges", "lessAdvance"].forEach(
        (k) => {
          if (fieldErrors[k]) updated[k] = fieldErrors[k];
          else delete updated[k];
        },
      );
      return updated;
    });

    const cleanLorryHire = isNaN(numLorryHire) || numLorryHire < 0 ? 0 : numLorryHire;
    const cleanFreight = isNaN(numFreight) || numFreight < 0 ? 0 : numFreight;
    const cleanLoadingMamul = isNaN(numLoadingMamul) || numLoadingMamul < 0 ? 0 : numLoadingMamul;
    const cleanRtoFine = isNaN(numRtoFine) || numRtoFine < 0 ? 0 : numRtoFine;
    const cleanExtra = isNaN(numExtra) || numExtra < 0 ? 0 : numExtra;
    const cleanLessAdvance = isNaN(numLessAdvance) || numLessAdvance < 0 ? 0 : numLessAdvance;
    const cleanComlyCom = isNaN(numComlyCom) || numComlyCom < 0 ? 0 : numComlyCom;

    // 1. TDS % strictly calculated on Lorry Hire
    const tdsPercentNum = parseFloat(tdsPercentage) || 0;
    const calculatedTds = (cleanLorryHire * tdsPercentNum) / 100;
    const roundedTds = Number(calculatedTds.toFixed(2));

    // 2. Extra charges and RTO Fine ADDED to Lorry Hire & Freight
    const totalGrossPayable = cleanLorryHire + cleanFreight + cleanExtra;

    // 3. Deductions: Loading Mamul, Challan Mamul (comlyCom), RTO Fine, Less Advance, TDS
    const totalDeductions = cleanLoadingMamul + cleanComlyCom + cleanRtoFine + cleanLessAdvance + roundedTds;
    const calculatedBalance = totalGrossPayable - totalDeductions;
    const roundedBalance = Number(calculatedBalance.toFixed(2));

    setTds(roundedTds.toFixed(2));
    setBalanceAmount(roundedBalance.toFixed(2));
  }, [
    lorryHire,
    freight,
    loadingMamul,
    rtoFine,
    extraCharges,
    lessAdvance,
    comlyCom,
    tdsPercentage,
  ]);

  const loadChallanDetails = (c: any) => {
    setChallanNo(c.challanNo || "");
    setChallanDate(c.challanDate || todayStr);
    setFromLocation(c.fromLocation || "");
    setToLocation(c.toLocation || "");
    setVehicleNumber(c.vehicleNumber || "");
    setItems(
      c.items || [{ cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" }],
    );
    setOwnerPan(c.ownerPan || "");
    setOwnerName(c.ownerName || "");
    setOwnerAadhar(c.ownerAadhar || "");
    setOwnerAccount(c.ownerAccount || "");
    setOwnerMobile(c.ownerMobile || "");
    setDeclarationAttached(c.declarationAttached || "No");
    setDriverName(c.driverName || "");
    setDriverMobile(c.driverMobile || "");
    setDimLength(c.dimLength || "");
    setDimWidth(c.dimWidth || "");
    setDimHeight(c.dimHeight || "");
    setBrokerPan(c.brokerPan || "");
    setBrokerName(c.brokerName || "");
    setBrokerAadhar(c.brokerAadhar || "");
    setBrokerAccount(c.brokerAccount || "");
    setBrokerMobile(c.brokerMobile || "");
    setLorryHire(
      c.lorryHire !== undefined && c.lorryHire !== null && Number(c.lorryHire) !== 0
        ? c.lorryHire.toString()
        : c.freight && Number(c.freight) !== 0
          ? c.freight.toString()
          : "",
    );
    setFreight(
      c.freight !== undefined && c.freight !== null && Number(c.freight) !== 0
        ? c.freight.toString()
        : "",
    );
    setLoadingMamul(
      c.loadingMamul !== undefined && c.loadingMamul !== null
        ? c.loadingMamul.toString()
        : "0",
    );
    setComlyCom(
      c.comlyCom !== undefined && c.comlyCom !== null
        ? c.comlyCom.toString()
        : "0",
    );
    setRtoFine(
      c.rtoFine !== undefined && c.rtoFine !== null && Number(c.rtoFine) !== 0
        ? c.rtoFine.toString()
        : "",
    );
    setExtraCharges(
      c.extraCharges !== undefined && c.extraCharges !== null && Number(c.extraCharges) !== 0
        ? c.extraCharges.toString()
        : "",
    );
    setTds(c.tds !== undefined && c.tds !== null ? Number(c.tds).toFixed(2) : "0.00");
    if (c.tdsPercentage) {
      const strPct = String(c.tdsPercentage).includes("%")
        ? String(c.tdsPercentage)
        : `${c.tdsPercentage}%`;
      setTdsPercentage(strPct === "1%" || strPct === "2%" ? strPct : "0%");
    } else {
      const hire = Number(c.lorryHire || c.freight) || 0;
      const t = Number(c.tds) || 0;
      if (hire > 0 && t > 0) {
        const pct = Math.round((t / hire) * 100);
        setTdsPercentage(pct === 1 || pct === 2 ? `${pct}%` : "0%");
      } else {
        setTdsPercentage("0%");
      }
    }
    setLessAdvance(
      c.lessAdvance !== undefined && c.lessAdvance !== null && Number(c.lessAdvance) !== 0
        ? c.lessAdvance.toString()
        : "",
    );
    setCommission(
      c.commission !== undefined && c.commission !== null && Number(c.commission) !== 0
        ? c.commission.toString()
        : "",
    );
    setBalanceAmount(
      c.balanceAmount !== undefined && c.balanceAmount !== null
        ? c.balanceAmount.toString()
        : "0",
    );
    setPayableAt(c.payableAt || "");
    setBrokerNameSec5(c.brokerNameSec5 || c.brokerName || "");
  };

  const handleLrNoChange = (val: string) => {
    setChallanNo(val);
  };

  const fetchLrDetails = (val: string) => {
    if (!val.trim()) {
      setFromLocation("");
      setToLocation("");
      setVehicleNumber("");
      setOwnerName("");
      setOwnerPan("");
      setOwnerAadhar("");
      setOwnerMobile("");
      setOwnerAccount("");
      setItems([{ cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" }]);
      return;
    }

    // 1. Check if a Challan already exists with this number (labeled LR Number)
    const existing = challans.find(
      (c) => c.challanNo && c.challanNo.trim().toLowerCase() === val.trim().toLowerCase(),
    );
    if (existing) {
      loadChallanDetails(existing);
      if (id !== existing.id) {
        navigate({ to: "/challan-note", search: { id: existing.id } });
      }
      return;
    }

    // 2. Otherwise, check if a Consignment Note exists with this LR Number to auto-populate fields
    const cn = consignmentNotes.find(
      (n) => n.lrNumber && n.lrNumber.trim().toLowerCase() === val.trim().toLowerCase(),
    );
    if (cn) {
      setFromLocation(cn.fromLocation || "");
      setToLocation(cn.toLocation || "");
      setVehicleNumber(cn.vehicleNumber || "");
      setDimLength(cn.vehicleLength || "");
      setDimWidth(cn.vehicleWidth || "");
      setDimHeight(cn.vehicleHeight || "");
      // Note: Payable At is manual and must NOT be auto-filled from cn.toLocation

      // Check if Booking exists for this LR to auto-populate broker details
      const bkg = bookings.find(
        (b) =>
          (b.lrNo && b.lrNo.trim().toLowerCase() === val.trim().toLowerCase()) ||
          (b.bookingNo && b.bookingNo.trim().toLowerCase() === val.trim().toLowerCase())
      );
      if (bkg && bkg.brokerName) {
        setBrokerName(bkg.brokerName);
        setBrokerNameSec5(bkg.brokerName);
        const b = brokers.find((x) => x.brokerName === bkg.brokerName);
        if (b) {
          setBrokerPan(b.panCard || "");
          setBrokerAccount(b.accountNumber || "");
          setBrokerMobile(b.mobileNumber || "");
          setBrokerAadhar(b.aadharCard || "");
        }
      }

      const t = trucks.find((x) => x.vehicleNumber === cn.vehicleNumber);
      if (t) {
        setOwnerName(t.ownerName || "");
        setOwnerPan(t.panCard || "");
        setOwnerAadhar(t.aadharNumber || "");
        setOwnerMobile(t.mobileNumber || "");
        setOwnerAccount(t.accountNumber || "");
      } else {
        setOwnerName("");
        setOwnerPan("");
        setOwnerAadhar("");
        setOwnerMobile("");
        setOwnerAccount("");
      }

      if (cn.items && cn.items.length > 0) {
        const mappedItems: ChallanItem[] = cn.items.map((item) => ({
          cnNo: cn.lrNumber || "",
          noOfPackages: Number(item.noOfPackages) || 0,
          particulars: item.description || "",
          weight: Number(item.grossWeight || item.netWeight) || 0,
          destination: cn.toLocation || "",
        }));
        setItems(mappedItems);
      } else {
        setItems([
          {
            cnNo: cn.lrNumber || "",
            noOfPackages: 0,
            particulars: "",
            weight: 0,
            destination: cn.toLocation || "",
          },
        ]);
      }
    } else {
      setFromLocation("");
      setToLocation("");
      setVehicleNumber("");
      setOwnerName("");
      setOwnerPan("");
      setOwnerAadhar("");
      setOwnerMobile("");
      setOwnerAccount("");
      setItems([{ cnNo: val, noOfPackages: 0, particulars: "", weight: 0, destination: "" }]);
    }
  };

  const handleChallanLookup = (val: string) => {
    if (!id && val) {
      const trimmedNo = val.trim();
      if (trimmedNo) {
        const matched = challans.find(
          (c) => c.challanNo && c.challanNo.trim().toLowerCase() === trimmedNo.toLowerCase(),
        );
        if (matched) {
          loadChallanDetails(matched);
          navigate({ to: "/challan-note", search: { id: matched.id } });
        }
      }
    }
  };

  // Autofill if edit mode, or start empty if new mode
  useEffect(() => {
    if (editChallan) {
      setManualChallanNo(editChallan.manualChallanNo || "");
      setChallanNo(editChallan.challanNo);
      setChallanDate(editChallan.challanDate || todayStr);
      setFromLocation(editChallan.fromLocation || "");
      setToLocation(editChallan.toLocation || "");
      setVehicleNumber(editChallan.vehicleNumber || "");
      setItems(
        editChallan.items || [
          { cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" },
        ],
      );
      const t = trucks.find((x) => x.vehicleNumber === editChallan.vehicleNumber);
      setOwnerPan(editChallan.ownerPan || (t ? t.panCard : "") || "");
      setOwnerName(editChallan.ownerName || (t ? t.ownerName : "") || "");
      setOwnerAadhar(editChallan.ownerAadhar || (t ? t.aadharNumber : "") || "");
      setOwnerAccount(editChallan.ownerAccount || (t ? t.accountNumber : "") || "");
      setOwnerMobile(editChallan.ownerMobile || (t ? t.mobileNumber : "") || "");
      setDeclarationAttached(editChallan.declarationAttached || "No");
      setDriverName(editChallan.driverName || "");
      setDriverMobile(editChallan.driverMobile || "");
      setDimLength(editChallan.dimLength || "");
      setDimWidth(editChallan.dimWidth || "");
      setDimHeight(editChallan.dimHeight || "");
      const b = brokers.find((x) => x.brokerName === editChallan.brokerName);
      setBrokerPan(editChallan.brokerPan || (b ? b.panCard : "") || "");
      setBrokerName(editChallan.brokerName || "");
      setBrokerAadhar(editChallan.brokerAadhar || (b ? b.aadharCard : "") || "");
      setBrokerAccount(editChallan.brokerAccount || (b ? b.accountNumber : "") || "");
      setBrokerMobile(editChallan.brokerMobile || (b ? b.mobileNumber : "") || "");
      setLorryHire(
        editChallan.lorryHire !== undefined &&
          editChallan.lorryHire !== null &&
          Number(editChallan.lorryHire) !== 0
          ? editChallan.lorryHire.toString()
          : editChallan.freight && Number(editChallan.freight) !== 0
            ? editChallan.freight.toString()
            : "",
      );
      setFreight(
        editChallan.freight !== undefined &&
          editChallan.freight !== null &&
          Number(editChallan.freight) !== 0
          ? editChallan.freight.toString()
          : "",
      );
      setLoadingMamul(
        editChallan.loadingMamul !== undefined && editChallan.loadingMamul !== null
          ? editChallan.loadingMamul.toString()
          : "0",
      );
      setComlyCom(
        editChallan.comlyCom !== undefined && editChallan.comlyCom !== null
          ? editChallan.comlyCom.toString()
          : "0",
      );
      setRtoFine(
        editChallan.rtoFine !== undefined &&
          editChallan.rtoFine !== null &&
          Number(editChallan.rtoFine) !== 0
          ? editChallan.rtoFine.toString()
          : "",
      );
      setExtraCharges(
        editChallan.extraCharges !== undefined &&
          editChallan.extraCharges !== null &&
          Number(editChallan.extraCharges) !== 0
          ? editChallan.extraCharges.toString()
          : "",
      );
      setTds(
        editChallan.tds !== undefined && editChallan.tds !== null
          ? Number(editChallan.tds).toFixed(2)
          : "0.00",
      );
      if (editChallan.tdsPercentage) {
        const strPct = String(editChallan.tdsPercentage).includes("%")
          ? String(editChallan.tdsPercentage)
          : `${editChallan.tdsPercentage}%`;
        setTdsPercentage(strPct === "1%" || strPct === "2%" ? strPct : "0%");
      } else {
        const hire = Number(editChallan.lorryHire || editChallan.freight) || 0;
        const t = Number(editChallan.tds) || 0;
        if (hire > 0 && t > 0) {
          const pct = Math.round((t / hire) * 100);
          setTdsPercentage(pct === 1 || pct === 2 ? `${pct}%` : "0%");
        } else {
          setTdsPercentage("0%");
        }
      }
      setLessAdvance(
        editChallan.lessAdvance !== undefined &&
          editChallan.lessAdvance !== null &&
          Number(editChallan.lessAdvance) !== 0
          ? editChallan.lessAdvance.toString()
          : "",
      );
      setCommission(
        editChallan.commission !== undefined &&
          editChallan.commission !== null &&
          Number(editChallan.commission) !== 0
          ? editChallan.commission.toString()
          : "",
      );
      setBalanceAmount(
        editChallan.balanceAmount !== undefined && editChallan.balanceAmount !== null
          ? editChallan.balanceAmount.toString()
          : "0",
      );
      setPayableAt(editChallan.payableAt || "");
      setBrokerNameSec5(editChallan.brokerNameSec5 || editChallan.brokerName || "");
    } else {
      setManualChallanNo(getNextManualChallanNo(challans));
      setChallanNo("");
      setChallanDate(todayStr);
      setFromLocation("");
      setToLocation("");
      setVehicleNumber("");
      setItems([{ cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" }]);
      setOwnerPan("");
      setOwnerName("");
      setOwnerAadhar("");
      setOwnerAccount("");
      setOwnerMobile("");
      setDeclarationAttached("No");
      setDriverName("");
      setDriverMobile("");
      setDimLength("");
      setDimWidth("");
      setDimHeight("");
      setBrokerPan("");
      setBrokerName("");
      setBrokerAadhar("");
      setBrokerAccount("");
      setBrokerMobile("");
      setLorryHire("");
      setFreight("");
      setLoadingMamul("0");
      setComlyCom("0");
      setRtoFine("");
      setExtraCharges("");
      setTds("0.00");
      setTdsPercentage("0%");
      setLessAdvance("");
      setCommission("");
      setBalanceAmount("0");
      setPayableAt("");
      setBrokerNameSec5("");
    }
  }, [editChallan, id]);

  // Synchronize Section 5 Broker Name with Section 4
  const handleBrokerSelect = (val: string) => {
    if (!val) return;
    setBrokerName(val);
    setBrokerNameSec5(val);
    if (val === "DIRECT") {
      setBrokerPan("");
      setBrokerAccount("");
      setBrokerMobile("");
      setBrokerAadhar("");
      return;
    }
    const b = brokers.find((x) => x.brokerName === val);
    if (b) {
      setBrokerPan(b.panCard || "");
      setBrokerAccount(b.accountNumber || "");
      setBrokerMobile(b.mobileNumber || "");
      setBrokerAadhar(b.aadharCard || "");
    }
  };

  const handleBrokerSec5Select = (val: string) => {
    if (!val) return;
    setBrokerNameSec5(val);
    setBrokerName(val);
    if (val === "DIRECT") {
      setBrokerPan("");
      setBrokerAccount("");
      setBrokerMobile("");
      setBrokerAadhar("");
      return;
    }
    const b = brokers.find((x) => x.brokerName === val);
    if (b) {
      setBrokerPan(b.panCard || "");
      setBrokerAccount(b.accountNumber || "");
      setBrokerMobile(b.mobileNumber || "");
      setBrokerAadhar(b.aadharCard || "");
    }
  };

  const handleOwnerNameChange = (val: string) => {
    if (!val) return;
    setOwnerName(val);
    const t = trucks.find((x) => x.ownerName?.trim().toLowerCase() === val.trim().toLowerCase());
    if (t) {
      setOwnerPan(t.panCard || "");
      setOwnerAadhar(t.aadharNumber || "");
      setOwnerMobile(t.mobileNumber || "");
      setOwnerAccount(t.accountNumber || "");
    }
  };

  // Auto fill owner details on vehicle selection
  const handleVehicleSelect = (val: string) => {
    setVehicleNumber(val);
    const t = trucks.find((x) => x.vehicleNumber === val);
    if (t) {
      setOwnerName(t.ownerName || "");
      setOwnerPan(t.panCard || "");
      setOwnerAadhar(t.aadharNumber || "");
      setOwnerMobile(t.mobileNumber || "");
      setOwnerAccount(t.accountNumber || "");
    }
  };

  // Items editable table actions
  const addItem = () => {
    setItems([
      ...items,
      { cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" },
    ]);
  };

  const deleteItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof ChallanItem, value: string | number) => {
    setItems(
      items.map((item, i) => {
        if (i === idx) {
          return { ...item, [field]: value };
        }
        return item;
      }),
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!manualChallanNo.trim()) e.manualChallanNo = "Challan No is required";
    if (!challanNo.trim()) e.challanNo = "LR Number is required";
    if (!challanDate) e.challanDate = "Challan Date is required";
    if (!fromLocation.trim()) e.fromLocation = "From Location is required";
    if (!toLocation.trim()) e.toLocation = "To Location is required";
    if (!vehicleNumber.trim()) e.vehicleNumber = "Vehicle Number is required";
    if (!ownerAccount.trim()) e.ownerAccount = "Account Number is required";
    if (!brokerName.trim()) e.brokerName = "Broker Name is required";

    // Validate table items
    items.forEach((item, idx) => {
      if (!item.cnNo.trim()) {
        e[`cnNo_${idx}`] = "Serial No is required";
      }
    });

    const checkNum = (val: string, k: string, label: string) => {
      if (val.trim() !== "") {
        const n = parseFloat(val);
        if (isNaN(n)) e[k] = `${label} must be a valid number`;
        else if (n < 0) e[k] = `${label} cannot be negative`;
      }
    };
    checkNum(lorryHire, "lorryHire", "Lorry Hire");
    checkNum(freight, "freight", "Freight");
    checkNum(loadingMamul, "loadingMamul", "Loading Mamul");
    checkNum(rtoFine, "rtoFine", "RTO Fine");
    checkNum(extraCharges, "extraCharges", "Extra Charges");
    checkNum(lessAdvance, "lessAdvance", "Less Advance");

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveChallan = async (shouldPrint = false) => {
    if (isLocked) {
      if (shouldPrint) {
        window.print();
        toast.info("Printing Challan Note (Editing is locked).");
        return;
      }
      toast.error(
        `This Challan (CH #${manualChallanNo || challanNo}) is locked and cannot be edited because a Money Receipt has already been generated for it.`,
      );
      return;
    }

    if (!validate()) {
      toast.error("Please fill in all required fields and fix errors.");
      return;
    }

    const payload = {
      manualChallanNo,
      challanNo,
      challanDate,
      fromLocation,
      toLocation,
      vehicleNumber,
      items,
      ownerPan,
      ownerName,
      ownerAadhar,
      ownerAccount,
      ownerMobile,
      declarationAttached,
      driverName,
      driverMobile,
      dimLength,
      dimWidth,
      dimHeight,
      brokerPan,
      brokerName,
      brokerAadhar,
      brokerAccount,
      brokerMobile,
      lorryHire: Number(lorryHire || 0),
      freight: Number(freight || 0),
      loadingMamul: Number(loadingMamul || 0),
      comlyCom: Number(comlyCom || 0),
      rtoFine: Number(rtoFine || 0),
      extraCharges: Number(extraCharges || 0),
      tds: Number(tds || 0),
      tdsPercentage: tdsPercentage || "0%",
      lessAdvance: Number(lessAdvance || 0),
      commission: Number(commission || 0),
      balanceAmount: Number(balanceAmount || 0),
      payableAt,
      brokerNameSec5,
      status: isEdit && id ? editChallan?.status || "In Transit" : "In Transit",
    };

    try {
      const existing = challans.find(
        (c) => c.challanNo && c.challanNo.trim().toLowerCase() === challanNo.trim().toLowerCase(),
      );
      const targetChallan = editChallan || (id ? challans.find((c) => c.id === id) : null) || existing;

      // Trichy branch lorry hire limit check: cannot be higher than previously saved amount (admin can edit freely)
      if (!getIsAdmin() && targetChallan) {
        const prevLorryHire = Number(targetChallan.lorryHire || targetChallan.freight || 0);
        const currentLorryHire = Number(lorryHire || freight || 0);

        if (prevLorryHire > 0 && currentLorryHire > prevLorryHire) {
          toast.error(
            `Trichy Branch Restriction: Lorry Hire cannot be increased above previously saved amount of ₹${prevLorryHire.toLocaleString("en-IN")}. You can only keep it same or reduce it.`,
          );
          return;
        }
      }

      if (isEdit && id) {
        const success = await updateChallan(id, payload);
        if (success) {
          toast.success("Already Saved Record Updated!", {
            description: `Challan #${manualChallanNo || challanNo} changes have been updated successfully.`,
            duration: 4000,
          });
          if (shouldPrint) {
            setTimeout(() => {
              const handleAfterPrint = () => {
                navigate({ to: "/challan-records" });
              };
              window.addEventListener("afterprint", handleAfterPrint, { once: true });
              window.print();
            }, 300);
          } else {
            navigate({ to: "/challan-records" });
          }
        } else {
          toast.error("Failed to update Challan. Please try again.");
        }
      } else if (existing) {
        // Automatically perform update if it already exists (prevent duplicate code crashes)
        const success = await updateChallan(existing.id, payload);
        if (success) {
          toast.success("Already Saved Record Updated!", {
            description: `Challan #${manualChallanNo || challanNo} already exists — all changes have been updated successfully!`,
            duration: 4000,
          });
          if (shouldPrint) {
            setTimeout(() => {
              const handleAfterPrint = () => {
                navigate({ to: "/challan-records" });
              };
              window.addEventListener("afterprint", handleAfterPrint, { once: true });
              window.print();
            }, 300);
          } else {
            navigate({ to: "/challan-records" });
          }
        } else {
          toast.error("Failed to save Challan changes. Please try again.");
        }
      } else {
        const generatedNo = await addChallan(payload);
        if (generatedNo) {
          toast.success("New Challan Saved Successfully!", {
            description: `Challan #${generatedNo || manualChallanNo} has been created and saved.`,
            duration: 4000,
          });
          if (shouldPrint) {
            setTimeout(() => {
              const handleAfterPrint = () => {
                navigate({ to: "/challan-records" });
              };
              window.addEventListener("afterprint", handleAfterPrint, { once: true });
              window.print();
            }, 300);
          } else {
            navigate({ to: "/challan-records" });
          }
        } else {
          toast.error("Failed to create Challan. Please try again.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    }
  };

  const handleNewChallan = () => {
    navigate({ to: "/challan-note", search: { id: undefined } });
    setManualChallanNo(getNextManualChallanNo(challans));
    setChallanNo("");
    setChallanDate(todayStr);
    setFromLocation("");
    setToLocation("");
    setVehicleNumber("");
    setItems([{ cnNo: "", noOfPackages: 0, particulars: "", weight: 0, destination: "" }]);
    setOwnerPan("");
    setOwnerName("");
    setOwnerAadhar("");
    setOwnerAccount("");
    setOwnerMobile("");
    setDeclarationAttached("No");
    setDriverName("");
    setDriverMobile("");
    setDimLength("");
    setDimWidth("");
    setDimHeight("");
    setBrokerPan("");
    setBrokerName("");
    setBrokerAadhar("");
    setBrokerAccount("");
    setBrokerMobile("");
    setLorryHire("");
    setFreight("");
    setLoadingMamul("0");
    setComlyCom("0");
    setRtoFine("");
    setExtraCharges("");
    setTds("0.00");
    setTdsPercentage("0%");
    setLessAdvance("");
    setCommission("");
    setBalanceAmount("0.00");
    setPayableAt("");
    setBrokerNameSec5("");
    setErrors({});
    toast.success("Form cleared successfully.");
  };

  const handleCancel = () => {
    navigate({ to: "/challan-records" });
  };

  return (
    <div className="w-full space-y-6" style={{ zoom: 1.1 }}>
{/* ── COMPANY HEADER BANNER ── */}
<div className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 print:hidden mb-6">
  <img src="/logo.png" alt="JRKS Logo" className="h-32 w-32 object-contain flex-shrink-0" style={{ clipPath: "inset(2px 0 0 0)" }} />
  <div>
    <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A]">JRKS DIGITAL INDIA LOGISTICS LLP</h2>
    <p className="text-xs font-bold text-blue-600 leading-none">(Transport Contractor & Logistics Solutions)</p>
    <p className="text-xs font-semibold text-slate-500 leading-tight mt-1.5 whitespace-nowrap">No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post), Trichy - 620 019.</p>
    <p className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 leading-tight mt-1.5 flex-wrap">
      <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Office: 0431-4518283</span>
      <span className="text-slate-300">|</span>
      <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-green-500"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg> WhatsApp: +91 97906 05938</span>
      <span className="text-slate-300">|</span>
      <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-blue-400"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg> Contact: +91 93645 95075</span>
    </p>
  </div>
</div>

      {/* ── TOP HEADER & ACTIONS ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Challan Note</h1>
          <p className="text-sm font-medium text-slate-500">
            Create and manage transport challan notes.
          </p>
        </div>
      </div>

      {!!isLocked && (
        <div className="flex items-center gap-3.5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 shadow-sm animate-in fade-in print:hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
              Challan is Locked
            </h3>
            <p className="text-xs font-semibold text-amber-800 mt-0.5">
              This Challan (CH #{manualChallanNo || challanNo || editChallan?.challanNo}) is locked and cannot be modified because a Money Receipt has already been created for it.
            </p>
          </div>
        </div>
      )}

      {/* ── FORM SECTIONS ──────────────────────────────────── */}
      <form onSubmit={(e) => e.preventDefault()} className="w-full space-y-6 pb-28">
        <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-80">
        {/* SECTION 1 — CHALLAN INFORMATION */}
        <SectionCard title="1. Challan Information" icon={<FileText className="h-5 w-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
            <FloatingLabelInput
              label="LR Number"
              value={challanNo}
              onChange={setChallanNo}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchLrDetails(challanNo);
                }
              }}
              placeholder="Enter LR Number"
              required
              error={errors.challanNo}
            />
            <FloatingLabelInput
              label="Challan No"
              value={manualChallanNo}
              onChange={setManualChallanNo}
              placeholder="Enter the Challan No"
              required
              error={errors.manualChallanNo}
            />
            <FloatingLabelDatePicker
              label="Challan Date"
              value={challanDate}
              onChange={setChallanDate}
              required
              error={errors.challanDate}
            />
            <FloatingLabelInput
              label="From Location"
              value={fromLocation}
              onChange={setFromLocation}
              placeholder="Enter departure city"
              required
              error={errors.fromLocation}
            />
            <FloatingLabelInput
              label="To Location"
              value={toLocation}
              onChange={setToLocation}
              placeholder="Enter destination"
              required
              error={errors.toLocation}
            />
            <FloatingLabelInput
              label="Vehicle Number"
              value={vehicleNumber}
              onChange={handleVehicleSelect}
              placeholder="Enter vehicle number"
              required
              error={errors.vehicleNumber}
            />
          </div>
        </SectionCard>

        {/* SECTION 2 — PACKAGE & PARTICULARS */}
        <SectionCard title="2. Package & Particulars" icon={<FileText className="h-5 w-5" />}>
          <div className="overflow-x-auto w-full border border-slate-100 rounded-xl">
            <table className="w-full border-collapse text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] w-[15%]">
                    LR Number
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] w-[12%]">
                    No. of Packages
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] w-[48%]">
                    Particulars
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] w-[12%]">
                    Weight
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] w-[13%]">
                    Destination
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-center text-red-600 w-[70px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.cnNo}
                        onChange={(e) => updateItem(idx, "cnNo", e.target.value)}
                        placeholder="LR Number"
                        className={cn(
                          "w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600",
                          errors[`cnNo_${idx}`] && "border-red-500 ring-1 ring-red-500/10",
                        )}
                      />
                      {errors[`cnNo_${idx}`] && (
                        <p className="text-[10px] text-red-500 font-bold mt-0.5">
                          {errors[`cnNo_${idx}`]}
                        </p>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.noOfPackages || ""}
                        onChange={(e) => updateItem(idx, "noOfPackages", Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.particulars}
                        onChange={(e) => updateItem(idx, "particulars", e.target.value)}
                        placeholder="Description"
                        className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={item.weight || ""}
                        onChange={(e) => updateItem(idx, "weight", Number(e.target.value))}
                        placeholder="0.00"
                        className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.destination}
                        onChange={(e) => updateItem(idx, "destination", e.target.value)}
                        placeholder="Destination"
                        className="w-full px-2.5 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteItem(idx)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Row"
                        disabled={items.length === 1}
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-extrabold border-t border-slate-200">
                  <td className="px-4 py-3 text-xs font-black text-slate-500 text-right">Total:</td>
                  <td className="px-4 py-3 text-xs font-black text-[#1E3A8A]">{totalPackages}</td>
                  <td></td>
                  <td className="px-4 py-3 text-xs font-black text-[#1E3A8A]">
                    {totalWeight.toFixed(2)}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/20 hover:bg-blue-50/50 px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            + Add Row
          </button>
        </SectionCard>

        {/* SECTION 3 — OWNER DETAILS */}
        <SectionCard title="3. Owner Details" icon={<Truck className="h-5 w-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
                Owner Name
              </label>
              <Select value={ownerName} onValueChange={handleOwnerNameChange}>
                <SelectTrigger className="w-full rounded-lg border border-slate-200 bg-white px-4 h-10 transition-all duration-200">
                  <span className="truncate pointer-events-none text-left">
                    {ownerName ? (
                      ownerName
                    ) : (
                      <span className="text-slate-400">Select Owner Name</span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {ownerName && !ownerOptions.includes(ownerName) && (
                    <SelectItem value={ownerName}>{ownerName}</SelectItem>
                  )}
                  {ownerOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FloatingLabelInput
              label="PAN Card Number"
              value={ownerPan}
              onChange={setOwnerPan}
              placeholder="Enter Owner PAN"
            />
            <FloatingLabelInput
              label="Aadhaar Number"
              value={ownerAadhar}
              onChange={setOwnerAadhar}
              placeholder="Enter Aadhaar Number"
            />
            <FloatingLabelInput
              label="Account Number"
              value={ownerAccount}
              onChange={setOwnerAccount}
              placeholder="Enter Account Number"
              required
              error={errors.ownerAccount}
            />
            <FloatingLabelInput
              label="Mobile Number"
              value={ownerMobile}
              onChange={setOwnerMobile}
              placeholder="Enter Mobile Number"
            />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
                Declaration Attached
              </label>
              <div
                className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1"
                style={{ minHeight: "44px" }}
              >
                <button
                  type="button"
                  onClick={() => setDeclarationAttached("Yes")}
                  className={cn(
                    "flex-1 text-xs font-extrabold py-2 rounded-lg transition-all cursor-pointer",
                    declarationAttached === "Yes"
                      ? "bg-[#1E3A8A] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setDeclarationAttached("No")}
                  className={cn(
                    "flex-1 text-xs font-extrabold py-2 rounded-lg transition-all cursor-pointer",
                    declarationAttached === "No"
                      ? "bg-[#1E3A8A] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  No
                </button>
              </div>
            </div>
            <FloatingLabelInput
              label="Driver Name"
              value={driverName}
              onChange={setDriverName}
              placeholder="Enter Driver Name"
            />
            <FloatingLabelInput
              label="Driver Mobile Number"
              value={driverMobile}
              onChange={setDriverMobile}
              placeholder="Enter Driver Mobile"
            />
          </div>

          <div className="border-t border-slate-100 pt-5 mt-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A] mb-3">
              Vehicle Dimensions
            </h3>
            <div className="grid grid-cols-3 gap-4 max-w-sm">
              <FloatingLabelInput
                label="Length (L)"
                value={dimLength}
                onChange={setDimLength}
                placeholder="L"
              />
              <FloatingLabelInput
                label="Width (B)"
                value={dimWidth}
                onChange={setDimWidth}
                placeholder="B"
              />
              <FloatingLabelInput
                label="Height (H)"
                value={dimHeight}
                onChange={setDimHeight}
                placeholder="H"
              />
            </div>
          </div>
        </SectionCard>

        {/* SECTION 4 — BROKER NAME */}
        <SectionCard title="4. Broker Name" icon={<Handshake className="h-5 w-5" />}>
          <div className="w-full">
            <FloatingLabelSelect
              label="Broker Name"
              value={brokerNameSec5}
              onChange={handleBrokerSec5Select}
              options={brokerOptions}
              placeholder="Select Broker Name"
            />
          </div>
        </SectionCard>

        {/* SECTION 5 — BROKER DETAILS */}
        <SectionCard title="5. Broker Details" icon={<Handshake className="h-5 w-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <FloatingLabelInput
              label="PAN Card Number"
              value={brokerPan}
              onChange={setBrokerPan}
              placeholder="Enter Broker PAN"
            />
            <FloatingLabelSelect
              label="Broker Name"
              value={brokerName}
              onChange={handleBrokerSelect}
              options={brokerOptions}
              placeholder="Select Broker Name"
              required
              error={errors.brokerName}
            />
            <FloatingLabelInput
              label="Aadhaar Number"
              value={brokerAadhar}
              onChange={setBrokerAadhar}
              placeholder="Enter Broker Aadhaar"
            />
            <FloatingLabelInput
              label="Account Number"
              value={brokerAccount}
              onChange={setBrokerAccount}
              placeholder="Enter Account Number"
            />
            <FloatingLabelInput
              label="Mobile Number"
              value={brokerMobile}
              onChange={setBrokerMobile}
              placeholder="Enter Mobile Number"
            />

            {(() => {
              const isAdmin = getIsAdmin();
              const targetChallan =
                editChallan || (id ? challans.find((c) => c.id === id) : null);
              const prevHireAmt = targetChallan?.lorryHire
                ? Number(targetChallan.lorryHire)
                : targetChallan?.freight
                  ? Number(targetChallan.freight)
                  : undefined;
              const isRestricted =
                !isAdmin &&
                Boolean(targetChallan) &&
                prevHireAmt !== undefined &&
                prevHireAmt > 0;

              return (
                <FloatingLabelInput
                  label="Lorry Hire"
                  value={lorryHire}
                  onChange={setLorryHire}
                  onBlur={(e) => {
                    if (isRestricted && prevHireAmt !== undefined) {
                      const val = Number(e.target.value) || 0;
                      if (val > prevHireAmt) {
                        toast.warning(
                          `Trichy Branch: Lorry Hire cannot be higher than previous amount of ₹${prevHireAmt.toLocaleString("en-IN")}.`,
                        );
                        setLorryHire(prevHireAmt.toString());
                      }
                    }
                  }}
                  placeholder={isRestricted ? `Max: ₹${prevHireAmt}` : "0.00"}
                  prefix="₹"
                  type="number"
                  error={errors.lorryHire}
                />
              );
            })()}


            <FloatingLabelInput
              label="Loading Mamul"
              value={loadingMamul}
              onChange={setLoadingMamul}
              placeholder="0.00"
              prefix="₹"
              type="number"
              error={errors.loadingMamul}
            />
            <FloatingLabelSelect
              label="CHALLAN MAMUL"
              value={comlyCom}
              onChange={setComlyCom}
              options={["0", "200", "500"]}
              placeholder="Select CHALLAN MAMUL"
            />
            <FloatingLabelInput
              label="RTO Fine"
              value={rtoFine}
              onChange={setRtoFine}
              placeholder="0.00"
              prefix="₹"
              type="number"
              error={errors.rtoFine}
            />
            <FloatingLabelInput
              label="Extra Charges"
              value={extraCharges}
              onChange={setExtraCharges}
              placeholder="0.00"
              prefix="₹"
              type="number"
              error={errors.extraCharges}
            />
            <FloatingLabelSelect
              label="TDS"
              value={tdsPercentage}
              onChange={setTdsPercentage}
              options={["0%", "1%", "2%"]}
              placeholder="Select TDS %"
            />
            <FloatingLabelInput
              label="Less Advance"
              value={lessAdvance}
              onChange={setLessAdvance}
              placeholder="0.00"
              prefix="₹"
              type="number"
              error={errors.lessAdvance}
            />
            <FloatingLabelInput
              label="Balance Amount"
              value={balanceAmount}
              readOnly
              placeholder="0.00"
              prefix="₹"
              type="number"
            />
            <FloatingLabelInput
              label="Payable At"
              value={payableAt}
              onChange={setPayableAt}
              placeholder="Enter Payable City"
            />
          </div>
        </SectionCard>
        </fieldset>

        {/* FOOTER ACTIONS - Sticky bar */}
        <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg print:hidden">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNewChallan}
              className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              <RotateCcw className="h-4.5 w-4.5" /> Clear Form
            </button>
            <button
              type="button"
              onClick={() => handleSaveChallan(false)}
              className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-[#1E3A8A] hover:bg-blue-800 text-white cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => handleSaveChallan(true)}
              className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-[#1E3A8A] hover:bg-blue-800 text-white cursor-pointer"
            >
              <Printer className="h-4.5 w-4.5" /> Save & Print
            </button>
          </div>
        </div>
      </form>

      {/* SCOPED PRINT STYLES */}
      <style>{`
        .copy-page {
          margin-bottom: 2rem;
        }
        .copy-page:last-child {
          margin-bottom: 0;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          /* Hide sidebar, top navigation, print buttons, and form panel */
          aside, header, nav, .print\\:hidden, button, form {
            display: none !important;
          }
          main, body, html {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          .lg\\:pl-\\[254\\.5px\\] {
            padding-left: 0 !important;
          }
          .w-full {
            zoom: 1 !important;
          }
          .challan-print-panel {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .copy-page {
            position: relative !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 284mm !important;
            width: 100% !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .copy-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .challan-print-paper {
            border: 2px solid black !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 200mm !important;
            height: auto !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            background: white !important;
            color: black !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .particulars-table {
            border-collapse: collapse !important;
            border: none !important;
            width: 100% !important;
          }
          .particulars-table thead tr th {
            background-color: white !important;
            color: black !important;
            border-top: 1px solid black !important;
            border-bottom: 1px solid black !important;
            border-left: none !important;
            border-right: 1px solid black !important;
            font-weight: bold !important;
          }
          .particulars-table thead tr th:last-child {
            border-right: none !important;
          }
          .particulars-table tbody tr {
            height: 33px !important;
          }
          .particulars-table tbody tr td {
            background-color: white !important;
            color: black !important;
            border-bottom: 1px solid black !important;
            border-left: none !important;
            border-right: 1px solid black !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          .particulars-table tbody tr td:last-child {
            border-right: none !important;
          }
          .particulars-table tbody tr:last-child,
          .particulars-table tbody tr:last-child td {
            border-bottom: none !important;
          }
          .details-table {
            border-collapse: collapse !important;
            border: none !important;
            width: 100% !important;
          }
          .details-table thead tr th {
            background-color: white !important;
            color: black !important;
            border-top: 1px solid black !important;
            border-bottom: 1px solid black !important;
            font-weight: bold !important;
          }
          .details-table thead tr th.border-right-split {
            border-right: 1px solid black !important;
          }
          .details-table tbody tr td {
            background-color: white !important;
            color: black !important;
            border-bottom: 1px solid black !important;
            padding-top: 3.5px !important;
            padding-bottom: 3.5px !important;
          }
          .details-table tbody tr td.border-right-split {
            border-right: 1px solid black !important;
          }
          .thick-border-b {
            border-bottom: 1px solid black !important;
          }
          .challan-header-divider {
            border-bottom: 1px solid black !important;
          }
          .route-strip-divider {
            border-bottom: none !important;
          }
          .signatures-divider {
            border-bottom: 1px solid black !important;
            padding-top: 14px !important;
            padding-bottom: 8px !important;
          }
          .dimensions-box {
            border: 1px solid black !important;
          }
        }
      `}</style>

      {/* Challan Print Preview (only shown in print) */}
      <div className="challan-print-panel hidden print:block w-full">
        {CHALLAN_COPIES.map((copyName) => (
          <div key={copyName} className="copy-page">
            <div className="challan-print-paper bg-white text-black font-sans text-[12.5px] leading-tight select-none relative flex flex-col">
              {/* Main content wrapper */}
              <div className="flex flex-col">
                {/* SUBJECT JURISDICTION BAR */}
                <div className="text-center text-[10.5px] pt-1 pb-0.5 text-black uppercase tracking-wider font-extrabold">
                  <div className="font-bold"> CHALLAN NOTE</div>
                  All Subject to Trichy Jurisdiction
                </div>
                {/* Header section with left logo, center info, and right phones */}
                <div className="flex flex-col pt-0.5 pb-2 px-2 border-b border-black challan-header-divider">
                  <div className="grid grid-cols-[85px_1fr_105px] items-center">
                    <div className="flex justify-start items-center">
                      <img
                        src={logo}
                        alt="JRKS Logo"
                        className="w-[80px] h-[80px] object-contain"
                        style={{ filter: "grayscale(100%) contrast(1.2)" }}
                      />
                    </div>

                    <div className="text-center flex flex-col justify-center px-1">
                      <h1 className="text-[26px] font-black tracking-tighter text-black leading-none m-0 uppercase font-serif whitespace-nowrap">
                        JRKS DIGITAL INDIA LOGISTICS LLP
                      </h1>
                      <p className="text-[13px] font-bold leading-normal m-0 mt-1">
                        (Transport Contractor & Logistics Solutions)
                      </p>
                    </div>

                    <div className="text-right text-[13px] font-black flex flex-col justify-center gap-1.5 leading-none font-mono pr-1">
                      <span>97906 05938</span>
                      <span>93645 95075</span>
                      <span>72062 82936</span>
                    </div>
                  </div>

                  <div className="text-center -mt-3 relative z-10 px-4">
                    <p className="text-[11.5px] font-extrabold leading-normal m-0">
                      No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street,
                    </p>
                    <p className="text-[11.5px] font-extrabold leading-normal m-0 mt-0.5">
                      Kattur (Post), Trichy - 620 019. &nbsp;&nbsp;&nbsp;&nbsp;
                      <a
                        href="https://jrkslogistics.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black underline font-bold"
                      >
                        https://jrkslogistics.in
                      </a>
                    </p>
                  </div>
                </div>

                {/* Challan details strip */}
                <div className="grid grid-cols-[1.5fr_1fr] py-2 px-6 text-[13.5px] font-bold">
                  <div>
                    Challan No.{" "}
                    <span className="font-extrabold text-[14.5px] pl-1 font-mono">
                      {manualChallanNo || challanNo || "________________"}
                    </span>
                  </div>
                  <div className="text-right">
                    Date :{" "}
                    <span className="border-b border-dotted border-black font-mono font-bold px-2">
                      {challanDate ? formatDate(challanDate) : formatDate(todayStr)}
                    </span>
                  </div>
                </div>

                {/* Route and vehicle strip */}
                <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr] gap-1 items-center py-2 px-6 border-b border-black route-strip-divider text-[13.5px] font-bold">
                  <span>Ex</span>
                  <span className="border-b border-dotted border-black font-mono font-bold px-2 truncate">
                    {fromLocation || "________________"}
                  </span>
                  <span>to</span>
                  <span className="border-b border-dotted border-black font-mono font-bold px-2 truncate">
                    {toLocation || "________________"}
                  </span>
                  <span>Vehicle</span>
                  <span className="border-b border-dotted border-black font-mono font-bold px-2 truncate uppercase">
                    {vehicleNumber || "________________"}
                  </span>
                </div>

                {/* Particulars Table */}
                <div>
                  <table className="particulars-table w-full border-collapse text-[12.5px] text-left border-b border-black">
                    <thead>
                      <tr>
                        <th className="border-r border-black px-3 py-1 font-bold text-black text-center w-[10%] thick-border-b">
                          LR No
                        </th>
                        <th className="border-r border-black px-3 py-1 font-bold text-black text-center w-[12%] thick-border-b">
                          No. of Packages
                        </th>
                        <th className="border-r border-black px-3 py-1 font-bold text-black text-center w-[53%] thick-border-b">
                          Particulars
                        </th>
                        <th className="border-r border-black px-3 py-1 font-bold text-black text-right w-[15%] thick-border-b">
                          Wt.
                        </th>
                        <th className="px-3 py-1 font-bold text-black text-center w-[10%] thick-border-b">
                          Destination
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const item = items[idx];
                        const isLastRow = idx === 5;
                        const cellClass = isLastRow ? "thick-border-b" : "";
                        return (
                          <tr key={idx} className="border-b border-black h-[35px] min-h-[35px]">
                            <td
                              className={`border-r border-black px-3 py-1 font-mono text-center align-middle ${cellClass}`}
                            >
                              {item ? item.cnNo || "" : ""}
                            </td>
                            <td
                              className={`border-r border-black px-3 py-1 text-center font-semibold align-middle ${cellClass}`}
                            >
                              {item ? item.noOfPackages || "" : ""}
                            </td>
                            <td
                              className={`border-r border-black px-3 py-1 align-middle ${cellClass}`}
                            >
                              {item ? item.particulars || "" : ""}
                            </td>
                            <td
                              className={`border-r border-black px-3 py-1 text-right font-mono font-semibold align-middle ${cellClass}`}
                            >
                              {item ? (item.weight ? Number(item.weight).toFixed(2) : "") : ""}
                            </td>
                            <td className={`px-3 py-1 text-center align-middle ${cellClass}`}>
                              {item ? item.destination || "" : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Details Table - connecting internal lines of Owner & Broker details */}
                <table className="details-table w-full border-collapse text-[12.5px] text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="border-right-split w-1/2 px-4 py-2 text-center font-black text-black uppercase tracking-wider text-[13px]">
                        Owner Details
                      </th>
                      <th className="w-1/2 px-4 py-2 text-center font-black text-black uppercase tracking-wider text-[13px]">
                        Broker Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border-right-split w-1/2 px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">PAN Card No.</span>
                          <span>:</span>
                          <span className="font-mono">{ownerPan || "-"}</span>
                        </div>
                      </td>
                      <td className="w-1/2 px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">PAN Card No.</span>
                          <span>:</span>
                          <span className="font-mono">{brokerPan || "-"}</span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Name</span>
                          <span>:</span>
                          <span className="font-semibold">{ownerName || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Name</span>
                          <span>:</span>
                          <span className="font-semibold">{brokerName || "-"}</span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Aadhar No.</span>
                          <span>:</span>
                          <span>{ownerAadhar || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Aadhar No.</span>
                          <span>:</span>
                          <span>{brokerAadhar || "-"}</span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Account No.</span>
                          <span>:</span>
                          <span>{ownerAccount || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Account No.</span>
                          <span>:</span>
                          <span>{brokerAccount || "-"}</span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Mobile No.</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14.5px]">
                            {ownerMobile || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Mobile No.</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14.5px]">
                            {brokerMobile || "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Declaration Attached</span>
                          <span>:</span>
                          <span className="font-bold">
                            {declarationAttached ? declarationAttached.toUpperCase() : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Lorry Hire</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14.5px]">
                            {lorryHire ? Number(lorryHire).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Driver Name</span>
                          <span>:</span>
                          <span className="font-semibold">{driverName || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Loading Mamul</span>
                          <span>:</span>
                          <span className="font-mono">
                            {loadingMamul ? Number(loadingMamul).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Driver Mobile No.</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14.5px]">
                            {driverMobile || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">RTO Fine</span>
                          <span>:</span>
                          <span className="font-mono">
                            {rtoFine ? Number(rtoFine).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td rowSpan={5} className="border-right-split px-4 py-1.5 align-middle">
                        <div className="flex flex-col justify-center h-full my-1">
                          <div className="border border-black dimensions-box text-[11px] bg-slate-50/50">
                            <div className="grid grid-cols-5 text-center font-bold border-b border-black py-1">
                              <span>L</span>
                              <span>x</span>
                              <span>B</span>
                              <span>x</span>
                              <span>H</span>
                            </div>
                            <div className="grid grid-cols-5 text-center font-mono font-bold py-1.5">
                              <span>{dimLength || "-"}</span>
                              <span>x</span>
                              <span>{dimWidth || "-"}</span>
                              <span>x</span>
                              <span>{dimHeight || "-"}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Extra</span>
                          <span>:</span>
                          <span className="font-mono">
                            {extraCharges ? Number(extraCharges).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">TDS</span>
                          <span>:</span>
                          <span className="font-mono">{tds ? Number(tds).toFixed(2) : "-"}</span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Less Advance</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14px]">
                            {lessAdvance ? Number(lessAdvance).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">CHALLAN MAMUL</span>
                          <span>:</span>
                          <span className="font-mono font-bold text-[14px]">
                            {Number(comlyCom) > 0 ? Number(comlyCom).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-4 py-1.5">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Balance</span>
                          <span>:</span>
                          <span className="font-mono font-black text-[14.5px]">
                            {balanceAmount ? Number(balanceAmount).toFixed(2) : "-"}
                          </span>
                        </div>
                      </td>
                    </tr>

                    <tr>
                      <td className="border-right-split px-4 py-1.5 align-middle thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Broker Name</span>
                          <span>:</span>
                          <span className="font-semibold">
                            {brokerNameSec5 || brokerName || ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-1.5 thick-border-b">
                        <div className="grid grid-cols-[130px_10px_1fr] items-center">
                          <span className="font-bold">Payable at</span>
                          <span>:</span>
                          <span className="font-semibold">{payableAt || ""}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom container containing Signatures and Footer Terms - always visible */}
              <div className="flex flex-col border-t border-black">
                {/* Signatures divider and layout */}
                <div className="grid grid-cols-2 pt-4 pb-2 px-6 border-b border-black signatures-divider text-[13px] font-bold text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-normal text-slate-400">
                      ....................................................................................
                    </span>
                    <span className="mt-1">Driver's / Broker's Signature</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-normal text-slate-400">
                      ....................................................................................
                    </span>
                    <span className="mt-1">Despatching Incharge</span>
                  </div>
                </div>

                {/* Footer Terms - placed snugly at bottom */}
                <div className="px-6 pt-2 pb-4 text-[10.5px] leading-relaxed space-y-0.5 text-black">
                  <div>
                    1. Goods once will be delivered to party godown according to the instruction of
                    our destination office.
                  </div>
                  <div>2. No. unloading on Saturday, Holiday &amp; after Office Hours.</div>
                  <div>
                    3. All the risk in the way of the lorry bear by Owner / Driver
                    Agent......................................................
                  </div>
                </div>
              </div>
            </div>
            {/* IN THE END OUTSIDE THE OVERALL BORDER MENTION THE COPY NAME */}
            <div className="text-center font-bold text-[13px] uppercase mt-2 tracking-widest text-black">
              ({copyName})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
