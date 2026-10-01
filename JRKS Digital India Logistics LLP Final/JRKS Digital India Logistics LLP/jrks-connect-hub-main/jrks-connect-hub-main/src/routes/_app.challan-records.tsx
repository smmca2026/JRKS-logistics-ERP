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
  Calendar,
  Filter,
  Printer,
  Phone,
  MessageCircle,
  Smartphone,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useOpsStore, type Challan } from "@/lib/ops-store";
import { PageHeader, TableCard, EmptyState } from "@/components/master-ui";
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

export const Route = createFileRoute("/_app/challan-records")({
  head: () => ({
    meta: [
      { title: "Challan Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage transport challan notes." },
    ],
  }),
  component: ChallanRecordsPage,
});

const PAGE_SIZE = 6;

function formatDate(dateStr: string) {
  if (!dateStr) return "";
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

import { exportToExcel } from "@/lib/export";
import { getIsAdmin } from "@/lib/auth";

const formatCurrency = (val: number) => {
  return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function ChallanRecordsPage() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { challans, deleteChallan, moneyReceipts } = useOpsStore();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  // Reset page on search or filter change
  const resetPage = () => setPage(1);

  const enrichedChallans = useMemo(() => {
    return challans.map((c) => {
      let isLocked =
        c.isLocked === 1 || c.isLocked === true || String(c.isLocked) === "1";
      if (!isLocked) {
        const chNos = [c.challanNo, c.manualChallanNo]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase().trim());
        const itemLrNos = (Array.isArray(c.items) ? c.items : [])
          .map((it: any) => String(it.cnNo || it.lrNo || "").toLowerCase().trim())
          .filter(Boolean);
        const allRefs = [...chNos, ...itemLrNos];

        isLocked = (moneyReceipts || []).some((mr) => {
          const mrLr = String(mr.lrNo || "").toLowerCase().trim();
          if (
            mrLr &&
            allRefs.some(
              (ref) => ref && (mrLr === ref || mrLr.includes(ref) || ref.includes(mrLr)),
            )
          ) {
            return true;
          }
          const mrItems = JSON.stringify(mr.items || []).toLowerCase();
          if (allRefs.some((ref) => ref && mrItems.includes(ref))) {
            return true;
          }
          return false;
        });
      }
      return { ...c, isLocked };
    });
  }, [challans, moneyReceipts]);

  const filtered = useMemo(() => {
    return enrichedChallans.filter((c) => {
      // 1. Search Query (Challan No, Manual Challan No, Vehicle No, Broker Name, LR Numbers)
      const q = search.toLowerCase().trim();
      let matchSearch = !q;
      if (q) {
        const textFields = [c.challanNo, c.manualChallanNo, c.vehicleNumber, c.brokerName, c.fromLocation, c.toLocation];
        const textMatch = textFields.some((v) => (v || "").toLowerCase().includes(q));
        
        let itemMatch = false;
        if (Array.isArray(c.items)) {
          itemMatch = c.items.some((it: any) => (it.cnNo || it.lrNo || "").toLowerCase().includes(q));
        } else if (typeof c.items === "string") {
          itemMatch = (c.items as string).toLowerCase().includes(q);
        }
        matchSearch = textMatch || itemMatch;
      }

      // 2. Date Range Filter
      let matchDate = true;
      if (startDate && c.challanDate) {
        matchDate = matchDate && c.challanDate >= startDate;
      }
      if (endDate && c.challanDate) {
        matchDate = matchDate && c.challanDate <= endDate;
      }

      return matchSearch && matchDate;
    });
  }, [enrichedChallans, search, startDate, endDate]);

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

  const handleClearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    resetPage();
  };

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      {/* Page Header */}
      
      <PageHeader
        title="Challan Records"
        description="Create and manage transport challan notes."
        icon={<ClipboardList className="h-5 w-5 text-[#1E3A8A]" />}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filtered.map((c) => ({
                  "Challan Date": formatDate(c.challanDate),
                  "Challan No": c.challanNo,
                  "From Location": c.fromLocation,
                  "To Location": c.toLocation,
                  "Vehicle Number": c.vehicleNumber,
                  Status: c.status,
                  "Owner Name": c.ownerName,
                  "Owner PAN": c.ownerPan,
                  "Owner Aadhaar": c.ownerAadhar,
                  "Owner Account": c.ownerAccount,
                  "Owner Mobile": c.ownerMobile,
                  "Driver Name": c.driverName,
                  "Driver Mobile": c.driverMobile,
                  "Vehicle Dimensions": `L: ${c.dimLength || ""} B: ${c.dimWidth || ""} H: ${c.dimHeight || ""}`,
                  "Broker Name": c.brokerName || c.brokerNameSec5 || "",
                  "Broker Mobile": c.brokerMobile,
                  "Payable At": c.payableAt || "",
                  "Delivery To Name": c.deliveryToName,
                  "Delivery To PAN": c.deliveryToPan,
                  "Delivery To Mobile": c.deliveryToMobile,
                  Freight: c.freight,
                  Advance: c.lessAdvance,
                  "Delivery Commission": c.deliveryCommission,
                  Halting: c.halting,
                  "Loading Mamul": c.loadingMamul,
                  "CHALLAN MAMUL": c.comlyCom,
                  "Extra Charges": c.extraCharges,
                  "RTO Fine": c.rtoFine,
                  "TDS Percentage": c.tdsPercentage,
                  "TDS Amount": c.tds,
                  "Total Amount": c.totalAmount,
                  Balance: c.balanceAmount,
                  "Remarks / Narration": c.narration,
                  Consignments: (c.items || []).map((i) => i.cnNo).join(", "),
                }));
                exportToExcel("challan_records.xlsx", exportData, "Challans");
                toast.success("Exported to Excel.");
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase px-5 py-2.5 rounded-full shadow-md cursor-pointer flex items-center gap-2 border border-emerald-200 transition-colors"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <Button
              className="h-10 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              onClick={() => navigate({ to: "/challan-note", search: { id: undefined } })}
            >
              <Plus className="h-4.5 w-4.5" /> New Challan
            </Button>
          </div>
        }
      />

      {/* Modern Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Global Search */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search LR Number, Vehicle, Broker..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Date Picker Start */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
              Start Date
            </label>
            <CustomDatePicker
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                resetPage();
              }}
            />
          </div>

          {/* Date Picker End */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#1E3A8A]">
              End Date
            </label>
            <CustomDatePicker
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                resetPage();
              }}
            />
          </div>

          {/* Clear Filters */}
          <div className="md:col-span-4">
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-605 font-extrabold text-[10px] uppercase tracking-wider rounded-full transition-all shadow-sm cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Challan Records Table */}
      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No challan records found"
            description={
              search || startDate || endDate
                ? "Try adjusting your search criteria or filters."
                : "Create your first Challan Note to get started."
            }
            actionLabel={search || startDate || endDate ? undefined : "New Challan Note"}
            onAction={() => navigate({ to: "/challan-note", search: { id: undefined } })}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm text-left">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Challan / LR No</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Challan Date</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Vehicle Number</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">From</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">To</th>
                  <th className="px-4 py-3.5 text-[#1E3A8A] font-black">Broker Name</th>
                  <th className="px-4 py-3.5 text-right text-[#1E3A8A] font-black">
                    Balance Amount
                  </th>
                  <th className="px-4 py-3.5 text-center text-[#1E3A8A] font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paged.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-600">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{c.manualChallanNo || c.challanNo}</span>
                        {c.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="h-2.5 w-2.5" /> Locked
                          </span>
                        ) : null}
                      </div>
                      {(() => {
                        const items = Array.isArray(c.items) ? c.items : [];
                        const lrList = items.map((it: any) => it.cnNo || it.lrNo).filter(Boolean);
                        if (lrList.length > 0) {
                          return (
                            <div className="text-[11px] font-semibold text-slate-700 font-sans mt-0.5">
                              LR: {lrList.join(", ")}
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {c.lastEditedBy ? (
                            <>
                              Edited by {c.lastEditedBy}{" "}
                              {c.lastEditedAt ? `(${new Date(c.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : c.createdBy ? (
                            <>
                              Created by {c.createdBy}{" "}
                              {c.createdAt ? `(${new Date(c.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : c.created_at ? `(${new Date(c.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-semibold">
                      {formatDate(c.challanDate)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-800">
                      {c.vehicleNumber}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{c.fromLocation}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">{c.toLocation}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-semibold">{c.brokerName || c.brokerNameSec5 || "—"}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-800 font-extrabold">
                      {formatCurrency(c.balanceAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-1.5">
                        {/* View */}
                        <button
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          onClick={() =>
                            navigate({ to: "/challan-overview", search: { id: c.id } })
                          }
                        >
                          <Eye className="h-4.5 w-4.5" />
                        </button>
                        {/* Edit */}
                        <button
                          title="Edit"
                          className="p-1.5 rounded-lg transition-colors text-slate-500 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          onClick={() => {
                            navigate({ to: "/challan-note", search: { id: c.id } });
                          }}
                        >
                          <Pencil className="h-4.5 w-4.5" />
                        </button>

                        {/* Delete */}
                        {isAdmin && (
                          <button
                            title={c.isLocked ? "Challan Locked" : "Delete"}
                            disabled={c.isLocked}
                            className={`p-1.5 rounded-lg transition-colors ${c.isLocked ? 'text-slate-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'}`}
                            onClick={() => {
                              if (c.isLocked) {
                                toast.error(`Cannot delete Challan (${c.manualChallanNo || c.challanNo}) because a Money Receipt has already been generated for it.`);
                                return;
                              }
                              if (
                                confirm(
                                  `Are you sure you want to delete Challan with LR Number ${c.challanNo}?`,
                                )
                              ) {
                                deleteChallan(c.id);
                                toast.success("Challan deleted successfully.");
                              }
                            }}
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {/* Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-extrabold text-slate-800">{(safePage - 1) * PAGE_SIZE + 1}</span>{" "}
            to{" "}
            <span className="font-extrabold text-slate-800">
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-extrabold text-slate-800">{filtered.length}</span> records
            <span className="ml-2 text-xs text-slate-400 font-medium">
              (use ← → arrow keys to navigate)
            </span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              title="Previous page (←)"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </Button>
            <span className="px-2 text-sm font-semibold text-slate-700">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-pointer"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              title="Next page (→)"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
