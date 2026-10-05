import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { Printer, Plus, Trash2, Copy, Save, Phone, MessageCircle, Smartphone, ArrowLeft, RotateCcw, Lock } from "lucide-react";
import { useOpsStore } from "../lib/ops-store";
import { useMasterStore } from "../lib/master-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/billing")({
  validateSearch: (search: Record<string, unknown>): { editId?: string; print?: string; autoPrint?: string; id?: string } => ({
    editId: (search.editId as string) || (search.id as string) || undefined,
    print: (search.print as string) || (search.autoPrint as string) || undefined,
    autoPrint: (search.autoPrint as string) || undefined,
    id: (search.id as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Billing & Invoicing — JRKS Logistics ERP" },
      {
        name: "description",
        content: "Review and manage logistics billing invoices and customer payments.",
      },
    ],
  }),
  component: BillingPage,
});

// Helper for Indian Rupees number to words conversion
function toIndianRupeesWords(num: number): string {
  const integerPart = Math.floor(num);
  if (integerPart === 0) return "Zero Rupees Only";

  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  };

  const formatHundreds = (n: number) => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n = n % 100;
    }
    if (n > 0) {
      str += formatTens(n);
    }
    return str.trim();
  };

  let str = "";
  let temp = integerPart;

  if (temp >= 10000000) {
    const crores = Math.floor(temp / 10000000);
    str += formatHundreds(crores) + " Crore ";
    temp %= 10000000;
  }

  if (temp >= 100000) {
    const lakhs = Math.floor(temp / 100000);
    str += formatHundreds(lakhs) + " Lakh ";
    temp %= 100000;
  }

  if (temp >= 1000) {
    const thousands = Math.floor(temp / 1000);
    str += formatHundreds(thousands) + " Thousand ";
    temp %= 1000;
  }

  if (temp > 0) {
    str += formatHundreds(temp);
  }

  str = str.trim();
  if (!str) return "";

  return str + " Rupees Only";
}

interface InvoiceRow {
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
  haltingAmount: string;
  rtoFine: string;
  ratePer?: string;
  amount: string;
}

interface InvoiceData {
  id?: string | number;
  billNo: string;
  lrNumber?: string;
  date: string;
  submittedDate: string;
  dueDate: string;
  companyName: string;
  companyAddress: string;
  companyMobile: string;
  companyWhatsApp: string;
  companyOffice: string;
  companyEmail: string;
  companyGst: string;
  companyPan: string;
  customerName: string;
  customerAddress: string;
  customerGst: string;
  customerPan: string;
  fromLocation: string;
  toLocation: string;
  rows: InvoiceRow[];
  bankName: string;
  bankBranch: string;
  accountNo: string;
  ifscCode: string;
  accountHolder: string;
  terms: string;
  rupeesInWords: string;
  subTotalOverride?: string;
  gstOverride?: string;
  grandTotalOverride?: string;
  gstPercentage?: string;
}

