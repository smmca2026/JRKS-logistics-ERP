import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Eye,
  Phone,
  MessageCircle,
  Smartphone,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { formatDate, exportToExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/voucher-records")({
  head: () => ({
    meta: [
      { title: "Voucher Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage all Cash/Bank Vouchers." },
    ],
  }),
  component: VoucherRecords,
});

import { getIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 6;

function VoucherRecords() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { vouchers, deleteVoucher, loadData } = useOpsStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<"All" | "Credit" | "Debit">("All");

  // Reload data from DB on mount
  useEffect(() => {
    loadData();
  }, []);

  const sortedVouchers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vouchers.filter((v) => {
      return (
        !q ||
        [v.voucherNo, v.manualVoucherNo, v.paidTo, v.receivedFrom, v.narration, v.voucherDate, formatDate(v.voucherDate)].some((str) =>
          (str || "").toLowerCase().includes(q),
        ) ||
        (v.items || []).some(
          (item: any) =>
            (item.codeNo || "").toLowerCase().includes(q) ||
            (item.expenseAccountName || "").toLowerCase().includes(q) ||
            (item.description || "").toLowerCase().includes(q) ||
            (item.refNo || "").toLowerCase().includes(q) ||
            (item.chequeDkNo || "").toLowerCase().includes(q),
        )
      );
    });
  }, [vouchers, search]);

  const flatItems = useMemo(() => {
    let result: any[] = [];
    sortedVouchers.forEach((v) => {
      if (v.items && v.items.length > 0) {
        v.items.forEach((item) => {
          result.push({
            ...item,
            parentVoucher: v,
          });
        });
      }
    });

    if (filterType !== "All") {
      result = result.filter((item) => item.creditDebit === filterType);
    }

    return result;
  }, [sortedVouchers, filterType]);

  const totalPages = Math.max(1, Math.ceil(flatItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = flatItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Keyboard navigation
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

  const getVoucherTotals = (v: any) => {
    let payment = 0;
    let receipt = 0;
    for (const item of v.items || []) {
      payment += Number(item.payment || 0);
      receipt += Number(item.receipt || 0);
    }
    return { payment, receipt };
  };

  const handleExport = () => {
    const exportData = flatItems.map((item) => {
      const v = item.parentVoucher;
      return {
        "Voucher Date": formatDate(v.voucherDate),
        "LR No.": v.voucherNo,
        "Voucher No.": v.manualVoucherNo || "",
        "Paid To": v.paidTo || "",
        "Received From": v.receivedFrom || "",
        "Party": item.creditDebit === "Credit" ? (v.receivedFrom || "") : (v.paidTo || ""),
        Narration: v.narration || "",
        "Total Payment": getVoucherTotals(v).payment,
        "Total Receipt": getVoucherTotals(v).receipt,
        "Code No": item.codeNo,
        "Expense Account Name": item.expenseAccountName,
        Description: item.description,
        "Ref No": item.refNo || "",
        "Mode of Payment": item.modeOfPayment || "",
        "Cheque/DD No": item.chequeDkNo || "",
        "Cheque Date": item.chequeDate ? formatDate(item.chequeDate) : "",
        "Bank Name": item.bankName || "",
        "Payment Amount": item.payment || 0,
        "Receipt Amount": item.receipt || 0,
        "Credit / Debit": item.creditDebit || "",
      };
    });
    exportToExcel("voucher_records.xlsx", exportData, "Vouchers");
    toast.success("Exported to Excel.");
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      
      <PageHeader
        title="Voucher Records"
        description="Register of all Cash/Bank Vouchers."
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase px-5 py-2.5 rounded-full shadow-md cursor-pointer flex items-center gap-2 border border-emerald-200 transition-colors"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <Button
              className="h-10 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              onClick={() => navigate({ to: "/voucher-entry", search: { editId: undefined } })}
            >
              <Plus className="h-4 w-4 mr-1" /> New Voucher
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Toolbar
            search={search}
            onSearch={(v) => {
              setSearch(v);
              resetPage();
            }}
            searchPlaceholder="Search by LR number, narration, date (DD-MM-YYYY), expense code…"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
          {(["All", "Credit", "Debit"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                resetPage();
              }}
              className={`px-5 py-1.5 text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                filterType === type
                  ? type === "Credit"
                    ? "bg-emerald-100 text-emerald-700 shadow-sm"
                    : type === "Debit"
                      ? "bg-red-100 text-red-700 shadow-sm"
                      : "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <TableCard>
        {flatItems.length === 0 ? (
          <EmptyState
            title="No voucher records found"
            description={
              search
                ? "Try adjusting your search criteria."
                : "Create your first Voucher to get started."
            }
            actionLabel={search ? undefined : "New Voucher"}
            onAction={() => navigate({ to: "/voucher-entry", search: { editId: undefined } })}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">Voucher Date</th>
                <th className="px-4 py-3">LR No.</th>
                <th className="px-4 py-3">Voucher No.</th>
                <th className="px-4 py-3">Narration</th>
                <th className="px-4 py-3">Code No.</th>
                <th className="px-4 py-3">Expense Account Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Ref No.</th>
                <th className="px-4 py-3">Mode of Payment</th>
                <th className="px-4 py-3 text-right">Payment (₹)</th>
                <th className="px-4 py-3 text-center">Credit/Debit</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {paged.map((item) => {
                const v = item.parentVoucher;
                return (
                  <tr
                    key={`${v.id}-${item.sNo}`}
                    className="transition-colors hover:bg-muted/40 font-bold text-slate-700"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(v.voucherDate)}</td>
                    <td className="px-4 py-3 font-mono text-xs font-black text-blue-600">
                      <div>{v.voucherNo}</div>
                      <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {v.lastEditedBy ? (
                            <>
                              Edited by {v.lastEditedBy}{" "}
                              {v.lastEditedAt ? `(${new Date(v.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : v.createdBy ? (
                            <>
                              Created by {v.createdBy}{" "}
                              {v.createdAt ? `(${new Date(v.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : v.created_at ? `(${new Date(v.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-black text-blue-600">
                      <div>{v.manualVoucherNo || "—"}</div>
                      {item.creditDebit === "Credit" && v.receivedFrom && (
                        <div className="text-[10px] text-emerald-700 font-bold font-sans mt-0.5 whitespace-nowrap">
                          From: {v.receivedFrom}
                        </div>
                      )}
                      {item.creditDebit === "Debit" && v.paidTo && (
                        <div className="text-[10px] text-blue-700 font-bold font-sans mt-0.5 whitespace-nowrap">
                          To: {v.paidTo}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">
                      {v.narration || "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">{item.codeNo}</td>
                    <td
                      className="px-4 py-3 text-slate-700 max-w-[160px] truncate"
                      title={item.expenseAccountName}
                    >
                      {item.expenseAccountName}
                    </td>
                    <td
                      className="px-4 py-3 text-slate-500 max-w-[200px] truncate"
                      title={item.description}
                    >
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.refNo || "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{item.modeOfPayment || "—"}</td>
                    <td className="px-4 py-3 text-right text-blue-600 tabular-nums whitespace-nowrap">
                      ₹ {Number(item.payment || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          item.creditDebit === "Credit"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.creditDebit === "Debit"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.creditDebit || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View"
                          className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() =>
                            navigate({ to: "/voucher-entry", search: { editId: v.id } })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          onClick={() =>
                            navigate({ to: "/voucher-entry", search: { editId: v.id } })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {/* Delete */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this Voucher? This will remove all ledger entries under it.",
                                )
                              ) {
                                await deleteVoucher(v.id);
                                toast.success("Voucher deleted successfully");
                                loadData();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {flatItems.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{(safePage - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium text-foreground">
              {Math.min(safePage * PAGE_SIZE, flatItems.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{flatItems.length}</span>
            <span className="ml-2 text-xs text-slate-400">(use ← → arrow keys to navigate)</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              title="Previous page (←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-foreground">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              title="Next page (→)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
