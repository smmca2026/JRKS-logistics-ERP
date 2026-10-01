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
  Lock,
} from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { useMasterStore } from "@/lib/master-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { formatDate, exportToExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/consignment-records")({
  head: () => ({
    meta: [
      { title: "Consignment Records — JRKS Logistics ERP" },
      { name: "description", content: "View and manage all generated Lorry Receipts (LR)." },
    ],
  }),
  component: ConsignmentRecords,
});

import { getIsAdmin } from "@/lib/auth";

const PAGE_SIZE = 6;

function ConsignmentRecords() {
  const isAdmin = getIsAdmin();

  const navigate = useNavigate();
  const { consignmentNotes, deleteConsignmentNote, bookings, moneyReceipts, loadData } = useOpsStore();
  const { companies } = useMasterStore();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const matchLr = (a?: string | null, b?: string | null) => {
    if (!a || !b) return false;
    const cleanA = a.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const cleanB = b.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    return cleanA === cleanB && cleanA.length > 0;
  };

  const enrichedNotes = useMemo(() => {
    return consignmentNotes.map((note) => {
      const matchedBooking = bookings.find(
        (b) =>
          matchLr(b.lrNo, note.lrNumber) ||
          matchLr(b.lrNumber, note.lrNumber) ||
          matchLr(b.bookingNo, note.consignmentNoteNo) ||
          matchLr(b.lrNo, note.consignmentNoteNo),
      );

      const resolvedConsignee = note.consigneeName || matchedBooking?.consigneeName || "";
      const resolvedConsignor = note.consignorName || matchedBooking?.consignorName || "";
      const resolvedVehicle = note.vehicleNumber || matchedBooking?.vehicleNumber || "";
      const resolvedFrom = note.fromLocation || matchedBooking?.loadingLocation || matchedBooking?.fromLocation || "";
      const resolvedTo = note.toLocation || matchedBooking?.unloadingLocation || matchedBooking?.toLocation || "";

      const targetLr = (note.lrNumber || note.consignmentNoteNo || "").trim().toLowerCase();
      const isLocked = Boolean(
        note.isLocked === 1 ||
        note.isLocked === true ||
        String(note.isLocked) === "1" ||
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

      return {
        ...note,
        isLocked,
        consigneeName: resolvedConsignee,
        consignorName: resolvedConsignor,
        vehicleNumber: resolvedVehicle,
        fromLocation: resolvedFrom,
        toLocation: resolvedTo,
      };
    });
  }, [consignmentNotes, bookings, moneyReceipts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return enrichedNotes.filter((note) => {
      return (
        !q ||
        [
          note.lrNumber,
          note.consignmentNoteNo,
          note.consignorName,
          note.consigneeName,
          note.fromLocation,
          note.toLocation,
          note.vehicleNumber,
          note.freightType,
        ].some((v) => (v || "").toLowerCase().includes(q))
      );
    });
  }, [enrichedNotes, search]);

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
        title="Consignment Records"
        description="Complete register of all generated digital Lorry Receipts (LR)."
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => {
                const exportData = filtered.map((c) => {
                  let consignorPan = c.consignorPan || "";
                  if (!consignorPan && c.consignorName) {
                    const comp = companies.find((comp) => comp.consigneeName === c.consignorName);
                    if (comp) consignorPan = comp.panNumber || "";
                  }

                  let consigneePan = c.consigneePan || "";
                  if (!consigneePan && c.consigneeName) {
                    const comp = companies.find((comp) => comp.consigneeName === c.consigneeName);
                    if (comp) consigneePan = comp.panNumber || "";
                  }

                  const totals = (c.items ?? []).reduce(
                    (acc, item) => ({
                      packages: acc.packages + Number(item.noOfPackages || 0),
                      netWeight: acc.netWeight + Number(item.netWeight || 0),
                      grossWeight: acc.grossWeight + Number(item.grossWeight || 0),
                      invoiceValue: acc.invoiceValue + Number(item.invoiceValue || 0),
                    }),
                    { packages: 0, netWeight: 0, grossWeight: 0, invoiceValue: 0 },
                  );

                  return {
                    "Consignment Note No": c.consignmentNoteNo,
                    "LR Number": c.lrNumber,
                    SAC: c.sac || "",
                    "LR Date": formatDate(c.lrDate || ""),
                    Branch: c.branch,
                    "Consignor Name": c.consignorName,
                    "Consignor Address": c.consignorAddress,
                    "Consignor GST": c.consignorGst,
                    "Consignor PAN": consignorPan,
                    "Consignee Name": c.consigneeName,
                    "Consignee Address": c.consigneeAddress,
                    "Consignee GST": c.consigneeGst,
                    "Consignee PAN": consigneePan,
                    "Insurance Type": c.insuranceType,
                    "From Location": c.fromLocation,
                    "To Location": c.toLocation,
                    "Vehicle Number": c.vehicleNumber,
                    "Vehicle Length": c.vehicleLength || "",
                    "Vehicle Width": c.vehicleWidth || "",
                    "Vehicle Height": c.vehicleHeight || "",
                    "Demand No": c.demandNo,
                    "Shipment No": c.shipmentNo,
                    "Cust No": c.custNo,
                    "Sch No": c.schNo,
                    "Freight Type": c.freightType,
                    "Total Packages": totals.packages,
                    "Total Net Weight": totals.netWeight,
                    "Total Gross Weight": totals.grossWeight,
                    "Total Invoice Value": totals.invoiceValue,
                    "Demurrage Chargeable After (Days)": c.demurrageDays,
                    "Demurrage Rate": c.demurrageRate,
                    "Demurrage Charge Basis": c.chargeBasis,
                    "Demurrage Remarks": c.demurrageRemarks,
                    "Bill No": c.billNo || "",
                    "Line Items": (c.items || [])
                      .map(
                        (i) =>
                          `${i.description} (${i.noOfPackages} pkg, ${i.netWeight} wt) [Inv: ${i.invoiceNoDcNo} Val: ${i.invoiceValue}]`,
                      )
                      .join(" | "),
                  };
                });
                exportToExcel("consignment_records.xlsx", exportData, "Consignments");
                toast.success("Exported to Excel.");
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs uppercase px-5 py-2.5 rounded-full shadow-md cursor-pointer flex items-center gap-2 border border-emerald-200 transition-colors"
            >
              <Download className="h-4 w-4" /> Excel
            </button>
            <Button
              className="h-10 bg-[#1E3A8A] hover:bg-blue-800 text-white font-extrabold text-xs uppercase px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
              onClick={() => navigate({ to: "/consignment-note", search: { editId: undefined } })}
            >
              <Plus className="h-4.5 w-4.5" /> New Consignment Note
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
            title="No consignment records found"
            description={
              search
                ? "Try adjusting your search criteria."
                : "Create your first Consignment Note (Lorry Receipt) to get started."
            }
            actionLabel={search ? undefined : "New Consignment Note"}
            onAction={() => navigate({ to: "/consignment-note", search: { editId: undefined } })}
          />
        ) : (
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="px-4 py-3">LR Date</th>
                <th className="px-4 py-3">LR Number</th>
                <th className="px-4 py-3">Consignor</th>
                <th className="px-4 py-3">Consignee</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3 text-right">Freight Type</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {paged.map((note) => (
                <tr key={note.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(note.lrDate)}</td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>{note.lrNumber}</span>
                      {note.isLocked ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
                          title="Locked: Money Receipt generated"
                        >
                          <Lock className="h-3 w-3 text-amber-700" /> Locked
                        </span>
                      ) : null}
                    </div>
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
                  <td className="px-4 py-3 font-semibold text-foreground">{note.consignorName || "—"}</td>
                  <td className="px-4 py-3 font-semibold text-blue-900">{note.consigneeName || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {note.fromLocation || "—"} ➜ {note.toLocation || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground font-bold">
                    <div>{note.vehicleNumber || "—"}</div>
                    {(note.vehicleLength || note.vehicleWidth || note.vehicleHeight) && (
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5 font-normal">
                        L:{note.vehicleLength || "-"} W:{note.vehicleWidth || "-"} H:{note.vehicleHeight || "-"}
                      </div>
                    )}
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
                        className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                        onClick={() =>
                          navigate({ to: "/consignment-view", search: { id: note.id } })
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={note.isLocked ? "View / Locked Note (Money Receipt generated)" : "Edit"}
                        className={`h-8 w-8 cursor-pointer ${note.isLocked ? 'text-amber-700 hover:text-amber-800 hover:bg-amber-50' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`}
                        onClick={() => {
                          navigate({ to: "/consignment-note", search: { editId: note.id } });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        title={note.isLocked ? "Cannot delete: Money Receipt exists" : "Delete"}
                        className={`h-8 w-8 cursor-pointer ${note.isLocked ? 'text-slate-300 hover:bg-transparent cursor-not-allowed' : 'text-destructive hover:bg-destructive/10'}`}
                        onClick={() => {
                          if (note.isLocked) {
                            toast.error(`Cannot delete LR #${note.lrNumber} because a Money Receipt has already been generated for it.`);
                            return;
                          }
                          if (confirm(`Are you sure you want to delete LR #${note.lrNumber}?`)) {
                            deleteConsignmentNote(note.id);
                            toast.success("LR deleted successfully");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
