import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Calendar,
  FileText,
  Building2,
  Handshake,
  CheckCircle2,
  RotateCcw,
  Check,
  Printer,
  ChevronDown,
  Phone,
  MessageCircle,
  Smartphone,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useOpsStore, type ArrivalReport } from "@/lib/ops-store";
import { formatDate } from "@/lib/export";
import { cn } from "@/lib/utils";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

// Helper to normalize and compare LR numbers flexibly
const cleanLrNumber = (val: string | undefined | null) => {
  if (!val) return "";
  let cleaned = String(val).trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (cleaned.startsWith("lr")) {
    cleaned = cleaned.substring(2);
  }
  const noLeadingZero = cleaned.replace(/^0+/, "");
  return noLeadingZero || cleaned;
};

const matchLr = (a: string | undefined | null, b: string | undefined | null) => {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (!strA || !strB) return false;
  if (strA.toLowerCase() === strB.toLowerCase()) return true;
  const cleanA = cleanLrNumber(strA);
  const cleanB = cleanLrNumber(strB);
  if (cleanA && cleanB && cleanA === cleanB) return true;
  return false;
};

const cleanChallanNumber = (val: string | undefined | null) => {
  if (!val) return "";
  let cleaned = String(val).trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  if (cleaned.startsWith("ch")) {
    cleaned = cleaned.substring(2);
  }
  const noLeadingZero = cleaned.replace(/^0+/, "");
  return noLeadingZero || cleaned;
};

const matchChallan = (a: string | undefined | null, b: string | undefined | null) => {
  if (!a || !b) return false;
  const strA = String(a).trim();
  const strB = String(b).trim();
  if (!strA || !strB) return false;
  if (strA.toLowerCase() === strB.toLowerCase()) return true;
  const cleanA = cleanChallanNumber(strA);
  const cleanB = cleanChallanNumber(strB);
  if (cleanA && cleanB && cleanA === cleanB) return true;
  return false;
};

export const Route = createFileRoute("/_app/arrival-report")({
  validateSearch: (search: Record<string, unknown>): { id?: string; print?: string } => {
    return {
      id: search.id as string | undefined,
      print: search.print as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Arrival Report — JRKS Logistics ERP" },
      { name: "description", content: "Manage delivery acknowledgement and arrival confirmation." },
    ],
  }),
  component: ArrivalReportPage,
});

/* ── REUSABLE CUSTOM INPUT COMPONENTS ── */
interface CustomInputProps {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  readOnly?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
}

function FormLabelInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required,
  error,
  readOnly,
  className,
  onKeyDown,
  onBlur,
}: CustomInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {type === "date" ? (
        <CustomDatePicker
          value={value}
          onChange={onChange || (() => { })}
          error={!!error}
          required={required}
        />
      ) : (
        <div
          className={cn(
            "relative flex items-center w-full rounded-full border border-slate-200 bg-white transition-all duration-200",
            focused && "border-blue-600 ring-2 ring-blue-500/10 shadow-sm",
            error && "border-red-500 ring-2 ring-red-500/10",
            readOnly && "bg-slate-50 border-slate-250 cursor-not-allowed",
            className,
          )}
          style={{ minHeight: "44px" }}
        >
          <div className="relative flex-grow py-2">
            <input
              type={type}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                onBlur?.();
              }}
              onKeyDown={onKeyDown}
              readOnly={readOnly}
              placeholder={placeholder}
              className={cn(
                "w-full px-4 text-sm font-semibold text-slate-800 bg-transparent border-0 outline-none focus:ring-0 focus:outline-none placeholder:text-slate-400",
                readOnly && "cursor-not-allowed text-slate-500",
              )}
            />
          </div>
        </div>
      )}
      {error && <p className="text-xs font-bold text-red-500 mt-1 pl-1">{error}</p>}
    </div>
  );
}

