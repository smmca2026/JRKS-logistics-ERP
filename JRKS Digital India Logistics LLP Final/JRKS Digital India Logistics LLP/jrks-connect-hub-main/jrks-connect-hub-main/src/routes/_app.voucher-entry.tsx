import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  BookOpen,
  Calendar,
  Save,
  Trash2,
  Plus,
  ArrowLeft,
  Eye,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Layers,
  Scale,
  Phone,
  MessageCircle,
  Smartphone,
  RotateCcw,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore, type Voucher, type VoucherItem } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
import { PageHeader, TableCard } from "@/components/master-ui";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/voucher-entry")({
  validateSearch: (search: Record<string, unknown>) => ({
    editId: (search.editId as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Voucher Entry — JRKS Logistics ERP" },
      { name: "description", content: "Create and manage voucher entries." },
    ],
  }),
  component: VoucherEntryPage,
});
const EXPENSE_CODES = [
  { code: "1", name: "L H ADVANCE EXP.", description: "LORRY HIRE ADVANCE, DIESEL AMOUNT" },
  { code: "2", name: "L H BALANCE EXP.", description: "LORRY HIRE BALANCE" },
  { code: "3", name: "RTO FINE EXP.", description: "ODC LOAD RTO FINE ON LINE FINE ONLY" },
  { code: "4", name: "LOADING EXP.", description: "VEHICLE LOADING AMOUNT" },
  { code: "5", name: "SALARY EXP.", description: "STAFF, MANAGER, OWNER, PARTNER SALARY" },
  { code: "6", name: "CASH WITH DRAWL EXP.", description: "CASH WITHDRAWL BY CHEQUE OR ATM OR QR CODE" },
  { code: "7", name: "SELF TRANSFER EXP.", description: "SELF ACCOUNT TRANSFER ANY BANK TO ANY BANK" },
  { code: "8", name: "HALTING (DETENTION) EXP.", description: "DETENTION AT LOADING OR UNLOADING POINT" },
  { code: "9", name: "HAND LOAN EXP.", description: "IF TAKEN HAND LOAN FROM BANK, CREDIT CARD OR FINANCER" },
  { code: "10", name: "HAND LOAN RETURN EXP.", description: "LOAN RETURN TO BANK OR OTHERS PERSON" },
  { code: "11", name: "INTEREST & EMI EXP.", description: "HAND LOAN INTEREST, CREDIT CARD EMI" },
  { code: "12", name: "OFFICE MAINTENANCE EXP.", description: "OFFICE MAINTENANCE , SWEEPER, WATER, ANY PURCHASE FOR OFFICE USE" },
  { code: "13", name: "OFFICE RENT EXP.", description: "OFFICE RENT ONLY" },
  { code: "14", name: "HOUSE RENT EXP.", description: "STAFF, MANAGER, OWNER, HOUSE RENT ALLOWANCE" },
  { code: "15", name: "ELECTRICITY BILL EXP.", description: "OFFICE ELECTRICITY, HOUSE ELECTRICITY BILL ONLY." },
  { code: "16", name: "TELEPHONE & MOBILE EXP.", description: "OFFICE TELEPHONE , WIFI BILL, STAFF, MANAGER, OWNER, MOBILE RECHARGE" },
  { code: "17", name: "COMPUTER SERVICE EXP.", description: "OFFICE COMPUTERS, LAPTOPS, PRINTERS REPAIR OR NEW PURCHASE" },
  { code: "18", name: "GPS RECHARGE (ROADO) EXP.", description: "GPS RECHARGE ONLY" },
  { code: "19", name: "AUDITING FEES EXP.", description: "AUDITOR FEES ONLY" },
  { code: "20", name: "BANK CHARGES EXP.", description: "CHEQUE BOOK, STATEMENT, ATM CHARGE, MESSAGE ALERT, RTGS/ NEFT DEBIT BY BANK" },
  { code: "21", name: "UNLOADING EXP.", description: "VEHICLE UNLOADING AMOUNT" },
  { code: "22", name: "POSTAGE & COURIER EXP.", description: "POST, SPEED POST, REGISTRY, AND COURIER EXP." },
  { code: "23", name: "PETROL & BIKE EXP.", description: "PETROL, BIKE SERVICE, OR NEW PURCHASE EXP." },
  { code: "24", name: "LOCAL CONVENIENCE EXP.", description: "LOCAL BUS, AUTO, TAXI EXP.," },
  { code: "25", name: "TRAVELLING EXP.", description: "BUS, RAIL, AIR TICKET, HOTEL BILL, BREAKFAST, LUNCH, DINNER BILL DURING TRAVELLING TIME ETC" },
  { code: "26", name: "MISCELLANEOUS EXP.", description: "OTHERS EXPENSES" },
  { code: "27", name: "TEA, COFFEE EXP.", description: "TEA SNACKS LUNCH DINNER EXP." },
  { code: "28", name: "POOJA EXP.", description: "OFFICE DAILY PUJA, AYUDHPUJA, DIWALI PUJA EXP." },
  { code: "29", name: "XEROX & PRINTING EXP.", description: "XEROX AND STATIONERY PRINTING" },
  { code: "30", name: "STAFF WELFARE EXP.", description: "STAFF MEDICAL EXP. , UNIFORM AND BONUS OTHERS EXP." },
  { code: "31", name: "BUSINESS DEVELOPMENT EXP.", description: "COMMISSION ETC" },
  { code: "32", name: "TRTA SUBSCRIPTION EXP.", description: "TRTA SUBSCRIPTION AND OTHER SUBSCRIPTION" },
  { code: "33", name: "DONATION EXP.", description: "DONATION FOR ANY FESTIVAL, PUJA, GOUSALA, TEMPLE , PONGAL VIZHA" },
];

