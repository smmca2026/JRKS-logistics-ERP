import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Printer,
  Eye,
  Phone,
  MessageCircle,
  Smartphone,
  Download,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore, type Bill } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { formatDate, exportToExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/bill-records")({
  head: () => ({
    meta: [
      { title: "Bill Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage all generated invoices." },
    ],
  }),
  component: BillRecords,
});

import { getIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 6;

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

function BillRecords() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { bills, deleteBill, loadData, moneyReceipts } = useOpsStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedBills = useMemo(() => {
    return bills.map((b) => {
      const isLocked = (moneyReceipts || []).some((mr: any) => {
        const mrLr = (mr.lrNo || "").toString().trim().toLowerCase();
        const mrBillNo = (mr.billNo || "").toString().trim().toLowerCase();

        if (b.billNo && (mrBillNo === b.billNo.toLowerCase() || mrLr === b.billNo.toLowerCase())) return true;
        if (b.lrNumber && matchLr(mrLr, b.lrNumber)) return true;
        if (b.items?.some((item: any) => item.lrNo && matchLr(mrLr, item.lrNo))) return true;

        if (Array.isArray(mr.items)) {
          return mr.items.some((item: any) => {
            const itemRef = (item.lrNo || item.lrNumber || item.billNo || item.cnNo || "").toString().trim().toLowerCase();
            if (b.billNo && itemRef === b.billNo.toLowerCase()) return true;
            if (b.lrNumber && matchLr(itemRef, b.lrNumber)) return true;
            if (b.items?.some((r: any) => r.lrNo && matchLr(itemRef, r.lrNo))) return true;
            return false;
          });
        }
        return false;
      });
      return { ...b, isLocked };
    });
  }, [bills, moneyReceipts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedBills.filter((b) => {
      return (
        !q ||
        [b.billNo, b.lrNumber, b.customerName, b.fromLocation, b.toLocation].some((v) =>
          (v || "").toLowerCase().includes(q),
        )
      );
    });
  }, [enrichedBills, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Keyboard arrow key navigation
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
    const exportData = filtered.map((b) => {
      let totalVal = "0";
      if (b.grandTotalOverride) {
        totalVal = b.grandTotalOverride;
      } else {
        const sum = (b.items || []).reduce((acc, item) => acc + Number(item.amount || 0), 0);
        const gstPercent = parseFloat(b.gstPercentage || "18") / 100;
        const gstAmt = sum * gstPercent;
        totalVal = (sum + gstAmt).toFixed(2);
      }

      return {
        "Bill Date": formatDate(b.date),
        "Bill Number": b.billNo,
        "LR Number": b.lrNumber || "",
        "Submitted Date": b.submittedDate ? formatDate(b.submittedDate) : "",
        "Due Date": b.dueDate ? formatDate(b.dueDate) : "",
        "Company Name": b.companyName,
        "Company Address": b.companyAddress || "",
        "Company Mobile": b.companyMobile || "",
        "Company WhatsApp": b.companyWhatsApp || "",
        "Company Office": b.companyOffice || "",
        "Company Email": b.companyEmail || "",
        "Company GST": b.companyGst || "",
        "Company PAN": b.companyPan || "",
        "Customer Name": b.customerName,
        "Customer Address": b.customerAddress || "",
        "Customer GST": b.customerGst || "",
        "Customer PAN": b.customerPan || "",
        "From Location": b.fromLocation || "",
        "To Location": b.toLocation || "",
        "Bank Name": b.bankName || "",
        "Bank Branch": b.bankBranch || "",
        "Account No": b.accountNo || "",
        "IFSC Code": b.ifscCode || "",
        "Account Holder": b.accountHolder || "",
        Terms: b.terms || "",
        "GST Percentage": b.gstPercentage || "0",
        "Sub Total Override": b.subTotalOverride || "",
        "GST Override": b.gstOverride || "",
        "Grand Total Override": b.grandTotalOverride || "",
        "Grand Total": totalVal,
        "Rupees In Words": b.rupeesInWords || "",
        "Line Items": (b.items || [])
          .map(
            (i) =>
              `[LR: ${i.lrNo}] ${i.goods} (Wt: ${i.weight}, Rate: ${i.rate}, Halt: ${i.haltingAmount || 0}, Fine: ${i.rtoFine || 0}) - Rs. ${i.amount}`,
          )
          .join(" | "),
      };
    });

    exportToExcel("bill_records.xlsx", exportData, "Bills");
    toast.success("Exported to Excel.");
  };

  const getBillGrandTotal = (b: any) => {
    if (b.grandTotalOverride) {
      return Number(b.grandTotalOverride).toFixed(2);
    }
    const sum = b.items.reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);
    const gstPercent = parseFloat(b.gstPercentage || "18") / 100;
    const gstAmt = sum * gstPercent;
    return (sum + gstAmt).toFixed(2);
  };

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      
      <PageHeader
        title="Bill Records"
        description="Register and archive of all generated invoice billing logs."
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
              onClick={() => navigate({ to: "/billing", search: { editId: undefined } })}
            >
              <Plus className="h-4.5 w-4.5" /> New Bill / Invoice
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
        searchPlaceholder="Search by bill number, customer, LR, route…"
      />

      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No bills found"
            description={
              search
                ? "Try adjusting your search criteria."
                : "Generate and save your first invoice bill to get started."
            }
            actionLabel={search ? undefined : "New Bill / Invoice"}
            onAction={() => navigate({ to: "/billing", search: { editId: undefined } })}
          />
        ) : (
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">Bill Date</th>
                <th className="px-4 py-3">Bill Number</th>
                <th className="px-4 py-3">LR Number</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3 text-right">Grand Total</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {paged.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(b.date)}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{b.billNo}</span>
                      {b.isLocked && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {b.lastEditedBy ? (
                            <>
                              Edited by {b.lastEditedBy}{" "}
                              {b.lastEditedAt ? `(${new Date(b.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : b.createdBy ? (
                            <>
                              Created by {b.createdBy}{" "}
                              {b.createdAt ? `(${new Date(b.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : b.created_at ? `(${new Date(b.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{b.lrNumber || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{b.customerName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {b.fromLocation || "—"} ➜ {b.toLocation || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-green-700">
                    Rs. {getBillGrandTotal(b)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {/* View / Edit */}
                      {/* View */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View Details"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate({ to: "/billing", search: { editId: b.id } })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={b.isLocked ? "View Locked Invoice" : "Edit Invoice"}
                        className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                        onClick={() => navigate({ to: "/billing", search: { editId: b.id } })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title={b.isLocked ? "Invoice is Locked (MR Generated)" : "Delete Invoice"}
                          disabled={b.isLocked}
                          className={`h-8 w-8 ${b.isLocked ? "opacity-40 cursor-not-allowed text-slate-400" : "text-destructive hover:bg-destructive/10"}`}
                          onClick={() => {
                            if (b.isLocked) {
                              toast.error(`Bill #${b.billNo} is locked because a Money Receipt has already been generated. It cannot be deleted.`);
                              return;
                            }
                            if (confirm("Are you sure you want to delete this invoice?")) {
                              deleteBill(b.id);
                              toast.success("Invoice deleted successfully");
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

      {/* Pagination Footer */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of <span className="font-semibold text-slate-700">{filtered.length}</span> records
              </p>
            </div>
            <div>
              <nav
                className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                aria-label="Pagination"
              >
                <Button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={safePage === 1}
                  variant="outline"
                  size="icon"
                  className="rounded-l-md"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    variant={safePage === idx + 1 ? "default" : "outline"}
                    className="h-9 w-9"
                  >
                    {idx + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={safePage === totalPages}
                  variant="outline"
                  size="icon"
                  className="rounded-r-md"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
