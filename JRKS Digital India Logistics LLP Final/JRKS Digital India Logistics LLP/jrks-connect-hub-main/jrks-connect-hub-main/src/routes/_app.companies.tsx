import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, MoreHorizontal, Pencil, Trash2, Phone, Eye } from "lucide-react";
import { toast } from "sonner";

import { useMasterStore, type Company, type BillingParty } from "@/lib/master-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { FormSection, TextField, TextAreaField, SelectField } from "@/components/form-kit";
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

export const Route = createFileRoute("/_app/companies")({
  head: () => ({
    meta: [
      { title: "Company Master — JRKS Logistics ERP" },
      { name: "description", content: "Manage consignee, consignor and billing party records." },
    ],
  }),
  component: CompanyMaster,
});

const BILLING_PARTIES: BillingParty[] = ["Consignee", "Consignor", "Third Party"];

type CompanyForm = Omit<Company, "id" | "createdAt">;
const emptyForm: CompanyForm = {
  consigneeName: "",
  address: "",
  contactPerson: "",
  mobileNumber: "",
  gstNumber: "",
  panNumber: "",
  billingParty: "Consignee",
  active: true,
};

import { getIsAdmin } from "@/lib/auth";

function CompanyMaster() {
  const isAdmin = getIsAdmin();

  const { companies, addCompany, updateCompany, deleteCompany } = useMasterStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewRecord = viewId ? (companies.find((c) => c.id === viewId) ?? null) : null;

  const set = <K extends keyof CompanyForm>(k: K, v: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companies.filter((c) => {
      const matchQ =
        !q ||
        [c.consigneeName, c.contactPerson, c.mobileNumber, c.gstNumber].some((v) =>
          v.toLowerCase().includes(q),
        );
      const matchS = filter === "all" || (filter === "active" ? c.active : !c.active);
      return matchQ && matchS;
    });
  }, [companies, search, filter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (c: Company) => {
    setEditingId(c.id);
    const { id, createdAt, ...rest } = c;
    setForm(rest);
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.consigneeName.trim()) e.consigneeName = "Consignee name is required";
    if (!form.contactPerson.trim()) e.contactPerson = "Contact person is required";
    if (!/^\d{10}$/.test(form.mobileNumber))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (form.gstNumber && form.gstNumber.length !== 15)
      e.gstNumber = "GST number must be 15 characters";
    if (form.panNumber && form.panNumber.length !== 10)
      e.panNumber = "PAN number must be 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const finalPan = form.panNumber
      ? form.panNumber.toUpperCase()
      : form.gstNumber && form.gstNumber.length >= 12
      ? form.gstNumber.substring(2, 12).toUpperCase()
      : "";

    const payload = {
      ...form,
      gstNumber: form.gstNumber.toUpperCase(),
      panNumber: finalPan,
    };
    if (editingId) {
      updateCompany(editingId, payload);
      toast.success("Company updated successfully.");
    } else {
      addCompany(payload);
      toast.success("Company added successfully.");
    }
    setOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      "companies.csv",
      [
        "Consignee Name",
        "Address",
        "Contact Person",
        "Mobile",
        "GST Number",
        "Billing Party",
        "Status",
      ],
      filtered.map((c) => [
        c.consigneeName,
        c.address,
        c.contactPerson,
        c.mobileNumber,
        c.gstNumber,
        c.billingParty,
        c.active ? "Active" : "Inactive",
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Master"
        description="Consignees, consignors and third-party billing entities."
        icon={<Building2 className="h-5 w-5" />}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search company, contact, GST…"
        onAdd={openAdd}
        addLabel="Add Company"
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
            title="No companies found"
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first company to get started."
            }
            actionLabel={search || filter !== "all" ? undefined : "Add Company"}
            onAction={openAdd}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Consignee Name</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Contact Person</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">GST Number</th>
                <th className="px-4 py-3">PAN Number</th>
                <th className="px-4 py-3">Billing Party</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{c.consigneeName}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                    {c.address}
                  </td>
                  <td className="px-4 py-3 text-foreground">{c.contactPerson}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {c.mobileNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {c.gstNumber || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {c.panNumber || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {c.billingParty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ActiveBadge active={c.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setViewId(c.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => openEdit(c)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(c.id)}
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
                <DialogTitle className="text-blue-900">Company Details</DialogTitle>
                <DialogDescription className="text-blue-600 text-xs">
                  {viewRecord?.consigneeName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewRecord && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Company Name
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {viewRecord.consigneeName}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Address
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line">
                    {viewRecord.address || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Contact Person
                  </p>
                  <p className="text-sm text-foreground">{viewRecord.contactPerson || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Mobile
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {viewRecord.mobileNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    GST Number
                  </p>
                  <p className="text-sm font-mono text-foreground">{viewRecord.gstNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    PAN Number
                  </p>
                  <p className="text-sm font-mono text-foreground">{viewRecord.panNumber || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Billing Party
                  </p>
                  <span className="inline-block rounded-full bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-0.5">
                    {viewRecord.billingParty}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-block rounded-full text-xs font-semibold px-3 py-0.5 ${viewRecord.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`}
                  >
                    {viewRecord.active ? "Active" : "Inactive"}
                  </span>
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
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{editingId ? "Edit Company" : "Add Company"}</DialogTitle>
            <DialogDescription>Capture company and billing party details.</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6">
            <FormSection title="Company Information">
              <TextField
                label="Consignee Name"
                value={form.consigneeName}
                onChange={(v) => set("consigneeName", v)}
                placeholder="Company name"
                required
                error={errors.consigneeName}
                full
              />
              <TextAreaField
                label="Address"
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Full address"
              />
              <TextField
                label="Contact Person Name"
                value={form.contactPerson}
                onChange={(v) => set("contactPerson", v)}
                placeholder="Contact person"
                required
                error={errors.contactPerson}
              />
              <TextField
                label="Mobile Number"
                value={form.mobileNumber}
                onChange={(v) => set("mobileNumber", v)}
                placeholder="10-digit number"
                required
                error={errors.mobileNumber}
              />
              <TextField
                label="GST Number"
                value={form.gstNumber}
                onChange={(v) => set("gstNumber", v)}
                placeholder="15-character GSTIN"
                error={errors.gstNumber}
              />
              <TextField
                label="PAN Number"
                value={form.panNumber || ""}
                onChange={(v) => set("panNumber", v)}
                placeholder="10-character PAN"
                error={errors.panNumber}
              />
              <SelectField
                label="Billing Party"
                value={form.billingParty}
                onChange={(v) => set("billingParty", v as BillingParty)}
                options={BILLING_PARTIES}
                required
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
            <Button onClick={submit}>{editingId ? "Save Changes" : "Add Company"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this company?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteCompany(deleteId);
                  toast.success("Company deleted.");
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
