import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import { Save, Printer, ArrowLeft, Plus, Trash2, RotateCcw, Phone, MessageCircle, Smartphone, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { useOpsStore, type MoneyReceipt, type MoneyReceiptRow } from "@/lib/ops-store";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/money-receipt")({
  validateSearch: (search: Record<string, unknown>) => ({
    editId: (search.editId as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Money Receipt Entry — JRKS Logistics ERP" },
      { name: "description", content: "Generate and manage Money Receipts." },
    ],
  }),
  component: MoneyReceiptEntry,
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

function safeFormatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : format(d, "dd-MM-yyyy");
}

import { getIsAdmin } from "@/lib/auth";

function MoneyReceiptEntry() {
  const isAdmin = getIsAdmin();

  const { editId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    moneyReceipts,
    bookings,
    consignmentNotes,
    bills,
    challans,
    addMoneyReceipt,
    updateMoneyReceipt,
    nextMoneyReceiptNo,
    loadData,
  } = useOpsStore();

  const [id, setId] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [mrNo, setMrNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [partyName, setPartyName] = useState("");
  const [paymentFor, setPaymentFor] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [narration, setNarration] = useState("");

  const [items, setItems] = useState<MoneyReceiptRow[]>([
    {
      lrNo: "",
      billNo: "",
      billDate: "",
      billAmount: "",
      receivedAmount: "",
      tdsPercentage: "0",
      tdsAmount: "0.00",
      claimAmount: "",
      netAmount: "0.00",
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate M.R. No starting from MR-1001 on mount if creating new receipt
  useEffect(() => {
    if (!editId && (!mrNo || !mrNo.startsWith("MR-"))) {
      setMrNo(nextMoneyReceiptNo());
    }
  }, [moneyReceipts, editId, mrNo, nextMoneyReceiptNo]);

  const handleResetForm = () => {
    setId("");
    setLrNo("");
    setMrNo(nextMoneyReceiptNo());
    setReceiptDate(format(new Date(), "yyyy-MM-dd"));
    setPartyName("");
    setPaymentFor("");
    setAmountReceived("");
    setAmountInWords("");
    setNarration("");
    setItems([
      {
        lrNo: "",
        billNo: "",
        billDate: "",
        billAmount: "",
        receivedAmount: "",
        tdsPercentage: "0",
        tdsAmount: "0.00",
        claimAmount: "",
        netAmount: "0.00",
      },
    ]);
  };

  useEffect(() => {
    if (editId && moneyReceipts.length > 0) {
      const existing = moneyReceipts.find((m) => String(m.id) === String(editId));
      if (existing) {
        setId(existing.id);
        setLrNo(existing.lrNo || "");
        setMrNo(existing.mrNo);
        setReceiptDate(existing.receiptDate);
        setPartyName(existing.partyName);
        setPaymentFor(existing.paymentFor || "");
        setAmountReceived(existing.amountReceived || "");
        setAmountInWords(existing.amountInWords || "");
        setNarration(existing.narration || "");

        if (existing.items?.length) {
          const normalizedItems = existing.items.map((item) => {
            const rAmt = item.receivedAmount || "";
            const tAmt = item.tdsAmount || "0.00";
            const cAmt = (item as any).claimAmount || "";
            const nAmt = item.netAmount || (Math.max(0, (parseFloat(rAmt) || 0) - (parseFloat(tAmt) || 0) - (parseFloat(cAmt) || 0))).toFixed(2);
            return {
              ...item,
              billAmount: item.billAmount || "0.00",
              receivedAmount: rAmt,
              tdsPercentage: item.tdsPercentage !== undefined && item.tdsPercentage !== null ? String(item.tdsPercentage) : "0",
              tdsAmount: tAmt,
              claimAmount: cAmt,
              netAmount: nAmt,
            };
          });
          setItems(normalizedItems);
        } else {
          setItems([
            {
              lrNo: "",
              billNo: "",
              billDate: "",
              billAmount: "",
              receivedAmount: "",
              tdsPercentage: "0",
              tdsAmount: "0.00",
              claimAmount: "",
              netAmount: "0.00",
            },
          ]);
        }
      }
    }
  }, [editId, moneyReceipts]);

  // Normalization helper for accurate matching
  const normLr = (s: string | undefined | null) => {
    if (!s) return "";
    const clean = s.trim().toLowerCase().replace(/^lr[-_\s]?/i, "");
    const stripped = clean.replace(/^0+/, "");
    return stripped || clean;
  };

  const matchLrExact = (a: string | undefined | null, b: string) => {
    if (!a || !b) return false;
    const cleanA = String(a).trim().toLowerCase();
    const cleanB = String(b).trim().toLowerCase();
    if (cleanA === cleanB) return true;
    const na = normLr(a);
    const nb = normLr(b);
    return na === nb || na.padStart(3, "0") === nb.padStart(3, "0") || cleanA.replace(/[^0-9]/g, "") === cleanB.replace(/[^0-9]/g, "");
  };

  // Fetch details ONLY when explicitly triggered (Enter key or Blur)
  const lookupLrOrBill = (
    idx: number,
    val: string,
    field: "lrNo" | "billNo",
    isExplicitEnter = false
  ) => {
    if (!val) return;
    const newItems = [...items];
    const row = { ...newItems[idx] };

    const cleanVal = val.toLowerCase().trim();
    const matchBillNo = (a: string | undefined | null) => {
      if (!a) return false;
      const cleanA = (a || "").toLowerCase().trim();
      return cleanA === cleanVal || cleanA.replace(/[^0-9]/g, "") === cleanVal.replace(/[^0-9]/g, "");
    };

    const findLinkedBill = (queryVal: string) => {
      if (!queryVal) return null;
      return bills?.find((x) =>
        matchBillNo(x.billNo) ||
        matchLrExact(x.lrNumber, queryVal) ||
        (Array.isArray(x.items) && x.items.some((i: any) =>
          matchLrExact(i.lrNo, queryVal) ||
          matchLrExact(i.cnNo, queryVal) ||
          matchLrExact(i.bookingNo, queryVal) ||
          matchBillNo(i.billNo)
        ))
      );
    };

    // Helper to extract freight amount from matching booking/challan/CN
    const findFreightFromOtherSources = (lrQuery: string) => {
      let amt = 0;
      const cn = consignmentNotes?.find((x) => matchLrExact(x.lrNumber, lrQuery) || matchLrExact(x.consignmentNoteNo, lrQuery));
      if (cn) {
        if (Array.isArray(cn.items) && cn.items.length > 0) {
          amt = cn.items.reduce((s: number, it: any) => s + (parseFloat(it.freightAmount || it.bookingAmount || it.amount || it.rate || it.totalFreight || it.total || 0) || 0), 0);
        }
        if (!amt) amt = parseFloat((cn as any).freightAmount || (cn as any).bookingAmount || (cn as any).totalAmount || 0) || 0;
      }
      if (!amt) {
        const bk = bookings?.find((x) => matchLrExact(x.lrNo, lrQuery) || matchLrExact(x.lrNumber, lrQuery) || matchLrExact(x.bookingNo, lrQuery));
        if (bk) {
          amt = parseFloat(bk.billAmount?.toString() || bk.hireAmount?.toString() || "0") || 0;
        }
      }
      if (!amt) {
        const ch = challans?.find((x) => matchLrExact(x.challanNo, lrQuery) || matchLrExact(x.manualChallanNo, lrQuery) || x.items?.some((i: any) => matchLrExact(i.cnNo, lrQuery) || matchLrExact(i.lrNo, lrQuery)));
        if (ch) {
          amt = parseFloat((ch as any).totalFreight?.toString() || (ch as any).hireAmount?.toString() || "0") || 0;
          if (!amt && (ch.lessAdvance || ch.balanceAmount)) {
            amt = (parseFloat(ch.lessAdvance?.toString() || "0") || 0) + (parseFloat(ch.balanceAmount?.toString() || "0") || 0);
          }
        }
      }
      return amt;
    };

    // 1. Try finding in Bills (highest priority)
    const bill = field === "billNo"
      ? bills?.find((x) => matchBillNo(x.billNo))
      : findLinkedBill(val);

    if (bill) {
      if (field === "lrNo" || !row.billNo) row.billNo = bill.billNo || "";
      if (field === "billNo" && (!row.lrNo || row.lrNo === "")) {
        row.lrNo = bill.lrNumber || (bill.items?.[0]?.lrNo) || "";
      }

      if (idx === 0 || !partyName) {
        if (bill.customerName) setPartyName(bill.customerName);
        setPaymentFor("Freight Bill");
      }

      let grandTotal = 0;
      if (bill.grandTotalOverride && parseFloat(bill.grandTotalOverride) > 0) {
        grandTotal = parseFloat(bill.grandTotalOverride);
      } else {
        const subTotal = bill.subTotalOverride && parseFloat(bill.subTotalOverride) > 0
          ? parseFloat(bill.subTotalOverride)
          : (bill.items || []).reduce((sum: any, r: any) => sum + (parseFloat(r.amount) || parseFloat(r.rate) || parseFloat(r.freight) || 0), 0);
        const gstPct = parseFloat((bill.gstPercentage || "0%").replace(/[^0-9.]/g, "")) || 0;
        const gst = bill.gstOverride ? parseFloat(bill.gstOverride) : subTotal * (gstPct / 100);
        grandTotal = subTotal + gst;
      }
      if (!grandTotal || grandTotal === 0) {
        grandTotal = parseFloat((bill as any).totalAmount || (bill as any).billAmount || 0) || 0;
      }
      if (!grandTotal || grandTotal === 0) {
        grandTotal = findFreightFromOtherSources(bill.lrNumber || val);
      }

      const bAmt = grandTotal || 0;
      let bDate = bill.date || "";
      if (bDate.length > 10) bDate = bDate.substring(0, 10);
      bDate = bDate.replace(/[\.\/]/g, "-");
      if (bDate.includes("-") && bDate.split("-")[0].length === 2) {
        bDate = bDate.split("-").reverse().join("-");
      }
      row.billDate = bDate;
      row.billAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";
      row.receivedAmount = bAmt > 0 ? bAmt.toFixed(2) : "";
      row.tdsPercentage = row.tdsPercentage || "0";
      row.tdsAmount = "0.00";
      row.claimAmount = row.claimAmount || "";
      row.netAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";

      newItems[idx] = row;
      setItems(newItems);
      if (isExplicitEnter) toast.success(`Fetched Bill #${bill.billNo || val}`);
      return;
    }

    // 2. Try finding in Bookings
    const b = field === "billNo"
      ? bookings?.find((x) => matchBillNo(x.bookingNo) || matchBillNo(x.lrNo))
      : bookings?.find((x) => matchLrExact(x.lrNo, val) || matchLrExact(x.bookingNo, val));

    if (b) {
      if (idx === 0 || !partyName) {
        if (b.companyName) setPartyName(b.companyName);
        else if (b.consignorName) setPartyName(b.consignorName);
        else if (b.consigneeName) setPartyName(b.consigneeName);
        setPaymentFor("Freight Bill");
      }
      const bAmtStr = b.billAmount ? b.billAmount.toString() : b.hireAmount ? b.hireAmount.toString() : "0";
      let bAmt = parseFloat(bAmtStr) || 0;
      if (!bAmt && (b.advanceAmount || b.balanceAmount)) {
        bAmt = (parseFloat(b.advanceAmount?.toString() || "0") || 0) + (parseFloat(b.balanceAmount?.toString() || "0") || 0);
      }

      // Check linked bill for this booking
      const linked = findLinkedBill(val) || findLinkedBill(b.lrNo) || findLinkedBill(b.bookingNo);
      if (linked?.billNo) {
        row.billNo = linked.billNo;
      }

      row.billDate = b.bookingDate ? b.bookingDate.substring(0, 10) : "";
      row.billAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";
      row.receivedAmount = bAmt > 0 ? bAmt.toFixed(2) : "";
      row.tdsPercentage = row.tdsPercentage || "0";
      row.tdsAmount = "0.00";
      row.claimAmount = row.claimAmount || "";
      row.netAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";

      newItems[idx] = row;
      setItems(newItems);
      if (isExplicitEnter) toast.success(`Fetched Booking details for LR ${val}`);
      return;
    }

    // 3. Try finding in Consignment Notes
    const cn = field === "billNo"
      ? consignmentNotes?.find((x) => matchBillNo(x.consignmentNoteNo) || matchBillNo(x.lrNumber))
      : consignmentNotes?.find((x) => matchLrExact(x.lrNumber, val) || matchLrExact(x.consignmentNoteNo, val));

    if (cn) {
      if (idx === 0 || !partyName) {
        if (cn.consignorName) setPartyName(cn.consignorName);
        setPaymentFor("Freight Bill");
      }
      let bAmt = 0;
      if (cn.items && cn.items.length > 0) {
        bAmt = cn.items.reduce((s: number, it: any) => s + (parseFloat(it.freightAmount || it.bookingAmount || it.amount || it.rate || it.totalFreight || it.total || 0) || 0), 0);
      }
      if (!bAmt) {
        bAmt = parseFloat((cn as any).freightAmount || (cn as any).bookingAmount || (cn as any).totalAmount || 0) || 0;
      }
      if (!bAmt) {
        bAmt = findFreightFromOtherSources(cn.lrNumber || val);
      }

      // Check linked bill for this consignment note
      const linked = findLinkedBill(val) || findLinkedBill(cn.lrNumber) || findLinkedBill(cn.consignmentNoteNo);
      if (linked?.billNo) {
        row.billNo = linked.billNo;
      } else if (cn.items?.[0]?.invoiceNoDcNo) {
        row.billNo = cn.items[0].invoiceNoDcNo;
      }

      row.billDate = cn.lrDate ? cn.lrDate.substring(0, 10) : "";
      row.billAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";
      row.receivedAmount = bAmt > 0 ? bAmt.toFixed(2) : "";
      row.tdsPercentage = row.tdsPercentage || "0";
      row.tdsAmount = "0.00";
      row.claimAmount = row.claimAmount || "";
      row.netAmount = bAmt > 0 ? bAmt.toFixed(2) : "0.00";

      newItems[idx] = row;
      setItems(newItems);
      if (isExplicitEnter) toast.success(`Fetched CN details for LR ${val}`);
      return;
    }

    // If no match found and explicit enter pressed
    if (isExplicitEnter) {
      toast.error(`No record found for ${field === "lrNo" ? "LR No" : "Bill No"}: "${val}"`);
    }
  };

  const lookupByMrNo = (mrVal: string) => {
    const clean = mrVal.trim().toLowerCase();
    if (!clean) return;
    const existing = moneyReceipts?.find((m) => (m.mrNo || "").trim().toLowerCase() === clean);
    if (existing && String(editId) !== String(existing.id)) {
      setId(existing.id);
      setMrNo(existing.mrNo);
      setLrNo(existing.lrNo || "");
      if (existing.receiptDate) setReceiptDate(existing.receiptDate);
      setPartyName(existing.partyName || "");
      setPaymentFor(existing.paymentFor || "Freight Bill");
      setNarration(existing.narration || "");
      if (existing.items?.length) {
        const normalized = existing.items.map((item) => {
          const rAmt = item.receivedAmount || "";
          const tAmt = item.tdsAmount || "0.00";
          const cAmt = (item as any).claimAmount || "";
          const nAmt = item.netAmount || (Math.max(0, (parseFloat(rAmt) || 0) - (parseFloat(tAmt) || 0) - (parseFloat(cAmt) || 0))).toFixed(2);
          return {
            ...item,
            billAmount: item.billAmount || "0.00",
            receivedAmount: rAmt,
            tdsPercentage: item.tdsPercentage !== undefined && item.tdsPercentage !== null ? String(item.tdsPercentage) : "0",
            tdsAmount: tAmt,
            claimAmount: cAmt,
            netAmount: nAmt,
          };
        });
        setItems(normalized);
      }
      toast.success(`Loaded details for MR #${existing.mrNo}`);
    }
  };

  const addItem = () =>
    setItems([
      ...items,
      {
        lrNo: "",
        billNo: "",
        billDate: "",
        billAmount: "",
        receivedAmount: "",
        tdsPercentage: "0",
        tdsAmount: "0.00",
        claimAmount: "",
        netAmount: "0.00",
      },
    ]);
  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItem = (idx: number, field: keyof MoneyReceiptRow, val: string) => {
    const newItems = [...items];
    const row = { ...newItems[idx] };

    // Validation
    if (
      (field === "billAmount" || field === "tdsAmount" || field === "receivedAmount" || field === "claimAmount" || field === "netAmount") &&
      parseFloat(val) < 0
    ) {
      val = "0";
    }

    row[field] = val as any;

    let bAmt = parseFloat(row.billAmount) || 0;
    let rAmt = parseFloat(row.receivedAmount) || 0;
    let tPer = parseFloat(row.tdsPercentage) || 0;
    let tAmt = parseFloat(row.tdsAmount) || 0;
    let cAmt = parseFloat(row.claimAmount || "0") || 0;

    const calculateNet = (r: number, t: number, c: number) => {
      return Math.max(0, r - t - c);
    };

    if (field === "billAmount") {
      bAmt = parseFloat(val) || 0;
    } else if (field === "receivedAmount") {
      rAmt = parseFloat(val) || 0;
      tAmt = (rAmt * tPer) / 100;
      row.tdsAmount = tAmt ? tAmt.toFixed(2) : "0.00";
      const nAmt = calculateNet(rAmt, tAmt, cAmt);
      row.netAmount = nAmt > 0 ? nAmt.toFixed(2) : "0.00";
    } else if (field === "tdsPercentage") {
      tPer = parseFloat(val) || 0;
      tAmt = (rAmt * tPer) / 100;
      row.tdsAmount = tAmt ? tAmt.toFixed(2) : "0.00";
      const nAmt = calculateNet(rAmt, tAmt, cAmt);
      row.netAmount = nAmt > 0 ? nAmt.toFixed(2) : "0.00";
    } else if (field === "tdsAmount") {
      tAmt = parseFloat(val) || 0;
      const nAmt = calculateNet(rAmt, tAmt, cAmt);
      row.netAmount = nAmt > 0 ? nAmt.toFixed(2) : "0.00";
    } else if (field === "claimAmount") {
      cAmt = parseFloat(val) || 0;
      const nAmt = calculateNet(rAmt, tAmt, cAmt);
      row.netAmount = nAmt > 0 ? nAmt.toFixed(2) : "0.00";
    } else if (field === "netAmount") {
      const nAmt = parseFloat(val) || 0;
      row.netAmount = nAmt.toFixed(2);
    }

    newItems[idx] = row;
    setItems(newItems);
  };

  // Central Calculation Engine
  const totals = useMemo(() => {
    let billAmt = 0;
    let received = 0;
    let tds = 0;
    let claim = 0;
    let net = 0;

    items.forEach((item) => {
      const b = parseFloat(item.billAmount) || 0;
      const r = parseFloat(item.receivedAmount) || 0;
      const t = parseFloat(item.tdsAmount) || 0;
      const c = parseFloat(item.claimAmount || "0") || 0;
      const n = item.netAmount !== undefined && item.netAmount !== ""
        ? parseFloat(item.netAmount) || 0
        : Math.max(0, r - t - c);

      billAmt += b;
      received += r;
      tds += t;
      claim += c;
      net += n;
    });

    const rounded = Math.round(net);
    const roundOff = rounded - net;

    return {
      billAmount: billAmt.toFixed(2),
      received: received.toFixed(2),
      tds: tds.toFixed(2),
      claim: claim.toFixed(2),
      netAmount: net.toFixed(2),
      roundOffRaw: roundOff,
      roundOffFormatted: (roundOff > 0 ? "+" : "") + roundOff.toFixed(2),
      subTotal: rounded.toString(),
    };
  }, [items]);

  // Reactive updates for Header Amount Received & Words
  useEffect(() => {
    setAmountReceived(totals.subTotal);
  }, [totals.subTotal]);

  useEffect(() => {
    const num = parseInt(amountReceived) || 0;
    if (num > 0) {
      setAmountInWords(numberToWords(num));
    } else {
      setAmountInWords("Zero Only");
    }
  }, [amountReceived]);

  const handleSave = async (isPrint = false) => {
    if (!lrNo) return toast.error("LR No is required");
    if (!mrNo) return toast.error("MR No is required");
    if (!partyName) return toast.error("Party Name is required");

    // Validations
    const activeItems = items.filter((i) => i.billNo || i.billAmount || i.lrNo);
    if (activeItems.length === 0) return toast.error("Cannot save empty rows.");

    const mainLrNo = lrNo || activeItems[0]?.lrNo || "";
    if (!mainLrNo) return toast.error("LR No is required");
    if (!mrNo) return toast.error("MR No is required");
    if (!partyName) return toast.error("Party Name is required");

    for (const item of activeItems) {
      if (!item.billNo) return toast.error("Bill Number cannot be empty for entered rows.");
    }

    const payload = {
      mrNo,
      lrNo: mainLrNo,
      branch: "Kattur, Trichy",
      receiptDate,
      partyName,
      paymentFor,
      amountReceived,
      amountInWords,
      narration,
      items: activeItems,
    };

    let success = false;
    if (id) {
      success = await updateMoneyReceipt(id, payload);
      if (success) {
        toast.success("Already Saved Money Receipt Updated!", {
          description: `MR #${mrNo} changes have been updated successfully.`,
          duration: 4000,
        });
      }
    } else {
      success = await addMoneyReceipt(payload);
      if (success) {
        toast.success("New Money Receipt Saved Successfully!", {
          description: `MR #${mrNo} created and saved.`,
          duration: 4000,
        });
      }
    }

    if (success && isPrint) {
      setTimeout(() => {
        const handleAfterPrint = () => {
          navigate({ to: "/money-receipt-records" });
        };
        window.addEventListener("afterprint", handleAfterPrint, { once: true });
        window.print();
      }, 300);
    } else if (success && !isPrint) {
      navigate({ to: "/money-receipt-records" });
    }
  };

  const inputCls =
    "w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900";
  const labelCls = "block text-xs font-bold text-slate-600 mb-1";

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-slate-50 relative">
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 5mm !important;
            height: 100% !important;
            overflow: hidden !important;
          }
          .no-print, [data-sonner-toaster], [data-sonner-toast] { display: none !important; }
          .print-only { display: flex !important; page-break-inside: avoid; }
        }
      `}</style>

      {/* -------------------- INTERACTIVE SCREEN -------------------- */}
      <div className="no-print p-6 pb-32 space-y-6">
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

        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-blue-950">
              Money Receipt Entry
            </h1>
            <p className="text-sm font-semibold text-slate-500 tracking-wide">
              Create or edit money receipt details
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>
                M.R. No. <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                className={inputCls}
                value={mrNo}
                onChange={(e) => setMrNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    lookupByMrNo((e.target as HTMLInputElement).value);
                  }
                }}
                onBlur={(e) => {
                  lookupByMrNo(e.target.value);
                }}
                placeholder="Enter the MR No"
              />
            </div>
            <div>
              <label className={labelCls}>Receipt Date</label>
              <CustomDatePicker value={receiptDate} onChange={setReceiptDate} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Received From</label>
              <input
                type="text"
                className={inputCls}
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="e.g. M/S Sri Vijayalakshmi Engineering Works"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Payment For</label>
              <input
                type="text"
                className={inputCls}
                value={paymentFor}
                onChange={(e) => setPaymentFor(e.target.value)}
                placeholder="e.g. Freight Bill"
              />
            </div>
            <div>
              <label className={labelCls}>Amount Received (₹)</label>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                title="Auto-calculated from Sub Total but can be edited"
              />
            </div>
            <div>
              <label className={labelCls}>In Words</label>
              <input
                type="text"
                className={`${inputCls} bg-slate-100 cursor-not-allowed`}
                value={amountInWords}
                readOnly
                placeholder="Auto-calculates"
              />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Table */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 text-lg">Received Payment Detail</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full min-w-[1100px] text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-[100px]">LR No.</th>
                    <th className="p-3 w-[110px]">Bill No.</th>
                    <th className="p-3 w-[130px]">Bill Date</th>
                    <th className="p-3 w-[120px]">Bill Amount</th>
                    <th className="p-3 w-[130px]">Received Amount</th>
                    <th className="p-3 w-[90px]">TDS %</th>
                    <th className="p-3 w-[110px]">TDS Amount</th>
                    <th className="p-3 w-[115px]">Claim Amount</th>
                    <th className="p-3 w-[125px]">Net Amount</th>
                    <th className="p-3 w-[50px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={item.lrNo || ""}
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase();
                            updateItem(idx, "lrNo", v);
                            if (idx === 0) setLrNo(v);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              lookupLrOrBill(idx, (e.target as HTMLInputElement).value, "lrNo", true);
                            }
                          }}
                          onBlur={(e) => {
                            lookupLrOrBill(idx, e.target.value, "lrNo", false);
                          }}
                          placeholder="LR No (Enter to fetch)"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={item.billNo}
                          onChange={(e) => updateItem(idx, "billNo", e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              lookupLrOrBill(idx, (e.target as HTMLInputElement).value, "billNo", true);
                            }
                          }}
                          onBlur={(e) => {
                            lookupLrOrBill(idx, e.target.value, "billNo", false);
                          }}
                          placeholder="Bill No (Enter to fetch)"
                        />
                      </td>
                      <td className="p-2">
                        <CustomDatePicker
                          value={item.billDate}
                          onChange={(val) => updateItem(idx, "billDate", val)}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={inputCls}
                          value={item.billAmount}
                          onChange={(e) => updateItem(idx, "billAmount", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`${inputCls} font-semibold`}
                          value={item.receivedAmount}
                          onChange={(e) => updateItem(idx, "receivedAmount", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={item.tdsPercentage || "0"}
                          onValueChange={(val) => updateItem(idx, "tdsPercentage", val)}
                        >
                          <SelectTrigger className={`${inputCls} h-[38px]`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="1">1%</SelectItem>
                            <SelectItem value="2">2%</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`${inputCls} text-right tabular-nums`}
                          value={item.tdsAmount}
                          onChange={(e) => updateItem(idx, "tdsAmount", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`${inputCls} text-right tabular-nums`}
                          value={item.claimAmount || ""}
                          onChange={(e) => updateItem(idx, "claimAmount", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={`${inputCls} font-bold text-right tabular-nums text-emerald-700 bg-emerald-50/50 border-emerald-200`}
                          value={item.netAmount || (Math.max(0, (parseFloat(item.receivedAmount) || 0) - (parseFloat(item.tdsAmount) || 0) - (parseFloat(item.claimAmount || "0") || 0)).toFixed(2))}
                          onChange={(e) => updateItem(idx, "netAmount", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                    <td className="p-3 text-right" colSpan={3}>
                      Total
                    </td>
                    <td className="p-3 text-slate-800">{totals.billAmount}</td>
                    <td className="p-3 text-slate-800">{totals.received}</td>
                    <td></td>
                    <td className="p-3 text-slate-800 text-right pr-4">{totals.tds}</td>
                    <td className="p-3 text-slate-800 text-right pr-4">{totals.claim}</td>
                    <td className="p-3 text-emerald-700 text-right pr-4">{totals.netAmount}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-slate-50 font-bold border-t border-slate-200">
                    <td className="p-3 text-right" colSpan={8}>
                      Round off +/-
                    </td>
                    <td className="p-3 text-slate-800 text-right pr-4">
                      {totals.roundOffFormatted}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-300">
                    <td className="p-3 text-right" colSpan={8}>
                      Sub Total
                    </td>
                    <td className="p-3 text-blue-900 text-right pr-4 text-base">
                      {totals.subTotal}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-start">
              <Button
                onClick={addItem}
                variant="outline"
                size="sm"
                className="font-bold border-blue-200 text-blue-800 hover:bg-blue-50 mt-1"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Row
              </Button>
              <div className="flex-1 max-w-md ml-4 flex gap-3 items-center">
                <label className="text-sm font-bold text-slate-700 whitespace-nowrap">
                  Remarks :
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  placeholder="e.g. OK"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- PRINT ONLY TEMPLATE (SINGLE PAGE, BLACK & WHITE) -------------------- */}
      <div
        className="print-only hidden bg-white text-black font-sans text-[11px] w-full max-w-4xl mx-auto p-6 border-2 border-black flex-col justify-between box-border"
        style={{ height: "280mm", pageBreakInside: "avoid" }}
      >
        <div>
          {/* Header Section */}
          <div className="text-center border-b border-black pb-2 mb-2 -mx-6 px-6">
            <h2 className="text-lg font-black text-black uppercase tracking-widest">
              Money Receipt
            </h2>
          </div>

          {/* Header Banner */}
          <div className="flex flex-col border-b-2 border-black mb-2 -mx-6 px-6 pb-2">
            <div className="text-center text-[10.5px] pb-1 text-black uppercase tracking-wider font-extrabold">
              All Subject to Trichy Jurisdiction
            </div>
            <div className="flex justify-between items-center w-full px-2">
              <div className="w-[100px] flex-shrink-0 flex justify-start items-center">
                <img
                  src={logo}
                  alt="JRKS Logo"
                  className="w-[100px] h-[100px] object-contain"
                  style={{ filter: "grayscale(100%) contrast(1.2)" }}
                />
              </div>

              <div className="text-center flex-1 px-1">
                <h1 className="text-[22px] font-black tracking-tighter text-black leading-none m-0 uppercase font-serif">
                  JRKS DIGITAL INDIA LOGISTICS LLP
                </h1>
                <p className="text-[13px] font-bold leading-normal m-0 mt-1.5 text-black">
                  (Transport Contractor & Logistics Solutions)
                </p>
              </div>

              <div className="text-right text-[12px] font-black flex flex-col justify-center gap-1.5 leading-none font-mono flex-shrink-0 text-black whitespace-nowrap">
                <span>97906 05938</span>
                <span>93645 95075</span>
                <span>72062 82936</span>
              </div>
            </div>

            <div className="text-center relative z-10 -mt-2">
              <p className="text-[13px] font-extrabold leading-normal m-0 text-black">
                No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post),
                Trichy - 620 019. <span className="underline ml-1 text-[11px]">https://jrkslogistics.in</span>
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4 -mx-6 px-6">
            <div className="flex items-center gap-2 flex-1 justify-start">
              <span className="font-bold text-sm text-black">MONEY RECEIPT NO:</span>
              <span className="font-mono font-bold text-base text-black">{mrNo || ""}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-center text-center">
              <span className="font-bold text-sm text-black">DATE:</span>
              <span className="font-mono font-bold text-base text-black">
                {receiptDate ? safeFormatDate(receiptDate) : format(new Date(), "dd-MM-yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end text-right">
              <span className="font-bold text-sm text-black">PAYMENT FOR:</span>
              <span className="font-bold text-base text-black">{paymentFor || ""}</span>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 text-black">
              1. Receipt Details
            </h3>
            <table className="w-full border-collapse border-2 border-black text-sm text-left [&_th]:border-2 [&_th]:border-black [&_td]:border-2 [&_td]:border-black">
              <tbody>
                <tr>
                  <th className="p-2 w-1/3 font-black text-black">Received From:</th>
                  <td className="p-2 font-bold text-black">{partyName || ""}</td>
                </tr>
                <tr>
                  <th className="p-2 w-1/3 font-black text-black">Amount Received:</th>
                  <td className="p-2 font-bold text-black">{amountReceived ? `Rs. ${amountReceived}` : ""}</td>
                </tr>
                <tr>
                  <th className="p-2 w-1/3 font-black text-black">In Words:</th>
                  <td className="p-2 font-bold text-black">{amountInWords || ""}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Breakdown */}
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider mb-2 text-black">
              2. Payment Breakdown
            </h3>
            <table className="w-full text-center border-collapse border-2 border-black text-xs [&_th]:border-2 [&_th]:border-black [&_td]:border-2 [&_td]:border-black">
              <thead className="print:bg-transparent bg-transparent">
                <tr className="!bg-white !text-black">
                  <th className="p-2 font-black !text-black">LR No.</th>
                  <th className="p-2 font-black !text-black">Bill No.</th>
                  <th className="p-2 font-black w-24 !text-black">Bill Date</th>
                  <th className="p-2 font-black !text-black">Bill Amount</th>
                  <th className="p-2 font-black !text-black">Received Amount</th>
                  <th className="p-2 font-black !text-black">TDS %</th>
                  <th className="p-2 font-black !text-black">TDS Amount</th>
                  <th className="p-2 font-black !text-black">Claim Amount</th>
                  <th className="p-2 font-black !text-black">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="h-8">
                    <td className="p-1 text-black font-bold">{item.lrNo || ""}</td>
                    <td className="p-1 text-black">{item.billNo}</td>
                    <td className="p-1 text-black">
                      {safeFormatDate(item.billDate)}
                    </td>
                    <td className="p-1 text-black">{item.billAmount}</td>
                    <td className="p-1 text-black">{item.receivedAmount}</td>
                    <td className="p-1 text-black">{item.tdsPercentage || "0"}%</td>
                    <td className="p-1 text-black">{item.tdsAmount}</td>
                    <td className="p-1 text-black">{item.claimAmount || "0.00"}</td>
                    <td className="p-1 font-bold text-black">{item.netAmount || (Math.max(0, (parseFloat(item.receivedAmount) || 0) - (parseFloat(item.tdsAmount) || 0) - (parseFloat(item.claimAmount || "0") || 0)).toFixed(2))}</td>
                  </tr>
                ))}

                <tr className="h-8">
                  <td colSpan={3}>
                    <span className="font-black block text-center uppercase tracking-widest text-sm text-black">
                      Total
                    </span>
                  </td>
                  <td className="p-1 font-black text-sm text-black">{totals.billAmount}</td>
                  <td className="p-1 font-black text-sm text-black">{totals.received}</td>
                  <td className="text-black"></td>
                  <td className="p-1 font-black text-sm text-black">{totals.tds}</td>
                  <td className="p-1 font-black text-sm text-black">{totals.claim}</td>
                  <td className="p-1 font-black text-sm text-black">{totals.netAmount}</td>
                </tr>
                <tr className="h-8">
                  <td className="text-black" colSpan={6}></td>
                  <td className="p-1 text-right pr-2 font-bold text-sm text-black" colSpan={2}>Round off+/-</td>
                  <td className="p-1 font-bold text-sm text-black">{totals.roundOffFormatted}</td>
                </tr>
                <tr className="font-black h-10 text-base">
                  <td className="text-black" colSpan={6}></td>
                  <td className="p-1 text-right pr-2 uppercase tracking-widest text-black" colSpan={2}>
                    Sub Total
                  </td>
                  <td className="p-1 text-black">{totals.subTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks & Signatures at the absolute bottom */}
        <div className="mt-auto">
          <div className="mb-6">
            <span className="font-black block uppercase mb-1 text-sm text-black">
              Remarks & Notes
            </span>
            <p className="border-2 border-black p-2 min-h-[60px] whitespace-pre-wrap text-sm font-bold text-black">
              {narration || ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 text-center text-sm">
            <div className="space-y-12">
              <div className="h-6"></div>
              <div className="border-t-2 border-black w-48 mx-auto pt-1 font-black uppercase text-black">
                Receiver Signature
              </div>
            </div>
            <div className="space-y-12">
              <div className="h-6"></div>
              <div className="border-t-2 border-black w-48 mx-auto pt-1 font-black uppercase text-black">
                Authorized Signatory
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- FLOATING ACTIONS -------------------- */}
      <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg print:hidden">
        <button
          type="button"
          onClick={() => navigate({ to: "/money-receipt-records" })}
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
  );
}
