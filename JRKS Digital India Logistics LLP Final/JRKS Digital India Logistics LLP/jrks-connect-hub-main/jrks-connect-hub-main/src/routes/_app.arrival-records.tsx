import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  X,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  Phone,
  MessageCircle,
  Smartphone,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOpsStore, type ArrivalReport } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
import { CustomDatePicker } from "@/components/ui/custom-datepicker";
import { PageHeader, TableCard, EmptyState } from "@/components/master-ui";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportToExcel } from "@/lib/export";
import { getIsAdmin } from "@/lib/auth";

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

export const Route = createFileRoute("/_app/arrival-records")({
  head: () => ({
    meta: [
      { title: "Arrival Report Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage delivery confirmations." },
    ],
  }),
  component: ArrivalRecordsPage,
});

const PAGE_SIZE = 6;

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD to DD-MM-YYYY
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

function ArrivalRecordsPage() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const {
    arrivalReports,
    deleteArrivalReport,
    loadData,
    consignmentNotes,
    challans,
    moneyReceipts,
  } = useOpsStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Filters State
  const [filterReportNo, setFilterReportNo] = useState("");
  const [filterLrNo, setFilterLrNo] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterPaymentMode, setFilterPaymentMode] = useState("ALL");
  const [filterConsignee, setFilterConsignee] = useState("");
  const [filterDestination, setFilterDestination] = useState("");

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedReports = useMemo(() => {
    return arrivalReports.map((r) => {
      const checkLr = r.lr_no || r.bill_no || r.arrival_report_no || "";
      let isLocked =
        (r as any).isLocked === 1 ||
        (r as any).isLocked === true ||
        String((r as any).isLocked) === "1";
      if (!isLocked && checkLr) {
        const lrClean = String(checkLr).toLowerCase().trim();
        isLocked = (moneyReceipts || []).some((mr) => {
          const mrLr = String(mr.lrNo || "").toLowerCase().trim();
          if (
            mrLr &&
            (mrLr === lrClean ||
              matchLr(mrLr, lrClean) ||
              mrLr.includes(lrClean) ||
              lrClean.includes(mrLr))
          ) {
            return true;
          }
          const mrItems = JSON.stringify(mr.items || []).toLowerCase();
          if (mrItems.includes(lrClean)) {
            return true;
          }
          return false;
        });
      }
      return { ...r, isLocked };
    });
  }, [arrivalReports, moneyReceipts]);

  const filtered = useMemo(() => {
    return enrichedReports.filter((ar) => {
      // Find consignment note for consignee and destination matching
      const cnNote = consignmentNotes.find((c) => matchLr(c.lrNumber, ar.lr_no || ar.bill_no));

      // 1. Arrival Report No filter
      if (
        filterReportNo.trim() &&
        !(ar.arrival_report_no || "").toLowerCase().includes(filterReportNo.toLowerCase().trim())
      ) {
        return false;
      }

      // 2. LR Number filter
      const currentLr = ar.lr_no || ar.bill_no || "";
      if (filterLrNo.trim() && !currentLr.toLowerCase().includes(filterLrNo.toLowerCase().trim())) {
        return false;
      }

      // 3. Date Range filter
      if (filterDateFrom && ar.report_date < filterDateFrom) return false;
      if (filterDateTo && ar.report_date > filterDateTo) return false;

      // 4. Delivery Status filter
      if (
        filterStatus !== "ALL" &&
        (ar.delivery_status || "Delivered").toLowerCase() !== filterStatus.toLowerCase()
      ) {
        return false;
      }

      // 5. Payment Mode filter
      if (
        filterPaymentMode !== "ALL" &&
        (ar.payment_mode || "Cash").toLowerCase() !== filterPaymentMode.toLowerCase()
      ) {
        return false;
      }

      // 6. Consignee filter
      if (
        filterConsignee.trim() &&
        !(cnNote?.consigneeName || "").toLowerCase().includes(filterConsignee.toLowerCase().trim())
      ) {
        return false;
      }

      // 7. Destination filter
      if (
        filterDestination.trim() &&
        !(cnNote?.toLocation || "").toLowerCase().includes(filterDestination.toLowerCase().trim())
      ) {
        return false;
      }

      // 8. General Search bar query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          (ar.arrival_report_no || "").toLowerCase().includes(q) ||
          currentLr.toLowerCase().includes(q) ||
          (ar.challan_no || "").toLowerCase().includes(q) ||
          (cnNote?.consigneeName || "").toLowerCase().includes(q) ||
          (cnNote?.consignorName || "").toLowerCase().includes(q) ||
          (cnNote?.fromLocation || "").toLowerCase().includes(q) ||
          (cnNote?.toLocation || "").toLowerCase().includes(q) ||
          (ar.branch_incharge || "").toLowerCase().includes(q) ||
          (ar.received_by || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    enrichedReports,
    consignmentNotes,
    filterReportNo,
    filterLrNo,
    filterDateFrom,
    filterDateTo,
    filterStatus,
    filterPaymentMode,
    filterConsignee,
    filterDestination,
    search,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Keyboard navigation support
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft" && safePage > 1) setPage((p) => p - 1);
      else if (e.key === "ArrowRight" && safePage < totalPages) setPage((p) => p + 1);
    },
    [safePage, totalPages],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleResetFilters = () => {
    setSearch("");
    setFilterReportNo("");
    setFilterLrNo("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterStatus("ALL");
    setFilterPaymentMode("ALL");
    setFilterConsignee("");
    setFilterDestination("");
    setPage(1);
  };

  const handleExport = () => {
    const exportData = filtered.map((ar) => {
      const cnNote = consignmentNotes.find((c) => matchLr(c.lrNumber, ar.lr_no || ar.bill_no));
      return {
        "Arrival Report No": ar.arrival_report_no,
        "LR Number": ar.lr_no || ar.bill_no,
        "Challan No": ar.challan_no,
        "Report Date": formatDate(ar.report_date),
        "Arrival Date": formatDate(ar.arrival_date || ar.report_date),
        "Delivery Date": formatDate(ar.delivery_date),
        "Consignee": cnNote?.consigneeName || "—",
        "Destination": cnNote?.toLocation || "—",
        "Delivery Status": ar.delivery_status || "Delivered",
        "Net Amount": ar.net_amount || ar.balance_amount || "0",
        "Branch Incharge": ar.branch_incharge,
      };
    });
    exportToExcel("arrival_reports.xlsx", exportData, "Arrival Reports");
    toast.success("Excel export completed!");
  };

  const handleDelete = (report: any) => {
    if (report.isLocked) {
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
    }
  };

  return (
    <div className="w-full space-y-6" style={{ zoom: 1.1 }}>
      {/* Page Header */}
      <PageHeader
        title="Arrival Report Records"
        description="Manage delivery acknowledgement and arrival confirmation records."
        icon={<ClipboardList className="h-5 w-5 text-[#1E3A8A]" />}
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-10 border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 font-bold text-xs uppercase px-4 rounded-xl shadow-sm cursor-pointer"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1 text-emerald-600" /> Excel
            </Button>
            <Button
              className="h-10 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              onClick={() => navigate({ to: "/arrival-report", search: { id: undefined } })}
            >
              <Plus className="h-4.5 w-4.5" /> New Arrival Report
            </Button>
          </div>
        }
      />

      {/* Toolbar / Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search across all fields (AR No, LR No, Challan, Consignee, Incharge...)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-sm",
              showFilters
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            Filters {showFilters ? <X className="h-3.5 w-3.5" /> : null}
          </button>
          {(search || filterReportNo || filterLrNo || filterDateFrom || filterDateTo || filterStatus !== "ALL" || filterPaymentMode !== "ALL" || filterConsignee || filterDestination) && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all border border-red-100 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 animate-in fade-in">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Report No</label>
              <input
                type="text"
                placeholder="Filter by AR No..."
                value={filterReportNo}
                onChange={(e) => {
                  setFilterReportNo(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">LR Number</label>
              <input
                type="text"
                placeholder="Filter by LR No..."
                value={filterLrNo}
                onChange={(e) => {
                  setFilterLrNo(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-semibold outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Date From</label>
              <CustomDatePicker
                value={filterDateFrom}
                onChange={(val) => {
                  setFilterDateFrom(val);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Date To</label>
              <CustomDatePicker
                value={filterDateTo}
                onChange={(val) => {
                  setFilterDateTo(val);
                  setPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Table Records */}
      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No arrival records found"
            description={
              search || filterLrNo || filterDateFrom || filterDateTo || filterStatus !== "ALL" || filterPaymentMode !== "ALL" || filterConsignee || filterDestination
                ? "Try adjusting your filters."
                : "Create your first Arrival Report to get started."
            }
            actionLabel={search || filterLrNo || filterDateFrom || filterDateTo || filterStatus !== "ALL" || filterPaymentMode !== "ALL" || filterConsignee || filterDestination ? undefined : "New Arrival Report"}
            onAction={() => navigate({ to: "/arrival-report", search: { id: undefined } })}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">AR Number</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">LR Number</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Challan No</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Reached Date</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Consignee</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Destination</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Status</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Net Balance</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Branch Incharge</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black text-center">Document</th>
                  <th className="px-4 py-3.5 text-center text-[#1E3A8A] font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paged.map((r) => {
                  const targetLr = r.lr_no || r.bill_no || r.mr_no;
                  const cnNote = consignmentNotes.find(
                    (c) => matchLr(c.lrNumber, targetLr) || matchLr(c.consignmentNoteNo, targetLr),
                  );
                  const linkedCh = challans.find((c) => {
                    const items = Array.isArray(c.items) ? c.items : [];
                    return items.some(
                      (item: any) => matchLr(item.cnNo, targetLr) || matchLr(item.lrNo, targetLr),
                    );
                  });
                  const displayChallanNo =
                    r.challan_no || linkedCh?.manualChallanNo || linkedCh?.challanNo || "—";

                  return (
                    <tr key={r.arrival_report_id} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 font-mono text-xs font-black text-[#1E3A8A]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{r.arrival_report_no || "—"}</span>
                          {(r as any).isLocked ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-sans">
                              <Lock className="h-2.5 w-2.5" /> Locked
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                        <div>{r.lr_no || r.bill_no || r.mr_no || "—"}</div>
                        <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {r.lastEditedBy ? (
                            <>
                              Edited by {r.lastEditedBy}{" "}
                              {r.lastEditedAt
                                ? `(${new Date(r.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})`
                                : ""}
                            </>
                          ) : r.createdBy ? (
                            <>
                              Created by {r.createdBy}{" "}
                              {r.createdAt
                                ? `(${new Date(r.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})`
                                : r.created_at
                                  ? `(${new Date(r.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})`
                                  : ""}
                            </>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-800">{displayChallanNo}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        {formatDate(r.report_date)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {cnNote?.consigneeName || "—"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {cnNote?.toLocation || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold",
                            (r.delivery_status || "Delivered") === "Delivered" &&
                              "bg-green-50 text-green-700",
                            (r.delivery_status || "Delivered") === "Partial Delivery" &&
                              "bg-amber-50 text-amber-700",
                            (r.delivery_status || "Delivered") === "Pending" &&
                              "bg-blue-50 text-blue-700",
                            (r.delivery_status || "Delivered") === "Returned" &&
                              "bg-red-50 text-red-700",
                          )}
                        >
                          {r.delivery_status || "Delivered"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#1E3A8A]">
                        {r.net_amount !== undefined && r.net_amount !== null && r.net_amount !== ""
                          ? `Rs. ${r.net_amount}`
                          : r.balance_amount
                            ? `Rs. ${r.balance_amount}`
                            : "—"}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {r.branch_incharge || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {r.uploaded_pdf ? (
                          <button
                            title="View Document"
                            onClick={(e) => {
                              e.stopPropagation();
                              const win = window.open();
                              if (win)
                                win.document.write(
                                  `<iframe src="${r.uploaded_pdf}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`,
                                );
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <FileText className="h-3.5 w-3.5" /> View POD
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            title="View Details"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            onClick={() =>
                              navigate({
                                to: "/arrival-view",
                                search: { id: r.arrival_report_id },
                              })
                            }
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            title="Edit"
                            className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            onClick={() =>
                              navigate({
                                to: "/arrival-report",
                                search: { id: r.arrival_report_id },
                              })
                            }
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </button>

                          {isAdmin && (
                            <button
                              title={(r as any).isLocked ? "Report Locked" : "Delete"}
                              disabled={(r as any).isLocked}
                              className={`p-1 rounded-lg transition-colors ${(r as any).isLocked ? "text-slate-300 cursor-not-allowed" : "text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"}`}
                              onClick={() => handleDelete(r)}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>
    </div>
  );
}
