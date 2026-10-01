import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  FileText,
  Printer,
  Save,
  Trash2,
  Plus,
  ShieldAlert,
  FilePlus,
  MapPin,
  User,
  Shield,
  Clock,
  RefreshCw,
  CreditCard,
  Mail,
  ArrowLeft,
  RotateCcw,
  Check,
  Phone,
  MessageCircle,
  Smartphone,
  Lock,
} from "lucide-react";

import { toast } from "sonner";

import { useOpsStore, type ConsignmentNote, type ConsignmentNoteItem } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
import { getIsAdmin } from "@/lib/auth";
import { PageHeader, TableCard } from "@/components/master-ui";
import { Button } from "@/components/ui/button";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/export";
import { inr } from "@/components/ops-ui";
const logo = "/logo.png";

export const Route = createFileRoute("/_app/consignment-note")({
  validateSearch: (search: Record<string, unknown>): { editId?: string; autoPrint?: boolean } => ({
    editId: (search.editId as string) || undefined,
    autoPrint: search.autoPrint === true || search.autoPrint === "true" || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Consignment Note (Lorry Receipt) - JRKS Logistics ERP" },
      {
        name: "description",
        content: "Generate, manage, and print Consignment Notes (LR) for shipments.",
      },
    ],
  }),
  component: ConsignmentNotePage,
});

const COPIES = [
  "CONSIGNEE COPY",
  "CONSIGNOR COPY",
  "LORRY COPY",
  "DESTINATION COPY",
  "ACCOUNTS COPY",
];

const defaultItemRow = (): ConsignmentNoteItem => ({
  noOfPackages: 0,
  methodOfPacking: "",
  description: "",
  netWeight: 0,
  grossWeight: 0,
  invoiceValue: 0,
  invoiceNoDcNo: "",
  gatePassNo: "",
  bookingAmount: 0,
  remarks: "",
});

