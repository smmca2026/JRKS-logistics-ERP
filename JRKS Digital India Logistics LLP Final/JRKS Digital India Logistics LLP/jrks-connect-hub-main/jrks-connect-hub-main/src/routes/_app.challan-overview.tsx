import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Trash2,
  FileText,
  User,
  MapPin,
  Package,
  DollarSign,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/challan-overview")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "View Challan — JRKS Logistics ERP" },
      { name: "description", content: "Full details of a Challan Note." },
    ],
  }),
  component: ChallanOverviewPage,
});

/* ── helpers ────────────────────────────────────────── */
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
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

const formatCurrency = (val: number) => {
  return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

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
    label.toLowerCase().includes("remarks") ||
    label.toLowerCase().includes("particulars");

  const isHighlight =
    label.toLowerCase().includes("freight") ||
    label.toLowerCase().includes("mamul") ||
    label.toLowerCase().includes("comly") ||
    label.toLowerCase().includes("fine") ||
    label.toLowerCase().includes("charges") ||
    label.toLowerCase().includes("tds") ||
    label.toLowerCase().includes("advance") ||
    label.toLowerCase().includes("commission") ||
    label.toLowerCase().includes("balance") ||
    label.toLowerCase().includes("amount") ||
    label.toLowerCase().includes("weight") ||
    label.toLowerCase().includes("vehicle") ||
    label.toLowerCase().includes("challan number");

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
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
          {icon}
        </div>
        <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="px-5 py-2 bg-white flex-1">{children}</div>
    </div>
  );
}

import { getIsAdmin } from "@/lib/auth";
import { Lock } from "lucide-react";