const defaultItemRow = (sNo: number): VoucherItem => ({
  sNo,
  codeNo: "",
  expenseAccountName: "",
  description: "",
  refNo: "",
  chequeDkNo: "",
  modeOfPayment: "",
  payment: 0,
  creditDebit: "",
});

// Utility to convert numbers to Indian words
function numberToWords(num: number): string {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 0) return "Minus " + convert(Math.abs(n));
    let str = "";
    if (n > 9999999) {
      str += convert(Math.floor(n / 10000000)) + "Crore ";
      n %= 10000000;
    }
    if (n > 99999) {
      str += convert(Math.floor(n / 100000)) + "Lakh ";
      n %= 100000;
    }
    if (n > 999) {
      str += convert(Math.floor(n / 1000)) + "Thousand ";
      n %= 1000;
    }
    if (n > 99) {
      str += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) str += a[n];
      else {
        str += b[Math.floor(n / 10)];
        if (n % 10 > 0) str += " " + a[n % 10];
        else str += " ";
      }
    }
    return str.trim() + " ";
  }

  if (num === 0) return "Zero";
  return "Rupees " + convert(Math.floor(num)).trim() + " Only";
}

import { getIsAdmin } from "@/lib/auth";

function VoucherEntryPage() {
  const isAdmin = getIsAdmin();

  const { editId } = Route.useSearch();
  const navigate = useNavigate();
  const { vouchers, voucherCodes, consignmentNotes, challans, bookings, addVoucher, updateVoucher, nextVoucherNo, loadData, loadVoucherCodes } = useOpsStore();
  const { brokers, loadData: loadMasters } = useMasterStore();

  useEffect(() => {
    loadData();
    loadVoucherCodes();
    loadMasters();
  }, [loadData, loadVoucherCodes, loadMasters]);

  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Form states
  const branch = "Trichy";
  const [manualVoucherNo, setManualVoucherNo] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState("");
  const [narration, setNarration] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [items, setItems] = useState<VoucherItem[]>([defaultItemRow(1)]);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const prevEditIdRef = useRef(editId);

  // Dynamic Credit/Debit detection from items
  const isCredit = useMemo(() => {
    return items.some((i) => (i.creditDebit || "").toLowerCase() === "credit");
  }, [items]);

  const isDebit = useMemo(() => {
    return items.some((i) => (i.creditDebit || "").toLowerCase() === "debit");
  }, [items]);

  // Sync editId parameter from URL to selectedVoucher state
  useEffect(() => {
    if (editId !== prevEditIdRef.current) {
      if (!editId) {
        setSelectedVoucher(null);
      }
      prevEditIdRef.current = editId;
    }

    if (editId) {
      const matched = vouchers.find((v) => String(v.id) === String(editId));
      if (matched && matched.id !== selectedVoucher?.id) {
        setSelectedVoucher(matched);
      }
    }
  }, [editId, vouchers]);

  // Auto-generate voucher number VR-1001 on mount if creating new voucher
  useEffect(() => {
    if (!editId && !selectedVoucher && (!manualVoucherNo || !manualVoucherNo.startsWith("VR-"))) {
      setManualVoucherNo(nextVoucherNo());
    }
  }, [vouchers, editId, selectedVoucher, manualVoucherNo, nextVoucherNo]);

  // Load a selected voucher into form or reset
  useEffect(() => {
    if (selectedVoucher) {
      setManualVoucherNo(selectedVoucher.manualVoucherNo || "");
      setVoucherNo(selectedVoucher.voucherNo);
      setVoucherDate(selectedVoucher.voucherDate);
      setNarration(selectedVoucher.narration);
      setPaidTo(selectedVoucher.paidTo || "");
      setReceivedFrom(selectedVoucher.receivedFrom || "");
      setItems(selectedVoucher.items || [defaultItemRow(1)]);
      setErrors({});
    } else {
      const todayISO = new Date().toISOString().slice(0, 10);
      setVoucherDate(todayISO);
      setManualVoucherNo(nextVoucherNo());
      setNarration("");
      setPaidTo("");
      setReceivedFrom("");
      setItems([defaultItemRow(1)]);
      setErrors({});
    }
  }, [selectedVoucher, nextVoucherNo]);

  // Reset form helper
  const handleResetForm = () => {
    navigate({ to: "/voucher-entry", search: { editId: undefined } });
    setSelectedVoucher(null);
    setManualVoucherNo(nextVoucherNo());
    setVoucherNo("");
    setNarration("");
    setPaidTo("");
    setReceivedFrom("");
    setItems([defaultItemRow(1)]);
    setErrors({});
  };

  // Dynamic Ledger Row operations
  const handleAddItemRow = () => {
    const nextSNo = items.length + 1;
    setItems([...items, defaultItemRow(nextSNo)]);

    // Auto-focus Code No of new row
    setTimeout(() => {
      const nextEl = document.getElementById(`input-${items.length}-codeNo`);
      nextEl?.focus();
    }, 50);
  };

  const handleDeleteItemRow = (index: number) => {
    if (items.length > 1) {
      const updated = items
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, sNo: idx + 1 }));
      setItems(updated);

      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof VoucherItem,
    value: string | number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const matchLr = (a?: string | null, b?: string | null) => {
    if (!a || !b) return false;
    const cleanA = a.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanB = b.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cleanA === cleanB && cleanA.length > 0;
  };

  const handleCodeNoChange = (index: number, val: string) => {
    const updated = [...items];
    const trimmed = val.trim();
    const matched =
      voucherCodes.find((c) => String(c.code) === trimmed && c.active === 1) ||
      EXPENSE_CODES.find((c) => String(c.code) === trimmed);

    if (matched) {
      const matchedName = (matched as any).expenseAccountName || (matched as any).name || "";
      const matchedDesc = matched.description || "";
      const currentRefNo = updated[index].refNo || voucherNo || "";

      let autoPayment = updated[index].payment;
      let autoCd = updated[index].creditDebit || "Debit";

      // If LR is present, auto-fill amount based on Challan / Booking
      if (voucherNo) {
        const trimmedLr = voucherNo.trim();
        const matchedChallan = challans.find(
          (c) =>
            matchLr(c.challanNo, trimmedLr) ||
            matchLr(c.manualChallanNo, trimmedLr) ||
            (Array.isArray(c.items) &&
              c.items.some((it: any) => matchLr(it.cnNo, trimmedLr) || matchLr(it.lrNo, trimmedLr))),
        );
        const matchedBooking = bookings.find(
          (b) =>
            matchLr(b.lrNo, trimmedLr) ||
            matchLr(b.lrNumber, trimmedLr) ||
            matchLr(b.bookingNo, trimmedLr),
        );

        if (trimmed === "1") {
          // L H Advance
          const adv = Number(matchedChallan?.lessAdvance || matchedBooking?.advanceAmount || 0);
          if (adv > 0 && (!autoPayment || autoPayment === 0)) autoPayment = adv;
          autoCd = "Debit";
        } else if (trimmed === "2") {
          // L H Balance
          const bal = Number(matchedChallan?.balanceAmount || matchedBooking?.balanceAmount || 0);
          if (bal > 0 && (!autoPayment || autoPayment === 0)) autoPayment = bal;
          autoCd = "Debit";
        } else if (trimmed === "3") {
          // RTO Fine
          const fine = Number(matchedChallan?.rtoFine || 0);
          if (fine > 0 && (!autoPayment || autoPayment === 0)) autoPayment = fine;
          autoCd = "Debit";
        } else if (trimmed === "4") {
          // Loading
          const loading = Number(matchedChallan?.loadingMamul || 0);
          if (loading > 0 && (!autoPayment || autoPayment === 0)) autoPayment = loading;
          autoCd = "Debit";
        } else if (trimmed === "8") {
          // Halting
          const halt = Number(matchedChallan?.halting || 0);
          if (halt > 0 && (!autoPayment || autoPayment === 0)) autoPayment = halt;
          autoCd = "Debit";
        }
      }

      updated[index] = {
        ...updated[index],
        codeNo: val,
        expenseAccountName: matchedName,
        description: matchedDesc,
        refNo: currentRefNo,
        payment: autoPayment,
        creditDebit: autoCd,
      };

      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);

      // Auto-jump to Expense Account Name if code is 2 digits or more
      if (trimmed.length >= 2) {
        setTimeout(() => {
          const nextEl = document.getElementById(`input-${index}-expenseAccountName`);
          nextEl?.focus();
          if (nextEl instanceof HTMLTextAreaElement || nextEl instanceof HTMLInputElement) {
            nextEl.select();
          }
        }, 50);
      }
    } else {
      updated[index] = {
        ...updated[index],
        codeNo: val,
        expenseAccountName: "",
        description: "",
      };

      if (trimmed === "") {
        const newErrors = { ...errors };
        delete newErrors[index];
        setErrors(newErrors);
      } else {
        setErrors({
          ...errors,
          [index]: "Invalid Expense Code.",
        });
      }
    }
    setItems(updated);
  };

  // Keyboard navigation & confirm value
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowIdx: number,
    field: string,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (field === "codeNo") {
        const val = items[rowIdx].codeNo.trim();
        const matched =
          voucherCodes.find((c) => String(c.code) === val && c.active === 1) ||
          EXPENSE_CODES.find((c) => String(c.code) === val);
        if (!matched) {
          setErrors((prev) => ({ ...prev, [rowIdx]: "Invalid Expense Code." }));
          toast.error("Please enter a valid expense code first.");
          return;
        }
      }

      let nextField = "";
      if (field === "codeNo") nextField = "expenseAccountName";
      else if (field === "expenseAccountName") nextField = "description";
      else if (field === "description") nextField = "refNo";
      else if (field === "refNo") nextField = "payment";
      else if (field === "payment") {
        if (rowIdx === items.length - 1) {
          handleAddItemRow();
          return;
        } else {
          const nextEl = document.getElementById(`input-${rowIdx + 1}-codeNo`);
          nextEl?.focus();
          return;
        }
      }

      if (nextField) {
        const nextEl = document.getElementById(`input-${rowIdx}-${nextField}`);
        nextEl?.focus();
        if (nextEl instanceof HTMLInputElement || nextEl instanceof HTMLTextAreaElement) {
          nextEl.select();
        }
      }
    }
  };

  // Totals calculations
  const totals = useMemo(() => {
    let paymentTotal = 0;
    let receiptTotal = 0;
    for (const item of items) {
      paymentTotal += Number(item.payment || 0);
      receiptTotal += Number(item.receipt || 0);
    }
    const balanceVal = receiptTotal - paymentTotal;
    return {
      payment: paymentTotal,
      receipt: receiptTotal,
      balance: balanceVal,
    };
  }, [items]);

  const handleVoucherLookup = (val: string) => {
    if (!val.trim()) return;
    const cleanVal = val.trim().toLowerCase();
    const existing = vouchers.find(
      (v) =>
        (v.manualVoucherNo && v.manualVoucherNo.toLowerCase() === cleanVal) ||
        v.id === cleanVal,
    );
    if (existing) {
      setManualVoucherNo(existing.manualVoucherNo || "");
      setVoucherNo(existing.voucherNo || "");
      setNarration(existing.narration || "");
      setPaidTo(existing.paidTo || "");
      setReceivedFrom(existing.receivedFrom || "");
      if (existing.items && existing.items.length > 0) {
        setItems(existing.items.map((item) => ({ ...item })));
      }
      setErrors({});
    }
  };

  const handleLrLookup = (val: string) => {
    if (!val || !val.trim()) return;
    const trimmedLr = val.trim();

    // 1. Look up in Consignment Notes
    const matchedCn = consignmentNotes.find(
      (c) =>
        matchLr(c.lrNumber, trimmedLr) ||
        matchLr(c.consignmentNoteNo, trimmedLr),
    );

    // 2. Look up in Challans
    const matchedChallan = challans.find(
      (c) =>
        matchLr(c.challanNo, trimmedLr) ||
        matchLr(c.manualChallanNo, trimmedLr) ||
        (Array.isArray(c.items) &&
          c.items.some((it: any) => matchLr(it.cnNo, trimmedLr) || matchLr(it.lrNo, trimmedLr))),
    );

    // 3. Look up in Bookings
    const matchedBooking = bookings.find(
      (b) =>
        matchLr(b.lrNo, trimmedLr) ||
        matchLr(b.lrNumber, trimmedLr) ||
        matchLr(b.bookingNo, trimmedLr),
    );

    const resolvedFrom =
      matchedCn?.fromLocation ||
      matchedChallan?.fromLocation ||
      matchedBooking?.loadingLocation ||
      matchedBooking?.fromLocation ||
      "";
    const resolvedTo =
      matchedCn?.toLocation ||
      matchedChallan?.toLocation ||
      matchedBooking?.unloadingLocation ||
      matchedBooking?.toLocation ||
      "";
    const resolvedVehicle =
      matchedCn?.vehicleNumber ||
      matchedChallan?.vehicleNumber ||
      matchedBooking?.vehicleNumber ||
      "";

    // Auto-populate narration if empty
    if (!narration && (resolvedFrom || resolvedTo || resolvedVehicle)) {
      const parts = [`LR: ${trimmedLr}`];
      if (resolvedFrom && resolvedTo) parts.push(`(${resolvedFrom} to ${resolvedTo})`);
      if (resolvedVehicle) parts.push(`Veh: ${resolvedVehicle}`);
      setNarration(parts.join(" "));
    }

    // Auto-populate paidTo if empty and broker or truck owner is found
    if (!paidTo) {
      const resolvedParty =
        matchedChallan?.brokerName ||
        matchedChallan?.ownerName ||
        matchedBooking?.brokerName ||
        matchedBooking?.truckOwner ||
        "";
      if (resolvedParty && resolvedParty !== "DIRECT") {
        setPaidTo(resolvedParty);
      }
    }

    // Update Ref No on current rows without injecting unwanted automatic rows
    setItems((prev) => {
      if (!prev || prev.length === 0) {
        return [{ ...defaultItemRow(1), refNo: trimmedLr }];
      }
      return prev.map((item, idx) => (idx === 0 && !item.refNo ? { ...item, refNo: trimmedLr } : item));
    });
    toast.info(`LR #${trimmedLr} reference linked`);
  };

  // Save operation
  const handleSave = async (shouldPrint = false) => {
    if (!manualVoucherNo.trim()) {
      toast.error("Please enter a Voucher No.");
      return;
    }
    if (!voucherDate) {
      toast.error("Please select the Voucher Date.");
      return;
    }
    
    if (items.some((i) => String(i.codeNo) === "2") && !paidTo.trim()) {
      toast.error("Please select the Paid To Vendor Name for Expense Code 2.");
      return;
    }

    // Verify all rows have valid expense codes
    for (let idx = 0; idx < items.length; idx++) {
      const codeVal = items[idx].codeNo.trim();
      const matched =
        voucherCodes.find((c) => String(c.code) === codeVal && c.active === 1) ||
        EXPENSE_CODES.find((c) => String(c.code) === codeVal);
      if (!matched) {
        toast.error(`Row ${idx + 1} has an invalid or empty expense code.`);
        return;
      }
    }

    const payload = {
      manualVoucherNo,
      voucherNo,
      voucherDate,
      narration,
      paidTo,
      receivedFrom,
      items,
      branch,
    };

    let success = false;
    let resNo = "";

    if (selectedVoucher) {
      success = await updateVoucher(selectedVoucher.id, payload);
      resNo = selectedVoucher.voucherNo;
    } else {
      resNo = await addVoucher(payload);
      success = !!resNo;
    }

    if (success) {
      if (shouldPrint) {
        setTimeout(() => {
          const handleAfterPrint = () => {
            navigate({ to: "/voucher-records" });
          };
          window.addEventListener("afterprint", handleAfterPrint, { once: true });
          window.print();
        }, 300);
      } else {
        toast.success(
          selectedVoucher
            ? `Voucher record for LR ${voucherNo} updated successfully!`
            : `Voucher record for LR ${resNo || voucherNo} created successfully!`,
        );
        handleResetForm();
        loadData();
      }
    } else {
      toast.error("Failed to save voucher. Please try again.");
    }
  };

  const totalPayment = items.reduce((sum, item) => sum + (Number(item.payment) || 0), 0);
  const amountInWords = numberToWords(totalPayment);

  return (
    <>
      <div className="space-y-6 print:hidden" style={{ zoom: 1.1 }}>
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
        <PageHeader
          title={selectedVoucher ? "Edit Voucher" : "Voucher Entry"}
          description="Record expense debits and receipt credits."
          icon={<BookOpen className="h-5 w-5" />}
          actions={
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 font-extrabold text-xs uppercase h-10 px-4 rounded-xl gap-2 hover:bg-blue-50"
              onClick={() => navigate({ to: "/voucher-records" })}
            >
              <Eye className="h-4 w-4" /> View Records
            </Button>
          }
        />

        {/* ── VOUCHER HEADER FIELDS CARD ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* LR Number (Manual) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                LR Number
              </label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                onBlur={(e) => handleLrLookup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleLrLookup(voucherNo);
                  }
                }}
                placeholder="Enter LR Number"
                className="h-11 w-full bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            {/* Voucher No (Manual) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                Voucher No <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={manualVoucherNo}
                onChange={(e) => setManualVoucherNo(e.target.value)}
                onBlur={(e) => handleVoucherLookup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleVoucherLookup(manualVoucherNo);
                  }
                }}
                placeholder="Enter the Voucher No"
                className="h-11 w-full bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                Date <span className="text-red-500">*</span>
              </label>
              <CustomDatePicker value={voucherDate} onChange={setVoucherDate} />
            </div>

            {/* Paid To */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                Paid To {items.some((i) => String(i.codeNo) === "2") && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="Paid To"
                className="h-11 w-full bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>

            {/* Received From */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                Received From
              </label>
              <input
                type="text"
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                placeholder="Received From"
                className="h-11 w-full bg-white border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* ── LEDGER ENTRY GRID ── */}
        <TableCard>
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-black uppercase tracking-wider text-blue-900 select-none">
                <th className="px-2 py-3 w-[45px] min-w-[40px] text-center">S.No</th>
                <th className="px-2 py-3 w-[75px] min-w-[70px]">Code *</th>
                <th className="px-2 py-3 w-[200px] min-w-[160px]">Expense Account Name</th>
                <th className="px-2 py-3 min-w-[180px]">Description</th>
                <th className="px-2 py-3 w-[95px] min-w-[85px]">Ref No.</th>
                <th className="px-2 py-3 w-[130px] min-w-[120px]">Mode</th>
                <th className="px-2 py-3 text-right w-[115px] min-w-[105px]">Payment (₹)</th>
                <th className="px-2 py-3 text-center w-[110px] min-w-[100px]">Credit/Debit</th>
                <th className="px-1 py-3 text-center w-[45px] min-w-[40px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white text-xs">
              {items.map((item, idx) => (
                <tr
                  key={idx}
                  className="transition-colors hover:bg-muted/40 font-bold text-slate-700"
                >
                  <td className="px-2 py-2 text-center text-slate-400 font-black w-[45px] min-w-[40px]">
                    {item.sNo}
                  </td>
                  <td className="px-2 py-2 w-[75px] min-w-[70px]">
                    <input
                      id={`input-${idx}-codeNo`}
                      type="text"
                      placeholder="Code"
                      value={item.codeNo}
                      onChange={(e) => handleCodeNoChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "codeNo")}
                      className={cn(
                        "h-10 w-full border rounded-xl px-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100",
                        errors[idx]
                          ? "border-red-500 focus:border-red-650 focus:ring-red-105"
                          : "border-slate-200 focus:border-blue-600",
                      )}
                    />
                    {errors[idx] && (
                      <p className="text-[10px] text-red-500 font-bold mt-1 leading-tight">
                        {errors[idx]}
                      </p>
                    )}
                  </td>
                  <td className="px-2 py-2 w-[200px] min-w-[160px]">
                    <textarea
                      id={`input-${idx}-expenseAccountName`}
                      placeholder="Expense Account Name"
                      value={item.expenseAccountName}
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                      onChange={(e) =>
                        handleUpdateItemField(idx, "expenseAccountName", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleKeyDown(e, idx, "expenseAccountName");
                        }
                      }}
                      className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-2.5 py-2 text-xs font-bold outline-none resize-none overflow-hidden leading-normal min-h-[40px]"
                      rows={1}
                    />
                  </td>
                  <td className="px-2 py-2 min-w-[180px]">
                    <textarea
                      id={`input-${idx}-description`}
                      placeholder="Description Details"
                      value={item.description}
                      ref={(el) => {
                        if (el) {
                          el.style.height = "auto";
                          el.style.height = `${el.scrollHeight}px`;
                        }
                      }}
                      onChange={(e) => handleUpdateItemField(idx, "description", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleKeyDown(e, idx, "description");
                        }
                      }}
                      className="w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-2.5 py-2 text-xs font-bold outline-none resize-none overflow-hidden leading-normal min-h-[40px]"
                      rows={1}
                    />
                  </td>
                  <td className="px-2 py-2 w-[95px] min-w-[85px]">
                    <input
                      id={`input-${idx}-refNo`}
                      type="text"
                      placeholder="Ref No"
                      value={item.refNo ?? ""}
                      onChange={(e) => handleUpdateItemField(idx, "refNo", e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, idx, "refNo")}
                      className="h-10 w-full border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-2.5 text-xs font-bold outline-none bg-white text-slate-800"
                    />
                  </td>
                  <td className="px-2 py-2 w-[130px] min-w-[120px]">
                    <Select
                      value={item.modeOfPayment || ""}
                      onValueChange={(val) => handleUpdateItemField(idx, "modeOfPayment", val)}
                    >
                      <SelectTrigger className="h-10 w-full border border-slate-200 rounded-xl text-xs font-bold px-2.5">
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="GPay">GPay</SelectItem>
                        <SelectItem value="NEFT">NEFT</SelectItem>
                        <SelectItem value="Online Transaction">Online Transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2 w-[115px] min-w-[105px]">
                    <input
                      id={`input-${idx}-payment`}
                      type="number"
                      placeholder="0.00"
                      value={item.payment || ""}
                      onChange={(e) =>
                        handleUpdateItemField(
                          idx,
                          "payment",
                          e.target.value === "" ? 0 : Number(e.target.value),
                        )
                      }
                      onKeyDown={(e) => handleKeyDown(e, idx, "payment")}
                      className="h-10 w-full text-right border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-2.5 text-xs font-bold outline-none tabular-nums"
                    />
                  </td>
                  <td className="px-2 py-2 w-[110px] min-w-[100px]">
                    <Select
                      value={item.creditDebit || ""}
                      onValueChange={(val) => handleUpdateItemField(idx, "creditDebit", val)}
                    >
                      <SelectTrigger className="h-10 w-full border border-slate-200 rounded-xl text-xs font-bold px-2.5">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Credit">Credit</SelectItem>
                        <SelectItem value="Debit">Debit</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-2 text-center w-[45px] min-w-[40px]">
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={items.length === 1}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                        onClick={() => handleDeleteItemRow(idx)}
                        title="Delete row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50 font-bold text-xs uppercase h-10 px-4 rounded-xl gap-1.5"
              onClick={handleAddItemRow}
            >
              <Plus className="h-4 w-4" /> Add Row
            </Button>
          </div>
        </TableCard>

        {/* ── FOOTER ACTIONS (Sticky) ── */}
        <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg print:hidden">
          <button
            type="button"
            onClick={() => navigate({ to: "/voucher-records" })}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
            >
              <RotateCcw className="h-4.5 w-4.5" /> Clear Form
            </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Save className="h-4.5 w-4.5" /> Save
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" /> Save & Print
          </button>
          </div>
        </div>
      </div>

      {/* PRINT PREVIEW */}
      <div className="hidden print:block w-full text-black font-sans bg-white p-1 max-w-5xl mx-auto">
        <style>{`@media print { @page { size: A4 landscape; margin: 5mm; } body { margin: 0; padding: 0; } }`}</style>
        <div className="border border-black p-3 flex flex-col min-h-[19cm]">
          {/* Header Banner */}
          <div className="flex flex-col pt-1 pb-1 border-b-2 border-black mb-4 -mx-3 px-3">
            <div
              className="text-center text-[13px] pb-1 text-black uppercase tracking-wider font-extrabold"
              style={{ color: "black" }}
            >
              All Subject to Trichy Jurisdiction
            </div>
            <div className="flex justify-between items-center w-full px-2">
              <div className="w-[155px] flex-shrink-0 flex justify-start">
                <img
                  src={logo}
                  alt="JRKS Logo"
                  className="w-[140px] h-[140px] object-contain"
                  style={{ filter: "grayscale(100%) contrast(1.2)" }}
                />
              </div>

              <div className="text-center flex-1 px-2 flex flex-col items-center justify-center -mt-1">
                <h1
                  className="text-[34px] font-black tracking-tighter text-black leading-none m-0 uppercase font-serif whitespace-nowrap"
                  style={{ color: "black" }}
                >
                  JRKS DIGITAL INDIA LOGISTICS LLP
                </h1>
                <p
                  className="text-[18px] font-bold leading-none m-0 mt-1 mb-1.5 text-black"
                  style={{ color: "black" }}
                >
                  (Transport Contractor & Logistics Solutions)
                </p>
                <p
                  className="text-[14px] font-extrabold leading-tight m-0 text-black max-w-[650px]"
                  style={{ color: "black" }}
                >
                  No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street,
                  <br />
                  Kattur (Post), Trichy - 620 019.{" "}
                  <span className="underline">https://jrkslogistics.in</span>
                </p>
              </div>

              <div
                className="text-right text-[15px] font-black flex flex-col gap-1.5 leading-none font-mono flex-shrink-0 text-black whitespace-nowrap pt-1 pr-2"
                style={{ color: "black" }}
              >
                <span>97906 05938</span>
                <span>93645 95075</span>
                <span>72062 82936</span>
              </div>
            </div>
          </div>

          {/* Top Details */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-bold flex gap-8">
              <div>
                Voucher No: <span className="font-normal">{manualVoucherNo || "N/A"}</span>
              </div>
              <div>
                LR Number: <span className="font-normal">{voucherNo}</span>
              </div>
            </div>
            <div className="text-sm font-bold text-right flex gap-8">
              <div>
                Date:{" "}
                <span className="font-normal">
                  {voucherDate ? new Date(voucherDate).toLocaleDateString("en-IN") : ""}
                </span>
              </div>
              <div>
                Branch: <span className="font-normal">{branch}</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold uppercase underline tracking-wider">
              {isCredit ? "Credit Voucher" : isDebit ? "Debit Voucher" : items[0]?.creditDebit ? `${items[0].creditDebit} Voucher` : "Voucher"}
            </h2>
          </div>

          <div className="flex justify-between items-center mb-4 text-sm font-bold">
            {isCredit ? (
              <div className="w-full text-left">
                Received From: <span className="font-normal">{receivedFrom || "_________________________"}</span>
              </div>
            ) : isDebit ? (
              <div className="w-full text-left">
                Paid To: <span className="font-normal">{paidTo || "_________________________"}</span>
              </div>
            ) : (
              <>
                <div>
                  Paid To: <span className="font-normal">{paidTo || "_________________________"}</span>
                </div>
                <div>
                  Received From:{" "}
                  <span className="font-normal">{receivedFrom || "_________________________"}</span>
                </div>
              </>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-sm border-collapse border-2 border-black mb-4">
            <thead>
              <tr>
                <th className="border-2 border-black p-2 font-black" style={{ color: "black" }}>
                  S.No
                </th>
                <th className="border-2 border-black p-2 font-black" style={{ color: "black" }}>
                  Code No
                </th>
                <th
                  className="border-2 border-black p-2 text-left font-black"
                  style={{ color: "black" }}
                >
                  Expense Account Name
                </th>
                <th
                  className="border-2 border-black p-2 text-left font-black"
                  style={{ color: "black" }}
                >
                  Description
                </th>
                <th className="border-2 border-black p-2 font-black" style={{ color: "black" }}>
                  Ref No
                </th>
                <th className="border-2 border-black p-2 font-black" style={{ color: "black" }}>
                  Mode
                </th>
                <th
                  className="border-2 border-black p-2 text-right font-black"
                  style={{ color: "black" }}
                >
                  Amount (Rs)
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="border-2 border-black p-2 text-center text-black font-bold">
                    {item.sNo}
                  </td>
                  <td className="border-2 border-black p-2 text-center text-black font-bold">
                    {item.codeNo}
                  </td>
                  <td className="border-2 border-black p-2 text-black font-bold">
                    {item.expenseAccountName}
                  </td>
                  <td className="border-2 border-black p-2 text-black font-bold">
                    {item.description}
                  </td>
                  <td className="border-2 border-black p-2 text-center text-black font-bold">
                    {item.refNo}
                  </td>
                  <td className="border-2 border-black p-2 text-center text-black font-bold">
                    {item.modeOfPayment}
                  </td>
                  <td className="border-2 border-black p-2 text-right font-mono text-black font-bold">
                    {item.payment ? Number(item.payment).toFixed(2) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={6}
                  className="border-2 border-black p-2 text-right font-black text-black uppercase"
                >
                  {isCredit ? "Total Receipt:" : "Total Payment:"}
                </td>
                <td className="border-2 border-black p-2 text-right font-black text-black">
                  {totalPayment}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div className="mb-8 text-sm">
            <div className="mb-2">
              <strong>Amount in Words:</strong> {amountInWords}
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between text-sm font-bold pt-8 mt-auto">
            <div className="text-center w-48 mt-12 mb-4">
              <div className="border-t border-black pt-2 font-bold text-sm">
                {isCredit ? "Depositor / Receiver Sign" : "Receiver Sign"}
              </div>
            </div>
            <div className="text-center w-48 mt-12 mb-4">
              <div className="border-t border-black pt-2 font-bold text-sm">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
