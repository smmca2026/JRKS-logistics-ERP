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
  Printer,
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

export const Route = createFileRoute("/_app/booking-register")({
  head: () => ({
    meta: [
      { title: "Booking Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage all generated transport bookings." },
    ],
  }),
  component: BookingRecords,
});

import { getIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 6;

function BookingRecords() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { bookings, deleteBooking, loadData } = useOpsStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Load latest data on mount
  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bookings.filter((note) => {
      return (
        !q ||
        [
          note.lrNumber,
          note.bookingNo,
          note.consignorName,
          note.consigneeName,
          note.fromLocation,
          note.toLocation,
          note.vehicleNumber,
          note.freightType,
        ].some((v) => (v || "").toLowerCase().includes(q))
      );
    });
  }, [bookings, search]);

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

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      
      <PageHeader
        title="Booking Records"
        description="Complete register of all generated digital Bookings."
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filtered.map((n) => {
                  const totals = (n.items ?? []).reduce(
                    (acc, item) => ({
                      packages: acc.packages + Number(item.noOfPackages || 0),
                      netWeight: acc.netWeight + Number(item.netWeight || 0),
                      grossWeight: acc.grossWeight + Number(item.grossWeight || 0),
                      invoiceValue: acc.invoiceValue + Number(item.invoiceValue || 0),
                    }),
                    { packages: 0, netWeight: 0, grossWeight: 0, invoiceValue: 0 },
                  );
                  return {
                    "LR Number": n.lrNumber,
                    "LR Date": formatDate(n.lrDate || ""),
                    Branch: n.branch,
                    Status: n.status,
                    "Consignor Name": n.consignorName,
                    "Consignor Address": n.consignorAddress,
                    "Consignor GST": n.consignorGst,
                    "Consignee Name": n.consigneeName,
                    "Consignee Address": n.consigneeAddress,
                    "Consignee GST": n.consigneeGst,
                    "From Location": n.fromLocation,
                    "To Location": n.toLocation,
                    "Freight Type": n.freightType,
                    "Insurance Type": n.insuranceType,
                    "Demand No": n.demandNo,
                    "Shipment No": n.shipmentNo,
                    "Customer No": n.custNo,
                    "Schedule No": n.schNo,
                    "Vehicle Number": n.vehicleNumber,
                    "Total Packages": totals.packages,
                    "Total Net Weight": totals.netWeight,
                    "Total Gross Weight": totals.grossWeight,
                    "Total Invoice Value": totals.invoiceValue,
                    "Demurrage Chargeable After (Days)": n.demurrageDays,
                    "Demurrage Rate": n.demurrageRate,
                    "Demurrage Charge Basis": n.chargeBasis,
                    "Demurrage Remarks": n.demurrageRemarks,
                    "Driver Name": n.driverName,
                    "Driver Mobile": n.driverMobile,
                    Advance: n.advance,
                    Balance: n.balance,
                    "Delivery Type": n.deliveryType,
                    "GST Paid By": n.gstPaidBy,
                    Narration: n.narration,
                    "Line Items": (n.items || [])
                      .map((i) => `${i.description} (${i.noOfPackages} pkg, ${i.netWeight} wt)`)
                      .join(" | "),
                  };
                });
                exportToExcel("booking_register.xlsx", exportData, "Bookings");
                toast.success("Exported to Excel.");
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase px-5 py-2.5 rounded-full shadow-md cursor-pointer flex items-center gap-2 border border-emerald-200 transition-colors"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <Button
              className="h-10 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              onClick={() => navigate({ to: "/booking-entry", search: { editId: undefined } })}
            >
              <Plus className="h-4.5 w-4.5" /> New Booking
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
        searchPlaceholder="Search by LR number, consignor, consignee, route, vehicle…"
      />

      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No booking records found"
            description={
              search
                ? "Try adjusting your search criteria."
                : "Create your first Booking to get started."
            }
            actionLabel={search ? undefined : "New Booking"}
            onAction={() => navigate({ to: "/booking-entry", search: { editId: undefined } })}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">LR Date</th>
                <th className="px-4 py-3">LR Number</th>
                <th className="px-4 py-3">Consignor</th>
                <th className="px-4 py-3">Consignee</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vehicle No</th>
                <th className="px-4 py-3 text-right">Freight Type</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {paged.map((note) => (
                <tr key={note.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(note.lrDate || "")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">
                    <div>{note.lrNumber}</div>
                    <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {note.lastEditedBy ? (
                            <>
                              Edited by {note.lastEditedBy}{" "}
                              {note.lastEditedAt ? `(${new Date(note.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : note.createdBy ? (
                            <>
                              Created by {note.createdBy}{" "}
                              {note.createdAt ? `(${new Date(note.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : note.created_at ? `(${new Date(note.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{note.consignorName}</td>
                  <td className="px-4 py-3 text-foreground">{note.consigneeName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {note.fromLocation} ➜ {note.toLocation}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {note.vehicleNumber}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-700">
                    {note.freightType}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {/* View — navigates to full page */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="View full details"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate({ to: "/booking-view", search: { id: note.id } })}
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
                          navigate({ to: "/booking-entry", search: { editId: note.id } })
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
                            if (confirm("Are you sure you want to delete this Booking?")) {
                              await deleteBooking(note.id);
                              toast.success("Booking deleted successfully");
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

      {filtered.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{(safePage - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium text-foreground">
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filtered.length}</span>
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