function ConsignmentNotePage() {
  const userRole = typeof window !== "undefined" ? sessionStorage.getItem("userRole") : "admin";

  const { editId, autoPrint } = Route.useSearch();
  const navigate = useNavigate();
  const {
    consignmentNotes,
    addConsignmentNote,
    updateConsignmentNote,
    deleteConsignmentNote,
    bookings,
    moneyReceipts,
    loadData,
  } = useOpsStore();
  const { companies, trucks } = useMasterStore();

  const [selectedNote, setSelectedNote] = useState<ConsignmentNote | null>(null);

  // Refresh master and ops data when page mounts to ensure dropdowns and records are populated
  useEffect(() => {
    loadData();
    useMasterStore.getState().loadData();
  }, [loadData]);

  // Form states
  const branch = "Trichy";
  const [consignmentNoteNo, setConsignmentNoteNo] = useState("");
  const [lrNumber, setLrNumber] = useState("");
  const [lrDate, setLrDate] = useState(""); // empty initially

  const [consignorName, setConsignorName] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consignorGst, setConsignorGst] = useState("");

  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneeGst, setConsigneeGst] = useState("");
  const [consignorPan, setConsignorPan] = useState("");
  const [consigneePan, setConsigneePan] = useState("");

  const [insuranceType, setInsuranceType] = useState<"Insured" | "Owner Risk" | "Carrier Risk">(
    "Owner Risk",
  );

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const [demandNo, setDemandNo] = useState("");
  const [shipmentNo, setShipmentNo] = useState("");
  const [custNo, setCustNo] = useState("");
  const [schNo, setSchNo] = useState("");
  const [freightType, setFreightType] = useState<"To Pay" | "Paid" | "To be billed">("To Pay");

  const [items, setItems] = useState<ConsignmentNoteItem[]>([defaultItemRow()]);

  const [vehicleLength, setVehicleLength] = useState("");
  const [vehicleWidth, setVehicleWidth] = useState("");
  const [vehicleHeight, setVehicleHeight] = useState("");

  // Determine if this Consignment Note is locked due to an existing Money Receipt
  const isLocked = useMemo(() => {
    if (!selectedNote) return false;
    if (
      selectedNote.isLocked === 1 ||
      selectedNote.isLocked === true ||
      String(selectedNote.isLocked) === "1"
    ) {
      return true;
    }
    const activeLr = (
      selectedNote.lrNumber ||
      selectedNote.consignmentNoteNo ||
      ""
    )
      .trim()
      .toLowerCase();
    if (activeLr && moneyReceipts.length > 0) {
      return moneyReceipts.some((mr) => {
        const mrLr = (mr.lrNo || "").toLowerCase().trim();
        if (
          mrLr &&
          (mrLr === activeLr || mrLr.split(/[,;\s]+/).map((s: string) => s.trim()).includes(activeLr))
        ) {
          return true;
        }
        const mrItems = Array.isArray(mr.items) ? mr.items : [];
        return mrItems.some((it: any) => {
          const itLr = (it.lrNo || "").toLowerCase().trim();
          return (
            itLr &&
            (itLr === activeLr || itLr.split(/[,;\s]+/).map((s: string) => s.trim()).includes(activeLr))
          );
        });
      });
    }
    return false;
  }, [selectedNote, moneyReceipts]);

  // Clean any old localStorage drafts on mount so form always opens fresh
  useEffect(() => {
    if (!editId) {
      try {
        localStorage.removeItem("jrks_consignment_note_draft");
      } catch (e) {}
    }
  }, [editId]);

  // Get today's date in format DD/MM/YYYY for placeholder
  const todayPlaceholder = useMemo(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, []);

  // Sync editId parameter from URL to selectedNote state
  useEffect(() => {
    if (editId) {
      const matched = consignmentNotes.find((n) => String(n.id) === String(editId));
      if (matched) {
        setSelectedNote(matched);
      } else {
        // Direct API fetch fallback in case consignmentNotes is still loading
        fetch(`/api/consignment-notes/${editId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && !data.error) {
              setSelectedNote(data);
            }
          })
          .catch(() => {});
      }
    } else {
      setSelectedNote(null);
    }
  }, [editId, consignmentNotes]);

  // Auto-print when editId and autoPrint parameters are active, selectedNote is fully loaded, and companies master is loaded
  useEffect(() => {
    if (selectedNote && autoPrint && companies.length > 0) {
      const timer = setTimeout(() => {
        window.print();
        navigate({
          to: "/consignment-note",
          search: { editId, autoPrint: undefined },
          replace: true,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedNote, autoPrint, editId, navigate, companies]);

  const matchLr = (a?: string | null, b?: string | null) => {
    if (!a || !b) return false;
    const cleanA = a.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanB = b.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cleanA === cleanB && cleanA.length > 0;
  };

  const extractPan = (pan?: string | null, gst?: string | null): string => {
    if (pan && pan.trim().length >= 10) return pan.trim().toUpperCase();
    if (gst && gst.trim().length >= 12) {
      const cleanGst = gst.trim().replace(/[^a-zA-Z0-9]/g, "");
      if (cleanGst.length >= 12) {
        return cleanGst.substring(2, 12).toUpperCase();
      }
    }
    return (pan || "").trim().toUpperCase();
  };

  // Helper to load note fields into form
  const applyNoteToForm = useCallback((note: ConsignmentNote) => {
    setConsignmentNoteNo(note.consignmentNoteNo || note.lrNumber || "");
    setLrNumber(note.lrNumber || note.consignmentNoteNo || "");
    setLrDate(note.lrDate || "");

    const matchedBooking = bookings.find(
      (b) =>
        matchLr(b.lrNo, note.lrNumber) ||
        matchLr(b.lrNumber, note.lrNumber) ||
        matchLr(b.bookingNo, note.lrNumber) ||
        matchLr(b.lrNo, note.consignmentNoteNo) ||
        matchLr(b.bookingNo, note.consignmentNoteNo),
    );

    const resolvedConsignor = note.consignorName || matchedBooking?.consignorName || "";
    const resolvedConsignee = note.consigneeName || matchedBooking?.consigneeName || "";
    const resolvedVehicle = note.vehicleNumber || matchedBooking?.vehicleNumber || "";
    const resolvedFrom = note.fromLocation || matchedBooking?.loadingLocation || matchedBooking?.fromLocation || "";
    const resolvedTo = note.toLocation || matchedBooking?.unloadingLocation || matchedBooking?.toLocation || "";

    setConsignorName(resolvedConsignor);
    const cComp = companies.find(
      (c) => c.consigneeName && resolvedConsignor && c.consigneeName.toLowerCase() === resolvedConsignor.toLowerCase(),
    );
    const cGst = note.consignorGst || matchedBooking?.consignorGst || cComp?.gstNumber || "";
    const cPan = extractPan(note.consignorPan || cComp?.panNumber, cGst);
    setConsignorAddress(note.consignorAddress || matchedBooking?.consignorAddress || cComp?.address || "");
    setConsignorGst(cGst);
    setConsignorPan(cPan);

    setConsigneeName(resolvedConsignee);
    const ceComp = companies.find(
      (c) => c.consigneeName && resolvedConsignee && c.consigneeName.toLowerCase() === resolvedConsignee.toLowerCase(),
    );
    const ceGst = note.consigneeGst || matchedBooking?.consigneeGst || ceComp?.gstNumber || "";
    const cePan = extractPan(note.consigneePan || matchedBooking?.panNumber || ceComp?.panNumber, ceGst);
    setConsigneeAddress(note.consigneeAddress || matchedBooking?.consigneeAddress || ceComp?.address || "");
    setConsigneeGst(ceGst);
    setConsigneePan(cePan);

    setInsuranceType(note.insuranceType || "Owner Risk");
    setFromLocation(resolvedFrom);
    setToLocation(resolvedTo);
    setVehicleNumber(resolvedVehicle);
    setDemandNo(note.demandNo || matchedBooking?.demandNo || "-");
    setShipmentNo(note.shipmentNo || matchedBooking?.shipmentNo || "-");
    setCustNo(note.custNo || matchedBooking?.custNo || "-");
    setSchNo(note.schNo || matchedBooking?.schNo || "-");
    setFreightType(note.freightType || matchedBooking?.freightType || "To Pay");
    setItems(
      note.items && note.items.length > 0
        ? note.items
        : matchedBooking?.items && matchedBooking.items.length > 0
        ? matchedBooking.items
        : [defaultItemRow()],
    );
    setVehicleLength(note.vehicleLength || "");
    setVehicleWidth(note.vehicleWidth || "");
    setVehicleHeight(note.vehicleHeight || "");
  }, [bookings, companies]);

  // Lookup existing LR note or Booking to fetch details
  const handleLrNumberLookup = (val: string) => {
    if (!val || !val.trim()) {
      if (!editId) {
        setSelectedNote(null);
      }
      return;
    }
    const trimmedLr = val.trim();

    // 1. Check existing Consignment Note first
    const matchedNote = consignmentNotes.find(
      (n) => matchLr(n.lrNumber, trimmedLr) || matchLr(n.consignmentNoteNo, trimmedLr),
    );
    if (matchedNote) {
      setSelectedNote(matchedNote);
      applyNoteToForm(matchedNote);
      return;
    } else {
      if (!editId) {
        setSelectedNote(null);
      }
    }

    // 2. Check existing Booking to automatically populate Consignee, Vehicle, Route, etc.
    const matchedBooking = bookings.find(
      (b) => matchLr(b.lrNo, trimmedLr) || matchLr(b.lrNumber, trimmedLr) || matchLr(b.bookingNo, trimmedLr),
    );
    if (matchedBooking) {
      if (matchedBooking.lrDate) setLrDate(matchedBooking.lrDate);
      else if (matchedBooking.bookingDate) setLrDate(matchedBooking.bookingDate);

      if (matchedBooking.consigneeName) {
        setConsigneeName(matchedBooking.consigneeName);
        const comp = companies.find((c) => c.consigneeName.toLowerCase() === matchedBooking.consigneeName!.toLowerCase());
        const ceGst = matchedBooking.consigneeGst || comp?.gstNumber || "";
        const cePan = extractPan(matchedBooking.panNumber || comp?.panNumber, ceGst);
        setConsigneeAddress(matchedBooking.consigneeAddress || comp?.address || "");
        setConsigneeGst(ceGst);
        setConsigneePan(cePan);
      }

      if (matchedBooking.consignorName) {
        setConsignorName(matchedBooking.consignorName);
        const comp = companies.find((c) => c.consigneeName.toLowerCase() === matchedBooking.consignorName!.toLowerCase());
        const cGst = matchedBooking.consignorGst || comp?.gstNumber || "";
        const cPan = extractPan(comp?.panNumber, cGst);
        setConsignorAddress(matchedBooking.consignorAddress || comp?.address || "");
        setConsignorGst(cGst);
        setConsignorPan(cPan);
      }

      if (matchedBooking.vehicleNumber) {
        setVehicleNumber(matchedBooking.vehicleNumber);
      }

      if (matchedBooking.loadingLocation || matchedBooking.fromLocation) {
        setFromLocation(matchedBooking.loadingLocation || matchedBooking.fromLocation || "");
      }
      if (matchedBooking.unloadingLocation || matchedBooking.toLocation) {
        setToLocation(matchedBooking.unloadingLocation || matchedBooking.toLocation || "");
      }

      if (matchedBooking.freightType) {
        setFreightType(matchedBooking.freightType);
      }
      setDemandNo(matchedBooking.demandNo || "-");
      setShipmentNo(matchedBooking.shipmentNo || "-");
      setCustNo(matchedBooking.custNo || "-");
      setSchNo(matchedBooking.schNo || "-");

      if (matchedBooking.items && matchedBooking.items.length > 0) {
        setItems(matchedBooking.items);
      }

      toast.info(`Auto-filled details from Booking #${matchedBooking.bookingNo || matchedBooking.lrNo}`);
    }
  };

  // Sync editId parameter from URL
  useEffect(() => {
    if (editId) {
      const matched = consignmentNotes.find((n) => String(n.id) === String(editId));
      if (matched) {
        setSelectedNote(matched);
        applyNoteToForm(matched);
      } else {
        fetch(`/api/consignment-notes/${editId}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && !data.error) {
              setSelectedNote(data);
              applyNoteToForm(data);
            }
          })
          .catch(() => {});
      }
    } else {
      setSelectedNote(null);
    }
  }, [editId, consignmentNotes, applyNoteToForm]);

  // Reset form helper
  const handleResetForm = () => {
    localStorage.removeItem("jrks_consignment_note_draft");
    navigate({ to: "/consignment-note", search: { editId: undefined } });
    setSelectedNote(null);
    setConsignmentNoteNo("");
    setLrNumber("");
    setLrDate("");
    setConsignorName("");
    setConsignorAddress("");
    setConsignorGst("");
    setConsignorPan("");
    setConsigneeName("");
    setConsigneeAddress("");
    setConsigneeGst("");
    setConsigneePan("");
    setInsuranceType("Owner Risk");
    setFromLocation("");
    setToLocation("");
    setVehicleNumber("");
    setDemandNo("");
    setShipmentNo("");
    setCustNo("");
    setSchNo("");
    setFreightType("To Pay");
    setItems([defaultItemRow()]);
    setVehicleLength("");
    setVehicleWidth("");
    setVehicleHeight("");
    toast.info("Form cleared. Ready for new entry.");
  };

  // Autocomplete Consignor
  const handleSelectConsignor = (name: string) => {
    setConsignorName(name);
    const matched = companies.find((c) => c.consigneeName.toLowerCase() === name.toLowerCase());
    if (matched) {
      const gst = matched.gstNumber || "";
      const pan = extractPan(matched.panNumber, gst);
      setConsignorAddress(matched.address || "");
      setConsignorGst(gst);
      setConsignorPan(pan);
    }
  };

  // Autocomplete Consignee
  const handleSelectConsignee = (name: string) => {
    setConsigneeName(name);
    const matched = companies.find((c) => c.consigneeName.toLowerCase() === name.toLowerCase());
    if (matched) {
      const gst = matched.gstNumber || "";
      const pan = extractPan(matched.panNumber, gst);
      setConsigneeAddress(matched.address || "");
      setConsigneeGst(gst);
      setConsigneePan(pan);
    }
  };

  // Dynamic Item Grid row operations
  const handleAddItemRow = () => {
    setItems([...items, defaultItemRow()]);
  };

  const handleDeleteItemRow = (index: number) => {
    if (items.length > 1) {
      const remainingItems = items.filter((_, idx) => idx !== index);
      if (
        selectedNote &&
        !getIsAdmin() &&
        (branch.toLowerCase() === "trichy" || (selectedNote.branch || "").toLowerCase() === "trichy")
      ) {
        const prevTotalFreight = (selectedNote.items || []).reduce(
          (sum, it) => sum + (Number(it.bookingAmount) || 0),
          0,
        );
        const newTotalFreight = remainingItems.reduce(
          (sum, it) => sum + (Number(it.bookingAmount) || 0),
          0,
        );
        if (prevTotalFreight > 0 && newTotalFreight < prevTotalFreight) {
          toast.error(
            `Trichy Branch Restriction: Cannot delete item because total freight amount cannot be reduced below ₹${prevTotalFreight.toLocaleString("en-IN")}.`,
          );
          return;
        }
      }
      setItems(remainingItems);
    }
  };

  const handleUpdateItemField = (
    index: number,
    field: keyof ConsignmentNoteItem,
    value: string | number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Totals calculations
  const totals = useMemo(() => {
    let packages = 0;
    let netWeight = 0;
    let grossWeight = 0;
    let invoiceVal = 0;
    for (const item of items) {
      packages += Number(item.noOfPackages || 0);
      netWeight += Number(item.netWeight || 0);
      grossWeight += Number(item.grossWeight || 0);
      invoiceVal += Number(item.invoiceValue || 0);
    }
    return { packages, netWeight, grossWeight, invoiceVal };
  }, [items]);

  // Pad items to a fixed size of 4 rows (padding with empty defaultItemRow items to fit single page)
  const paddedItems = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.noOfPackages ||
        item.methodOfPacking?.trim() ||
        item.description?.trim() ||
        item.netWeight ||
        item.grossWeight ||
        item.invoiceValue ||
        item.invoiceNoDcNo?.trim() ||
        item.gatePassNo?.trim() ||
        item.bookingAmount,
    );
    const result = [...filtered];
    while (result.length < 4) {
      result.push(defaultItemRow());
    }
    return result;
  }, [items]);

  // Save operation
  const handleSave = async (shouldPrint = false) => {
    if (isLocked) {
      if (shouldPrint) {
        handlePrint();
        toast.info("Printing Consignment Note (Editing is locked).");
        return;
      }
      toast.error("Locked Record", {
        description: `This Consignment Note (LR #${lrNumber || consignmentNoteNo}) is locked and cannot be edited because a Money Receipt has already been generated for it.`,
        duration: 5000,
      });
      return;
    }

    const finalConsignmentNoteNo = consignmentNoteNo.trim() || lrNumber.trim();
    if (!finalConsignmentNoteNo) {
      toast.error("Please enter LR Number (Consignment No).");
      return;
    }
    if (!lrDate) {
      toast.error("Please select the LR Date.");
      return;
    }
    if (!consignorName || !consigneeName || !fromLocation || !toLocation || !vehicleNumber) {
      toast.error(
        "Please fill in the core route and party details (Consignor, Consignee, From, To, Vehicle No.)",
      );
      return;
    }
    if (!consignorPan || !consigneePan) {
      toast.error("Please enter both Consignor PAN and Consignee PAN.");
      return;
    }

    // Trichy branch freight reduction check: cannot be lower than previously saved amount (admin can edit freely)
    if (
      selectedNote &&
      !getIsAdmin() &&
      (branch.toLowerCase() === "trichy" || (selectedNote.branch || "").toLowerCase() === "trichy")
    ) {
      const prevTotalFreight = (selectedNote.items || []).reduce(
        (sum, it) => sum + (Number(it.bookingAmount) || 0),
        0,
      );
      const currentTotalFreight = items.reduce(
        (sum, it) => sum + (Number(it.bookingAmount) || 0),
        0,
      );

      if (prevTotalFreight > 0 && currentTotalFreight < prevTotalFreight) {
        toast.error(
          `Trichy Branch Restriction: Freight Amount cannot be reduced below previously saved amount of ₹${prevTotalFreight.toLocaleString("en-IN")}. You can only keep it same or increase it.`,
        );
        return;
      }
    }

    const payload = {
      branch,
      consignmentNoteNo: finalConsignmentNoteNo,
      lrNumber,
      lrDate,
      consignorName,
      consignorAddress,
      consignorGst,
      consignorPan,
      consigneeName,
      consigneeAddress,
      consigneeGst,
      consigneePan,
      insuranceType,
      fromLocation,
      toLocation,
      vehicleNumber,
      demandNo,
      shipmentNo,
      custNo,
      schNo,
      freightType,
      demurrageDays: 0,
      demurrageRate: 0,
      chargeBasis: "",
      demurrageRemarks: "",
      vehicleLength,
      vehicleWidth,
      vehicleHeight,
      items,
    };

    let success = false;
    if (selectedNote) {
      success = await updateConsignmentNote(selectedNote.id, payload);
      if (success) {
        toast.success("Already Saved Record Updated!", {
          description: `Consignment Note #${finalConsignmentNoteNo} changes have been updated successfully.`,
          duration: 4000,
        });
      }
    } else {
      success = await addConsignmentNote(payload);
      if (success) {
        toast.success("New Consignment Note Saved Successfully!", {
          description: `Consignment Note #${finalConsignmentNoteNo} has been created and saved.`,
          duration: 4000,
        });
      }
    }

    if (success) {
      if (shouldPrint) {
        setTimeout(() => {
          const handleAfterPrint = () => {
            handleResetForm();
            navigate({ to: "/consignment-records" });
          };
          window.addEventListener("afterprint", handleAfterPrint, { once: true });
          window.print();
        }, 300);
      } else {
        handleResetForm();
        navigate({ to: "/consignment-records" });
      }
    } else {
      toast.error("Failed to save Consignment Note. Please verify data.");
    }
  };

  // Print operation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>
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
            margin: 3mm;
          }
          /* Hide sidebar, top navigation, print buttons, and left form panel */
          aside, header, nav, .print\\:hidden, button, .consignment-form-panel {
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
          .lg\\:pl-\\[280px\\] {
            padding-left: 0 !important;
          }
          .lr-preview-panel {
            position: relative !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
          .copy-page {
            position: relative !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 285mm !important;
            width: 100% !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .copy-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .lr-preview-paper {
            border: 2px solid black !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 280mm !important;
            height: 198mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            transform: rotate(90deg) !important;
            transform-origin: top left !important;
            position: absolute !important;
            left: 201mm !important;
            top: 2mm !important;
          }
          /* Ensure all table lines in preview are solid black */
          .lr-preview-paper table {
            border-collapse: collapse !important;
          }
          .lr-preview-paper th,
          .lr-preview-paper td {
            color: black !important;
          }
          
          /* Ref table borders */
          .lr-preview-paper .ref-table td {
            border-top: 1.5px solid black !important;
            border-bottom: 1.5px solid black !important;
          }
          .lr-preview-paper .ref-table td:not(:last-child) {
            border-right: 1.5px solid black !important;
          }

          /* Goods table headers */
          .lr-preview-paper thead th {
            border-top: 1.5px solid black !important;
            border-bottom: 1.5px solid black !important;
          }
          .lr-preview-paper thead th:not(:last-child) {
            border-right: 1.5px solid black !important;
          }

          /* Goods table body column lines (vertical only) */
          .lr-preview-paper tbody td:not(:last-child) {
            border-right: 1.5px solid black !important;
          }

          /* Goods table total row borders */
          .lr-preview-paper .total-row td {
            border-top: 1.5px solid black !important;
            border-bottom: 1.5px solid black !important;
          }
          .lr-preview-paper .total-row td:not(:last-child) {
            border-right: 1.5px solid black !important;
          }
        }
      `}</style>

      {/* Container */}
      <div className="w-full">
        {/* Input Form (hidden in print) */}
        <div className="space-y-6 consignment-form-panel print:hidden">
          {/* Main Title / Banner */}
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

          {/* Lock Banner if locked */}
          {isLocked && (
            <div className="flex items-center gap-3.5 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 shadow-sm animate-in fade-in">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">
                  Consignment Note is Locked
                </h3>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">
                  This Lorry Receipt (LR #{lrNumber || consignmentNoteNo || selectedNote?.lrNumber}) is locked and cannot be modified because a Money Receipt has already been created for it.
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => e.preventDefault()}
            className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-5 pb-28 text-sm space-y-6 shadow-sm"
          >
            <fieldset disabled={isLocked} className="space-y-6 disabled:opacity-85">
            {/* DOCUMENT DETAILS CARD */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                  LR Number <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  value={lrNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLrNumber(val);
                    if (!demandNo) setDemandNo("-");
                    if (!shipmentNo) setShipmentNo("-");
                    if (!custNo) setCustNo("-");
                    if (!schNo) setSchNo("-");
                    handleLrNumberLookup(val);
                  }}
                  onBlur={(e) => handleLrNumberLookup(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleLrNumberLookup(lrNumber);
                    }
                  }}
                  placeholder="Enter LR Number"
                  className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-805 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                  LR Date <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CustomDatePicker value={lrDate} onChange={setLrDate} />
              </div>
            </div>

            {/* 4 Cards Grid Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* CARD 1: CONSIGNOR DETAILS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-blue-900 uppercase text-xs tracking-wider">
                      CONSIGNOR DETAILS
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        Consigner Name <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={consignorName}
                        onValueChange={(val) => handleSelectConsignor(val)}
                      >
                        <SelectTrigger className="w-full mt-1 h-9 border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-800">
                          <span className="truncate pointer-events-none">
                            {consignorName ? (
                              consignorName
                            ) : (
                              <span className="text-slate-400">Select Consignor</span>
                            )}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {consignorName &&
                            !companies.some((c) => c.consigneeName === consignorName) && (
                              <SelectItem value={consignorName}>{consignorName}</SelectItem>
                            )}
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.consigneeName}>
                              {c.consigneeName} {c.billingParty ? `(${c.billingParty})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={consignorAddress}
                        onChange={(e) => setConsignorAddress(e.target.value)}
                        placeholder="Address"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        GST <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={consignorGst}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setConsignorGst(val);
                          const autoPan = extractPan(consignorPan, val);
                          if (autoPan && (!consignorPan || consignorPan.length < 10)) {
                            setConsignorPan(autoPan);
                          }
                        }}
                        placeholder="Enter GST Number"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        PAN No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={consignorPan}
                        onChange={(e) => setConsignorPan(e.target.value.toUpperCase())}
                        placeholder="Enter PAN Number"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: CONSIGNEE DETAILS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-blue-900 uppercase text-xs tracking-wider">
                      CONSIGNEE DETAILS
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        Consignee Name <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={consigneeName}
                        onValueChange={(val) => handleSelectConsignee(val)}
                      >
                        <SelectTrigger className="w-full mt-1 h-9 border-slate-200 rounded-lg bg-white text-xs font-semibold text-slate-800">
                          <span className="truncate pointer-events-none">
                            {consigneeName ? (
                              consigneeName
                            ) : (
                              <span className="text-slate-400">Select Consignee</span>
                            )}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {consigneeName &&
                            !companies.some((c) => c.consigneeName === consigneeName) && (
                              <SelectItem value={consigneeName}>{consigneeName}</SelectItem>
                            )}
                          {companies.map((c) => (
                            <SelectItem key={c.id} value={c.consigneeName}>
                              {c.consigneeName} {c.billingParty ? `(${c.billingParty})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={consigneeAddress}
                        onChange={(e) => setConsigneeAddress(e.target.value)}
                        placeholder="Address"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        GST <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={consigneeGst}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setConsigneeGst(val);
                          const autoPan = extractPan(consigneePan, val);
                          if (autoPan && (!consigneePan || consigneePan.length < 10)) {
                            setConsigneePan(autoPan);
                          }
                        }}
                        placeholder="Enter GST Number"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        PAN No. <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={consigneePan}
                        onChange={(e) => setConsigneePan(e.target.value.toUpperCase())}
                        placeholder="Enter PAN Number"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: INSURANCE */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-blue-900 uppercase text-xs tracking-wider">
                      INSURANCE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal mb-4">
                    The customer has stated that he has not insured the consignment OR He has
                    insured the consignment. At Owner's risk / Carrier's risk.
                  </p>
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="insuranceType"
                        value="Insured"
                        checked={insuranceType === "Insured"}
                        onChange={() => setInsuranceType("Insured")}
                        className="h-4 w-4 accent-blue-900"
                      />
                      Insured
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="insuranceType"
                        value="Owner Risk"
                        checked={insuranceType === "Owner Risk"}
                        onChange={() => setInsuranceType("Owner Risk")}
                        className="h-4 w-4 accent-blue-900"
                      />
                      Owner Risk
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                      <input
                        type="radio"
                        name="insuranceType"
                        value="Carrier Risk"
                        checked={insuranceType === "Carrier Risk"}
                        onChange={() => setInsuranceType("Carrier Risk")}
                        className="h-4 w-4 accent-blue-900"
                      />
                      Carrier Risk
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD 4: OTHER DETAILS */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-extrabold text-blue-900 uppercase text-xs tracking-wider">
                      OTHER DETAILS
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        From <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        placeholder="From"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        To <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={toLocation}
                        onChange={(e) => setToLocation(e.target.value)}
                        placeholder="To"
                        className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-700">
                        Veh. No. <span className="text-red-500">*</span>
                      </label>
                      <Select value={vehicleNumber} onValueChange={setVehicleNumber}>
                        <SelectTrigger className="w-full mt-1 h-9 border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-800">
                          <span className="truncate pointer-events-none">
                            {vehicleNumber ? (
                              vehicleNumber
                            ) : (
                              <span className="text-slate-400">Select Vehicle</span>
                            )}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleNumber &&
                            !trucks.some((t) => t.vehicleNumber.toLowerCase() === vehicleNumber.toLowerCase()) && (
                              <SelectItem value={vehicleNumber}>{vehicleNumber}</SelectItem>
                            )}
                          {trucks.map((t) => (
                            <SelectItem key={t.id} value={t.vehicleNumber}>
                              {t.vehicleNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6 text-xs">
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Demand No.
                </label>
                <input
                  type="text"
                  value={demandNo}
                  onChange={(e) => setDemandNo(e.target.value)}
                  placeholder="Enter Demand No."
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Shipment No.
                </label>
                <input
                  type="text"
                  value={shipmentNo}
                  onChange={(e) => setShipmentNo(e.target.value)}
                  placeholder="Enter Shipment No."
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Cust. No.
                </label>
                <input
                  type="text"
                  value={custNo}
                  onChange={(e) => setCustNo(e.target.value)}
                  placeholder="Enter Customer No."
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Sch. No.
                </label>
                <input
                  type="text"
                  value={schNo}
                  onChange={(e) => setSchNo(e.target.value)}
                  placeholder="Enter Schedule No."
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                />
              </div>
              <div className="flex flex-col justify-center">
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                  Freight Payable By
                </label>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-900">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="freightType"
                      value="To Pay"
                      checked={freightType === "To Pay"}
                      onChange={() => setFreightType("To Pay")}
                      className="h-4 w-4 accent-blue-900"
                    />
                    To Pay
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="freightType"
                      value="Paid"
                      checked={freightType === "Paid"}
                      onChange={() => setFreightType("Paid")}
                      className="h-4 w-4 accent-blue-900"
                    />
                    Paid
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="freightType"
                      value="To be billed"
                      checked={freightType === "To be billed"}
                      onChange={() => setFreightType("To be billed")}
                      className="h-4 w-4 accent-blue-900"
                    />
                    To be billed
                  </label>
                </div>
              </div>
            </div>

            {/* Goods Details Grid Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl mt-6">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-[#0f3b8c] text-white text-[10px] font-bold uppercase tracking-wider border-b border-blue-900">
                    <th className="px-2 py-2 border-r border-blue-800/40 text-center w-10 text-white">
                      S.No.
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 text-center w-20 text-white">
                      No. of Pkgs
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 w-32 text-white">
                      Packing Method
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 w-48 text-white">
                      Description
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 text-right w-24 text-white">
                      Net Wt (Kg)
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 text-right w-24 text-white">
                      Gross Wt (Kg)
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 text-right w-24 text-white">
                      Inv Val (Rs.)
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 w-36 text-white">
                      Invoice No.
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 w-32 text-white">
                      Gate Pass No.
                    </th>
                    <th className="px-2 py-2 border-r border-blue-800/40 w-36 text-white">
                      Freight Amount
                    </th>
                    <th className="px-2 py-2 text-center w-10 print:hidden text-white">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, index) => (
                    <tr key={index} className="align-middle">
                      <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-700">
                        {index + 1}
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.noOfPackages || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            handleUpdateItemField(index, "noOfPackages", val ? Number(val) : "");
                          }}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.methodOfPacking}
                          onChange={(e) =>
                            handleUpdateItemField(index, "methodOfPacking", e.target.value)
                          }
                          placeholder="e.g. Box, Bag"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold focus:outline-none focus:border-blue-900 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItemField(index, "description", e.target.value)
                          }
                          placeholder="Enter Description"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          step="0.001"
                          value={item.netWeight || ""}
                          onChange={(e) =>
                            handleUpdateItemField(index, "netWeight", Number(e.target.value))
                          }
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right font-semibold font-mono text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="number"
                          step="0.001"
                          value={item.grossWeight || ""}
                          onChange={(e) =>
                            handleUpdateItemField(index, "grossWeight", Number(e.target.value))
                          }
                          placeholder="0.000"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-right font-semibold font-mono text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <div className="relative">
                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={item.invoiceValue || ""}
                            onChange={(e) =>
                              handleUpdateItemField(index, "invoiceValue", Number(e.target.value))
                            }
                            placeholder="0"
                            className="w-full bg-white border border-slate-200 rounded pl-4 pr-1 py-1 text-right font-semibold font-mono text-slate-800 focus:outline-none focus:border-blue-900 text-xs"
                          />
                        </div>
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.invoiceNoDcNo}
                          onChange={(e) =>
                            handleUpdateItemField(index, "invoiceNoDcNo", e.target.value)
                          }
                          placeholder="Invoice No."
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        <input
                          type="text"
                          value={item.gatePassNo}
                          onChange={(e) =>
                            handleUpdateItemField(index, "gatePassNo", e.target.value)
                          }
                          placeholder="Gate Pass"
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                        />
                      </td>
                      <td className="p-1 border-r border-slate-200">
                        {(() => {
                          const prevItemAmt = selectedNote?.items?.[index]?.bookingAmount
                            ? Number(selectedNote.items[index].bookingAmount)
                            : undefined;
                          const isRestricted =
                            selectedNote &&
                            !getIsAdmin() &&
                            (branch.toLowerCase() === "trichy" ||
                              (selectedNote.branch || "").toLowerCase() === "trichy") &&
                            prevItemAmt !== undefined &&
                            prevItemAmt > 0;

                          return (
                            <input
                              type="number"
                              value={item.bookingAmount}
                              min={isRestricted ? prevItemAmt : undefined}
                              onChange={(e) =>
                                handleUpdateItemField(index, "bookingAmount", e.target.value)
                              }
                              onBlur={(e) => {
                                if (isRestricted) {
                                  const enteredVal = Number(e.target.value) || 0;
                                  if (enteredVal < prevItemAmt) {
                                    toast.warning(
                                      `Trichy Branch: Freight Amount cannot be less than previous amount of ₹${prevItemAmt.toLocaleString("en-IN")}.`,
                                    );
                                    handleUpdateItemField(index, "bookingAmount", prevItemAmt);
                                  }
                                }
                              }}
                              placeholder={isRestricted ? `Min ₹${prevItemAmt}` : "Amount"}
                              title={
                                isRestricted
                                  ? `Previously saved amount: ₹${prevItemAmt}. Cannot be reduced.`
                                  : undefined
                              }
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 font-mono text-right focus:outline-none focus:border-blue-900 text-xs"
                            />
                          );
                        })()}
                      </td>
                      <td className="p-1 text-center print:hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItemRow(index)}
                          disabled={items.length === 1}
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f0f4fc] font-extrabold text-[11px] text-slate-800 border-t border-slate-200">
                    <td className="px-2 py-2 border-r border-slate-200"></td>
                    <td className="px-2 py-2 border-r border-slate-200 text-center font-mono font-black">
                      {totals.packages}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-200 flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-900">
                      <FileText className="h-4 w-4 text-blue-900" />
                      <span>TOTAL</span>
                    </td>
                    <td className="px-2 py-2 border-r border-slate-200"></td>
                    <td className="px-2 py-2 border-r border-slate-200 text-right font-mono font-black">
                      {totals.netWeight.toFixed(3)}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-200 text-right font-mono font-black">
                      {totals.grossWeight.toFixed(3)}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-200 text-right font-mono font-black">
                      {totals.invoiceVal.toLocaleString("en-IN")}
                    </td>
                    <td className="px-2 py-2 border-r border-slate-200" colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Add package button */}
            <div className="p-2 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddItemRow}
                className="h-9 border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-lg shadow-sm text-xs font-bold"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
                Add Package Row
              </Button>
            </div>

            {/* Vehicle Dimensions Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                <span className="font-extrabold text-blue-900 uppercase text-xs tracking-wider">
                  CONSIGNMENT DIMENSION( in MTRS)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    LENGTH (L)
                  </label>
                  <input
                    type="text"
                    value={vehicleLength}
                    onChange={(e) => setVehicleLength(e.target.value)}
                    placeholder="L"
                    className="w-full mt-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    WIDTH (B)
                  </label>
                  <input
                    type="text"
                    value={vehicleWidth}
                    onChange={(e) => setVehicleWidth(e.target.value)}
                    placeholder="B"
                    className="w-full mt-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                    HEIGHT (H)
                  </label>
                  <input
                    type="text"
                    value={vehicleHeight}
                    onChange={(e) => setVehicleHeight(e.target.value)}
                    placeholder="H"
                    className="w-full mt-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>
            </div>
            </fieldset>

            {/* Sticky Form Action buttons */}
            <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 pr-6 pl-12 flex items-center justify-between shadow-lg print:hidden">
              <button
                type="button"
                onClick={() => navigate({ to: "/consignment-records" })}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-[13px] tracking-wider uppercase px-6 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" /> Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  <RotateCcw className="h-4.5 w-4.5" /> Clear Form
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md transition-all duration-200 bg-[#1E3A8A] hover:bg-blue-800 text-white hover:shadow-lg cursor-pointer"
                >
                  <Save className="h-4.5 w-4.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="flex items-center gap-2 font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md transition-all duration-200 bg-[#1E3A8A] hover:bg-blue-800 text-white hover:shadow-lg cursor-pointer"
                >
                  <Printer className="h-4.5 w-4.5" /> Save & Print
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* LR Preview (only shown in print) */}
        <div className="lr-preview-panel hidden print:block w-full">
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-xl shadow-md print:hidden">
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Live LR Print Preview (A4 Landscape)
            </span>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-7 px-3 rounded-full text-xs shadow flex items-center gap-1"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </Button>
          </div>

          {/* Scrollable Container for Preview */}
          <div className="overflow-x-auto w-full p-4 bg-slate-100 border border-slate-200 rounded-xl shadow-inner print:p-0 print:border-none print:shadow-none print:bg-white">
            {COPIES.map((copyName, copyIdx) => (
              <div key={copyName} className="copy-page">
                <div
                  id={copyIdx === 0 ? "lr-print-preview" : undefined}
                  className="lr-preview-paper bg-white text-black p-0 border-2 border-black rounded-none shadow-md font-sans text-[11px] leading-tight select-none relative overflow-hidden print:shadow-none"
                  style={{
                    width: "1050px",
                    margin: "0 auto",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* MAIN HEADER: LOGO, TITLE, DETAILS, PHONE */}
                  <div className="grid grid-cols-[120px_1fr_130px] border-b border-black items-stretch">
                    {/* Left Logo */}
                    <div className="flex justify-center items-center p-1.5">
                      <img
                        src={logo}
                        alt="JRKS Logo"
                        className="w-[95px] h-[95px] object-contain"
                        style={{ filter: "grayscale(100%) contrast(1.1)" }}
                      />
                    </div>

                    {/* Center Title & Info */}
                    <div className="text-center flex flex-col justify-center py-1.5 px-2">
                      <div className="text-center text-[10px] pb-1 text-black flex flex-col items-center leading-tight">
                        <div className="font-black text-[12px] tracking-wider">CONSIGNMENT NOTE</div>
                        <span className="underline font-bold">
                          Subject to Tiruchirappalli Jurisdiction only
                        </span>
                      </div>
                      <h1 className="text-[26px] font-serif font-black tracking-wider text-black leading-none m-0 mt-0.5">
                        JRKS DIGITAL INDIA LOGISTICS LLP
                      </h1>
                      <p className="text-[13px] font-bold italic leading-normal m-0 mt-0.5">
                        (Transport Contractor & Logistics Solutions) &nbsp;&nbsp;&nbsp;&nbsp;{" "}
                        <a
                          href="https://jrkslogistics.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-mono text-black"
                        >
                          https://jrkslogistics.in
                        </a>
                      </p>
                      <p className="text-[11.5px] font-bold leading-normal m-0 mt-0.5">
                        No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur
                        (Post), Trichy - 620 019.
                      </p>
                    </div>

                    {/* Right Phones */}
                    <div className="text-right flex items-center justify-center p-2 font-mono text-black">
                      <div className="text-[13.5px] font-black flex flex-col space-y-1.5 leading-none">
                        <span>97906 05938</span>
                        <span>93645 95075</span>
                        <span>72062 82936</span>
                      </div>
                    </div>
                  </div>
                  {/* GST / PAN / SAC / EMAIL STRIP */}
                  <div className="grid grid-cols-4 text-center border-b border-black font-bold text-[9.5px]">
                    <div className="border-r border-black py-0.5 flex items-center justify-center gap-1">
                      <span>GST No.:</span>
                      <span className="font-black">33AAWFJ4987B1ZY</span>
                    </div>
                    <div className="border-r border-black py-0.5 flex items-center justify-center gap-1">
                      <span>PAN No.:</span>
                      <span className="font-black">AAWFJ4987B</span>
                    </div>
                    <div className="border-r border-black py-0.5 flex items-center justify-center gap-1">
                      <span>SAC Code:</span>
                      <span className="font-black">9965</span>
                    </div>
                    <div className="py-0.5 flex items-center justify-center gap-1 px-1">
                      <span>E-mail:</span>
                      <span className="font-mono text-[8.5px] font-black truncate">
                        admin@jrksdilogistics.in
                      </span>
                    </div>
                  </div>
                  {/* MIDDLE ROW: NOTICE, DEMURRAGE, INSURANCE, LR DETAILS */}
                  <div className="grid grid-cols-[2.5fr_2.5fr_2.2fr_2fr] border-b border-black text-[9px] leading-tight min-h-[110px]">
                    {/* Box 1: NOTICE */}
                    <div className="p-1 border-r border-black flex flex-col justify-start">
                      <div className="text-center font-black underline mb-1 uppercase text-[10px] text-black">
                        NOTICE
                      </div>
                      <p className="text-[8.5px] text-justify leading-relaxed m-0 font-medium text-black">
                        The Consignment covered by this Lorry Receipt shall be stored at the
                        destination under the control of the Transport Operator and shall be
                        delivered to or to the order of the Consignee Bank whose name is mentioned
                        in the Lorry Receipt. It will under no circumstances be delivered to anyone
                        without the written authority from the Consignee Bank or its order, endorsed
                        in the Consignee Copy.
                      </p>
                    </div>

                    {/* Box 2: CONSIGNEE COPY & VEHICLE DIMENSIONS */}
                    <div className="p-1 border-r border-black flex flex-col justify-between items-center text-center">
                      <div className="text-black text-[11px] font-black uppercase tracking-wider">
                        {copyName}
                      </div>
                      <div className="w-full mt-0.5 flex flex-col justify-center flex-grow px-1">
                        <div className="font-black text-[8.5px] border-b border-dotted border-black pb-0.5 uppercase tracking-wide text-black">
                          CONSIGNMENT DIMENSION( in MTRS)
                        </div>
                        <div className="text-[11px] mt-1.5 font-semibold leading-relaxed text-black flex items-end px-1">
                          <span className="text-[10px] text-black font-bold mr-1">LBH-(M):</span>
                          <span className="font-bold text-[12.5px] border-b border-black flex-grow text-center min-w-[50px] inline-block leading-none pb-0.5 whitespace-nowrap">
                            {vehicleLength || vehicleWidth || vehicleHeight 
                              ? `${vehicleLength || "-"} x ${vehicleWidth || "-"} x ${vehicleHeight || "-"}`
                              : "\u00A0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Box 3: INSURANCE */}
                    <div className="p-1 border-r border-black flex flex-col justify-start">
                      <div className="text-center font-black underline mb-1 uppercase text-[10px] text-black">
                        INSURANCE
                      </div>
                      <p className="text-[8.5px] leading-normal text-justify m-0 font-semibold text-black">
                        The customer has stated that he has not insured the consignment OR He has
                        insured the consignment. At Owner's risk / Carrier's risk.
                      </p>
                    </div>

                    {/* Box 4: BRANCH & LR DETAILS */}
                    <div className="p-1 flex flex-col justify-between font-bold text-[9.5px] space-y-0.5 text-black">
                      <div className="flex justify-between border-b border-slate-200 py-[1px]">
                        <span className="text-black font-bold">Branch:</span>
                        <span className="font-black text-right truncate max-w-[120px]">
                          {branch}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-[1px]">
                        <span className="text-black font-black text-[10px]">LR No:</span>
                        <span className="font-black text-right text-black font-mono text-[11px]">
                          {lrNumber || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-[1px]">
                        <span className="text-black font-bold">LR Date:</span>
                        <span className="font-black text-right">
                          {lrDate ? formatDate(lrDate) : new Date().toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-[1px]">
                        <span className="text-black font-bold">From:</span>
                        <span className="font-black text-right truncate max-w-[120px]">
                          {fromLocation || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 py-[1px]">
                        <span className="text-black font-bold">To:</span>
                        <span className="font-black text-right truncate max-w-[120px]">
                          {toLocation || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between py-[1px]">
                        <span className="text-black font-bold">Veh. No:</span>
                        <span className="font-black text-right text-black font-mono truncate max-w-[120px]">
                          {vehicleNumber || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* PARTY DETAILS SECTION */}
                  <div className="grid grid-cols-2 border-b border-black text-[9px] min-h-[70px] w-full">
                    {/* Consignor Details */}
                    <div className="border-r border-black flex flex-col justify-start text-black w-full overflow-hidden">
                      <div className="font-black text-black border-b border-black px-1.5 py-0.5 uppercase text-[9px] w-full">
                        Consignor Details
                      </div>
                      <div className="p-1 flex flex-col gap-0.5 text-black">
                        <div>
                          <span className="font-bold">Name:</span>{" "}
                          <span className="font-semibold text-[9.5px]">{consignorName || "-"}</span>
                        </div>
                        <div className="whitespace-normal break-words text-black">
                          <span className="font-bold">Address:</span>{" "}
                          <span className="font-normal text-[9px]">{consignorAddress || "-"}</span>
                        </div>
                        <div className="text-black">
                          <span className="font-bold">GST:</span>{" "}
                          <span className="font-normal text-[9px] font-mono">
                            {consignorGst || "-"}
                          </span>
                        </div>
                        <div className="text-black">
                          <span className="font-bold">PAN:</span>{" "}
                          <span className="font-normal text-[9px] font-mono">
                            {consignorPan || "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Consignee Details */}
                    <div className="flex flex-col justify-start text-black w-full overflow-hidden">
                      <div className="font-black text-black border-b border-black px-1.5 py-0.5 uppercase text-[9px] w-full">
                        Consignee Details
                      </div>
                      <div className="p-1 flex flex-col gap-0.5 text-black">
                        <div>
                          <span className="font-bold">Name:</span>{" "}
                          <span className="font-semibold text-[9.5px]">{consigneeName || "-"}</span>
                        </div>
                        <div className="whitespace-normal break-words text-black">
                          <span className="font-bold">Address:</span>{" "}
                          <span className="font-normal text-[9px]">{consigneeAddress || "-"}</span>
                        </div>
                        <div className="text-black">
                          <span className="font-bold">GST:</span>{" "}
                          <span className="font-normal text-[9px] font-mono">
                            {consigneeGst || "-"}
                          </span>
                        </div>
                        <div className="text-black">
                          <span className="font-bold">PAN:</span>{" "}
                          <span className="font-normal text-[9px] font-mono">
                            {consigneePan || "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REFERENCES ROW */}
                  <table className="w-full text-[9px] font-bold text-center text-black border-collapse ref-table">
                    <tbody>
                      <tr className="text-black">
                        <td className="py-0.5 w-[22%] text-center font-bold text-black">
                          Demand No:{" "}
                          <span className="font-black text-black">{demandNo || "-"}</span>
                        </td>
                        <td className="py-0.5 w-[22%] text-center font-bold text-black">
                          Shipment No:{" "}
                          <span className="font-black text-black">{shipmentNo || "-"}</span>
                        </td>
                        <td className="py-0.5 w-[26%] text-center font-bold text-black">
                          Cust. No: <span className="font-black text-black">{custNo || "-"}</span>
                        </td>
                        <td className="py-0.5 w-[15%] text-center font-bold text-black">
                          Sch. No: <span className="font-black text-black">{schNo || "-"}</span>
                        </td>
                        <td className="py-0.5 w-[15%] text-center font-bold text-black">
                          Freight:{" "}
                          <span className="font-black text-black uppercase">
                            {freightType || "-"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* GOODS TABLE SECTION */}
                  <div className="flex flex-col flex-1">
                    <table className="w-full text-[9px] border-collapse h-full">
                      <thead>
                        <tr className="bg-slate-100 text-black border-b border-black">
                          <th className="px-1.5 py-1 border-r border-black font-black text-center w-12 text-black bg-transparent">
                            No. of Pkgs
                          </th>
                          <th className="px-1.5 py-1 border-r border-black font-black text-left w-28 text-black bg-transparent">
                            Method of Packing
                          </th>
                          <th className="px-1.5 py-1 border-r border-black font-black text-left w-76 text-black bg-transparent">
                            Description (Said to contain)
                          </th>
                          <th className="px-1.5 py-1 border-r border-black font-black text-right w-20 text-black bg-transparent">
                            Net Wt. (Kg)
                          </th>
                          <th className="px-1.5 py-1 border-r border-black font-black text-right w-20 text-black bg-transparent">
                            Gross Wt. (Kg)
                          </th>
                          <th className="px-1.5 py-1 border-r border-black font-black text-right w-24 text-black bg-transparent">
                            Inv Val (Rs.)
                          </th>
                          <th className="px-1.5 py-1 border-r border-black text-left w-28 text-black bg-transparent">
                            Invoice No.
                          </th>
                          <th className="px-1.5 py-1 border-r border-black text-left w-20 text-black bg-transparent">
                            Gate Pass No
                          </th>
                          <th className="px-1.5 py-1 font-black text-left w-28 text-black bg-transparent print:hidden">
                            Freight Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Render item rows */}
                        {paddedItems.map((item, idx) => (
                          <tr key={idx} className="h-[21px] text-black">
                            <td className="px-1.5 py-0.5 border-r border-black text-center font-bold font-mono text-black">
                              {item.noOfPackages || ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black truncate max-w-[96px] text-black">
                              {item.methodOfPacking || ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black break-words whitespace-normal max-w-[304px] font-semibold text-black">
                              {item.description || ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black text-right font-mono text-black">
                              {item.netWeight ? Number(item.netWeight) : ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black text-right font-mono text-black">
                              {item.grossWeight ? Number(item.grossWeight) : ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black text-right font-mono text-black">
                              {item.invoiceValue
                                ? Number(item.invoiceValue).toLocaleString("en-IN")
                                : ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black truncate max-w-[110px] font-mono text-black">
                              {item.invoiceNoDcNo || ""}
                            </td>
                            <td className="px-1.5 py-0.5 border-r border-black truncate max-w-[80px] font-mono text-black">
                              {item.gatePassNo || ""}
                            </td>
                            <td className="px-1.5 py-0.5 break-words whitespace-normal max-w-[112px] text-black font-mono text-right print:hidden">
                              {item.bookingAmount || ""}
                            </td>
                          </tr>
                        ))}

                        {/* Filler row to stretch the table and draw vertical borders */}
                        <tr className="text-black h-full">
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="border-r border-black"></td>
                          <td className="print:hidden"></td>
                        </tr>

                        {/* Totals row */}
                        <tr className="total-row font-bold border-t-2 border-black h-[22px] text-black">
                          <td className="px-1.5 py-1 border-r border-black text-center font-black font-mono text-[10px] text-black bg-transparent">
                            {totals.packages || 0}
                          </td>
                          <td
                            className="px-1.5 py-1 border-r border-black font-black bg-transparent"
                            colSpan={2}
                          >
                            <span className="text-[10px] uppercase text-black tracking-wider">
                              TOTAL
                            </span>
                          </td>
                          <td className="px-1.5 py-1 border-r border-black text-right font-black font-mono text-[10px] text-black bg-transparent">
                            {totals.netWeight || ""}
                          </td>
                          <td className="px-1.5 py-1 border-r border-black text-right font-black font-mono text-[10px] text-black bg-transparent">
                            {totals.grossWeight || ""}
                          </td>
                          <td className="px-1.5 py-1 border-r border-black text-right font-black font-mono text-[10px] text-black bg-transparent">
                            {totals.invoiceVal.toLocaleString("en-IN")}
                          </td>
                          <td
                            className="px-1.5 py-1 border-r border-black bg-transparent print:hidden"
                            colSpan={3}
                          ></td>
                          <td
                            className="px-1.5 py-1 border-r border-black bg-transparent hidden print:table-cell"
                            colSpan={2}
                          ></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* BOTTOM SIGNATURE SECTION */}
                  <div
                    className="grid grid-cols-[1.5fr_1.2fr_1.8fr] border-t border-black text-[10.5px] min-h-[90px] items-stretch text-black"
                    style={{ pageBreakInside: "avoid" }}
                  >
                    {/* Left signature */}
                    <div className="p-2 pb-4 flex flex-col justify-end border-r border-black text-black">
                      <span className="font-semibold text-black text-[11px]">
                        Signature and Seal of Consignor. &#125;
                      </span>
                    </div>

                    {/* Middle disclaimer */}
                    <div className="p-2 py-3 flex flex-col justify-between items-center text-center border-r border-black text-black">
                      <div className="font-black uppercase text-[11px] text-black">
                        OWNER'S RISK
                      </div>
                      <div className="text-[10px] text-black font-medium">
                        (Not responsible for Breakage, Leakage, Theft and Robbery)
                      </div>
                    </div>

                    {/* Right signature */}
                    <div className="p-2 py-3 flex flex-col justify-between text-center text-black">
                      <div className="font-black text-[11.5px] uppercase text-black">
                        For JRKS DIGITAL INDIA LOGISTICS LLP
                      </div>
                      <div className="h-6"></div> {/* Signature space */}
                      <div className="text-center text-[10px] font-bold text-black">
                        Booking Officer
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
