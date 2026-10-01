import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Printer, Trash2, FileText, ClipboardList } from "lucide-react";
import { toast } from "sonner";

import { useOpsStore, type ArrivalReport } from "@/lib/ops-store";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/arrival-view")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "View Arrival Report — JRKS Logistics ERP" },
      { name: "description", content: "Full details of an Arrival Report." },
    ],
  }),
  component: ArrivalOverviewPage,
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

/* ── helpers ────────────────────────────────────────── */
function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "—";
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

function Field({ label, value, mono = false, important = false }: any) {
  if (!value) return null;
  return (
    <div className="flex flex-col py-2 border-b border-slate-100 last:border-0">
      <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
      <span
        className={`mt-1.5 text-[18px] leading-snug break-words ${important ? "font-black text-blue-900" : "font-extrabold text-slate-800"} ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
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

function ArrivalOverviewPage() {
  const isAdmin = getIsAdmin();

  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const { arrivalReports, deleteArrivalReport, loadData, consignmentNotes, challans, moneyReceipts } =
    useOpsStore();

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const report = arrivalReports.find((x) => String(x.arrival_report_id) === String(id));

  const isLocked = React.useMemo(() => {
    if (!report) return false;
    if (
      (report as any).isLocked === 1 ||
      (report as any).isLocked === true ||
      String((report as any).isLocked) === "1"
    ) {
      return true;
    }
    const checkLr = report.lr_no || report.bill_no || report.mr_no || report.arrival_report_no || "";
    if (!checkLr) return false;
    const lrClean = String(checkLr).toLowerCase().trim();
    return (moneyReceipts || []).some((mr) => {
      const mrLr = String(mr.lrNo || "").toLowerCase().trim();
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
  }, [report, moneyReceipts]);

  // Auto-lookup matching consignment and challan details for display
  const cnNote = React.useMemo(() => {
    if (!report) return null;
    const lrNo = report.lr_no || report.bill_no;
    if (!lrNo) return null;
    return consignmentNotes.find((c) => matchLr(c.lrNumber, lrNo));
  }, [report, consignmentNotes]);

  const ch = React.useMemo(() => {
    if (!report) return null;
    const lrNo = report.lr_no || report.bill_no;
    if (!lrNo) return null;
    return challans.find((c) => c.items?.some((item) => matchLr(item.cnNo, lrNo)));
  }, [report, challans]);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-slate-200" />
        <p className="text-lg font-semibold text-slate-500">Arrival Report not found.</p>
        <Button
          className="bg-[#4169E1] hover:bg-[#3156cd] text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl h-10 shadow-sm gap-2"
          onClick={() => navigate({ to: "/arrival-records" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Button>
      </div>
    );
  }

  const refConsignor = cnNote?.consignorName || "—";
  const refConsignee = cnNote?.consigneeName || "—";
  const refFromLocation = cnNote?.fromLocation || "—";
  const refToLocation = cnNote?.toLocation || "—";
  const refVehicleNumber = cnNote?.vehicleNumber || ch?.vehicleNumber || "—";
  const refDriverName = ch?.driverName || "—";
  const refNoOfPackages =
    cnNote?.items?.reduce((sum, item) => sum + Number(item.noOfPackages || 0), 0) || "—";
  const refFreightAmount = ch?.freight ? `Rs. ${ch.freight}` : "—";
  const refBalanceAmount = report.balance_amount
    ? `Rs. ${report.balance_amount}`
    : ch?.balanceAmount !== undefined && ch?.balanceAmount !== null
      ? `Rs. ${ch.balanceAmount}`
      : "—";

  const handleDelete = () => {
    if (isLocked) {
      toast.error(
        `Cannot delete Arrival Report (${report.arrival_report_no || report.bill_no || report.lr_no}) because a Money Receipt has already been generated for it.`,
      );
      return;
    }
    if (
      confirm(
        `Are you sure you want to delete Arrival Report for Report No ${report.arrival_report_no || report.bill_no}?`,
      )
    ) {
      deleteArrivalReport(report.arrival_report_id);
      toast.success("Arrival report deleted successfully.");
      navigate({ to: "/arrival-records" });
    }
  };

  const handlePrint = () => {
    navigate({ to: "/arrival-report", search: { id: report.arrival_report_id, print: "true" } });
  };

  return (
    <div className="w-full space-y-4" style={{ zoom: 1.1 }}>
      {/* ── Action bar ─────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button
          variant="ghost"
          className="text-slate-500 hover:text-slate-800 text-[14px] font-semibold -ml-2 gap-1.5"
          onClick={() => navigate({ to: "/arrival-records" })}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Records
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-12 px-6 text-[16px] font-bold border-blue-200 text-[#0f3b8c] hover:bg-blue-50 rounded-xl shadow-sm gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" /> Print
          </Button>

          <Button
            variant="outline"
            className="h-12 px-6 text-[16px] font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm gap-2"
            onClick={() =>
              navigate({ to: "/arrival-report", search: { id: report.arrival_report_id } })
            }
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
              Arrival Report details
            </p>
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-400 text-amber-950 shadow-sm">
                <Lock className="h-3 w-3" /> Locked (MR Generated)
              </span>
            )}
          </div>
          <h1 className="text-[34px] font-bold text-white mt-1 leading-none">
            AR No —{" "}
            <span className="text-yellow-300 font-mono">{report.arrival_report_no || "—"}</span>
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            ["LR Number", report.lr_no || report.bill_no || report.mr_no || "—"],
            [
              "Challan No",
              report.challan_no ||
                (report as any).challanNo ||
                (report as any).manualChallanNo ||
                ch?.manualChallanNo ||
                ch?.challanNo ||
                "—",
            ],
            ["Incharge", report.branch_incharge || "—"],
          ].map(([lbl, val]) => (
            <div key={lbl} className="bg-white/10 rounded-xl px-5 py-3 text-white min-w-[120px]">
              <p className="text-[12px] text-blue-200 uppercase tracking-wider font-semibold">
                {lbl}
              </p>
              <p className="text-[15px] font-bold mt-1">{val || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <Card title="1. Basic Details" icon={<FileText className="h-4 w-4" />}>
          <Field label="Reached date" value={formatDate(report.report_date)} />
          <Field
            label="Ack received date"
            value={formatDate(report.arrival_date || report.report_date)}
          />
          <Field label="Unloading date" value={formatDate(report.delivery_date)} />
          <Field label="Branch Incharge" value={report.branch_incharge || "—"} />
          <Field label="Created On" value={formatDate(report.created_at)} />
        </Card>

        <Card title="2. Consignment Details" icon={<ClipboardList className="h-4 w-4" />}>
          <Field label="Consignor" value={refConsignor} />
          <Field label="Consignee" value={refConsignee} />
          <Field label="From Location" value={refFromLocation} />
          <Field label="To Location" value={refToLocation} />
          <Field label="Vehicle Number" value={refVehicleNumber} />
          <Field label="Driver Name" value={refDriverName} />
          <Field label="Packages count" value={refNoOfPackages} />
        </Card>

        <Card title="3. Delivery Confirmation" icon={<FileText className="h-4 w-4" />}>
          <Field label="Delivery Status" value={report.delivery_status || "Delivered"} />
          <Field label="Received By" value={report.received_by || "—"} />
          <Field label="Receiver Mobile" value={report.receiver_mobile || "—"} />
          <Field
            label="Balance Amount (₹)"
            value={report.balance_amount ? `Rs. ${report.balance_amount}` : refBalanceAmount}
            important
          />
          <Field
            label="Net Balance (₹)"
            value={report.net_amount ? `Rs. ${report.net_amount}` : "—"}
            important
          />
        </Card>

        <Card title="4. Halting & Penalty" icon={<FileText className="h-4 w-4" />}>
          <Field label="Halting / Detention Days" value={report.halting_days || "0"} />
          <Field
            label="Amount Per Day"
            value={
              report.halting_amount_per_day ? `Rs. ${report.halting_amount_per_day}` : "Rs. 0.00"
            }
          />
          <Field
            label="Total Detention Amount"
            value={
              report.total_detention_amount ? `Rs. ${report.total_detention_amount}` : "Rs. 0.00"
            }
            important
          />
          <Field label="Penalty Reason" value={report.penalty_type || "None"} />
          <Field
            label="Penalty Amount"
            value={report.penalty_amount ? `Rs. ${report.penalty_amount}` : "Rs. 0.00"}
            important
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {report.remarks && (
          <Card title="Remarks / Acknowledgement" icon={<FileText className="h-4 w-4" />}>
            <div className="pt-2">
              <p className="text-[15px] font-semibold text-slate-700 bg-slate-50/50 p-3 rounded-lg whitespace-pre-wrap min-h-[50px]">
                {report.remarks}
              </p>
            </div>
          </Card>
        )}

        {report.uploaded_pdf && (
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 font-black text-sm">
                PDF
              </div>
              <div>
                <p className="text-[16px] font-bold text-slate-800">
                  {report.uploaded_pdf_name || "Arrival Document.pdf"}
                </p>
                <span className="text-[12px] text-green-700 font-semibold">
                  Attached Document / POD
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 text-[14px] font-bold border-blue-300 text-blue-700 hover:bg-blue-100 px-4"
              onClick={() => {
                const win = window.open();
                if (win) {
                  win.document.write(
                    `<iframe src="${report.uploaded_pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
                  );
                }
              }}
            >
              View Document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