/* ── page ───────────────────────────────────────────── */
function ChallanOverviewPage() {
  const isAdmin = getIsAdmin();

  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { challans, deleteChallan, moneyReceipts } = useOpsStore();

  const c = challans.find((x) => String(x.id) === String(id));

  const isLocked = React.useMemo(() => {
    if (!c) return false;
    if (c.isLocked === 1 || c.isLocked === true || String(c.isLocked) === "1") {
      return true;
    }
    const chNos = [c.challanNo, c.manualChallanNo]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase().trim());
    const itemLrNos = (Array.isArray(c.items) ? c.items : [])
      .map((it: any) => String(it.cnNo || it.lrNo || "").toLowerCase().trim())
      .filter(Boolean);
    const allRefs = [...chNos, ...itemLrNos];

    return (moneyReceipts || []).some((mr) => {
      const mrLr = String(mr.lrNo || "").toLowerCase().trim();
      if (
        mrLr &&
        allRefs.some((ref) => ref && (mrLr === ref || mrLr.includes(ref) || ref.includes(mrLr)))
      ) {
        return true;
      }
      const mrItems = JSON.stringify(mr.items || []).toLowerCase();
      if (allRefs.some((ref) => ref && mrItems.includes(ref))) {
        return true;
      }
      return false;
    });
  }, [c, moneyReceipts]);

  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-slate-200" />
        <p className="text-lg font-semibold text-slate-500">Challan record not found.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/challan-records" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Records
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (isLocked) {
      toast.error(
        `Cannot delete Challan (${c.manualChallanNo || c.challanNo}) because a Money Receipt has already been generated for it.`,
      );
      return;
    }
    if (confirm(`Are you sure you want to delete Challan with LR Number ${c.challanNo}?`)) {
      deleteChallan(c.id);
      toast.success("Challan deleted successfully.");
      navigate({ to: "/challan-records" });
    }
  };

  return (
    <div className="w-full space-y-4" style={{ zoom: 1.1 }}>
      {/* ── Action bar ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 text-[14px] font-semibold -ml-2 gap-1.5"
          onClick={() => navigate({ to: "/challan-records" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-12 px-6 text-[16px] font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm gap-2"
            onClick={() => navigate({ to: "/challan-note", search: { id: c.id } })}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              disabled={isLocked}
              className={`h-12 px-6 text-[16px] font-bold rounded-xl shadow-sm gap-2 ${isLocked ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* ── Hero banner ────────────────────────────── */}
      <div className="w-full rounded-2xl bg-[#0f3b8c] px-6 py-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-blue-300 uppercase tracking-widest font-bold">
              Challan Note details
            </p>
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-amber-950 shadow-sm">
                <Lock className="h-3 w-3" /> Locked (MR Generated)
              </span>
            )}
          </div>
          <h1 className="text-[34px] font-bold text-white mt-1 leading-none">
            Challan No —{" "}
            <span className="text-yellow-300 font-mono">{c.manualChallanNo || "—"}</span>
          </h1>
          <p className="text-sm text-blue-200 mt-1.5 font-medium">
            LR No: {c.challanNo} &nbsp;·&nbsp; Date: {formatDate(c.challanDate)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white/10 rounded-xl px-5 py-3 text-white min-w-[120px]">
            <p className="text-[12px] text-blue-200 uppercase tracking-wider font-semibold">
              Status
            </p>
            <p className="text-[16px] font-bold mt-1">{c.status || "—"}</p>
          </div>
          {[
            ["Vehicle", c.vehicleNumber],
            ["Broker Name", c.brokerName || "—"],
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

      {/* ── Row 1: Challan Info | Owner Details | Broker Details (3 cols) ─ */}
      <div className="grid grid-cols-3 gap-4 w-full">
        <Card title="1. Challan Information" icon={<FileText className="h-4 w-4" />}>
          <Field label="Challan No" value={c.manualChallanNo} important />
          <Field label="LR Number" value={c.challanNo} important />
          <Field label="Challan Date" value={formatDate(c.challanDate)} />
          <Field label="From Location" value={c.fromLocation} important />
          <Field label="To Location" value={c.toLocation} important />
          <Field label="Vehicle Number" value={c.vehicleNumber} mono important />
        </Card>

        <Card title="3. Owner Details" icon={<User className="h-4 w-4" />}>
          <Field label="Owner Name" value={c.ownerName} important />
          <Field label="PAN Card Number" value={c.ownerPan} mono />
          <Field label="Aadhaar Number" value={c.ownerAadhar} mono />
          <Field label="Account Number" value={c.ownerAccount} mono />
          <Field label="Mobile Number" value={c.ownerMobile} />
          <Field label="Declaration Attached" value={c.declarationAttached || "No"} />
          <Field label="Driver Name" value={c.driverName} />
          <Field label="Driver Mobile" value={c.driverMobile} />
          <Field
            label="Vehicle Dimensions"
            value={`L: ${c.dimLength || "—"}  B: ${c.dimWidth || "—"}  H: ${c.dimHeight || "—"}`}
          />
        </Card>

        <Card title="4. Broker Details" icon={<Handshake className="h-4 w-4" />}>
          <Field label="Broker Name" value={c.brokerName} important />
          <Field label="PAN Card Number" value={c.brokerPan} mono />
          <Field label="Aadhaar Number" value={c.brokerAadhar} mono />
          <Field label="Account Number" value={c.brokerAccount} mono />
          <Field label="Mobile Number" value={c.brokerMobile} />
          <Field label="Payable At" value={c.payableAt} />
          <Field label="Broker Name (Sec 5)" value={c.brokerNameSec5} />
        </Card>
      </div>

      {/* ── Row 1.5: Delivery Commission ────── */}
      {(c.deliveryToName || c.deliveryToPan || c.deliveryToMobile || c.deliveryCommission) && (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <User className="h-4 w-4" />
            </div>
            <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
              Delivery To Details
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-4 gap-5">
            <Field label="Delivery To Name" value={c.deliveryToName} important />
            <Field label="PAN Card Number" value={c.deliveryToPan} mono />
            <Field label="Mobile Number" value={c.deliveryToMobile} />
            <Field
              label="Delivery Commission"
              value={c.deliveryCommission ? formatCurrency(c.deliveryCommission) : "—"}
              important
            />
          </div>
        </div>
      )}

      {/* ── Row 2: Particulars Table ────── */}
      {c.items && c.items.length > 0 && (
        <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
              2. Particulars details
            </span>
          </div>

          <div className="p-4">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3.5 text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider w-[15%]">
                      LR Number
                    </th>
                    <th className="px-4 py-3.5 text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider text-center w-[15%]">
                      No. of Packages
                    </th>
                    <th className="px-4 py-3.5 text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider w-[48%]">
                      Particulars
                    </th>
                    <th className="px-4 py-3.5 text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider text-right w-[12%]">
                      Weight
                    </th>
                    <th className="px-4 py-3.5 text-[14px] font-medium text-[#1E3A8A] uppercase tracking-wider w-[10%]">
                      Destination
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {c.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3.5 font-mono text-[16px] font-semibold text-blue-900">
                        {item.cnNo}
                      </td>
                      <td className="px-4 py-3.5 text-[16px] font-semibold text-slate-800 text-center">
                        {item.noOfPackages}
                      </td>
                      <td className="px-4 py-3.5 text-[16px] font-semibold text-slate-800">
                        {item.particulars}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[18px] font-bold text-slate-900 text-right">
                        {item.weight}
                      </td>
                      <td className="px-4 py-3.5 text-[16px] font-semibold text-slate-800">
                        {item.destination}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Financial Details ────── */}
      <div className="w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
            <DollarSign className="h-4 w-4" />
          </div>
          <span className="text-[20px] font-semibold text-blue-900 uppercase tracking-wider">
            Financial Details
          </span>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <Field label="Lorry Hire" value={formatCurrency(c.lorryHire || 0)} />
          <Field label="Loading Mamul" value={formatCurrency(c.loadingMamul)} />
          <Field label="CHALLAN MAMUL" value={formatCurrency(c.comlyCom || 0)} />
          <Field label="RTO Fine" value={formatCurrency(c.rtoFine)} />
          <Field label="Extra Charges" value={formatCurrency(c.extraCharges)} />
          <Field label="TDS Percentage" value={c.tdsPercentage || "—"} />
          <Field label="Less Advance" value={formatCurrency(c.lessAdvance)} />
          <Field label="Balance Amount" value={formatCurrency(c.balanceAmount)} important />
          <Field label="Payable At" value={c.payableAt || "—"} />
        </div>
        {c.narration && (
          <div className="px-5 pb-5">
            <Field label="Narration" value={c.narration} />
          </div>
        )}
      </div>
    </div>
  );
}
