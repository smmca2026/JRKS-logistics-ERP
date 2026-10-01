import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Handshake, MoreHorizontal, Pencil, Trash2, Phone, MessageCircle, Eye } from "lucide-react";
import { toast } from "sonner";

import { useMasterStore, type Broker } from "@/lib/master-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { FormSection, TextField, TextAreaField } from "@/components/form-kit";
import { ActiveBadge } from "@/components/status-badge";
import { exportToCsv } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/brokers")({
  head: () => ({
    meta: [
      { title: "Lorry Vendor Master — JRKS Logistics ERP" },
      { name: "description", content: "Manage lorry vendor contact and bank records." },
    ],
  }),
  component: BrokerMaster,
});

type BrokerForm = Omit<Broker, "id" | "createdAt">;
const emptyForm: BrokerForm = {
  brokerName: "",
  address: "",
  contactPerson: "",
  mobileNumber: "",
  whatsappNumber: "",
  panCard: "",
  aadharCard: "",
  gstNumber: "",
  accountNumber: "",
  bankName: "",
  branch: "",
  ifsc: "",
  active: true,
};

import { getIsAdmin } from "@/lib/auth";

function BrokerMaster() {
  const isAdmin = getIsAdmin();

  const { brokers, addBroker, updateBroker, deleteBroker } = useMasterStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BrokerForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewRecord = viewId ? (brokers.find((b) => b.id === viewId) ?? null) : null;

  const set = <K extends keyof BrokerForm>(k: K, v: BrokerForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return brokers.filter((b) => {
      const matchQ =
        !q ||
        [b.brokerName, b.contactPerson, b.mobileNumber, b.panCard, b.bankName].some((v) =>
          v.toLowerCase().includes(q),
        );
      const matchS = filter === "all" || (filter === "active" ? b.active : !b.active);
      return matchQ && matchS;
    });
  }, [brokers, search, filter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (b: Broker) => {
    setEditingId(b.id);
    const { id, createdAt, ...rest } = b;
    setForm({ ...rest, gstNumber: rest.gstNumber ?? "" });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.brokerName.trim()) e.brokerName = "Lorry Vendor name is required";
    if (!form.contactPerson.trim()) e.contactPerson = "Contact person is required";
    if (!/^\d{10}$/.test(form.mobileNumber))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (form.whatsappNumber && !/^\d{10}$/.test(form.whatsappNumber))
      e.whatsappNumber = "Enter a valid 10-digit number";
    if (form.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panCard.toUpperCase()))
      e.panCard = "Invalid PAN format";
    if (form.aadharCard && !/^\d{12}$/.test(form.aadharCard))
      e.aadharCard = "Aadhaar number must be a 12-digit number";
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase()))
      e.ifsc = "Invalid IFSC";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const payload = {
      ...form,
      panCard: form.panCard.toUpperCase(),
      ifsc: form.ifsc.toUpperCase(),
      gstNumber: form.gstNumber?.toUpperCase(),
    };
    if (editingId) {
      updateBroker(editingId, payload);
      toast.success("Lorry Vendor updated successfully.");
    } else {
      addBroker(payload);
      toast.success("Lorry Vendor added successfully.");
    }
    setOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      "lorry-vendors.csv",
      [
        "Lorry Vendor Name",
        "Contact Person",
        "Mobile",
        "WhatsApp",
        "PAN",
        "Aadhaar",
        "GST",
        "Bank Name",
        "Status",
      ],
      filtered.map((b) => [
        b.brokerName,
        b.contactPerson,
        b.mobileNumber,
        b.whatsappNumber,
        b.panCard,
        b.aadharCard || "",
        b.gstNumber || "",
        b.bankName,
        b.active ? "Active" : "Inactive",
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lorry Vendor Master"
        description="Transport lorry vendors with contact and settlement bank details."
        icon={<Handshake className="h-5 w-5" />}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search lorry vendor, contact, PAN, bank…"
        onAdd={openAdd}
        addLabel="Add Lorry Vendor"
        filter={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 w-[150px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No lorry vendors found"
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first lorry vendor to get started."
            }
            actionLabel={search || filter !== "all" ? undefined : "Add Lorry Vendor"}
            onAction={openAdd}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Lorry Vendor Name</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">PAN</th>
                <th className="px-4 py-3">GST</th>
                <th className="px-4 py-3">Bank Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{b.brokerName}</td>
                  <td className="px-4 py-3 text-foreground">{b.contactPerson}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {b.mobileNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageCircle className="h-3.5 w-3.5 text-success" />{" "}
                      {b.whatsappNumber || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    <div>
                      {b.panCard || "—"}
                      {b.aadharCard && (
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          Aadhaar: {b.aadharCard}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {b.gstNumber || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{b.bankName}</td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={b.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setViewId(b.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => openEdit(b)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(b.id)}
                          title="Delete"
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

      {/* View Details Dialog */}
      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-blue-900">Lorry Vendor Details</DialogTitle>
                <DialogDescription className="text-blue-600 text-xs">
                  {viewRecord?.brokerName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewRecord && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Contact Info
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Lorry Vendor Name
                    </p>
                    <p className="text-sm font-semibold text-foreground">{viewRecord.brokerName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Address</p>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {viewRecord.address || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Contact Person
                    </p>
                    <p className="text-sm text-foreground">{viewRecord.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Mobile</p>
                    <p className="text-sm font-mono text-foreground">{viewRecord.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">WhatsApp</p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.whatsappNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">GST Number</p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.gstNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">PAN Card</p>
                    <p className="text-sm font-mono text-foreground">{viewRecord.panCard || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Aadhaar Card</p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.aadharCard || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Status</p>
                    <span
                      className={`inline-block rounded-full text-xs font-semibold px-3 py-0.5 ${viewRecord.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                    >
                      {viewRecord.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Bank Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Account Number
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.accountNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Bank Name</p>
                    <p className="text-sm text-foreground">{viewRecord.bankName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Branch</p>
                    <p className="text-sm text-foreground">{viewRecord.branch || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">IFSC Code</p>
                    <p className="text-sm font-mono text-foreground">{viewRecord.ifsc || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewId(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setViewId(null);
                if (viewRecord) openEdit(viewRecord);
              }}
            >
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{editingId ? "Edit Lorry Vendor" : "Add Lorry Vendor"}</DialogTitle>
            <DialogDescription>
              Capture lorry vendor contact and bank settlement details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 px-6 py-6">
            <FormSection title="Lorry Vendor Information">
              <TextField
                label="Lorry Vendor Name"
                value={form.brokerName}
                onChange={(v) => set("brokerName", v)}
                placeholder="Lorry Vendor / agency name"
                required
                error={errors.brokerName}
              />
              <TextField
                label="Contact Person Name"
                value={form.contactPerson}
                onChange={(v) => set("contactPerson", v)}
                placeholder="Contact person"
                required
                error={errors.contactPerson}
              />
              <TextAreaField
                label="Address"
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Full address"
              />
              <TextField
                label="Contact Person Mobile Number"
                value={form.mobileNumber}
                onChange={(v) => set("mobileNumber", v)}
                placeholder="10-digit number"
                required
                error={errors.mobileNumber}
              />
              <TextField
                label="WhatsApp Number"
                value={form.whatsappNumber}
                onChange={(v) => set("whatsappNumber", v)}
                placeholder="10-digit number"
                error={errors.whatsappNumber}
              />
              <TextField
                label="PAN Card Number"
                value={form.panCard}
                onChange={(v) => set("panCard", v)}
                placeholder="ABCDE1234F"
                error={errors.panCard}
              />
              <TextField
                label="Aadhaar Number"
                value={form.aadharCard}
                onChange={(v) => set("aadharCard", v)}
                placeholder="12-digit Aadhaar number"
                error={errors.aadharCard}
              />
              <TextField
                label="GST Number"
                hint="(Optional)"
                value={form.gstNumber ?? ""}
                onChange={(v) => set("gstNumber", v)}
                placeholder="15-character GSTIN"
              />
            </FormSection>

            <FormSection title="Bank Details">
              <TextField
                label="Account Number"
                value={form.accountNumber}
                onChange={(v) => set("accountNumber", v)}
                placeholder="Account number"
              />
              <TextField
                label="Bank Name"
                value={form.bankName}
                onChange={(v) => set("bankName", v)}
                placeholder="Bank name"
              />
              <TextField
                label="Branch Name"
                value={form.branch}
                onChange={(v) => set("branch", v)}
                placeholder="Branch"
              />
              <TextField
                label="IFSC Code"
                value={form.ifsc}
                onChange={(v) => set("ifsc", v)}
                placeholder="UTIB0000456"
                error={errors.ifsc}
              />
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5 sm:col-span-2">
                <Label className="text-sm font-medium text-foreground">Active</Label>
                <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              </div>
            </FormSection>
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Save Changes" : "Add Lorry Vendor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lorry vendor?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteBroker(deleteId);
                  toast.success("Lorry Vendor deleted.");
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
