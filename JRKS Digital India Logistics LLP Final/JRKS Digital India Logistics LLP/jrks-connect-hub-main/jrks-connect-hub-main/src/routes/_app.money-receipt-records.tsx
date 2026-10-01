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

export const Route = createFileRoute("/_app/money-receipt-records")({
  head: () => ({
    meta: [
      { title: "Money Receipt Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage all Money Receipts." },
    ],
  }),
  component: MoneyReceiptRecords,
});

import { getIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 6;

function MoneyReceiptRecords() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { moneyReceipts, deleteMoneyReceipt, loadData } = useOpsStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Reload data from DB on mount
  useEffect(() => {
    loadData();
  }, []);

  const sortedRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (moneyReceipts || []).filter((mr) => {
      return (
        !q ||
        [mr.mrNo, mr.partyName, mr.paymentFor, mr.receiptDate].some((str) =>
          (str || "").toLowerCase().includes(q),
        )
      );
    });
  }, [moneyReceipts, search]);

  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sortedRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const handleExport = () => {
    const exportData = sortedRecords.map((mr) => ({
      "MR Date": formatDate(mr.receiptDate),
      "MR No": mr.mrNo,
      "LR Number": mr.lrNo || "",
      Branch: mr.branch || "",
      "Party Name": mr.partyName || "",
      "Payment For": mr.paymentFor || "",
      "Amount Received": mr.amountReceived || 0,
      "Amount In Words": mr.amountInWords || "",
      Narration: mr.narration || "",
      "Line Items":
        typeof mr.items === "string"
          ? JSON.parse(mr.items)
              .map(
                (i: any) =>
                  `${i.billNo || "No Bill"} (Date: ${i.billDate || ""}, Amt: ${i.billAmount || 0}, TDS%: ${i.tdsPercentage || 0}, TDS: ${i.tdsAmount || 0}, Recv: ${i.receivedAmount || 0})`,
              )
              .join(" | ")
          : (mr.items || [])
              .map(
                (i: any) =>
                  `${i.billNo || "No Bill"} (Date: ${i.billDate || ""}, Amt: ${i.billAmount || 0}, TDS%: ${i.tdsPercentage || 0}, TDS: ${i.tdsAmount || 0}, Recv: ${i.receivedAmount || 0})`,
              )
              .join(" | "),
      Status: mr.status || "Active",
    }));
    exportToExcel("money_receipt_records.xlsx", exportData, "Money Receipts");
    toast.success("Exported to Excel.");
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      
      <PageHeader
        title="Money Receipt Records"
        description="Register of all Money Receipts."
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
              onClick={() => navigate({ to: "/money-receipt", search: { editId: undefined } })}
            >
              <Plus className="h-4 w-4 mr-1" /> New Money Receipt
            </Button>
          </div>
        }
      />

      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          resetPage();
        }}
        searchPlaceholder="Search by MR No, Party, Payment For…"
      />

      <TableCard>
        {sortedRecords.length === 0 ? (
          <EmptyState
            title="No money receipt records found"
            description={
              search
                ? "Try adjusting your search criteria."
                : "Create your first Money Receipt to get started."
            }
            actionLabel={search ? undefined : "New Money Receipt"}
            onAction={() => navigate({ to: "/money-receipt", search: { editId: undefined } })}
          />
        ) : (
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">MR Date</th>
                <th className="px-4 py-3">LR No.</th>
                <th className="px-4 py-3">MR No.</th>
                <th className="px-4 py-3">Party Name</th>
                <th className="px-4 py-3">Payment For</th>
                <th className="px-4 py-3 text-right">Amount Received (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {paged.map((mr) => (
                <tr
                  key={mr.id}
                  className="transition-colors hover:bg-muted/40 font-bold text-slate-700"
                >
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(mr.receiptDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600">
                    {mr.lrNo || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-black text-blue-600">
                    <div>{mr.mrNo}</div>
                    <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {mr.lastEditedBy ? (
                            <>
                              Edited by {mr.lastEditedBy}{" "}
                              {mr.lastEditedAt ? `(${new Date(mr.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : mr.createdBy ? (
                            <>
                              Created by {mr.createdBy}{" "}
                              {mr.createdAt ? `(${new Date(mr.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : mr.created_at ? `(${new Date(mr.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                  </td>
                  <td
                    className="px-4 py-3 text-slate-700 max-w-[200px] truncate"
                    title={mr.partyName}
                  >
                    {mr.partyName}
                  </td>
                  <td className="px-4 py-3 text-foreground">{mr.paymentFor}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 tabular-nums font-black">
                    ₹{" "}
                    {Number(mr.amountReceived || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      {/* Edit */}
                      {/* View */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Details"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() =>
                          navigate({ to: "/money-receipt", search: { editId: mr.id } })
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
                          navigate({ to: "/money-receipt", search: { editId: mr.id } })
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
                            if (confirm("Are you sure you want to delete this Money Receipt?")) {
                              await deleteMoneyReceipt(mr.id);
                              toast.success("Money receipt deleted successfully");
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
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {sortedRecords.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{(safePage - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium text-foreground">
              {Math.min(safePage * PAGE_SIZE, sortedRecords.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{sortedRecords.length}</span>
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