function ArrivalReportPage() {
  const navigate = useNavigate();
  const {
    arrivalReports,
    addArrivalReport,
    updateArrivalReport,
    loadData,
    consignmentNotes,
    challans,
    moneyReceipts,
    nextArrivalReportNo,
  } = useOpsStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchParams = Route.useSearch();
  const id = searchParams.id;
  const isEdit = !!id;

  const existingReport = useMemo(() => {
    if (!id) return null;
    return arrivalReports.find((r) => String(r.arrival_report_id) === String(id));
  }, [arrivalReports, id]);

  const isLocked = useMemo(() => {
    const checkLr =
      (existingReport as any)?.lr_no ||
      (existingReport as any)?.bill_no ||
      (existingReport as any)?.arrival_report_no ||
      "";
    if (
      existingReport &&
      ((existingReport as any).isLocked === 1 ||
        (existingReport as any).isLocked === true ||
        String((existingReport as any).isLocked) === "1")
    ) {
      return true;
    }
    if (!checkLr) return false;
    return (moneyReceipts || []).some((mr) => {
      const mrLr = String(mr.lrNo || "").toLowerCase().trim();
      const lrClean = String(checkLr).toLowerCase().trim();
      if (
        mrLr &&
        (mrLr === lrClean || matchLr(mrLr, lrClean) || mrLr.includes(lrClean) || lrClean.includes(mrLr))
      ) {
        return true;
      }
      const mrItems = JSON.stringify(mr.items || []).toLowerCase();
      if (mrItems.includes(lrClean)) {
        return true;
      }
      return false;
    });
  }, [existingReport, moneyReceipts]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Form Fields State
  const [arrivalReportNo, setArrivalReportNo] = useState("");

  useEffect(() => {
    if (!isEdit && (!arrivalReportNo || !arrivalReportNo.startsWith("AR-"))) {
      setArrivalReportNo(nextArrivalReportNo());
    }
  }, [isEdit, arrivalReports, arrivalReportNo, nextArrivalReportNo]);
  const [challanNo, setChallanNo] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");

  const [targetEditId, setTargetEditId] = useState<string | null>(id || null);

  // Reference Details (Read-only)
  const [refConsignor, setRefConsignor] = useState("");
  const [refConsignee, setRefConsignee] = useState("");
  const [refFromLocation, setRefFromLocation] = useState("");
  const [refToLocation, setRefToLocation] = useState("");
  const [refVehicleNumber, setRefVehicleNumber] = useState("");
  const [refDriverName, setRefDriverName] = useState("");
  const [refDriverMobile, setRefDriverMobile] = useState("");
  const [refNoOfPackages, setRefNoOfPackages] = useState("");
  const [refFreightAmount, setRefFreightAmount] = useState("");
  const [refBalanceAmount, setRefBalanceAmount] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [uploadedPdf, setUploadedPdf] = useState("");
  const [uploadedPdfName, setUploadedPdfName] = useState("");

  // Delivery Details
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("Delivered");
  const [receivedBy, setReceivedBy] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [remarks, setRemarks] = useState("");

  // Payment Details
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [paymentReference, setPaymentReference] = useState("");

  // Reference Details (Editable)
  const [billReferenceNo, setBillReferenceNo] = useState("");
  const [billReferenceDate, setBillReferenceDate] = useState("");
  const [mrReferenceNo, setMrReferenceNo] = useState("");
  const [mrReferenceDate, setMrReferenceDate] = useState("");

  // Branch Details
  const [branchIncharge, setBranchIncharge] = useState("");

  // Halting / Detention Details
  const [haltingDays, setHaltingDays] = useState("");
  const [haltingAmountPerDay, setHaltingAmountPerDay] = useState("");
  const [totalDetentionAmount, setTotalDetentionAmount] = useState("0.00");

  // Penalty Details
  const [penaltyType, setPenaltyType] = useState("None");
  const [penaltyAmount, setPenaltyAmount] = useState("");

  // Automatically set base balance when reference balance is loaded
  useEffect(() => {
    if (refBalanceAmount) {
      setBalanceAmount(parseFloat(refBalanceAmount).toFixed(2));
    }
  }, [refBalanceAmount]);

  // Calculate Net Amount = Balance Amount + Total Detention Amount - Penalty Amount
  useEffect(() => {
    const bal = parseFloat(balanceAmount) || 0;
    const det = parseFloat(totalDetentionAmount) || 0;
    const pen = parseFloat(penaltyAmount) || 0;
    setNetAmount((bal + det - pen).toFixed(2));
  }, [balanceAmount, totalDetentionAmount, penaltyAmount]);

  useEffect(() => {
    const days = parseFloat(haltingDays) || 0;
    const rate = parseFloat(haltingAmountPerDay) || 0;
    setTotalDetentionAmount((days * rate).toFixed(2));
  }, [haltingDays, haltingAmountPerDay]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper to safely get items array from challan or consignment note
  const getChallanItems = (c: any): any[] => {
    if (!c) return [];
    if (Array.isArray(c.items)) return c.items;
    if (typeof c.items === "string") {
      try {
        return JSON.parse(c.items || "[]");
      } catch {
        return [];
      }
    }
    return [];
  };

  // Lookup helper for read-only references
  const populateReferenceDetails = (lrNo: string, chNo?: string) => {
    let cnNote = lrNo
      ? consignmentNotes.find((c) => matchLr(c.lrNumber, lrNo) || matchLr(c.consignmentNoteNo, lrNo))
      : null;

    let ch = challans.find((c) => {
      const items = getChallanItems(c);
      return (
        (lrNo && items.some((item: any) => matchLr(item.cnNo, lrNo))) ||
        (chNo && (matchChallan(c.challanNo, chNo) || matchChallan(c.manualChallanNo, chNo)))
      );
    });

    if (!cnNote && ch) {
      const items = getChallanItems(ch);
      const itemCn = items[0]?.cnNo;
      if (itemCn) {
        cnNote =
          consignmentNotes.find(
            (c) => matchLr(c.lrNumber, itemCn) || matchLr(c.consignmentNoteNo, itemCn),
          ) || null;
      }
    }

    if (cnNote) {
      setRefConsignor(cnNote.consignorName || "");
      setRefConsignee(cnNote.consigneeName || "");
      setRefFromLocation(cnNote.fromLocation || "");
      setRefToLocation(cnNote.toLocation || "");
      setRefVehicleNumber(cnNote.vehicleNumber || ch?.vehicleNumber || "");

      const cnItems = Array.isArray(cnNote.items) ? cnNote.items : [];
      const pkgCount = cnItems.reduce((sum, item) => sum + Number(item.noOfPackages || 0), 0);
      setRefNoOfPackages(pkgCount > 0 ? String(pkgCount) : "");
    } else {
      setRefConsignor("");
      setRefConsignee("");
      setRefFromLocation("");
      setRefToLocation("");
      setRefVehicleNumber(ch?.vehicleNumber || "");
      setRefNoOfPackages("");
    }

    if (ch) {
      setRefDriverName(ch.driverName || "");
      setRefDriverMobile(ch.driverMobile || cnNote?.driverMobile || "");
      setRefFreightAmount(ch.freight ? String(ch.freight) : "");
      if (ch.vehicleNumber) {
        setRefVehicleNumber(ch.vehicleNumber);
      }
      if (ch.balanceAmount !== undefined && ch.balanceAmount !== null) {
        setRefBalanceAmount(String(ch.balanceAmount));
        if (!isEdit || !existingReport?.balance_amount) {
          setBalanceAmount(String(ch.balanceAmount));
        }
      }
    } else {
      setRefDriverName("");
      setRefDriverMobile("");
      setRefFreightAmount("");
      setRefBalanceAmount("");
    }
  };

  const populateForm = (report: typeof existingReport) => {
    if (report) {
      const lrVal = (report as any).lr_no || (report as any).bill_no || (report as any).mr_no || (report as any).lrNo || (report as any).lrNumber || "";
      const chVal = (report as any).challan_no || (report as any).challanNo || (report as any).manualChallanNo || "";
      setArrivalReportNo((report as any).arrival_report_no || (report as any).arrivalReportNo || "");
      setChallanNo(chVal);
      setLrNumber(lrVal);
      setReportDate(report.report_date || todayStr);
      setArrivalDate(report.arrival_date || todayStr);
      setDeliveryDate(report.delivery_date || todayStr);
      setDeliveryStatus(report.delivery_status || "Delivered");
      setReceivedBy(report.received_by || "");
      setReceiverMobile(report.receiver_mobile || "");
      setRemarks(report.remarks || "");
      setPaymentMode(report.payment_mode || "Cash");
      setPaymentReference(report.payment_reference || "");
      setBillReferenceNo(report.bill_reference_no || "");
      setBillReferenceDate(report.bill_reference_date || "");
      setMrReferenceNo(report.mr_reference_no || "");
      setMrReferenceDate(report.mr_reference_date || "");
      setBranchIncharge(report.branch_incharge || "");
      setHaltingDays(report.halting_days || "");
      setHaltingAmountPerDay(report.halting_amount_per_day || "");
      setTotalDetentionAmount(report.total_detention_amount || "0.00");
      setPenaltyType(report.penalty_type || "None");
      setPenaltyAmount(report.penalty_amount || "");
      setBalanceAmount(report.balance_amount || "");
      setNetAmount(report.net_amount !== undefined && report.net_amount !== null ? String(report.net_amount) : "");
      setUploadedPdf(report.uploaded_pdf || "");
      setUploadedPdfName(report.uploaded_pdf_name || "");
    } else {
      setArrivalReportNo("");
      setChallanNo("");
      setReportDate("");
      setArrivalDate("");
      setDeliveryDate("");
      setDeliveryStatus("Delivered");
      setReceivedBy("");
      setReceiverMobile("");
      setRemarks("");
      setPaymentMode("Cash");
      setPaymentReference("");
      setBillReferenceNo("");
      setBillReferenceDate("");
      setMrReferenceNo("");
      setMrReferenceDate("");
      setBranchIncharge("");
      setHaltingDays("");
      setHaltingAmountPerDay("");
      setTotalDetentionAmount("0.00");
      setBalanceAmount("");
      setNetAmount("");
      setUploadedPdf("");
      setUploadedPdfName("");
    }
    setErrors({});
  };

  // Initialize form fields on edit mode
  useEffect(() => {
    if (isEdit && existingReport) {
      setTargetEditId(existingReport.arrival_report_id);
      const lrVal =
        (existingReport as any).lr_no ||
        (existingReport as any).bill_no ||
        (existingReport as any).mr_no ||
        (existingReport as any).lrNo ||
        (existingReport as any).lrNumber ||
        "";
      const chVal =
        (existingReport as any).challan_no ||
        (existingReport as any).challanNo ||
        (existingReport as any).manualChallanNo ||
        "";
      setLrNumber(lrVal);
      setChallanNo(chVal);
      populateForm(existingReport);
      populateReferenceDetails(lrVal, chVal);
    }
  }, [isEdit, existingReport]);

  // Auto-print if opened with print=true
  useEffect(() => {
    if (searchParams.print === "true" && existingReport) {
      const lrVal = (existingReport as any).lr_no || (existingReport as any).bill_no || (existingReport as any).mr_no || (existingReport as any).lrNo || (existingReport as any).lrNumber || "";
      const chVal = (existingReport as any).challan_no || (existingReport as any).challanNo || (existingReport as any).manualChallanNo || "";
      populateReferenceDetails(lrVal, chVal);
      const timer = setTimeout(() => {
        window.print();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [searchParams.print, existingReport]);

  // Input change handler for LR Number - auto fetches matching Challan and Consignment details
  const handleLrNumberChange = (value: string) => {
    setLrNumber(value);
    const trimmed = (value || "").trim();
    if (trimmed) {
      const cnNote = consignmentNotes.find(
        (c) => matchLr(c.lrNumber, trimmed) || matchLr(c.consignmentNoteNo, trimmed),
      );

      const ch = challans.find((c) => {
        const items = getChallanItems(c);
        return items?.some(
          (item: any) =>
            matchLr(item.cnNo, trimmed) ||
            matchLr(item.lrNo, trimmed) ||
            matchLr(item.cnNo, cnNote?.consignmentNoteNo || cnNote?.lrNumber),
        );
      });

      if (ch) {
        setChallanNo(ch.manualChallanNo || ch.challanNo || "");
      } else {
        setChallanNo("");
      }

      populateReferenceDetails(trimmed, ch ? (ch.manualChallanNo || ch.challanNo) : "");
    } else {
      setChallanNo("");
      populateReferenceDetails("", "");
    }
  };

  // Input change handler for Challan No
  const handleChallanNoChange = (value: string) => {
    setChallanNo(value);
  };

  const fetchDetailsByLr = (value: string, showToast = true) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      setChallanNo("");
      populateReferenceDetails("", "");
      return;
    }

    // 1. OPTION 1: Check if an Arrival Report ALREADY exists for this LR Number
    const existingAr = arrivalReports.find((r) => {
      const lrVal = (r as any).lr_no || (r as any).bill_no || (r as any).mr_no || (r as any).lrNo || (r as any).lrNumber || "";
      return matchLr(lrVal, trimmed);
    });

    if (existingAr) {
      setTargetEditId(existingAr.arrival_report_id);
      populateForm(existingAr);
      const chVal = (existingAr as any).challan_no || (existingAr as any).challanNo || (existingAr as any).manualChallanNo || "";
      populateReferenceDetails(trimmed, chVal);
      if (showToast) {
        toast.info(`Loaded existing Arrival Report (${existingAr.arrival_report_no || "AR Record"}) for LR ${trimmed}`);
      }
      return;
    }

    // 2. New Arrival Report for this LR: Keep next sequence number
    if (!id) {
      setTargetEditId(null);
      if (!arrivalReportNo || !arrivalReportNo.startsWith("AR-")) {
        setArrivalReportNo(nextArrivalReportNo());
      }
    }

    // Search Consignment Note by lrNumber (case-insensitive with matchLr helper)
    const cnNote = consignmentNotes.find(
      (c) => matchLr(c.lrNumber, trimmed) || matchLr(c.consignmentNoteNo, trimmed),
    );

    // Search Challan by checking if any of its items have matching cnNo
    const ch = challans.find((c) => {
      const items = getChallanItems(c);
      return items?.some(
        (item: any) =>
          matchLr(item.cnNo, trimmed) ||
          matchLr(item.lrNo, trimmed) ||
          matchLr(item.cnNo, cnNote?.consignmentNoteNo || cnNote?.lrNumber),
      );
    });

    // Strictly set Challan No to the actual found challan, never fallback to LR number
    if (ch) {
      setChallanNo(ch.manualChallanNo || ch.challanNo || "");
    } else {
      setChallanNo("");
    }

    populateReferenceDetails(trimmed, ch ? (ch.manualChallanNo || ch.challanNo) : "");

    if (cnNote || ch) {
      if (cnNote) {
        if (cnNote.billNo) setBillReferenceNo(cnNote.billNo);
        if (cnNote.lrDate) {
          setBillReferenceDate(cnNote.lrDate);
          setMrReferenceDate(cnNote.lrDate);
          if (!arrivalDate) setArrivalDate(cnNote.lrDate);
          if (!reportDate) setReportDate(cnNote.lrDate);
          if (!deliveryDate) setDeliveryDate(cnNote.lrDate);
        }
        setMrReferenceNo(cnNote.lrNumber || cnNote.consignmentNoteNo || "");
      }

      if (ch) {
        if (ch.challanDate) {
          if (!deliveryDate) setDeliveryDate(ch.challanDate);
          if (!arrivalDate) setArrivalDate(ch.challanDate);
          if (!reportDate) setReportDate(ch.challanDate);
        }
        if (ch.balanceAmount !== undefined && ch.balanceAmount !== null) {
          setRefBalanceAmount(String(ch.balanceAmount));
          setBalanceAmount(String(ch.balanceAmount));
        }
      }
    } else {
      if (showToast) {
        toast.error(`No consignment note or challan found for LR: ${trimmed}`);
      }
    }
  };

  const fetchDetailsByChallan = (value: string, showToast = true) => {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      populateReferenceDetails(lrNumber, "");
      return;
    }

    // 1. OPTION 1: Check if an Arrival Report ALREADY exists for this Challan No
    const existingAr = arrivalReports.find((r) => {
      const chVal = (r as any).challan_no || (r as any).challanNo || (r as any).manualChallanNo || "";
      return matchChallan(chVal, trimmed);
    });

    if (existingAr) {
      setTargetEditId(existingAr.arrival_report_id);
      populateForm(existingAr);
      const lrVal = (existingAr as any).lr_no || (existingAr as any).bill_no || (existingAr as any).mr_no || "";
      populateReferenceDetails(lrVal, trimmed);
      if (showToast) {
        toast.info(`Loaded existing Arrival Report (${existingAr.arrival_report_no || "AR Record"}) for Challan ${trimmed}`);
      }
      return;
    }

    // 2. New Arrival Report for this Challan
    if (!id) {
      setTargetEditId(null);
      if (!arrivalReportNo || !arrivalReportNo.startsWith("AR-")) {
        setArrivalReportNo(nextArrivalReportNo());
      }
    }

    const ch = challans.find(
      (c) => matchChallan(c.challanNo, trimmed) || matchChallan(c.manualChallanNo, trimmed),
    );

    if (ch) {
      const items = getChallanItems(ch);
      const linkedCnNo = items?.[0]?.cnNo || "";
      if (linkedCnNo && !lrNumber) {
        setLrNumber(linkedCnNo);
      }
      populateReferenceDetails(linkedCnNo || lrNumber, trimmed);

      if (ch.challanDate) {
        if (!deliveryDate) setDeliveryDate(ch.challanDate);
        if (!arrivalDate) setArrivalDate(ch.challanDate);
        if (!reportDate) setReportDate(ch.challanDate);
      }
      if (ch.balanceAmount !== undefined && ch.balanceAmount !== null) {
        setRefBalanceAmount(String(ch.balanceAmount));
        setBalanceAmount(String(ch.balanceAmount));
      }

      if (linkedCnNo) {
        const cnNote = consignmentNotes.find(
          (c) => matchLr(c.lrNumber, linkedCnNo) || matchLr(c.consignmentNoteNo, linkedCnNo),
        );
        if (cnNote) {
          if (cnNote.billNo) setBillReferenceNo(cnNote.billNo);
          if (cnNote.lrDate) {
            setBillReferenceDate(cnNote.lrDate);
            setMrReferenceDate(cnNote.lrDate);
          }
          setMrReferenceNo(cnNote.lrNumber || cnNote.consignmentNoteNo || "");
        }
      }
    } else {
      populateReferenceDetails(lrNumber, trimmed);
      if (showToast) {
        toast.error(`No challan found for Challan No: ${trimmed}`);
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!arrivalReportNo.trim()) errs.arrivalReportNo = "AR No is required";
    if (!lrNumber.trim()) errs.lrNumber = "LR Number is required";
    if (!reportDate) errs.reportDate = "Report Date is required";
    if (!arrivalDate) errs.arrivalDate = "Arrival Date is required";
    if (!deliveryDate) errs.deliveryDate = "Delivery Date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Invalid file format. Please upload a PDF document.");
      return;
    }

    const MAX_SIZE_BYTES = 500 * 1024; // 500 KB limit
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(
        `PDF exceeds 500 KB limit (${(file.size / 1024).toFixed(1)} KB). Please upload a smaller file.`,
      );
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setUploadedPdf(base64String);
      setUploadedPdfName(file.name);
      // Removed success toast notification per user request
    };
    reader.onerror = () => {
      toast.error("Error reading PDF file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (shouldPrint = false) => {
    if (isLocked) {
      if (shouldPrint) {
        setTimeout(() => {
          const handleAfterPrint = () => {
            navigate({ to: "/arrival-records" });
          };
          window.addEventListener("afterprint", handleAfterPrint, { once: true });
          window.print();
        }, 300);
        toast.info("Printing Arrival Report (Editing is locked).");
        return;
      }
      toast.error(
        `This Arrival Report (AR #${arrivalReportNo || lrNumber}) is locked and cannot be edited because a Money Receipt has already been generated for it.`,
      );
      return;
    }

    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      arrival_report_no: arrivalReportNo,
      challan_no: challanNo,
      lr_no: lrNumber,
      report_date: reportDate,
      arrival_date: arrivalDate,
      delivery_date: deliveryDate,
      delivery_status: deliveryStatus,
      received_by: receivedBy,
      receiver_mobile: receiverMobile,
      remarks,
      payment_mode: paymentMode,
      payment_reference: paymentReference,
      bill_reference_no: billReferenceNo,
      bill_reference_date: billReferenceDate || null,
      mr_reference_no: mrReferenceNo,
      mr_reference_date: mrReferenceDate || null,
      branch_incharge: branchIncharge,
      halting_days: haltingDays,
      halting_amount_per_day: haltingAmountPerDay,
      total_detention_amount: totalDetentionAmount,
      penalty_type: penaltyType,
      penalty_amount: penaltyAmount,
      balance_amount: balanceAmount,
      net_amount: netAmount,
      uploaded_pdf: uploadedPdf,
      uploaded_pdf_name: uploadedPdfName,
      bill_no: lrNumber, // legacy compatibility
      mr_no: "N/A", // legacy compatibility
    } as Omit<ArrivalReport, "arrival_report_id" | "created_at" | "updated_at">;

    try {
      let success = false;
      if (targetEditId) {
        success = await updateArrivalReport(targetEditId, payload);
      } else {
        success = await addArrivalReport(payload);
      }

      if (success) {
        if (shouldPrint) {
          setTimeout(() => {
            const handleAfterPrint = () => {
              navigate({ to: "/arrival-records" });
            };
            window.addEventListener("afterprint", handleAfterPrint, { once: true });
            window.print();
          }, 300);
        } else {
          navigate({ to: "/arrival-records" });
        }
      } else {
        toast.error("An error occurred while saving the Arrival Report.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred while saving.");
    }
  };

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear the form?")) {
      setTargetEditId(null);
      setArrivalReportNo(nextArrivalReportNo());
      setLrNumber("");
      setChallanNo("");
      setReportDate("");
      setArrivalDate("");
      setDeliveryDate("");
      setDeliveryStatus("Delivered");
      setReceivedBy("");
      setReceiverMobile("");
      setRemarks("");
      setPaymentMode("Cash");
      setPaymentReference("");
      setBillReferenceNo("");
      setBillReferenceDate("");
      setMrReferenceNo("");
      setMrReferenceDate("");
      setBranchIncharge("");
      setHaltingDays("");
      setHaltingAmountPerDay("");
      setTotalDetentionAmount("0.00");
      setPenaltyType("None");
      setPenaltyAmount("");
      setBalanceAmount("");
      setNetAmount("");
      setUploadedPdf("");
      setUploadedPdfName("");
      setErrors({});
      populateReferenceDetails("");
    }
  };

  const currentLr = lrNumber || (existingReport as any)?.lr_no || (existingReport as any)?.bill_no || (existingReport as any)?.mr_no || (existingReport as any)?.lrNo || (existingReport as any)?.lrNumber || "";
  const currentChallan = challanNo || (existingReport as any)?.challan_no || (existingReport as any)?.challanNo || (existingReport as any)?.manualChallanNo || "";
  const currentArNo = arrivalReportNo || (existingReport as any)?.arrival_report_no || (existingReport as any)?.arrivalReportNo || "-";

  const dynamicCn = useMemo(() => {
    if (currentLr) {
      const match = consignmentNotes.find(
        (c) => matchLr(c.lrNumber, currentLr) || matchLr(c.consignmentNoteNo, currentLr),
      );
      if (match) return match;
    }
    if (currentChallan) {
      const ch = challans.find(
        (c) => matchChallan(c.challanNo, currentChallan) || matchChallan(c.manualChallanNo, currentChallan),
      );
      const items = getChallanItems(ch);
      if (items?.[0]?.cnNo) {
        const match = consignmentNotes.find(
          (c) => matchLr(c.lrNumber, items[0].cnNo) || matchLr(c.consignmentNoteNo, items[0].cnNo),
        );
        if (match) return match;
      }
    }
    return null;
  }, [consignmentNotes, challans, currentLr, currentChallan]);

  const dynamicCh = useMemo(() => {
    if (currentChallan) {
      const ch = challans.find(
        (c) => matchChallan(c.challanNo, currentChallan) || matchChallan(c.manualChallanNo, currentChallan),
      );
      if (ch) return ch;
    }
    if (currentLr) {
      const ch = challans.find((c) => {
        const items = getChallanItems(c);
        return items.some(
          (item: any) => matchLr(item.cnNo, currentLr) || matchLr(item.cnNo, dynamicCn?.consignmentNoteNo),
        );
      });
      if (ch) return ch;
    }
    return null;
  }, [challans, currentChallan, currentLr, dynamicCn]);

  return (
    <div className="w-full space-y-6" style={{ zoom: 1.1 }}>
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          @media print {
            .no-print, aside, header, nav, button {
              display: none !important;
            }
            .print-only {
              display: block !important;
              visibility: visible !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 4mm 6mm !important;
              box-sizing: border-box !important;
              filter: grayscale(100%) !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-only * {
              color: #000000 !important;
              border-color: #000000 !important;
              visibility: visible !important;
            }
            body, html, main {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="no-print space-y-6">
        {/* Main Title / Company Banner */}
        <div className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <img
            src={logo}
            alt="JRKS Logo"
            className="h-32 w-32 object-contain flex-shrink-0"
            style={{ clipPath: "inset(2px 0 0 0)" }}
          />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A]">
              JRKS DIGITAL INDIA LOGISTICS LLP
            </h2>
            <p className="text-xs font-bold text-blue-600 leading-none">
              (Transport Contractor & Logistics Solutions)
            </p>
            <p className="text-xs font-semibold text-slate-500 leading-tight mt-1.5 whitespace-nowrap">
              No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post),
              Trichy - 620 019.
            </p>
            <p className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 leading-tight mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 text-slate-400" /> Office: 0431-4518283
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-500" /> WhatsApp: +91 97906 05938
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-blue-400" /> Contact: +91 93645 95075
              </span>
            </p>
          </div>
        </div>

        {/* ── TOP ACTION HEADER ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isEdit ? "Edit Arrival Report" : "Add Arrival Report"}
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
              Arrival Report &gt; {isEdit ? "Edit Arrival Report" : "Add Arrival Report"}
            </p>
          </div>
        </div>

        {/* Lock Banner if locked */}
        {isLocked && (
          <div className="flex items-center gap-3.5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 shadow-sm animate-in fade-in print:hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
                Arrival Report is Locked
              </h3>
              <p className="text-xs font-semibold text-amber-800 mt-0.5">
                This Arrival Report (AR #{arrivalReportNo || lrNumber}) is locked and cannot be modified because a Money Receipt has already been created for it.
              </p>
            </div>
          </div>
        )}

        {/* ── FORM CONTENT ── */}
        <form onSubmit={(e) => e.preventDefault()} className="w-full space-y-6 pb-28">
          <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-85">
          {/* SECTION 1: BASIC DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Basic Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
              <FormLabelInput
                label="AR No"
                value={arrivalReportNo}
                onChange={setArrivalReportNo}
                placeholder="Enter AR No"
                required
                error={errors.arrivalReportNo}
              />

              <FormLabelInput
                label="LR Number"
                value={lrNumber}
                onChange={handleLrNumberChange}
                onBlur={() => {
                  if (lrNumber.trim()) {
                    fetchDetailsByLr(lrNumber.trim(), false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchDetailsByLr(lrNumber, true);
                  }
                }}
                placeholder="Enter LR Number"
                required
                error={errors.lrNumber}
              />

              <FormLabelInput
                label="Challan No"
                value={challanNo}
                onChange={handleChallanNoChange}
                onBlur={() => {
                  if (challanNo.trim()) {
                    fetchDetailsByChallan(challanNo.trim(), false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchDetailsByChallan(challanNo, true);
                  }
                }}
                placeholder="Enter Challan No"
              />

              <FormLabelInput
                label="Ack received date"
                type="date"
                value={arrivalDate}
                onChange={setArrivalDate}
                required
                error={errors.arrivalDate}
              />

              <FormLabelInput
                label="Reached Date"
                type="date"
                value={reportDate}
                onChange={setReportDate}
                required
                error={errors.reportDate}
              />
            </div>
          </div>

          {/* SECTION 2: CONSIGNMENT DETAILS (READ-ONLY REFERENCE) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Consignment Details (Read-only Reference)
              </h2>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Consignor
                </span>
                <span className="text-sm font-bold text-slate-700">{refConsignor || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Consignee
                </span>
                <span className="text-sm font-bold text-slate-700">{refConsignee || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  From Location
                </span>
                <span className="text-sm font-bold text-slate-700">{refFromLocation || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  To Location
                </span>
                <span className="text-sm font-bold text-slate-700">{refToLocation || "—"}</span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Vehicle Number
                </span>
                <span className="text-sm font-bold text-slate-700">{refVehicleNumber || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Driver Name
                </span>
                <span className="text-sm font-bold text-slate-700">{refDriverName || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Number of Packages
                </span>
                <span className="text-sm font-bold text-slate-700">{refNoOfPackages || "—"}</span>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider block mb-1">
                  Balance Amount
                </span>
                <span className="text-sm font-bold text-[#1E3A8A]">
                  {refBalanceAmount ? `Rs. ${refBalanceAmount}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: DELIVERY DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Delivery Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormLabelInput
                label="Unloading Date"
                type="date"
                value={deliveryDate}
                onChange={setDeliveryDate}
                required
                error={errors.deliveryDate}
              />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                  Delivery Status <span className="text-red-500">*</span>
                </label>
                <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                  <SelectTrigger className="w-full h-11 rounded-full border border-slate-200 font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/10">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Partial Delivery">Partial Delivery</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormLabelInput
                label="Received By"
                value={receivedBy}
                onChange={setReceivedBy}
                placeholder="Enter recipient name"
              />
              <FormLabelInput
                label="Receiver Mobile Number"
                value={receiverMobile}
                onChange={setReceiverMobile}
                placeholder="Enter recipient mobile"
                type="number"
              />
              <FormLabelInput
                label="Balance Amount (₹)"
                value={balanceAmount}
                onChange={setBalanceAmount}
                placeholder="0.00"
                type="number"
              />
              <FormLabelInput
                label="Net Balance (₹)"
                value={netAmount}
                readOnly
                placeholder="0.00"
                type="number"
                className="bg-slate-100 font-bold"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks/acknowledgement notes"
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                style={{ minHeight: "100px" }}
              />
            </div>
          </div>

          {/* SECTION 4: HALTING / DETENTION DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Halting / Detention Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FormLabelInput
                label="Halting / Detention Days"
                value={haltingDays}
                onChange={setHaltingDays}
                placeholder="0"
                type="number"
              />
              <FormLabelInput
                label="Halting / Detention Amount Per Day"
                value={haltingAmountPerDay}
                onChange={setHaltingAmountPerDay}
                placeholder="0.00"
                type="number"
              />
              <FormLabelInput
                label="Total Detention Amount"
                value={totalDetentionAmount}
                readOnly
                placeholder="0.00"
              />
            </div>
          </div>

          {/* SECTION 4.5: PENALTY DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-red-500 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Penalty Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                  Penalty Reason
                </label>
                <Select value={penaltyType} onValueChange={setPenaltyType}>
                  <SelectTrigger className="w-full h-11 rounded-full border border-slate-200 font-semibold text-slate-800">
                    <SelectValue placeholder="Select Reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Shortage">Shortage</SelectItem>
                    <SelectItem value="Damage">Damage</SelectItem>
                    <SelectItem value="Delay delivery">Delay delivery</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormLabelInput
                label="Penalty Amount (₹)"
                value={penaltyAmount}
                onChange={setPenaltyAmount}
                placeholder="0.00"
                type="number"
              />
            </div>
          </div>

          {/* SECTION 5: BRANCH DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                Branch Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormLabelInput
                label="Branch Incharge"
                value={branchIncharge}
                onChange={setBranchIncharge}
                placeholder="Enter Branch Incharge name"
              />
            </div>
          </div>

          {/* SECTION 6: POD / DOCUMENT UPLOAD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-l-4 border-blue-600 pl-3">
              <div>
                <h2 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider">
                  Upload Arrival Document / POD
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Attach signed delivery proof or POD in PDF format (Maximum file size: 500 KB)
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/30 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-blue-50/60">
              {uploadedPdf ? (
                <div className="flex items-center justify-between w-full max-w-lg bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 font-black text-xs">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {uploadedPdfName || "arrival_document.pdf"}
                      </p>
                      <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        <Check className="h-3 w-3" /> Attached (Ready to Save)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<iframe src="${uploadedPdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
                          );
                        }
                      }}
                    >
                      Preview
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setUploadedPdf("");
                        setUploadedPdfName("");
                        toast.info("PDF removed.");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-inner">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <label
                      htmlFor="pdf-upload-input"
                      className="cursor-pointer font-bold text-sm text-[#1E3A8A] hover:underline"
                    >
                      Click to upload PDF
                    </label>
                    <span className="text-xs text-slate-500 font-medium ml-1">or drag & drop</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Strict limit: PDF documents strictly under 500 KB
                    </p>
                  </div>
                  <input
                    id="pdf-upload-input"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  <label
                    htmlFor="pdf-upload-input"
                    className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-800 cursor-pointer transition-transform active:scale-95"
                  >
                    Upload PDF (Max 500 KB)
                  </label>
                </div>
              )}
            </div>
          </div>
          </fieldset>

          {/* STICKY FOOTER ACTION BUTTONS */}
          <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg print:hidden">
            <button
              type="button"
              onClick={() => navigate({ to: "/arrival-records" })}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer animate-none"
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Back
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClearForm}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer animate-none"
              >
                <RotateCcw className="h-4.5 w-4.5" /> Clear Form
              </button>
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer animate-none"
            >
              <Save className="h-4.5 w-4.5" /> Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer animate-none"
            >
              <Printer className="h-4.5 w-4.5" /> Save & Print
            </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`@media print { @page { size: auto; margin: 5mm; } body { margin: 0; padding: 0; } }`}</style>
      <div className="print-only bg-white text-black font-sans text-xs max-w-5xl mx-auto p-1">
        <div className="border border-black p-3 flex flex-col min-h-[20cm]">
          {/* Centered Arrival Report Title at the very top */}
          <div className="text-center border-b border-black pb-2 mb-2 -mx-3">
            <h2 className="text-sm font-black text-[#1E3A8A] uppercase tracking-widest">
              Arrival Report
            </h2>
          </div>

          {/* Header Banner */}
          <div className="flex flex-col border-b-2 border-black mb-2 -mx-3 px-3 pb-1">
            <div className="text-center text-[10.5px] pb-0.5 text-black uppercase tracking-wider font-extrabold">
              All Subject to Trichy Jurisdiction
            </div>
            <div className="flex justify-between items-center w-full px-2">
              <div className="w-[80px] flex-shrink-0 flex justify-start items-center">
                <img
                  src={logo}
                  alt="JRKS Logo"
                  className="w-[80px] h-[80px] object-contain"
                  style={{ filter: "grayscale(100%) contrast(1.2)" }}
                />
              </div>

              <div className="text-center flex-1 px-1">
                <h1 className="text-[16px] font-black tracking-tighter text-black leading-none m-0 uppercase font-serif">
                  JRKS DIGITAL INDIA LOGISTICS LLP
                </h1>
                <p className="text-[10px] font-bold leading-normal m-0 mt-1 text-black">
                  (Transport Contractor & Logistics Solutions)
                </p>
              </div>

              <div className="text-right text-[10px] font-black flex flex-col justify-center gap-1 leading-none font-mono flex-shrink-0 text-black whitespace-nowrap">
                <span>97906 05938</span>
                <span>93645 95075</span>
                <span>72062 82936</span>
              </div>
            </div>

            <div className="text-center relative z-10">
              <p className="text-[9px] font-extrabold leading-normal m-0 text-black">
                No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post),
                Trichy - 620 019. <span className="underline">https://jrkslogistics.in</span>
              </p>
            </div>
          </div>
          {/* Grid: Key Details */}
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 border-b border-black pb-2 mb-3 text-[9.5px] -mx-3 px-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">AR NUMBER:</span>
              <span className="font-mono font-bold text-black">
                {currentArNo || "-"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">ACK RECEIVED DATE:</span>
              <span className="text-black font-bold">{formatDate(arrivalDate || existingReport?.arrival_date || existingReport?.report_date || dynamicCn?.lrDate || dynamicCh?.challanDate || "")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">LR NUMBER:</span>
              <span className="font-mono font-bold text-black">
                {currentLr || dynamicCn?.lrNumber || dynamicCn?.consignmentNoteNo || "-"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">REACHED DATE:</span>
              <span className="text-black font-bold">{formatDate(reportDate || existingReport?.report_date || dynamicCn?.lrDate || dynamicCh?.challanDate || "")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">CHALLAN NO:</span>
              <span className="font-mono font-bold text-black">
                {currentChallan || dynamicCh?.manualChallanNo || dynamicCh?.challanNo || "-"}
              </span>
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <span className="font-bold text-[#1E3A8A] block uppercase">UNLOADING DATE:</span>
              <span className="text-black font-bold">{formatDate(deliveryDate || existingReport?.delivery_date || dynamicCn?.lrDate || dynamicCh?.challanDate || "")}</span>
            </div>
          </div>

          {/* Consignment Information */}
          <div className="space-y-1.5 border-b border-black pb-3 mb-3 -mx-3 px-3">
            <h3 className="text-[9px] font-black uppercase text-blue-900 tracking-wider">
              1. Consignment Details
            </h3>
            <table className="w-full border-collapse border border-black text-[9px] text-left">
              <tbody>
                <tr className="border-b border-black">
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Consignor:
                  </th>
                  <td className="border-r border-black p-1.5 w-1/4 font-semibold text-black">
                    {refConsignor || dynamicCn?.consignorName || "—"}
                  </td>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Consignee:
                  </th>
                  <td className="p-1.5 w-1/4 font-semibold text-black">{refConsignee || dynamicCn?.consigneeName || "—"}</td>
                </tr>
                <tr className="border-b border-black">
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    From Location:
                  </th>
                  <td className="border-r border-black p-1.5 w-1/4 font-semibold text-black">
                    {refFromLocation || dynamicCn?.fromLocation || "—"}
                  </td>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    To Location:
                  </th>
                  <td className="p-1.5 w-1/4 font-semibold text-black">{refToLocation || dynamicCn?.toLocation || "—"}</td>
                </tr>
                <tr>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Vehicle Number:
                  </th>
                  <td className="border-r border-black p-1.5 w-1/4 font-semibold text-black">
                    {refVehicleNumber || dynamicCn?.vehicleNumber || dynamicCh?.vehicleNumber || "—"}
                  </td>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Driver Name:
                  </th>
                  <td className="p-1.5 w-1/4 font-semibold text-black">{refDriverName || dynamicCh?.driverName || dynamicCn?.driverName || "—"}</td>
                </tr>
                <tr className="border-t border-black">
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Packages:
                  </th>
                  <td className="border-r border-black p-1.5 w-1/4 font-semibold text-black">
                    {refNoOfPackages || (dynamicCn?.items ? String(dynamicCn.items.reduce((s, i) => s + Number(i.noOfPackages || 0), 0)) : "") || "—"}
                  </td>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Driver Mobile:
                  </th>
                  <td className="p-1.5 w-1/4 font-semibold text-black">{refDriverMobile || dynamicCh?.driverMobile || dynamicCn?.driverMobile || "—"}</td>
                </tr>
                <tr className="border-t border-black">
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Balance Amount:
                  </th>
                  <td className="border-r border-black p-1.5 w-1/4 font-bold text-black">
                    {balanceAmount
                      ? `Rs. ${balanceAmount}`
                      : refBalanceAmount
                        ? `Rs. ${refBalanceAmount}`
                        : dynamicCh?.balanceAmount !== undefined
                          ? `Rs. ${dynamicCh.balanceAmount}`
                          : "—"}
                  </td>
                  <th className="border-r border-black p-1.5 bg-[#e5e7eb] w-1/4 font-black text-black">
                    Net Balance:
                  </th>
                  <td className="p-1.5 w-1/4 font-bold text-black">
                    {netAmount ? `Rs. ${netAmount}` : balanceAmount ? `Rs. ${balanceAmount}` : refBalanceAmount ? `Rs. ${refBalanceAmount}` : "Rs. 0.00"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery & Acknowledgement details */}
          <div className="grid grid-cols-3 gap-4 border-b border-black pb-3 mb-3 text-[9px] -mx-3 px-3">
            <div className="space-y-1.5">
              <h3 className="font-black uppercase text-blue-900 tracking-wider">
                2. Delivery Acknowledgement
              </h3>
              <p>
                <strong>Delivery Status:</strong> {deliveryStatus}
              </p>
              <p>
                <strong>Received By:</strong> {receivedBy || "—"}
              </p>
              <p>
                <strong>Receiver Mobile:</strong> {receiverMobile || "—"}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black uppercase text-blue-900 tracking-wider">
                3. Halting / Detention
              </h3>
              <p>
                <strong>Halting Days:</strong> {haltingDays || "0"}
              </p>
              <p>
                <strong>Amount / Day:</strong>{" "}
                {haltingAmountPerDay ? `Rs. ${haltingAmountPerDay}` : "Rs. 0.00"}
              </p>
              <p>
                <strong>Total Detention:</strong>{" "}
                {totalDetentionAmount ? `Rs. ${totalDetentionAmount}` : "Rs. 0.00"}
              </p>
            </div>
            <div className="space-y-1.5">
              <h3 className="font-black uppercase text-blue-900 tracking-wider">
                4. Penalty Details
              </h3>
              <p>
                <strong>Reason:</strong> {penaltyType || "None"}
              </p>
              <p>
                <strong>Amount:</strong> {penaltyAmount ? `Rs. ${penaltyAmount}` : "Rs. 0.00"}
              </p>
            </div>
          </div>

          {/* Remarks & Signatures */}
          <div className="pt-2 text-[9px] flex flex-col justify-between h-[110px] mt-auto">
            <div>
              <span className="font-bold text-[#1E3A8A] block uppercase mb-1">
                Remarks & Special Instructions
              </span>
              <p className="border border-black p-2 min-h-[40px] whitespace-pre-wrap">
                {remarks || ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-center -mx-4 px-4">
              <div>
                <div className="border-t border-black pt-1 inline-block min-w-[200px] font-bold">
                  Branch Incharge: {branchIncharge || "—"}
                </div>
              </div>
              <div>
                <div className="border-t border-black pt-1 inline-block min-w-[200px] font-bold">
                  Authorized Signatory / Receiver
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
