import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Trash2,
  FileText,
  Clock,
  Package,
  User,
  MapPin,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/export";

export const Route = createFileRoute("/_app/consignment-view")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "View Consignment — JRKS Logistics ERP" },
      { name: "description", content: "Full details of a Lorry Receipt (LR)." },
    ],
  }),
  component: ConsignmentViewPage,
});

/* ── helpers ────────────────────────────────────────── */
function Field({
  label,
  value,
  mono = false,
  important = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  important?: boolean;
}) {
  const isLongText =
    label.toLowerCase().includes("address") ||
    label.toLowerCase().includes("description") ||
    label.toLowerCase().includes("remarks");

  const isHighlight =
    label.toLowerCase().includes("weight") ||
    label.toLowerCase().includes("value") ||
    label.toLowerCase().includes("amount") ||
    label.toLowerCase().includes("hire") ||
    label.toLowerCase().includes("advance") ||
    label.toLowerCase().includes("fine") ||
    label.toLowerCase().includes("vehicle") ||
    label.toLowerCase().includes("lr no") ||
    label.toLowerCase().includes("lr number");

  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <p className="text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider leading-none mb-1.5">
        {label}
      </p>
      <p
        className={`break-words ${isHighlight ? "text-[21px] font-bold text-slate-900" : important ? "text-[18px] font-semibold text-slate-900" : "text-[16px] font-semibold text-slate-800"} ${mono ? "font-mono font-bold" : ""} ${isLongText ? "leading-[1.75]" : "leading-relaxed"}`}
      >
        {value !== undefined && value !== null && value !== "" ? String(value) : "—"}
      </p>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
          {icon}
        </div>
        <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

import { getIsAdmin } from "@/lib/auth";

/* ── page ───────────────────────────────────────────── */
function ConsignmentViewPage() {
  const isAdmin = getIsAdmin();

  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { consignmentNotes, deleteConsignmentNote, bookings, moneyReceipts, loadData } = useOpsStore();
  const { companies } = useMasterStore();

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const matchLr = (a?: string | null, b?: string | null) => {
    if (!a || !b) return false;
    const cleanA = a.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanB = b.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cleanA === cleanB && cleanA.length > 0;
  };

  const rawNote = consignmentNotes.find((n) => String(n.id) === String(id));

  if (!rawNote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-slate-200" />
        <p className="text-lg font-semibold text-slate-500">Consignment record not found.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/consignment-records" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Records
        </Button>
      </div>
    );
  }

  // Fallback lookup from matching booking if any fields are missing
  const matchedBooking = bookings.find(
    (b) =>
      matchLr(b.lrNo, rawNote.lrNumber) ||
      matchLr(b.lrNumber, rawNote.lrNumber) ||
      matchLr(b.bookingNo, rawNote.consignmentNoteNo) ||
      matchLr(b.lrNo, rawNote.consignmentNoteNo),
  );

  const targetLr = (rawNote.lrNumber || rawNote.consignmentNoteNo || "").trim().toLowerCase();
  const isLocked = Boolean(
    rawNote.isLocked === 1 ||
    rawNote.isLocked === true ||
    String(rawNote.isLocked) === "1" ||
    (targetLr &&
      moneyReceipts.some((mr) => {
        const mrLr = (mr.lrNo || "").toLowerCase().trim();
        if (
          mrLr &&
          (mrLr === targetLr || mrLr.split(/[,;\s]+/).map((s) => s.trim()).includes(targetLr))
        )
          return true;
        const items = Array.isArray(mr.items) ? mr.items : [];
        return items.some(
          (it: any) =>
            (it.lrNo || "").toLowerCase().trim() === targetLr ||
            (it.lrNo || "")
              .toLowerCase()
              .split(/[,;\s]+/)
              .map((s: string) => s.trim())
              .includes(targetLr),
        );
      }))
  );

  const note = {
    ...rawNote,
    isLocked,
    consigneeName: rawNote.consigneeName || matchedBooking?.consigneeName || "",
    consigneeAddress: rawNote.consigneeAddress || matchedBooking?.consigneeAddress || "",
    consigneeGst: rawNote.consigneeGst || matchedBooking?.consigneeGst || "",
    consignorName: rawNote.consignorName || matchedBooking?.consignorName || "",
    consignorAddress: rawNote.consignorAddress || matchedBooking?.consignorAddress || "",
    consignorGst: rawNote.consignorGst || matchedBooking?.consignorGst || "",
    vehicleNumber: rawNote.vehicleNumber || matchedBooking?.vehicleNumber || "",
    fromLocation: rawNote.fromLocation || matchedBooking?.loadingLocation || matchedBooking?.fromLocation || "",
    toLocation: rawNote.toLocation || matchedBooking?.unloadingLocation || matchedBooking?.toLocation || "",
  };

  const totals = (note.items ?? []).reduce(
    (acc, item) => ({
      packages: acc.packages + Number(item.noOfPackages || 0),
      netWeight: acc.netWeight + Number(item.netWeight || 0),
      grossWeight: acc.grossWeight + Number(item.grossWeight || 0),
      invoiceValue: acc.invoiceValue + Number(item.invoiceValue || 0),
    }),
    { packages: 0, netWeight: 0, grossWeight: 0, invoiceValue: 0 },
  );

  const handleDelete = () => {
    if (note.isLocked) {
      toast.error(`Cannot delete LR #${note.lrNumber} because a Money Receipt has already been generated for it.`);
      return;
    }
    if (confirm("Are you sure you want to delete this LR? This cannot be undone.")) {
      deleteConsignmentNote(note.id);
      toast.success("LR deleted successfully.");
      navigate({ to: "/consignment-records" });
    }
  };

  // Fallback lookup from companies master list for Consignor/Consignee PAN if empty
  let consignorPan = note.consignorPan || "";
  if (!consignorPan && note.consignorName) {
    const comp = companies.find((c) => c.consigneeName.toLowerCase() === note.consignorName.toLowerCase());
    if (comp) consignorPan = comp.panNumber || "";
  }

  let consigneePan = note.consigneePan || "";
  if (!consigneePan && note.consigneeName) {
    const comp = companies.find((c) => c.consigneeName.toLowerCase() === note.consigneeName.toLowerCase());
    if (comp) consigneePan = comp.panNumber || "";
  }

  return (
    <div className="w-full space-y-4">
      {/* ── Action bar ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 text-[14px] font-semibold -ml-2 gap-1.5"
          onClick={() => navigate({ to: "/consignment-records" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={`h-12 px-6 text-[16px] font-bold rounded-xl shadow-sm gap-2 ${note.isLocked ? 'border-amber-400 text-amber-700 hover:bg-amber-50' : 'border-amber-500 text-amber-600 hover:bg-amber-50'}`}
            onClick={() => navigate({ to: "/consignment-note", search: { editId: note.id } })}
          >
            {note.isLocked ? <Lock className="h-4 w-4 text-amber-700" /> : <Pencil className="h-4 w-4" />}
            {note.isLocked ? "View LR (Locked)" : "Edit"}
          </Button>

          <Button
            variant="outline"
            disabled={note.isLocked}
            className={`h-12 px-6 text-[16px] font-bold rounded-xl shadow-sm gap-2 ${note.isLocked ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-red-400 text-red-600 hover:bg-red-50 cursor-pointer'}`}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* ── Hero banner ────────────────────────────── */}
      <div className="w-full rounded-2xl bg-[#0f3b8c] px-6 py-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-blue-300 uppercase tracking-widest font-bold">
              Lorry Receipt
            </p>
            {note.isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                <Lock className="h-3 w-3" /> Locked (MR Generated)
              </span>
            )}
          </div>
          <h1 className="text-[34px] font-bold text-white mt-1 leading-none">
            LR — <span className="text-yellow-300 font-mono">{note.lrNumber}</span>
          </h1>
          <p className="text-sm text-blue-200 mt-1.5 font-medium">
            {note.branch} Branch &nbsp;·&nbsp; {formatDate(note.lrDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            ["Consignee", note.consigneeName],
            ["Vehicle", note.vehicleNumber],
            ["Freight", note.freightType],
            ["Insurance", note.insuranceType],
          ].map(([lbl, val]) => (
            <div key={lbl} className="bg-white/10 rounded-xl px-5 py-3 text-white min-w-[130px]">
              <p className="text-[12px] text-blue-200 uppercase tracking-wider font-semibold">
                {lbl}
              </p>
              <p className="text-[16px] font-bold font-mono mt-1">{val || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 1: Consignor | Consignee | Route (3 equal cols) ─ */}
      <div className="grid grid-cols-3 gap-4 w-full">
        <Card title="Consignor Details" icon={<User className="h-4 w-4" />}>
          <Field label="Consignor Name" value={note.consignorName} important />
          <Field label="Address" value={note.consignorAddress} />
          <Field label="GST Number" value={note.consignorGst} mono important />
          <Field label="PAN Number" value={consignorPan} mono />
        </Card>

        <Card title="Consignee Details" icon={<User className="h-4 w-4" />}>
          <Field label="Consignee Name" value={note.consigneeName} important />
          <Field label="Vehicle Number" value={note.vehicleNumber} mono important />
          <Field label="Address" value={note.consigneeAddress} />
          <Field label="GST Number" value={note.consigneeGst} mono important />
          <Field label="PAN Number" value={consigneePan} mono />
        </Card>

        <Card title="Route & Logistics" icon={<MapPin className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="From" value={note.fromLocation} important />
            <Field label="To" value={note.toLocation} important />
            <Field label="Vehicle No." value={note.vehicleNumber} mono important />
            <Field label="Consignment No." value={note.consignmentNoteNo} important />
            <Field label="SAC Code" value={note.sac} mono important />
            <Field label="Freight Type" value={note.freightType} important />
            <Field label="Insurance" value={note.insuranceType} important />
            <Field label="Demand No." value={note.demandNo} />
            <Field label="Shipment No." value={note.shipmentNo} />
            <Field label="Customer No." value={note.custNo} />
            <Field label="Schedule No." value={note.schNo} />
          </div>
        </Card>
      </div>

      {/* ── Row 2: Goods Details – vertical item cards ────── */}
      {note.items && note.items.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
              Goods Details
            </span>
          </div>

          {/* Item cards grid: 2 per row (or 3 if many items) */}
          <div className="p-4 grid grid-cols-2 gap-3">
            {note.items.map((item, idx) => (
              <div key={idx} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                {/* Item header */}
                <p className="text-[13px] font-semibold text-white bg-[#0f3b8c] rounded-md px-2.5 py-1 inline-block mb-2 uppercase tracking-wider">
                  Item #{idx + 1}
                </p>
                {/* 3-column field grid per item */}
                <div className="grid grid-cols-3 gap-x-4">
                  <Field label="No. of Packages" value={item.noOfPackages} important />
                  <Field label="Method of Packing" value={item.methodOfPacking} />
                  <Field label="Description" value={item.description} />
                  <Field
                    label="Net Weight (Kg)"
                    value={item.netWeight ? Number(item.netWeight).toFixed(3) : "—"}
                    mono
                    important
                  />
                  <Field
                    label="Gross Weight (Kg)"
                    value={item.grossWeight ? Number(item.grossWeight).toFixed(3) : "—"}
                    mono
                    important
                  />
                  <Field
                    label="Invoice Value (₹)"
                    value={
                      item.invoiceValue
                        ? "₹" + Number(item.invoiceValue).toLocaleString("en-IN")
                        : "—"
                    }
                    mono
                    important
                  />
                  <Field label="Invoice No / DC No." value={item.invoiceNoDcNo} mono />
                  <Field label="Gate Pass No." value={item.gatePassNo} mono />
                  <Field
                    label="Freight Amount (₹)"
                    value={item.bookingAmount ? "₹" + item.bookingAmount : "—"}
                    mono
                    important
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Totals strip */}
          <div className="border-t border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-[15px] font-bold text-blue-900 uppercase tracking-wider mb-3">
              Totals
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                ["Total Packages", String(totals.packages), false],
                ["Total Net Weight", totals.netWeight.toFixed(3) + " Kg", true],
                ["Total Gross Weight", totals.grossWeight.toFixed(3) + " Kg", true],
                ["Total Invoice Value", "₹" + totals.invoiceValue.toLocaleString("en-IN"), true],
              ].map(([lbl, val, mono]) => (
                <div
                  key={lbl as string}
                  className="bg-white rounded-lg px-3 py-2 border border-blue-100 text-center shadow-sm"
                >
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                    {lbl}
                  </p>
                  <p
                    className={`text-[24px] font-bold text-blue-900 mt-1.5 leading-none ${mono ? "font-mono font-black" : ""}`}
                  >
                    {val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Vehicle Dimensions (3-col, only if data) ───────── */}
      {(note.vehicleLength || note.vehicleWidth || note.vehicleHeight) && (
        <Card title="Vehicle Dimensions" icon={<Package className="h-4 w-4" />}>
          <div className="grid grid-cols-4 gap-x-6">
            <Field label="Length (L)" value={note.vehicleLength} important />
            <Field label="Width (B)" value={note.vehicleWidth} important />
            <Field label="Height (H)" value={note.vehicleHeight} important />
          </div>
        </Card>
      )}
    </div>
  );
}
