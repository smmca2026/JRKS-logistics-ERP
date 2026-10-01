import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
  Truck,
  RefreshCw,
  CreditCard,
  Mail,
  ArrowLeft,
  RotateCcw,
  Check,
  Phone,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore, type Booking, type ConsignmentNoteItem } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
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

export const Route = createFileRoute("/_app/booking-entry")({
  validateSearch: (search: Record<string, unknown>) => ({
    editId: (search.editId as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Booking Entry — JRKS Logistics ERP" },
      {
        name: "description",
        content: "Generate, manage, and print Bookings for shipments.",
      },
    ],
  }),
  component: BookingEntryPage,
});

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

function BookingEntryPage() {
  const userRole = typeof window !== "undefined" ? sessionStorage.getItem("userRole") : "admin";

  const { editId } = Route.useSearch();
  const navigate = useNavigate();
  const { bookings, addBooking, updateBooking, deleteBooking, nextBookingNo, consignmentNotes } =
    useOpsStore();
  const { companies, trucks } = useMasterStore();

  const [selectedNote, setSelectedNote] = useState<Booking | null>(null);

  // Refresh master data when page mounts to ensure dropdowns are populated with latest data
  useEffect(() => {
    const mState = useMasterStore.getState();
    if (mState.companies.length === 0 || mState.trucks.length === 0) {
      mState.loadData();
    }
  }, []);

  // Form states
  const branch = "Trichy";
  const [consignmentNoteNo, setConsignmentNoteNo] = useState("JRKS001");
  const [lrNumber, setLrNumber] = useState("1");
  const [lrDate, setLrDate] = useState(""); // empty initially

  const [consignorName, setConsignorName] = useState("");
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consignorGst, setConsignorGst] = useState("");

  const [consigneeName, setConsigneeName] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  const [consigneeGst, setConsigneeGst] = useState("");

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

  const [demurrageDays, setDemurrageDays] = useState<number | "">("");
  const [demurrageRate, setDemurrageRate] = useState<number | "">("");
  const [chargeBasis, setChargeBasis] = useState("");
  const [demurrageRemarks, setDemurrageRemarks] = useState("");

  // Sync editId parameter from URL to selectedNote state
  useEffect(() => {
    if (editId) {
      const matched = bookings.find((n) => String(n.id) === String(editId));
      if (matched) {
        setSelectedNote(matched);
      } else {
        setSelectedNote(null);
      }
    } else {
      setSelectedNote(null);
    }
  }, [editId, bookings]);

  // Auto-generate booking number and LR number on mount or creation reset
  useEffect(() => {
    if (!selectedNote) {
      const count = bookings.length + 1;
      const autoNum = nextBookingNo();
      const autoLr = String(count);
      setConsignmentNoteNo(autoNum);
      setLrNumber(autoLr);
    }
  }, [bookings, selectedNote, nextBookingNo]);

  // Load a selected note into the form view, or reset to empty
  useEffect(() => {
    if (selectedNote) {
      setConsignmentNoteNo(selectedNote.bookingNo);
      setLrNumber(selectedNote.lrNumber || "");
      setLrDate(selectedNote.lrDate || "");
      setConsignorName(selectedNote.consignorName || "");
      setConsignorAddress(selectedNote.consignorAddress || "");
      setConsignorGst(selectedNote.consignorGst || "");
      setConsigneeName(selectedNote.consigneeName || "");
      setConsigneeAddress(selectedNote.consigneeAddress || "");
      setConsigneeGst(selectedNote.consigneeGst || "");
      setInsuranceType(selectedNote.insuranceType || "Owner Risk");
      setFromLocation(selectedNote.fromLocation || "");
      setToLocation(selectedNote.toLocation || "");
      setVehicleNumber(selectedNote.vehicleNumber || "");
      setDemandNo(selectedNote.demandNo || "");
      setShipmentNo(selectedNote.shipmentNo || "");
      setCustNo(selectedNote.custNo || "");
      setSchNo(selectedNote.schNo || "");
      setFreightType(selectedNote.freightType || "To Pay");
      setItems(selectedNote.items || [defaultItemRow()]);
      setDemurrageDays(selectedNote.demurrageDays ?? "");
      setDemurrageRate(selectedNote.demurrageRate ?? "");
      setChargeBasis(selectedNote.chargeBasis || "");
      setDemurrageRemarks(selectedNote.demurrageRemarks || "");
    } else {
      setLrNumber("");
      setLrDate("");
      setConsignorName("");
      setConsignorAddress("");
      setConsignorGst("");
      setConsigneeName("");
      setConsigneeAddress("");
      setConsigneeGst("");
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
      setDemurrageDays("");
      setDemurrageRate("");
      setChargeBasis("");
      setDemurrageRemarks("");
    }
  }, [selectedNote]);

  // Reset form helper
  const handleResetForm = () => {
    navigate({ to: "/booking-entry", search: { editId: undefined } });
    setSelectedNote(null);
    setLrNumber("");
    setLrDate("");
    setConsignorName("");
    setConsignorAddress("");
    setConsignorGst("");
    setConsigneeName("");
    setConsigneeAddress("");
    setConsigneeGst("");
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
    setDemurrageDays("");
    setDemurrageRate("");
    setChargeBasis("");
    setDemurrageRemarks("");
  };

  const cleanLrNumber = (val: string | undefined | null) => {
    if (!val) return "";
    return val
      .toString()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  };

  const matchLr = (a: string | undefined | null, b: string | undefined | null) => {
    const cleanA = cleanLrNumber(a);
    const cleanB = cleanLrNumber(b);
    if (!cleanA || !cleanB) return false;
    return cleanA === cleanB;
  };

  const handleLrChange = (val: string) => {
    setLrNumber(val);
    if (!val.trim()) return;

    const cnNote = consignmentNotes.find((c) => matchLr(c.lrNumber, val));
    if (cnNote) {
      if (cnNote.lrDate) setLrDate(cnNote.lrDate);
      setConsignorName(cnNote.consignorName || "");
      setConsignorAddress(cnNote.consignorAddress || "");
      setConsignorGst(cnNote.consignorGst || "");
      setConsigneeName(cnNote.consigneeName || "");
      setConsigneeAddress(cnNote.consigneeAddress || "");
      setConsigneeGst(cnNote.consigneeGst || "");
      setInsuranceType(cnNote.insuranceType || "Owner Risk");
      setFromLocation(cnNote.fromLocation || "");
      setToLocation(cnNote.toLocation || "");
      setVehicleNumber(cnNote.vehicleNumber || "");
      setDemandNo(cnNote.demandNo || "");
      setShipmentNo(cnNote.shipmentNo || "");
      setCustNo(cnNote.custNo || "");
      setSchNo(cnNote.schNo || "");
      setFreightType(cnNote.freightType || "To Pay");
      setItems(cnNote.items || [defaultItemRow()]);
      setDemurrageDays(cnNote.demurrageDays ?? "");
      setDemurrageRate(cnNote.demurrageRate ?? "");
      setChargeBasis(cnNote.chargeBasis || "");
      setDemurrageRemarks(cnNote.demurrageRemarks || "");
    }
  };

  // Autocomplete Consignor
  const handleSelectConsignor = (name: string) => {
    setConsignorName(name);
    const matched = companies.find((c) => c.consigneeName === name);
    if (matched) {
      setConsignorAddress(matched.address);
      setConsignorGst(matched.gstNumber);
    }
  };

  // Autocomplete Consignee
  const handleSelectConsignee = (name: string) => {
    setConsigneeName(name);
    const matched = companies.find((c) => c.consigneeName === name);
    if (matched) {
      setConsigneeAddress(matched.address);
      setConsigneeGst(matched.gstNumber);
    }
  };

  // Dynamic Item Grid row operations
  const handleAddItemRow = () => {
    setItems([...items, defaultItemRow()]);
  };

  const handleDeleteItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
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

  // Save operation
  const handleSave = async (shouldPrint = false) => {
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

    const payload = {
      bookingNo: consignmentNoteNo,
      branch,
      bookingDate: lrDate,
      lrNumber,
      lrDate,
      consignorName,
      consignorAddress,
      consignorGst,
      consigneeName,
      consigneeAddress,
      consigneeGst,
      insuranceType,
      fromLocation,
      toLocation,
      vehicleNumber,
      demandNo,
      shipmentNo,
      custNo,
      schNo,
      freightType,
      demurrageDays: Number(demurrageDays || 0),
      demurrageRate: Number(demurrageRate || 0),
      chargeBasis,
      demurrageRemarks,
      items,
      // satisfy existing columns requirements
      loadingLocation: fromLocation,
      unloadingLocation: toLocation,
      commissionPaid: false,
      truckOwner:
        companies.find((c) => c.consigneeName === consigneeName)?.contactPerson || "Owner",
      brokerName: "Broker",
      companyName: consigneeName,
      materialDescription: items[0]?.description || "Shipment",
      weight: `${totals.netWeight} MT`,
      hireAmount: 0,
      advanceAmount: 0,
      balanceAmount: 0,
      commissionAmount: 0,
      billAmount: totals.invoiceVal,
      receivedAmount: 0,
      dueDate: lrDate,
      remarks: demurrageRemarks || "",
      status: "Booked" as const,
    };

    let success = false;
    if (selectedNote) {
      try {
        await updateBooking(selectedNote.id, payload);
        success = true;
      } catch (err) {
        success = false;
      }
    } else {
      try {
        const resNo = await addBooking(payload);
        success = !!resNo;
      } catch (err) {
        success = false;
      }
    }

    if (success) {
      if (shouldPrint) {
        setTimeout(() => {
          window.print();
          handleResetForm();
          navigate({ to: "/booking-register" });
        }, 500);
      } else {
        handleResetForm();
        navigate({ to: "/booking-register" });
      }
    } else {
      toast.error("Failed to save Booking. Please verify data.");
    }
  };

  // Print operation
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>
      {/* HIGH FIDELITY LR FORM SHEET */}
      <div className="space-y-6">
        {/* Banner Card */}
        <div className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-6 shadow-sm flex items-center gap-4 print:border-none print:border-b-2 print:border-black print:shadow-none print:p-0 print:pb-4 print:mb-4 print:bg-white print:text-black">
          <img
            src={logo}
            alt="JRKS Logo"
            className="h-32 w-32 object-contain flex-shrink-0"
            style={{ clipPath: "inset(2px 0 0 0)" }}
          />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#1E3A8A] print:text-black">
              JRKS DIGITAL INDIA LOGISTICS LLP
            </h2>
            <p className="text-xs font-bold text-blue-600 leading-none print:text-black">
              (Transport Contractor & Logistics Solutions)
            </p>
            <p className="text-xs font-semibold text-slate-500 leading-tight mt-1.5 whitespace-nowrap print:text-black">
              No.23, 24/1, Main Road, Amman Nagar East, Muneeswaran Kovil Street, Kattur (Post),
              Trichy - 620 019.
            </p>
            <p className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 leading-tight mt-1.5 flex-wrap print:text-black">
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

        <form
          onSubmit={(e) => e.preventDefault()}
          className="w-full bg-white text-slate-900 rounded-lg p-6 text-base pb-28 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black"
        >
          {/* DOCUMENT DETAILS CARD */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6 print:bg-transparent print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-[10px] font-black uppercase tracking-wider text-blue-900">
                LR Number <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={lrNumber}
                onChange={(e) => handleLrChange(e.target.value)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* CARD 1: CONSIGNOR DETAILS */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-extrabold text-blue-900 uppercase text-sm tracking-wider">
                    CONSIGNOR DETAILS
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      Consigner Name <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={consignorName}
                      onValueChange={(val) => handleSelectConsignor(val)}
                    >
                      <SelectTrigger className="w-full mt-1 h-10 border-slate-200 rounded-lg bg-white text-sm font-semibold text-slate-800">
                        <SelectValue placeholder="Select Consignor" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.consigneeName}>
                            {c.consigneeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={consignorAddress}
                      onChange={(e) => setConsignorAddress(e.target.value)}
                      placeholder="Address"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2.5 font-medium resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      GST <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={consignorGst}
                      onChange={(e) => setConsignorGst(e.target.value)}
                      placeholder="Enter GST Number"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-base font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
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
                  <span className="font-extrabold text-blue-900 uppercase text-sm tracking-wider">
                    CONSIGNEE DETAILS
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      Consignee Name <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={consigneeName}
                      onValueChange={(val) => handleSelectConsignee(val)}
                    >
                      <SelectTrigger className="w-full mt-1 h-10 border-slate-200 rounded-lg bg-white text-sm font-semibold text-slate-800">
                        <SelectValue placeholder="Select Consignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.consigneeName}>
                            {c.consigneeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={consigneeAddress}
                      onChange={(e) => setConsigneeAddress(e.target.value)}
                      placeholder="Address"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg p-2.5 font-medium resize-none focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      GST <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={consigneeGst}
                      onChange={(e) => setConsigneeGst(e.target.value)}
                      placeholder="Enter GST Number"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-base font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
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
                  <span className="font-extrabold text-blue-900 uppercase text-sm tracking-wider">
                    INSURANCE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal mb-4">
                  The customer has stated that he has not insured the consignment OR He has insured
                  the consignment. At Owner's risk / Carrier's risk.
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
                  <span className="font-extrabold text-blue-900 uppercase text-sm tracking-wider">
                    OTHER DETAILS
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      From <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      placeholder="From"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      To <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      placeholder="To"
                      className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-base font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-700">
                      Veh. No. <span className="text-red-500">*</span>
                    </label>
                    <Select value={vehicleNumber} onValueChange={setVehicleNumber}>
                      <SelectTrigger className="w-full mt-1 h-10 border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-800">
                        <SelectValue placeholder="Select Vehicle" />
                      </SelectTrigger>
                      <SelectContent>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 text-sm">
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
                className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 font-semibold text-slate-805 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-blue-900"
              />
            </div>
            <div className="flex flex-col justify-center">
              <label className="block text-sm font-bold text-blue-700 uppercase tracking-wider mb-2">
                Freight Payable By
              </label>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-900">
                <label className="flex items-center gap-1.5 cursor-pointer">
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
                <label className="flex items-center gap-1.5 cursor-pointer">
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
                <label className="flex items-center gap-1.5 cursor-pointer">
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
                  <th className="px-2 py-2.5 border-r border-blue-800/40 text-center w-12 text-white">
                    S.No.
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 text-center w-24 text-white">
                    No. of Packages
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 w-40 text-white">
                    Method of Packing
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 w-64 text-white">
                    Description (Said to contain)
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 text-right w-28 text-white">
                    Net. Weight (Kg.)
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 text-right w-28 text-white">
                    Gross Weight (Kg.)
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 text-right w-32 text-white">
                    Invoice Value (Rs.)
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 w-44 text-white">
                    Invoice No. / DC No.
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 w-44 text-white">
                    Gate Pass No.
                  </th>
                  <th className="px-3 py-2.5 border-r border-blue-800/40 w-52 text-white">
                    Remarks
                  </th>
                  <th className="px-3 py-2.5 text-center w-12 print:hidden text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {items.map((item, index) => (
                  <tr key={index} className="align-middle">
                    <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-700 w-12">
                      {index + 1}
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={item.noOfPackages || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          handleUpdateItemField(index, "noOfPackages", val ? Number(val) : "");
                        }}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-center font-bold text-slate-800 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.methodOfPacking}
                        onChange={(e) =>
                          handleUpdateItemField(index, "methodOfPacking", e.target.value)
                        }
                        placeholder="e.g. Box, Bag, Carton"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateItemField(index, "description", e.target.value)
                        }
                        placeholder="Enter Description"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-semibold text-slate-805 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.001"
                        value={item.netWeight || ""}
                        onChange={(e) =>
                          handleUpdateItemField(index, "netWeight", Number(e.target.value))
                        }
                        placeholder="0.000"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-right font-semibold font-mono text-slate-800 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="number"
                        step="0.001"
                        value={item.grossWeight || ""}
                        onChange={(e) =>
                          handleUpdateItemField(index, "grossWeight", Number(e.target.value))
                        }
                        placeholder="0.000"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-right font-semibold font-mono text-slate-855 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={item.invoiceValue || ""}
                          onChange={(e) =>
                            handleUpdateItemField(index, "invoiceValue", Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full bg-white border border-slate-200 rounded pl-6 pr-2 py-1.5 text-right font-semibold font-mono text-slate-800 focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.invoiceNoDcNo}
                        onChange={(e) =>
                          handleUpdateItemField(index, "invoiceNoDcNo", e.target.value)
                        }
                        placeholder="Enter Invoice / DC No."
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono text-xs text-slate-800 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.gatePassNo}
                        onChange={(e) => handleUpdateItemField(index, "gatePassNo", e.target.value)}
                        placeholder="Enter Gate Pass No."
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 font-mono text-xs text-slate-805 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleUpdateItemField(index, "remarks", e.target.value)}
                        placeholder="Enter Remarks"
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-blue-900"
                      />
                    </td>
                    <td className="p-1.5 text-center print:hidden">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItemRow(index)}
                        disabled={items.length === 1}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Totals Row */}
                <tr className="bg-[#f0f4fc] font-extrabold text-[11px] text-slate-800 border-t border-slate-200">
                  <td className="px-2 py-3 border-r border-slate-200"></td>
                  <td className="px-3 py-3 border-r border-slate-200 text-center">
                    {totals.packages}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-900" />
                    <span>TOTAL</span>
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200"></td>
                  <td className="px-3 py-3 border-r border-slate-200 text-right font-mono tabular-nums">
                    {totals.netWeight.toFixed(3)}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200 text-right font-mono tabular-nums">
                    {totals.grossWeight.toFixed(3)}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200 text-right font-mono tabular-nums">
                    {inr(totals.invoiceVal)}
                  </td>
                  <td className="px-3 py-3 border-r border-slate-200"></td>
                  <td className="px-3 py-3 border-r border-slate-200"></td>
                  <td className="px-3 py-3 border-r border-slate-200"></td>
                  <td className="px-3 py-3 print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Add package button */}
          <div className="p-3 flex justify-end print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={handleAddItemRow}
              className="h-10 border-blue-600 text-blue-600 hover:bg-blue-50/50 rounded-lg shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4 text-blue-600" />
              Add Package Row
            </Button>
          </div>

          {/* Demurrage Section */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mt-6">
            <div className="flex items-center gap-2 pb-2 mb-4 border-b border-slate-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-900">
                <Clock className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-blue-900 uppercase text-sm tracking-wider">
                DEMURRAGE DETAILS
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Demurrage Chargeable After (Days)
                </label>
                <input
                  type="number"
                  value={demurrageDays}
                  onChange={(e) =>
                    setDemurrageDays(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Enter Days"
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-805 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Demurrage Rate (₹ / Day)
                </label>
                <input
                  type="number"
                  value={demurrageRate}
                  onChange={(e) =>
                    setDemurrageRate(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Enter Rate"
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-805 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Charge Basis
                </label>
                <Select value={chargeBasis} onValueChange={setChargeBasis}>
                  <SelectTrigger className="w-full mt-1 h-10 border-slate-200 rounded-lg">
                    <SelectValue placeholder="[ Select ]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Per Quintal (Qt.)">Per Quintal (Qt.)</SelectItem>
                    <SelectItem value="Weight Charged">Weight Charged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider">
                  Remarks
                </label>
                <input
                  type="text"
                  value={demurrageRemarks}
                  onChange={(e) => setDemurrageRemarks(e.target.value)}
                  placeholder="Enter Remarks"
                  className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-805 placeholder-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>
            </div>
            {/* Action buttons at the bottom - Sticky bar */}
            <div className="fixed bottom-0 left-0 lg:left-[254.5px] right-0 z-20 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3.5 px-6 flex items-center justify-end shadow-lg gap-3 print:hidden">
              <button
                type="button"
                onClick={handleResetForm}
                className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3156cd] text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
              >
                <RotateCcw className="h-4.5 w-4.5" /> Clear Form
              </button>
              <button
                type="button"
                onClick={() => navigate({ to: "/booking-register" })}
                className="flex items-center gap-2 bg-[#4169E1] hover:bg-[#3156cd] text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-sm transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" /> Back
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="flex items-center gap-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-[13px] tracking-wider uppercase px-8 py-3.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <Check className="h-4 w-4" /> Save Booking Note
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