function getTodayDDMMYYYY(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function ensureDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

const defaultInvoiceData = (): InvoiceData => ({
  billNo: "",
  lrNumber: "",
  date: getTodayDDMMYYYY(),
  submittedDate: "",
  dueDate: "",
  companyName: "JRKS DIGITAL INDIA LOGISTICS LLP",
  companyAddress:
    "No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post), Trichy - 620 019.",
  companyMobile: "+91 93645 95075",
  companyWhatsApp: "+91 97906 05938",
  companyOffice: "0431-4518283",
  companyEmail: "admin@jrksdilogistics.in",
  companyGst: "33AAWFJ4987B1ZY",
  companyPan: "AAWFJ4987B",
  customerName: "",
  customerAddress: "",
  customerGst: "",
  customerPan: "",
  fromLocation: "",
  toLocation: "",
  rows: [
    {
      id: "row-1",
      sNo: "",
      date: "",
      from: "",
      to: "",
      lrNo: "",
      goods: "",
      partyInvoiceNo: "",
      arvDate: "",
      unldDate: "",
      noOfPkg: "",
      weight: "",
      rate: "",
      haltingAmount: "",
      rtoFine: "",
      amount: "",
    },
  ],
  bankName: "HDFC Bank",
  bankBranch: "Coimbatore Main",
  accountNo: "50100234567890",
  ifscCode: "HDFC0000123",
  accountHolder: "JRKS Logistics",
  terms: "",
  rupeesInWords: "",
  gstPercentage: "0%",
});

// Helper to normalize and compare LR numbers flexibly
const cleanLrNumber = (val: string | undefined | null) => {
  if (!val) return "";
  let cleaned = val.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (cleaned.startsWith("lr")) {
    cleaned = cleaned.substring(2);
  }
  return cleaned.replace(/^0+/, "");
};

const matchLr = (a: string | undefined | null, b: string | undefined | null) => {
  if (!a || !b) return false;
  const cleanA = cleanLrNumber(a);
  const cleanB = cleanLrNumber(b);
  return cleanA === cleanB && cleanA !== "";
};

const logo = "/logo.png";

// Helper component to enable inline editable text seamlessly
const EditableCell = ({
  value,
  onChange,
  className = "",
  showBorder = false,
  singleLine = false,
  maxWords,
  maxChars,
  tabIndex,
  placeholder = "",
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  showBorder?: boolean;
  singleLine?: boolean;
  maxWords?: number;
  maxChars?: number;
  tabIndex?: number;
  placeholder?: string;
  disabled?: boolean;
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastCommittedRef = useRef(value);

  // Keep internal text in sync with changes from outside when not active
  useEffect(() => {
    if (cellRef.current) {
      const displayVal = !value && !isFocused && placeholder ? placeholder : value;
      if (cellRef.current.innerText !== displayVal) {
        cellRef.current.innerText = displayVal;
      }
    }
    lastCommittedRef.current = value;
  }, [value, isFocused, placeholder]);

  const limitWords = (str: string, max: number): string => {
    const words = str.trim().split(/\s+/).filter(Boolean);
    if (words.length > max) {
      return words.slice(0, max).join(" ");
    }
    return str;
  };

  const limitChars = (str: string, max: number): string => {
    if (str.length > max) {
      return str.slice(0, max);
    }
    return str;
  };

  const commitChange = (txt: string) => {
    if (disabled) return;
    if (txt !== lastCommittedRef.current) {
      lastCommittedRef.current = txt;
      onChange(txt);
    }
  };

  const moveFocusToNext = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    // Commit current value first
    if (cellRef.current) {
      let txt = cellRef.current.innerText || "";
      if (maxWords) txt = limitWords(txt, maxWords);
      if (maxChars) txt = limitChars(txt, maxChars);
      commitChange(txt);
    }
    // Find all focusable contenteditable divs and inputs, move to next
    const focusables = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[contenteditable="true"]:not([data-no-tab]), input:not([type="hidden"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    const idx = cellRef.current ? focusables.indexOf(cellRef.current) : -1;
    const next = e.shiftKey ? focusables[idx - 1] : focusables[idx + 1];
    if (next) {
      next.focus();
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(next);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  };

  return (
    <div
      ref={cellRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      tabIndex={disabled ? -1 : (tabIndex ?? 0)}
      className={`outline-none rounded px-1.5 py-0.5 min-h-[1.2em] select-text uppercase ${disabled ? "cursor-not-allowed opacity-90 select-none" : ""
        } ${singleLine ? "whitespace-nowrap overflow-hidden" : "break-words whitespace-pre-wrap"
        } ${showBorder
          ? isFocused && !disabled
            ? "border-[1.5px] border-solid border-black bg-white shadow-sm print:border-[1.5px] print:border-solid print:border-black print:bg-slate-50"
            : "border-[1.5px] border-solid border-black bg-white print:border-[1.5px] print:border-solid print:border-black print:bg-slate-50"
          : ""
        } ${className}`}
      onFocus={() => {
        if (disabled) return;
        setIsFocused(true);
        if (cellRef.current && cellRef.current.innerText === placeholder && !value) {
          cellRef.current.innerText = "";
        }
      }}
      onBlur={() => {
        setIsFocused(false);
        if (cellRef.current) {
          let txt = cellRef.current.innerText || "";
          if (txt === placeholder) txt = "";
          if (maxWords) txt = limitWords(txt, maxWords);
          if (maxChars) txt = limitChars(txt, maxChars);
          const finalDisplay = !txt && placeholder ? placeholder : txt;
          cellRef.current.innerText = finalDisplay;
          commitChange(txt);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Tab" || e.key === "Enter") {
          moveFocusToNext(e);
          return;
        }

        const isControlKey =
          e.key === "Backspace" ||
          e.key === "Delete" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight" ||
          e.key === "ArrowUp" ||
          e.key === "ArrowDown" ||
          e.key === "Home" ||
          e.key === "End" ||
          e.ctrlKey ||
          e.metaKey;

        if (maxChars && !isControlKey) {
          const currentText = cellRef.current?.innerText || "";
          if (currentText.length >= maxChars) {
            e.preventDefault();
          }
        }
      }}
      onInput={() => {
        if (cellRef.current && maxChars) {
          const txt = cellRef.current.innerText || "";
          if (txt.length > maxChars) {
            cellRef.current.innerText = txt.slice(0, maxChars);
            // Put cursor back to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(cellRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      }}
      style={{
        wordBreak: singleLine ? "keep-all" : "break-word",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    />
  );
};

function BillingPage() {
  const userRole = typeof window !== "undefined" ? sessionStorage.getItem("userRole") : "admin";

  const { editId } = Route.useSearch();
  const navigate = useNavigate();
  const { bills, addBill, updateBill, nextBillNo, loadData, moneyReceipts } = useOpsStore();
  const companies = useMasterStore((state) => state.companies);

  useEffect(() => {
    loadData();
  }, [loadData]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(1);

  // Invoice form state
  const [invoice, setInvoice] = useState<InvoiceData>(defaultInvoiceData);

  const [selectedBill, setSelectedBill] = useState<any>(null);

  // Sync editId parameter from URL to selectedBill state
  useEffect(() => {
    if (editId) {
      const matched = bills.find((b) => String(b.id) === String(editId));
      if (matched) {
        setSelectedBill(matched);
      } else {
        setSelectedBill(null);
      }
    } else {
      setSelectedBill(null);
    }
  }, [editId, bills]);

  // Load a selected bill into the form view, or reset to empty
  useEffect(() => {
    if (selectedBill) {
      setInvoice({
        billNo: selectedBill.billNo,
        lrNumber: selectedBill.lrNumber || "",
        date: selectedBill.date,
        submittedDate: selectedBill.submittedDate || "",
        dueDate: selectedBill.dueDate || "",
        companyName: selectedBill.companyName,
        companyAddress: selectedBill.companyAddress || "",
        companyMobile: selectedBill.companyMobile || "",
        companyWhatsApp: selectedBill.companyWhatsApp || "",
        companyOffice: selectedBill.companyOffice || "",
        companyEmail: selectedBill.companyEmail || "",
        companyGst: selectedBill.companyGst || "",
        companyPan: selectedBill.companyPan || "",
        customerName: selectedBill.customerName,
        customerAddress: selectedBill.customerAddress || "",
        customerGst: selectedBill.customerGst || "",
        customerPan: selectedBill.customerPan || "",
        fromLocation: selectedBill.fromLocation || "",
        toLocation: selectedBill.toLocation || "",
        rows: selectedBill.items || [],
        bankName: selectedBill.bankName || "",
        bankBranch: selectedBill.bankBranch || "",
        accountNo: selectedBill.accountNo || "",
        ifscCode: selectedBill.ifscCode || "",
        accountHolder: selectedBill.accountHolder || "",
        terms: selectedBill.terms || "",
        rupeesInWords: selectedBill.rupeesInWords || "",
        subTotalOverride: selectedBill.subTotalOverride,
        gstOverride: selectedBill.gstOverride,
        grandTotalOverride: selectedBill.grandTotalOverride,
        gstPercentage: selectedBill.gstPercentage || "0%",
      });
    } else {
      setInvoice({ ...defaultInvoiceData(), billNo: nextBillNo() });
    }
  }, [selectedBill]);

  const isLocked = useMemo(() => {
    if (!selectedBill && !invoice.billNo && !invoice.lrNumber) return false;
    return (moneyReceipts || []).some((mr: any) => {
      const mrLr = (mr.lrNo || "").toString().trim().toLowerCase();
      const mrBillNo = (mr.billNo || "").toString().trim().toLowerCase();

      // Direct billNo match
      if (invoice.billNo && (mrBillNo === invoice.billNo.toLowerCase() || mrLr === invoice.billNo.toLowerCase())) return true;
      if (selectedBill?.billNo && (mrBillNo === selectedBill.billNo.toLowerCase() || mrLr === selectedBill.billNo.toLowerCase())) return true;

      // Direct LR match
      if (invoice.lrNumber && matchLr(mrLr, invoice.lrNumber)) return true;
      if (selectedBill?.lrNumber && matchLr(mrLr, selectedBill.lrNumber)) return true;

      // Any row LR match
      if (invoice.rows?.some((r) => r.lrNo && matchLr(mrLr, r.lrNo))) return true;
      if (selectedBill?.items?.some((r: any) => r.lrNo && matchLr(mrLr, r.lrNo))) return true;

      // Inside items of MR
      if (Array.isArray(mr.items)) {
        return mr.items.some((item: any) => {
          const itemRef = (item.lrNo || item.lrNumber || item.billNo || item.cnNo || "").toString().trim().toLowerCase();
          if (invoice.billNo && itemRef === invoice.billNo.toLowerCase()) return true;
          if (selectedBill?.billNo && itemRef === selectedBill.billNo.toLowerCase()) return true;
          if (invoice.lrNumber && matchLr(itemRef, invoice.lrNumber)) return true;
          if (selectedBill?.lrNumber && matchLr(itemRef, selectedBill.lrNumber)) return true;
          if (invoice.rows?.some((r) => r.lrNo && matchLr(itemRef, r.lrNo))) return true;
          return false;
        });
      }

      return false;
    });
  }, [moneyReceipts, invoice.billNo, invoice.lrNumber, invoice.rows, selectedBill]);

  const handleSave = async (shouldPrint = false) => {
    if (isLocked) {
      if (shouldPrint) {
        window.print();
      } else {
        toast.error("This Bill / Invoice is locked and cannot be modified because a Money Receipt has already been generated.");
      }
      return;
    }

    if (!invoice.billNo.trim()) {
      toast.error("Please enter a Bill/Invoice Number.");
      return;
    }
    if (!invoice.customerName.trim()) {
      toast.error("Please enter Billed To / Consignor Name.");
      return;
    }

    const targetId = editId || invoice.id;
    const saveData = {
      billNo: invoice.billNo,
      lrNumber: invoice.lrNumber || "",
      date: invoice.date,
      submittedDate: invoice.submittedDate || "",
      dueDate: invoice.dueDate || "",
      companyName: invoice.companyName,
      companyAddress: invoice.companyAddress,
      companyMobile: invoice.companyMobile,
      companyWhatsApp: invoice.companyWhatsApp,
      companyOffice: invoice.companyOffice,
      companyEmail: invoice.companyEmail,
      companyGst: invoice.companyGst,
      companyPan: invoice.companyPan,
      customerName: invoice.customerName,
      customerAddress: invoice.customerAddress,
      customerGst: invoice.customerGst,
      customerPan: invoice.customerPan,
      fromLocation: invoice.fromLocation,
      toLocation: invoice.toLocation,
      bankName: invoice.bankName,
      bankBranch: invoice.bankBranch,
      accountNo: invoice.accountNo,
      ifscCode: invoice.ifscCode,
      accountHolder: invoice.accountHolder,
      terms: invoice.terms,
      rupeesInWords: invoice.rupeesInWords,
      subTotalOverride: invoice.subTotalOverride,
      gstOverride: invoice.gstOverride,
      grandTotalOverride: invoice.grandTotalOverride,
      gstPercentage: invoice.gstPercentage || "0%",
      items: invoice.rows,
    };

    try {
      if (targetId) {
        const ok = await updateBill(String(targetId), saveData);
        if (ok) {
          toast.success("Invoice updated successfully!");
          await loadData();
          if (shouldPrint === true) {
            setTimeout(() => {
              const handleAfterPrint = () => {
                navigate({ to: "/bill-records" });
              };
              window.addEventListener("afterprint", handleAfterPrint, { once: true });
              window.print();
            }, 300);
          } else {
            navigate({ to: "/bill-records" });
          }
        } else {
          toast.error("Failed to update the bill.");
        }
      } else {
        const ok = await addBill(saveData);
        if (ok) {
          toast.success("Invoice saved successfully!");
          await loadData();
          if (shouldPrint === true) {
            setTimeout(() => {
              const handleAfterPrint = () => {
                navigate({ to: "/bill-records" });
              };
              window.addEventListener("afterprint", handleAfterPrint, { once: true });
              window.print();
            }, 300);
          } else {
            navigate({ to: "/bill-records" });
          }
        } else {
          toast.error("Failed to save the bill.");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving.");
    }
  };

  // Search states for LR details auto-fetch
  const consignmentNotes = useOpsStore((state) => state.consignmentNotes);
  const arrivalReports = useOpsStore((state) => state.arrivalReports);
  const challans = useOpsStore((state) => state.challans);

  const handleLrFieldChange = (val: string) => {
    // 1. If an existing bill matches this LR number, load it completely
    const existingBill = bills.find(
      (b) => matchLr(b.lrNumber, val) || b.items.some((item) => matchLr(item.lrNo, val)),
    );
    const cnNote = consignmentNotes.find(
      (c) => matchLr(c.lrNumber, val) || matchLr(c.consignmentNoteNo, val),
    );

    if (existingBill) {
      setInvoice({
        id: existingBill.id,
        billNo: existingBill.billNo,
        lrNumber: existingBill.lrNumber || val,
        date: existingBill.date,
        submittedDate: existingBill.submittedDate || "",
        dueDate: existingBill.dueDate || "",
        companyName: existingBill.companyName,
        companyAddress: existingBill.companyAddress || "",
        companyMobile: existingBill.companyMobile || "",
        companyWhatsApp: existingBill.companyWhatsApp || "",
        companyOffice: existingBill.companyOffice || "",
        companyEmail: existingBill.companyEmail || "",
        companyGst: existingBill.companyGst || "",
        companyPan: existingBill.companyPan || "",
        customerName: existingBill.customerName,
        customerAddress: existingBill.customerAddress || "",
        customerGst: existingBill.customerGst || "",
        customerPan: existingBill.customerPan || "",
        fromLocation: existingBill.fromLocation || "",
        toLocation: existingBill.toLocation || "",
        rows:
          existingBill.items && existingBill.items.length > 0
            ? existingBill.items.map((item) => ({
              ...item,
              haltingAmount: item.haltingAmount || "",
              rtoFine: item.rtoFine || "",
            }))
            : [],
        bankName: existingBill.bankName || "",
        bankBranch: existingBill.bankBranch || "",
        accountNo: existingBill.accountNo || "",
        ifscCode: existingBill.ifscCode || "",
        accountHolder: existingBill.accountHolder || "",
        terms: existingBill.terms || "",
        rupeesInWords: existingBill.rupeesInWords || "",
        subTotalOverride: existingBill.subTotalOverride,
        gstOverride: existingBill.gstOverride,
        grandTotalOverride: existingBill.grandTotalOverride,
        gstPercentage: existingBill.gstPercentage || "0%",
      });
      return;
    }

    // 2. Otherwise, construct from ConsignmentNote + Arrival + Challan
    const arrReport = cnNote
      ? arrivalReports.find(
        (ar) => matchLr(ar.lr_no, cnNote.lrNumber) || matchLr(ar.lr_no, cnNote.consignmentNoteNo),
      )
      : undefined;
    const challan = cnNote
      ? challans.find((ch) =>
        ch.items.some(
          (item) =>
            matchLr(item.cnNo, cnNote.lrNumber) || matchLr(item.cnNo, cnNote.consignmentNoteNo),
        ),
      )
      : undefined;
    const matchedCompany = cnNote
      ? companies.find((c) => c.consigneeName === cnNote.consignorName)
      : undefined;
    const consignorPanVal = cnNote ? cnNote.consignorPan || matchedCompany?.panNumber || "" : "";
    const consignorGstVal = cnNote ? cnNote.consignorGst || matchedCompany?.gstNumber || "" : "";

    setInvoice((prev) => {
      const updated = { ...prev, lrNumber: val };
      if (cnNote) {
        const mappedRows = cnNote.items.map((item, index) => {
          const wt = String(item.netWeight || "");
          return {
            id: `fetched-row-${index}-${Date.now()}`,
            sNo: (cnNote.vehicleNumber || "").replace(/\s+/g, ""),
            date: ensureDDMMYYYY(cnNote.lrDate),
            from: cnNote.fromLocation || "",
            to: cnNote.toLocation || "",
            lrNo: cnNote.lrNumber,
            goods: item.description || "",
            partyInvoiceNo: item.invoiceNoDcNo || "",
            arvDate: arrReport?.arrival_date ? ensureDDMMYYYY(arrReport.arrival_date) : "",
            unldDate: arrReport?.delivery_date ? ensureDDMMYYYY(arrReport.delivery_date) : "",
            noOfPkg: String(item.noOfPackages || ""),
            weight: wt,
            rate: item.bookingAmount ? String(item.bookingAmount) : "",
            haltingAmount:
              arrReport?.total_detention_amount && arrReport.total_detention_amount !== "0.00"
                ? String(arrReport.total_detention_amount)
                : "",
            rtoFine: challan?.rtoFine ? String(challan.rtoFine) : "",
            amount: (() => {
              const r = item.bookingAmount ? parseFloat(String(item.bookingAmount)) : 0;
              const h = arrReport?.total_detention_amount
                ? parseFloat(arrReport.total_detention_amount)
                : 0;
              const f = challan?.rtoFine ? parseFloat(String(challan.rtoFine)) : 0;
              const total = r + h + f;
              return total > 0 ? String(total) : "";
            })(),
          };
        });

        return {
          ...updated,
          lrNumber: cnNote.lrNumber,
          customerName: cnNote.consignorName || cnNote.consigneeName,
          customerAddress: cnNote.consignorAddress || cnNote.consigneeAddress,
          customerGst: consignorGstVal,
          customerPan: consignorPanVal,
          fromLocation: cnNote.fromLocation,
          toLocation: cnNote.toLocation,
          rows: mappedRows.length > 0 ? mappedRows : prev.rows,
        };
      }

      return updated;
    });
  };

  // Handle dynamic scale sizing to fit the container width and height perfectly (no scrollbars)
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Subtract buttons width (160px buttons + gap = 170px) from containerWidth
        const containerWidth = containerRef.current.clientWidth - 170;
        // Subtract vertical padding from containerHeight
        const containerHeight = containerRef.current.clientHeight - 8;

        const targetWidth = 1123;
        const targetHeight = 794;

        const scaleX = containerWidth / targetWidth;
        const scaleY = containerHeight / targetHeight;

        // Fit completely inside both boundaries with a 5% scaling boost for maximum screen space utilization
        const newScale = Math.min(scaleX, scaleY) * 1.05;
        setScale(newScale);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Auto-calculated Subtotal, GST and Grandtotal from rows
  const computedSubTotal = useMemo(() => {
    return invoice.rows.reduce((sum, r) => {
      const val = parseFloat(r.amount);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [invoice.rows]);

  const currentSubTotal =
    invoice.subTotalOverride !== undefined && invoice.subTotalOverride !== ""
      ? invoice.subTotalOverride
      : computedSubTotal.toFixed(2);

  const parsedGstPercent = useMemo(() => {
    const clean = (invoice.gstPercentage || "0%").replace(/[^0-9.]/g, "");
    const pct = parseFloat(clean);
    return isNaN(pct) ? 0 : pct;
  }, [invoice.gstPercentage]);

  const computedGst = useMemo(() => {
    const sub = parseFloat(currentSubTotal);
    if (isNaN(sub)) return "0.00";
    return (sub * (parsedGstPercent / 100)).toFixed(2);
  }, [currentSubTotal, parsedGstPercent]);

  const currentGst =
    invoice.gstOverride !== undefined && invoice.gstOverride !== ""
      ? invoice.gstOverride
      : computedGst;

  const computedGrandTotal = useMemo(() => {
    const base = parseFloat(currentSubTotal);
    const gstVal = parseFloat(currentGst);
    const bVal = isNaN(base) ? 0 : base;
    const gVal = isNaN(gstVal) ? 0 : gstVal;
    return bVal + gVal;
  }, [currentSubTotal, currentGst]);

  const currentGrandTotal =
    invoice.grandTotalOverride !== undefined && invoice.grandTotalOverride !== ""
      ? invoice.grandTotalOverride
      : computedGrandTotal.toFixed(2);

  // Auto-update Rupees in Words unless manually altered
  useEffect(() => {
    const totalVal = parseFloat(currentGrandTotal);
    if (!isNaN(totalVal) && totalVal > 0) {
      const words = toIndianRupeesWords(totalVal);
      setInvoice((prev) => ({
        ...prev,
        rupeesInWords: words,
      }));
    }
  }, [currentGrandTotal]);

  const handlePrint = () => {
    window.print();
  };

  const handleClearAll = () => {
    if (isLocked) {
      toast.error("This Bill / Invoice is locked and cannot be cleared.");
      return;
    }
    setInvoice({
      billNo: "",
      lrNumber: "",
      date: getTodayDDMMYYYY(),
      submittedDate: "",
      dueDate: "",
      companyName: "JRKS DIGITAL INDIA LOGISTICS LLP",
      companyAddress:
        "No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post), Trichy - 620 019.",
      companyMobile: "+91 93645 95075",
      companyWhatsApp: "+91 97906 05938",
      companyOffice: "0431-4518283",
      companyEmail: "admin@jrksdilogistics.in",
      companyGst: "33AAWFJ4987B1ZY",
      companyPan: "AAWFJ4987B",
      customerName: "",
      customerAddress: "",
      customerGst: "",
      customerPan: "",
      fromLocation: "",
      toLocation: "",
      rows: [
        {
          id: `row-${Date.now()}`,
          sNo: "",
          date: "",
          from: "",
          to: "",
          lrNo: "",
          goods: "",
          partyInvoiceNo: "",
          arvDate: "",
          unldDate: "",
          noOfPkg: "",
          weight: "",
          rate: "",
          haltingAmount: "",
          rtoFine: "",
          amount: "",
        },
      ],
      bankName: "HDFC Bank",
      bankBranch: "Coimbatore Main",
      accountNo: "50100234567890",
      ifscCode: "HDFC0000123",
      accountHolder: "JRKS Logistics",
      terms: "",
      rupeesInWords: "",
      gstPercentage: "0%",
      gstOverride: undefined,
      subTotalOverride: undefined,
      grandTotalOverride: undefined,
    });
  };

  // Row Manipulation Actions
  const handleUpdateRow = (index: number, updatedFields: Partial<InvoiceRow>) => {
    setInvoice((prev) => {
      const newRows = [...prev.rows];
      // Pad newRows with empty rows if the user is editing a dynamically padded row index
      while (newRows.length <= index) {
        newRows.push({
          id: `new-row-${newRows.length}-${Date.now()}`,
          sNo: "",
          date: "",
          from: "",
          to: "",
          lrNo: "",
          goods: "",
          partyInvoiceNo: "",
          arvDate: "",
          unldDate: "",
          noOfPkg: "",
          weight: "",
          rate: "",
          haltingAmount: "",
          rtoFine: "",
          amount: "",
        });
      }

      let updatedRow = { ...newRows[index], ...updatedFields };

      // Auto-fetch details if lrNo is updated/entered in the row
      if (updatedFields.lrNo !== undefined) {
        const val = updatedFields.lrNo;
        const cnNote = consignmentNotes.find(
          (c) => matchLr(c.lrNumber, val) || matchLr(c.consignmentNoteNo, val),
        );
        if (cnNote) {
          const arrReport = arrivalReports.find(
            (ar) =>
              matchLr(ar.lr_no, cnNote.lrNumber) || matchLr(ar.lr_no, cnNote.consignmentNoteNo),
          );
          const challan = challans.find((ch) =>
            ch.items.some(
              (item) =>
                matchLr(item.cnNo, cnNote.lrNumber) || matchLr(item.cnNo, cnNote.consignmentNoteNo),
            ),
          );
          const firstItem = cnNote.items[0];
          const totalPackages = cnNote.items.reduce(
            (sum, item) => sum + Number(item.noOfPackages || 0),
            0,
          );
          const totalWeight = cnNote.items.reduce(
            (sum, item) => sum + Number(item.netWeight || 0),
            0,
          );
          const goodsDesc = cnNote.items
            .map((item) => item.description)
            .filter(Boolean)
            .join(", ");

          updatedRow = {
            ...updatedRow,
            date: ensureDDMMYYYY(cnNote.lrDate),
            sNo: (cnNote.vehicleNumber || "").replace(/\s+/g, ""),
            from: cnNote.fromLocation || "",
            to: cnNote.toLocation || "",
            goods: goodsDesc || firstItem?.description || "",
            noOfPkg:
              totalPackages > 0 ? String(totalPackages) : String(firstItem?.noOfPackages || ""),
            weight: totalWeight > 0 ? String(totalWeight) : String(firstItem?.netWeight || ""),
            rate: challan?.freight ? String(challan.freight) : updatedRow.rate,
            arvDate: arrReport?.arrival_date ? ensureDDMMYYYY(arrReport.arrival_date) : "",
            unldDate: arrReport?.delivery_date ? ensureDDMMYYYY(arrReport.delivery_date) : "",
            haltingAmount:
              arrReport?.total_detention_amount && arrReport.total_detention_amount !== "0.00"
                ? String(arrReport.total_detention_amount)
                : "",
            rtoFine: challan?.rtoFine ? String(challan.rtoFine) : "",
          };

          const r = parseFloat(updatedRow.rate || "0") || 0;
          const h = parseFloat(updatedRow.haltingAmount || "0") || 0;
          const f = parseFloat(updatedRow.rtoFine || "0") || 0;
          if (r > 0 || h > 0 || f > 0) {
            updatedRow.amount = String(r + h + f);
          }

          // Update customer details at the top asynchronously
          const matchedCompany = companies.find((c) => c.consigneeName === cnNote.consignorName);
          const consignorPanVal = cnNote.consignorPan || matchedCompany?.panNumber || "";
          const consignorGstVal = cnNote.consignorGst || matchedCompany?.gstNumber || "";

          setTimeout(() => {
            setInvoice((current) => ({
              ...current,
              lrNumber: current.lrNumber || cnNote.lrNumber || cnNote.consignmentNoteNo || "",
              customerName: current.customerName || cnNote.consignorName || cnNote.consigneeName,
              customerAddress:
                current.customerAddress || cnNote.consignorAddress || cnNote.consigneeAddress,
              customerGst: current.customerGst || consignorGstVal,
              customerPan: current.customerPan || consignorPanVal,
              fromLocation: current.fromLocation || cnNote.fromLocation,
              toLocation: current.toLocation || cnNote.toLocation,
            }));
          }, 0);
        }
      }

      // Auto-calculate amount if rate, haltingAmount, or rtoFine was manually modified
      if (
        updatedFields.rate !== undefined ||
        updatedFields.haltingAmount !== undefined ||
        updatedFields.rtoFine !== undefined
      ) {
        const r = parseFloat(updatedRow.rate || "0") || 0;
        const h = parseFloat(updatedRow.haltingAmount || "0") || 0;
        const f = parseFloat(updatedRow.rtoFine || "0") || 0;
        if (r > 0 || h > 0 || f > 0) {
          updatedRow.amount = String(r + h + f);
        } else {
          updatedRow.amount = "";
        }
      }

      newRows[index] = updatedRow;
      return { ...prev, rows: newRows };
    });
  };

  const handleInsertRow = (index: number) => {
    const newRow: InvoiceRow = {
      id: `row-${Date.now()}`,
      sNo: "",
      date: getTodayDDMMYYYY(),
      from: "",
      to: "",
      lrNo: "",
      goods: "",
      partyInvoiceNo: "",
      arvDate: "",
      unldDate: "",
      noOfPkg: "",
      weight: "",
      rate: "",
      haltingAmount: "",
      rtoFine: "",
      amount: "",
    };
    setInvoice((prev) => {
      const newRows = [...prev.rows];
      newRows.splice(index + 1, 0, newRow);
      return { ...prev, rows: newRows };
    });
  };

  const handleDuplicateRow = (index: number) => {
    setInvoice((prev) => {
      const newRows = [...prev.rows];
      const source = newRows[index];
      const duplicated: InvoiceRow = {
        ...source,
        id: `row-${Date.now()}`,
        sNo: "",
      };
      newRows.splice(index + 1, 0, duplicated);
      return { ...prev, rows: newRows };
    });
  };

  const handleDeleteRow = (index: number) => {
    if (invoice.rows.length <= 1) {
      alert("At least one row is required.");
      return;
    }
    setInvoice((prev) => {
      const newRows = prev.rows.filter((_, i) => i !== index);
      return { ...prev, rows: newRows };
    });
  };

  // Fixed visual layout helpers
  const rowCountToShow = Math.max(5, invoice.rows.length);

  // Dynamic padding: construct 5 fully editable rows
  const editableRows = useMemo(() => {
    const list = [...invoice.rows];
    while (list.length < rowCountToShow) {
      list.push({
        id: `padded-empty-${list.length}-${Date.now()}`,
        sNo: "",
        date: "",
        from: "",
        to: "",
        lrNo: "",
        goods: "",
        partyInvoiceNo: "",
        arvDate: "",
        unldDate: "",
        noOfPkg: "",
        weight: "",
        rate: "",
        haltingAmount: "",
        rtoFine: "",
        amount: "",
      });
    }
    return list;
  }, [invoice.rows, rowCountToShow]);

  return (
    <div
      ref={containerRef}
      id="billing-page-root"
      className="relative w-full h-[calc(100vh-140px)] bg-slate-100 flex items-center justify-center overflow-hidden p-1 select-none"
      style={{ zoom: 1 }}
    >
      {/* SCOPED PRINT STYLES */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 5mm;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          /* Hide app wrappers, sidebar, headers, controls, and action columns */
          aside, header, nav, footer, .no-print, button, .actions-column, [data-sonner-toaster], [data-sonner-toast] {
            display: none !important;
          }
          
          /* Reset parent containers up to the page root */
          html, body, #root, main,
          .min-h-screen,
          .flex-col,
          .mx-auto,
          #billing-page-root,
          #billing-canvas-aligner,
          #billing-canvas-wrapper {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: hidden !important; /* Force content on exactly 1 page! */
            display: block !important;
            position: relative !important;
            transform: none !important;
            zoom: 1 !important;
            box-shadow: none !important;
          }

          /* Exact landscape container override for printing (matching consignment note layout) */
          .a4-landscape-page {
            border: 2px solid #000000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 280mm !important;
            height: auto !important; /* Dynamic height fits all content strictly on a single sheet */
            min-height: 0 !important;
            max-height: 190mm !important;
            margin: 0 !important;
            padding: 0 !important; /* Elements touch borders exactly */
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            zoom: 1 !important;

            /* Rotate page: Left edge of landscape becomes top of A4 portrait */
            transform: rotate(90deg) !important;
            transform-origin: top left !important;
            position: absolute !important;
            left: 194mm !important;
            top: 3.5mm !important;
            background: white !important;
          }

          /* Ensure the inner wrapper matches the canvas height exactly */
          .a4-landscape-page > div {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important; /* Stack sections tightly together to connect them and remove gaps */
            height: auto !important; /* Collapse height to fit content exactly in print */
            width: 100% !important;
            border: none !important; /* Remove inner wrapper border to prevent double borders */
            position: relative !important;
          }

          /* Force solid black borders on all layout dividers during print */
          .a4-landscape-page div,
          .a4-landscape-page td,
          .a4-landscape-page th {
            border-color: #000000 !important;
          }
          .a4-landscape-page .border-b {
            border-bottom: 1.5px solid #000000 !important;
          }
          .a4-landscape-page .border-t:not(.border-dotted) {
            border-top: 1.5px solid #000000 !important;
          }
          .a4-landscape-page .border-l {
            border-left: 1.5px solid #000000 !important;
          }
          .a4-landscape-page .border-r {
            border-right: 1.5px solid #000000 !important;
          }
          .a4-landscape-page .border {
            border: 1.5px solid #000000 !important;
          }

          /* Thinner top border above Billed To / GST NO section (print preview only) */
          #billing-section2-left, #billing-section2-right {
            border-top: 0.7px solid #000000 !important;
          }

          /* Collapse table section height to natural content height in print preview to remove gaps */
          #billing-section3 {
            flex: none !important; /* Disable flex grow to ensure height is respected by print engine */
            height: auto !important;
            max-height: none !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }
          #billing-section3 table {
            width: calc(100% + 2px) !important; /* Slightly wider to overlap parent borders and remove sub-pixel gaps */
            margin-left: -1px !important; /* Shift left to center the overlap */
            height: auto !important; /* Let table collapse to its natural height */
            table-layout: fixed !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            margin-right: 0 !important;
            padding: 0 !important;
          }
          #billing-section5 {
            height: 32mm !important; /* Lock Section 5 height to 32mm to fit details and signature gap */
            background: white !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #billing-section5 > div {
            height: 32mm !important; /* Force explicit 32mm height on print columns to resolve browser bugs */
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .sig-company-header {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            letter-spacing: normal !important;
          }
          .sig-label {
            font-size: 9.5px !important;
            font-weight: 800 !important;
            letter-spacing: 0.05em !important;
          }



          /* Increase top right metadata fields and boxes size in print preview */
          .a4-landscape-page div.w-\[38\%\] {
            font-size: 11px !important; /* Label text size 11px */
            padding-left: 20px !important;
            padding-right: 20px !important;
            width: 32% !important;
          }
          .a4-landscape-page div.w-\[62\%\] {
            width: 68% !important;
          }
          .a4-landscape-page div.w-\[38\%\] [contenteditable="true"] {
            font-size: 11px !important; /* Input text size 11px */
            width: 130px !important; /* Reduced to ensure it doesn't push labels left */
            max-width: 130px !important;
            padding: 1px 4px !important; /* Compact padding to make space for gaps */
            height: 18px !important; /* Keep box height compact */
            line-height: 1 !important;
            border-radius: 4px !important;
          }

          /* Gap between Bill No / LR No / Date boxes in print preview (top-right header column) */
          #billing-meta-col {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important; /* Solid 10px gap */
            justify-content: center !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            padding-left: 20px !important; /* Explicitly add left padding to prevent touching line */
            padding-right: 10px !important;
          }
          #billing-meta-col > div {
            height: 18px !important; /* Fixed row height of 18px */
            display: flex !important;
            align-items: center !important;
          }
          /* Gap before the GST, PAN, FROM/TO fields in print preview */
          #billing-section2-right > div.space-y-3 {
            padding-left: 20px !important;
          }
          #billing-section2-right > div.border-t {
            padding-left: 20px !important;
          }
          .a4-landscape-page div.h-\[32mm\] > div.w-\[38\%\] [contenteditable="true"] {
            font-size: 12px !important;
            padding: 4px 8px !important;
            width: 140px !important;
            max-width: 140px !important;
          }

          /* GST/PAN print-only: add gap between label and box, and padding from border edges */
          .a4-landscape-page div.h-\[32mm\] > div.w-\[38\%\] > div.space-y-3 > div {
            padding-left: 8px !important;
            padding-right: 8px !important;
            gap: 16px !important;
          }
          .a4-landscape-page div.h-\[32mm\] > div.w-\[38\%\] > div.space-y-3 span {
            margin-right: 8px !important;
          }

          /* Connect all lines properly and make borders solid black during print */
          .a4-landscape-page table {
            border-collapse: collapse !important;
            border: 1.5px solid #000000 !important;
          }
          .a4-landscape-page table th {
            background-color: #cccccc !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .a4-landscape-page table th,
          .a4-landscape-page table td {
            border-bottom: 1.5px solid #000000 !important;
            border-right: 1.5px solid #000000 !important;
            color: #000000 !important;
            padding: 2px 4px !important; /* Extremely compact padding to save height and prevent footer overflow */
            box-sizing: border-box !important;
            font-size: 10px !important; /* Compact font size to fit contents */
          }
          .a4-landscape-page table th:last-child,
          .a4-landscape-page table td:last-child {
            border-right: none !important;
          }
          .a4-landscape-page table tbody tr:last-child td {
            border-bottom: none !important;
          }
        }
        
        /* Non-print fallback styles for table rendering on screen */
        .a4-landscape-page table thead tr th {
          background-color: #cccccc !important;
          color: #000000 !important;
          border-right: 1.5px solid #000000 !important;
          border-bottom: 1.5px solid #000000 !important;
          font-weight: 800 !important;
        }
        .a4-landscape-page table tbody tr td {
          border-right: 1.5px solid #000000 !important;
          border-bottom: 1.5px solid #000000 !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          text-overflow: ellipsis !important;
        }
        .a4-landscape-page table tbody tr.body-row td {
          height: 29px !important;
          max-height: 29px !important;
        }
        .a4-landscape-page table tbody tr.summary-row td {
          height: 22px !important;
          max-height: 22px !important;
        }
      `}</style>

      {/* ── ALIGNED CONTENT CONTAINER (LOCKS ASPECT RATIO AND HEIGHT) ── */}
      <div id="billing-canvas-aligner" className="flex flex-col items-center flex-shrink-0">
        {/* ── LOCKED BANNER ── */}
        {isLocked && (
          <div className="no-print w-full max-w-[1123px] mb-2 bg-amber-50 border border-amber-300 rounded-xl p-2.5 px-4 flex items-center gap-3 text-amber-900 shadow-sm animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0 text-amber-700">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-black tracking-wide uppercase text-amber-900">
                FREIGHT BILL IS LOCKED
              </div>
              <div className="text-[11px] font-medium text-amber-700 mt-0.5">
                This Bill ({invoice.billNo || "Draft"}) is locked and cannot be modified because a Money Receipt has already been created for it.
              </div>
            </div>
          </div>
        )}

        {/* Scaled invoice canvas wrapper */}
        <div
          id="billing-canvas-wrapper"
          className="relative flex-shrink-0"
          style={{
            height: `${794 * scale}px`,
            width: `${1123 * scale}px`,
            overflow: "hidden",
          }}
        >
          <div
            className="a4-landscape-page bg-white relative flex flex-col justify-between flex-shrink-0"
            style={{
              width: "1123px",
              height: "794px",
              padding: "8mm",
              boxSizing: "border-box",
              border: "none",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              fontFamily: "'Inter', sans-serif",
              color: "black",
              backgroundColor: "white",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              position: "absolute",
              left: 0,
              top: 0,
            }}
          >
            {/* INNER WRAPPER FOR 2PX BORDER */}
            <fieldset disabled={isLocked} className={`contents border-0 p-0 m-0 min-w-0 ${isLocked ? "pointer-events-none select-none" : ""}`}>
              <div className="border border-black h-auto w-full flex flex-col justify-start overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full text-center font-black text-[12px] pt-1 uppercase tracking-widest text-black pointer-events-none">
                  FREIGHT BILL
                </div>
                {/* 1. HEADER SECTION (Height approx 40mm) */}
                <div className="h-[40mm] flex border-b border-black">
                  {/* Left Side: Logo & Company details */}
                  <div className="w-[64%] flex items-center p-2.5 pt-2.5">
                    <img
                      src={logo}
                      alt="JRKS Logo"
                      className="h-[96px] w-[96px] object-contain flex-shrink-0 mr-3"
                      style={{ filter: "grayscale(100%)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <h1 className="text-[18px] font-extrabold tracking-tight text-black uppercase leading-tight">
                        {invoice.companyName}
                      </h1>
                      <p className="text-[11px] font-bold text-black leading-none italic mt-0.5">
                        (Transport Contractor & Logistics Solutions)
                      </p>

                      <p className="text-[9.5px] font-semibold text-black leading-normal mt-1 whitespace-nowrap animate-none">
                        {invoice.companyAddress}
                      </p>

                      <div className="mt-1 flex items-center whitespace-nowrap gap-x-2 text-[10px] font-bold text-black">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Office:{" "}
                          <span className="font-semibold">{invoice.companyOffice}</span>
                        </span>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> WhatsApp:{" "}
                          <span className="font-semibold">{invoice.companyWhatsApp}</span>
                        </span>
                        <span>|</span>
                        <span className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" /> Mobile:{" "}
                          <span className="font-semibold">{invoice.companyMobile}</span>
                        </span>
                      </div>

                      <div className="text-[10px] font-bold text-black flex items-center whitespace-nowrap gap-x-2 leading-none mt-1.5 flex-wrap">
                        <span>
                          GST No. : <span className="text-black font-semibold">33AAWFJ4987B1ZY</span>
                        </span>
                        <span>|</span>
                        <span>
                          PAN : <span className="text-black font-semibold">AAWFJ4987B</span>
                        </span>
                        <span>|</span>
                        <span>
                          SAC Code : <span className="text-black font-semibold">9965</span>
                        </span>
                        <span>|</span>
                        <span>
                          Email :{" "}
                          <span className="text-black font-semibold lowercase">
                            {invoice.companyEmail || "admin@jrksdilogistics.in"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Meta Info rows */}
                  <div
                    id="billing-meta-col"
                    className="w-[36%] border-l border-black flex flex-col justify-between px-3 py-2 pt-2.5 text-[11px]"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-black uppercase tracking-wide whitespace-nowrap text-[11px]">
                        Bill / Invoice No:
                      </span>
                      <EditableCell
                        value={invoice.billNo}
                        onChange={(val) => setInvoice((p) => ({ ...p, billNo: val }))}
                        showBorder={true}
                        singleLine={true}
                        tabIndex={1}
                        className="font-bold font-mono text-black text-right w-[155px] max-w-[155px] py-1 max-h-[2em] overflow-hidden text-[11.5px]"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-black uppercase tracking-wide whitespace-nowrap text-[11px]">
                        LR Number:
                      </span>
                      <EditableCell
                        value={invoice.lrNumber || ""}
                        onChange={(val) => handleLrFieldChange(val)}
                        showBorder={true}
                        singleLine={true}
                        tabIndex={2}
                        className="font-bold font-mono text-black text-right w-[155px] max-w-[155px] py-1 max-h-[2em] overflow-hidden uppercase text-[11.5px]"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-black uppercase tracking-wide whitespace-nowrap text-[11px]">
                        Billing Date:
                      </span>
                      <EditableCell
                        value={invoice.date}
                        onChange={(val) => setInvoice((p) => ({ ...p, date: val }))}
                        showBorder={true}
                        singleLine={true}
                        tabIndex={3}
                        className="font-bold text-black text-right w-[155px] max-w-[155px] py-1 max-h-[2em] overflow-hidden text-[11.5px]"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-black uppercase tracking-wide whitespace-nowrap text-[11px]">
                        Submitted Date:
                      </span>
                      <EditableCell
                        value={invoice.submittedDate}
                        onChange={(val) => setInvoice((p) => ({ ...p, submittedDate: val }))}
                        showBorder={true}
                        singleLine={true}
                        tabIndex={4}
                        className="font-bold text-black text-right w-[155px] max-w-[155px] py-1 max-h-[2em] overflow-hidden text-[11.5px]"
                      />
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-black uppercase tracking-wide whitespace-nowrap text-[11px]">
                        Due Date:
                      </span>
                      <EditableCell
                        value={invoice.dueDate}
                        onChange={(val) => setInvoice((p) => ({ ...p, dueDate: val }))}
                        showBorder={true}
                        singleLine={true}
                        tabIndex={5}
                        className="font-bold text-black text-right w-[155px] max-w-[155px] py-1 max-h-[2em] overflow-hidden text-[11.5px]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. CUSTOMER & ROUTE SECTION (Height approx 32mm) */}
                <div className="h-[32mm] flex border-b border-black">
                  {/* Left Side: Billed To Customer */}
                  <div
                    id="billing-section2-left"
                    className="w-[64%] p-2.5 flex flex-col text-[11px] leading-tight justify-between h-full"
                  >
                    <div className="flex flex-col justify-between h-full py-0.5">
                      <span className="text-[10px] font-black text-black uppercase tracking-wider">
                        CONSIGNOR / BILLED TO:
                      </span>
                      <div className="flex flex-col justify-evenly flex-1 mt-1 text-[11px] leading-snug">
                        <div className="flex gap-1.5 items-center">
                          <span className="font-extrabold text-black uppercase whitespace-nowrap text-[11px]">
                            Name:
                          </span>
                          <EditableCell
                            value={invoice.customerName}
                            onChange={(val) => setInvoice((p) => ({ ...p, customerName: val }))}
                            singleLine={true}
                            maxWords={50}
                            className="font-bold text-black uppercase flex-1 py-0.5 min-h-0 text-[12.5px]"
                          />
                        </div>
                        <div className="flex gap-1.5 items-start">
                          <span className="font-extrabold text-black uppercase whitespace-nowrap text-[11px] mt-0.5">
                            Address:
                          </span>
                          <EditableCell
                            value={invoice.customerAddress}
                            onChange={(val) => setInvoice((p) => ({ ...p, customerAddress: val }))}
                            singleLine={false}
                            className="text-black uppercase flex-1 py-0.5 min-h-0 text-[10.5px] leading-normal max-h-[3.6em] overflow-hidden"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Customer GST, PAN and Route info */}
                  <div
                    id="billing-section2-right"
                    className="w-[36%] border-l border-black p-2.5 flex flex-col justify-between text-[11px] leading-tight h-full"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-black w-20 uppercase text-[11px]">
                          GST NO:
                        </span>
                        <EditableCell
                          value={invoice.customerGst}
                          onChange={(val) => setInvoice((p) => ({ ...p, customerGst: val }))}
                          showBorder={true}
                          singleLine={true}
                          className="font-mono text-black font-bold w-[200px] max-w-[200px] py-1 text-[13px]"
                        />
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-black w-20 uppercase text-[11px]">
                          PAN No:
                        </span>
                        <EditableCell
                          value={invoice.customerPan}
                          onChange={(val) => setInvoice((p) => ({ ...p, customerPan: val }))}
                          showBorder={true}
                          singleLine={true}
                          className="font-mono text-black font-bold w-[200px] max-w-[200px] py-1 text-[13px]"
                        />
                      </div>
                    </div>
                    <div className="pt-2 mt-auto flex justify-between gap-3 pb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-black uppercase text-[10px]">FROM:</span>
                        <EditableCell
                          value={invoice.fromLocation}
                          onChange={(val) => setInvoice((p) => ({ ...p, fromLocation: val }))}
                          showBorder={true}
                          singleLine={true}
                          className="font-bold text-black uppercase w-[120px] max-w-[120px] py-1 text-center text-[11.5px]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-black uppercase text-[10px]">TO:</span>
                        <EditableCell
                          value={invoice.toLocation}
                          onChange={(val) => setInvoice((p) => ({ ...p, toLocation: val }))}
                          showBorder={true}
                          singleLine={true}
                          className="font-bold text-black uppercase w-[120px] max-w-[120px] py-1 text-center text-[11.5px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. MAIN TABLE SECTION */}
                <div
                  id="billing-section3"
                  className="flex-initial flex flex-col min-h-0 bg-white overflow-hidden"
                >
                  {/* Payment notice */}
                  <div className="text-center text-[8px] font-bold text-black border-t border-b border-black py-0.5 italic">
                    Bill must be paid within (30) days of Presentation, otherwise interest will be
                    charged @ 24% p.a
                  </div>
                  <table className="w-full border-collapse table-fixed text-[12px] leading-normal">
                    <thead>
                      <tr
                        style={{ backgroundColor: "#cccccc", color: "#000000" }}
                        className="border-b border-black text-center text-[9px] leading-tight font-extrabold uppercase"
                      >
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[4.5%] whitespace-normal break-words"
                        >
                          C/Note No.
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[8%] whitespace-normal break-words"
                        >
                          Date
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[9%] whitespace-normal break-words"
                        >
                          Lorry No
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-1 w-[14%] text-left whitespace-normal break-words"
                        >
                          Goods
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[11.5%] whitespace-normal break-words"
                        >
                          Party Inv. No.
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[7.5%] whitespace-normal break-words"
                        >
                          Arv.Date
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[7.5%] whitespace-normal break-words"
                        >
                          Unld.Date
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[3.5%] whitespace-normal break-words"
                        >
                          No of Pkg
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[8.5%] whitespace-normal break-words"
                        >
                          Wgt MT/KG
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[8%] text-right whitespace-normal break-words"
                        >
                          Rate
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[5.5%] text-right whitespace-normal break-words"
                        >
                          Halting Amt
                        </th>
                        <th
                          style={{ borderRight: "1.5px solid #000000" }}
                          className="py-1 px-0.5 w-[5.5%] text-right whitespace-normal break-words"
                        >
                          RTO Fine
                        </th>
                        <th className="py-1 px-1 w-[6.5%] text-right whitespace-normal break-words">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableRows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="body-row border-b border-black hover:bg-gray-100/50"
                        >
                          <td className="border-r-2 border-black text-center font-bold text-black py-2 overflow-hidden">
                            <EditableCell
                              value={row.lrNo}
                              onChange={(val) => handleUpdateRow(idx, { lrNo: val })}
                              singleLine={true}
                              maxChars={20}
                              className="text-center font-bold text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center text-black overflow-hidden">
                            <EditableCell
                              value={row.date}
                              onChange={(val) => handleUpdateRow(idx, { date: val })}
                              singleLine={true}
                              maxChars={10}
                              className="text-center font-mono text-[11px] whitespace-nowrap overflow-hidden px-0.5"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center font-bold text-black overflow-hidden">
                            <EditableCell
                              value={(row.sNo || "").replace(/\s+/g, "")}
                              onChange={(val) =>
                                handleUpdateRow(idx, { sNo: val.replace(/\s+/g, "") })
                              }
                              singleLine={true}
                              maxChars={20}
                              className="text-center uppercase font-bold text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-left pl-2 text-black overflow-hidden">
                            <EditableCell
                              value={row.goods}
                              onChange={(val) => handleUpdateRow(idx, { goods: val })}
                              singleLine={true}
                              maxChars={50}
                              className="text-left font-semibold text-[12px] whitespace-nowrap overflow-hidden"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center text-black overflow-hidden">
                            <EditableCell
                              value={row.partyInvoiceNo}
                              onChange={(val) => handleUpdateRow(idx, { partyInvoiceNo: val })}
                              singleLine={true}
                              maxChars={50}
                              className="text-center text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center text-black overflow-hidden">
                            <EditableCell
                              value={row.arvDate}
                              onChange={(val) => handleUpdateRow(idx, { arvDate: val })}
                              singleLine={true}
                              maxChars={10}
                              className="text-center font-mono text-[11px] whitespace-nowrap overflow-hidden px-0.5"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center text-black overflow-hidden">
                            <EditableCell
                              value={row.unldDate}
                              onChange={(val) => handleUpdateRow(idx, { unldDate: val })}
                              singleLine={true}
                              maxChars={10}
                              className="text-center font-mono text-[11px] whitespace-nowrap overflow-hidden px-0.5"
                            />
                          </td>
                          <td className="border-r-2 border-black text-center text-black overflow-hidden">
                            <EditableCell
                              value={row.noOfPkg}
                              onChange={(val) => handleUpdateRow(idx, { noOfPkg: val })}
                              singleLine={true}
                              maxChars={6}
                              className="text-center text-[12px] whitespace-nowrap overflow-hidden px-0.5"
                            />
                          </td>
                          <td className="border-r-2 border-black text-right pr-2 font-mono text-black overflow-hidden">
                            <EditableCell
                              value={row.weight}
                              onChange={(val) => handleUpdateRow(idx, { weight: val })}
                              singleLine={true}
                              maxChars={15}
                              className="text-right text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-right pr-2 font-mono text-black overflow-hidden">
                            <EditableCell
                              value={row.rate}
                              onChange={(val) => handleUpdateRow(idx, { rate: val })}
                              singleLine={true}
                              maxChars={12}
                              className="text-right text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-right pr-1 font-mono text-black overflow-hidden">
                            <EditableCell
                              value={row.haltingAmount}
                              onChange={(val) => handleUpdateRow(idx, { haltingAmount: val })}
                              singleLine={true}
                              maxChars={12}
                              className="text-right text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="border-r-2 border-black text-right pr-1 font-mono text-black overflow-hidden">
                            <EditableCell
                              value={row.rtoFine}
                              onChange={(val) => handleUpdateRow(idx, { rtoFine: val })}
                              singleLine={true}
                              maxChars={12}
                              className="text-right text-[12px] whitespace-nowrap overflow-hidden px-1"
                            />
                          </td>
                          <td className="text-right pr-2 font-bold font-mono text-black overflow-hidden">
                            <EditableCell
                              value={row.amount}
                              onChange={(val) => handleUpdateRow(idx, { amount: val })}
                              singleLine={true}
                              maxChars={15}
                              className="text-right text-[12px] whitespace-nowrap overflow-hidden font-bold px-1"
                            />
                          </td>
                        </tr>
                      ))}
                      {/* Summary Row 1: Rupees in Words & GST */}
                      {/* Summary Row 1: Rupees in Words & GST */}
                      <tr className="summary-row border-b border-black">
                        <td
                          rowSpan={3}
                          colSpan={9}
                          className="border-r border-black py-1 px-2 text-left font-bold text-black uppercase align-middle"
                        >
                          <div className="flex items-start gap-1">
                            <span className="font-extrabold text-[10px] whitespace-nowrap">
                              Rupees in Words:
                            </span>
                            <EditableCell
                              value={invoice.rupeesInWords}
                              onChange={(val) =>
                                setInvoice((prev) => ({ ...prev, rupeesInWords: val }))
                              }
                              className="font-bold text-black flex-1 italic text-[11px]"
                            />
                          </div>
                        </td>
                        <td colSpan={4} className="py-0.5 px-1 font-semibold text-[10px] text-black">
                          <div className="flex items-center justify-between w-full h-full">
                            <span className="font-extrabold text-[9px] uppercase flex items-center gap-0.5">
                              GST (
                              <EditableCell
                                value={invoice.gstPercentage || "0%"}
                                onChange={(val) => setInvoice((p) => ({ ...p, gstPercentage: val }))}
                                placeholder="0%"
                                singleLine={true}
                                maxChars={4}
                                className="font-extrabold inline-block text-[9px] p-0 min-h-0 min-w-[15px] border-none text-center bg-transparent focus:bg-white select-all"
                              />
                              ):
                            </span>
                            <span className="font-mono text-[9.5px] font-bold">
                              <EditableCell
                                value={currentGst}
                                onChange={(val) => setInvoice((p) => ({ ...p, gstOverride: val }))}
                                className="font-bold inline-block"
                              />
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Summary Row 2: Sub Total */}
                      <tr className="summary-row border-b border-black">
                        <td colSpan={4} className="py-0.5 px-1 font-semibold text-[10px] text-black">
                          <div className="flex items-center justify-between w-full h-full">
                            <span className="font-extrabold text-[9px] uppercase">Sub Total:</span>
                            <span className="font-mono text-[9.5px] font-bold">
                              <EditableCell
                                value={currentSubTotal}
                                onChange={(val) =>
                                  setInvoice((p) => ({ ...p, subTotalOverride: val }))
                                }
                                className="font-bold inline-block"
                              />
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* Summary Row 3: Grand Total */}
                      <tr className="summary-row bg-white">
                        <td
                          colSpan={4}
                          className="py-0.5 px-1 font-black text-[11px] text-black bg-slate-50"
                        >
                          <div className="flex items-center justify-between w-full h-full">
                            <span className="font-black text-[9.5px] uppercase tracking-wider">
                              Grand Total:
                            </span>
                            <span className="font-mono font-black text-[10px]">
                              Rs.{" "}
                              <EditableCell
                                value={currentGrandTotal}
                                onChange={(val) =>
                                  setInvoice((p) => ({ ...p, grandTotalOverride: val }))
                                }
                                className="font-extrabold inline-block"
                              />
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. FOOTER SECTIONS (Height exactly 32mm) */}
                <div
                  id="billing-section5"
                  className="h-[32mm] flex border-t border-black text-[9px] leading-tight"
                >
                  {/* Column 1: Payment Instructions */}
                  <div className="w-[36%] p-2 border-r border-black flex flex-col justify-between">
                    <div>
                      <span className="font-black text-black underline tracking-wide uppercase text-[12.5px]">
                        Payment Instructions:
                      </span>
                      <div className="mt-1.5 space-y-1 text-[11.5px] text-black">
                        <div className="flex">
                          <span className="font-bold text-black w-20">Bank Name:</span>
                          <span className="font-extrabold uppercase">HDFC BANK</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold text-black w-20">Account No:</span>
                          <span className="font-extrabold font-mono tracking-wide">
                            50200120262501
                          </span>
                        </div>
                        <div className="flex">
                          <span className="font-bold text-black w-20">IFSC Code:</span>
                          <span className="font-extrabold font-mono tracking-wide">HDFC0002086</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold text-black w-20">Account to:</span>
                          <span className="font-extrabold uppercase">JRKS Digital India Logistics LLP</span>
                        </div>
                        <div className="flex">
                          <span className="font-bold text-black w-20">Branch:</span>
                          <span className="font-extrabold uppercase">THIRUVERUMBUR</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Terms & Conditions */}
                  <div className="w-[39%] p-2 border-r border-black flex flex-col justify-between">
                    <div>
                      <span className="font-black text-black underline tracking-wide uppercase text-[12.5px]">
                        Terms & Conditions:
                      </span>
                      <div className="mt-1.5 space-y-1.5 text-[10.2px] text-black font-extrabold uppercase leading-snug">
                        <p>
                          WE HEREBY CONFIRM THAT WHILE OUR TURNOVER IS ABOVE THE LIMIT SPECIFIED UNDER
                          RULE 48(4) OF THE GST ACT, AS A GOODS TRANSPORT AGENT (GTA) WE ARE EXEMPT
                          FROM ISSUING E-INVOICE.
                        </p>
                        <p className="mt-1.5 text-[10.5px] font-black text-black">
                          NOTE - GST WILL BE PAID BY PARTY
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Authorised Signatory Signature box */}
                  <div className="w-[25%] p-2 flex flex-col justify-between items-center text-center relative">
                    <span className="font-bold text-black uppercase tracking-tight text-[8px] leading-tight sig-company-header">
                      For JRKS DIGITAL INDIA LOGISTICS LLP
                    </span>

                    <div className="w-full flex flex-col items-center mt-auto pb-0.5">
                      <span className="font-bold text-black uppercase tracking-wider text-[8px] sig-label">
                        Authorised Signatory
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>

      {/* ── FOOTER ACTIONS - Sticky bar ── */}
      <div className="no-print fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg">
        <button
          type="button"
          onClick={() => navigate({ to: "/bill-records" })}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
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
