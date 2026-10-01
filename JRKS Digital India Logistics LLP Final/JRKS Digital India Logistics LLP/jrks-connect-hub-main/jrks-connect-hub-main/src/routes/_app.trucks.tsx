import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Truck as TruckIcon, MoreHorizontal, Pencil, Trash2, Phone, Eye } from "lucide-react";
import { toast } from "sonner";

import {
  useMasterStore,
  truckStatus,
  docStatus,
  type Truck,
  type VehicleType,
} from "@/lib/master-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { FormSection, TextField, TextAreaField, SelectField } from "@/components/form-kit";
import { StatusBadge } from "@/components/status-badge";
import { exportToCsv, formatDate } from "@/lib/export";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_app/trucks")({
  head: () => ({
    meta: [
      { title: "Market Truck Master — JRKS Logistics ERP" },
      { name: "description", content: "Manage market truck owner and vehicle document records." },
    ],
  }),
  component: TruckMaster,
});

const VEHICLE_TYPES: VehicleType[] = [
  "LCV",
  "Lorry",
  "Taurus",
  "Trailer",
  "container SXL",
  "container XXL",
];

type TruckForm = Omit<Truck, "id" | "createdAt">;

const emptyDoc = { number: "", validUpto: "" };
const emptyForm: TruckForm = {
  vehicleNumber: "",
  ownerName: "",
  address: "",
  mobileNumber: "",
  panCard: "",
  aadharNumber: "",
  accountNumber: "",
  vehicleType: "Lorry",
  engineNumber: "",
  chassisNumber: "",
  nationalPermit: { ...emptyDoc },
  insurance: { ...emptyDoc },
  pollution: { ...emptyDoc },
  taxReceipt: { ...emptyDoc },
  fitness: { ...emptyDoc },
};

import { getIsAdmin } from "@/lib/auth";

function TruckMaster() {
  const isAdmin = getIsAdmin();

  const { trucks, addTruck, updateTruck, deleteTruck } = useMasterStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TruckForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewRecord = viewId ? (trucks.find((t) => t.id === viewId) ?? null) : null;

  const set = <K extends keyof TruckForm>(k: K, v: TruckForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const setDoc = (
    k: "nationalPermit" | "insurance" | "pollution" | "taxReceipt" | "fitness",
    field: "number" | "validUpto",
    v: string,
  ) => setForm((f) => ({ ...f, [k]: { ...f[k], [field]: v } }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return trucks.filter((t) => {
      const matchQ =
        !q ||
        [t.vehicleNumber, t.ownerName, t.mobileNumber, t.vehicleType].some((v) =>
          v.toLowerCase().includes(q),
        );
      const matchS = statusFilter === "all" || truckStatus(t) === statusFilter;
      return matchQ && matchS;
    });
  }, [trucks, search, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (t: Truck) => {
    setEditingId(t.id);
    const { id, createdAt, ...rest } = t;
    setForm(rest);
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.vehicleNumber.trim()) e.vehicleNumber = "Vehicle number is required";
    if (!form.ownerName.trim()) e.ownerName = "Owner name is required";
    if (!/^\d{10}$/.test(form.mobileNumber))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    if (form.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.panCard.toUpperCase()))
      e.panCard = "Invalid PAN format (e.g. ABCDE1234F)";
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber))
      e.aadharNumber = "Aadhaar number must be a 12-digit number";
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
      vehicleNumber: form.vehicleNumber.toUpperCase(),
    };
    if (editingId) {
      updateTruck(editingId, payload);
      toast.success("Market Truck updated successfully.");
    } else {
      addTruck(payload);
      toast.success("Market Truck added successfully.");
    }
    setOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTruck(deleteId);
      toast.success("Market Truck deleted.");
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    exportToCsv(
      "market-trucks.csv",
      [
        "Vehicle Number",
        "Owner Name",
        "Mobile",
        "PAN Card",
        "Aadhaar Number",
        "Vehicle Type",
        "National Permit",
        "Insurance Validity",
        "Fitness Validity",
        "Status",
      ],
      filtered.map((t) => [
        t.vehicleNumber,
        t.ownerName,
        t.mobileNumber,
        t.panCard,
        t.aadharNumber || "",
        t.vehicleType,
        t.nationalPermit.number,
        t.insurance.validUpto,
        t.fitness.validUpto,
        truckStatus(t),
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Truck Master"
        description="Owner details, vehicle information and statutory document tracking."
        icon={<TruckIcon className="h-5 w-5" />}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search vehicle, owner, mobile…"
        onAdd={openAdd}
        addLabel="Add Market Truck"
        filter={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[160px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <TableCard>
        {filtered.length === 0 ? (
          <EmptyState
            title="No market trucks found"
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first market truck to get started."
            }
            actionLabel={search || statusFilter !== "all" ? undefined : "Add Market Truck"}
            onAction={openAdd}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Vehicle Number</th>
                <th className="px-4 py-3">Owner Name</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Nat. Permit</th>
                <th className="px-4 py-3">Insurance Validity</th>
                <th className="px-4 py-3">Fitness Validity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{t.vehicleNumber}</td>
                  <td className="px-4 py-3 text-foreground">
                    <div>
                      <div className="font-semibold">{t.ownerName}</div>
                      {t.panCard || t.aadharNumber ? (
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {t.panCard ? `PAN: ${t.panCard}` : ""}
                          {t.panCard && t.aadharNumber ? " | " : ""}
                          {t.aadharNumber ? `Aadhaar: ${t.aadharNumber}` : ""}
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {t.mobileNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {t.vehicleType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.nationalPermit.number || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        docStatus(t.insurance.validUpto) !== "active"
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {formatDate(t.insurance.validUpto)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        docStatus(t.fitness.validUpto) !== "active"
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {formatDate(t.fitness.validUpto)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={truckStatus(t)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-[10px] text-slate-500 font-normal font-sans mt-0.5 whitespace-nowrap">
                          {t.lastEditedBy ? (
                            <>
                              Edited by {t.lastEditedBy}{" "}
                              {t.lastEditedAt ? `(${new Date(t.lastEditedAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : t.createdBy ? (
                            <>
                              Created by {t.createdBy}{" "}
                              {t.createdAt ? `(${new Date(t.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")})` : t.created_at ? `(${new Date(t.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")})` : ""}
                            </>
                          ) : null}
                        </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setViewId(t.id)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        onClick={() => openEdit(t)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteId(t.id)}
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
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <DialogHeader className="border-b border-border px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-blue-900">Market Truck Details</DialogTitle>
                <DialogDescription className="text-blue-600 text-xs font-mono">
                  {viewRecord?.vehicleNumber}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewRecord && (
            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Owner & Vehicle
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Vehicle Number
                    </p>
                    <p className="text-sm font-bold font-mono text-foreground">
                      {viewRecord.vehicleNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Owner Name</p>
                    <p className="text-sm font-semibold text-foreground">{viewRecord.ownerName}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Address</p>
                    <p className="text-sm text-foreground">{viewRecord.address || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Mobile</p>
                    <p className="text-sm font-mono text-foreground">{viewRecord.mobileNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">PAN Card</p>
                    <p className="text-sm font-mono text-foreground">{viewRecord.panCard || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Aadhaar Number
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.aadharNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">Vehicle Type</p>
                    <span className="inline-block rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {viewRecord.vehicleType}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Engine Number
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.engineNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">
                      Chassis Number
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {viewRecord.chassisNumber || "—"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Documents
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "National Permit", doc: viewRecord.nationalPermit },
                    { label: "Insurance", doc: viewRecord.insurance },
                    { label: "Pollution", doc: viewRecord.pollution },
                    { label: "Tax Receipt", doc: viewRecord.taxReceipt },
                    { label: "Fitness", doc: viewRecord.fitness },
                  ].map(({ label, doc }) => (
                    <div key={label} className="bg-muted/40 rounded-lg p-2.5 border border-border/40">
                      <p className="font-bold text-muted-foreground mb-1">{label}</p>
                      <p className="font-mono text-foreground">{doc.number || "—"}</p>
                      <p className="text-muted-foreground mt-0.5">
                        Valid: {doc.validUpto ? formatDate(doc.validUpto) : "—"}
                      </p>
                    </div>
                  ))}
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

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{editingId ? "Edit Market Truck" : "Add Market Truck"}</DialogTitle>
            <DialogDescription>
              Capture owner, vehicle and statutory document details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 px-6 py-6">
            <FormSection title="Basic Information" description="Owner and vehicle identity">
              <TextField
                label="Vehicle Number"
                value={form.vehicleNumber}
                onChange={(v) => set("vehicleNumber", v)}
                placeholder="TN 38 BC 4521"
                required
                error={errors.vehicleNumber}
              />
              <TextField
                label="Owner Name"
                value={form.ownerName}
                onChange={(v) => set("ownerName", v)}
                placeholder="Rajesh Kumar"
                required
                error={errors.ownerName}
              />
              <TextAreaField
                label="Address"
                value={form.address}
                onChange={(v) => set("address", v)}
                placeholder="Full address"
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
                label="PAN Card Number"
                value={form.panCard}
                onChange={(v) => set("panCard", v)}
                placeholder="ABCDE1234F"
                error={errors.panCard}
              />
              <TextField
                label="Aadhaar Number"
                value={form.aadharNumber || ""}
                onChange={(v) => set("aadharNumber", v)}
                placeholder="12-digit Aadhaar number"
                error={errors.aadharNumber}
              />
              <SelectField
                label="Vehicle Type"
                value={form.vehicleType}
                onChange={(v) => set("vehicleType", v as VehicleType)}
                options={VEHICLE_TYPES}
                required
              />
              <TextField
                label="Vehicle Engine Number"
                value={form.engineNumber}
                onChange={(v) => set("engineNumber", v)}
                placeholder="Engine number"
              />
              <TextField
                label="Chassis Number"
                value={form.chassisNumber}
                onChange={(v) => set("chassisNumber", v)}
                placeholder="Chassis number"
              />
            </FormSection>

            <FormSection
              title="Document Information"
              description="Statutory validity is tracked automatically"
            >
              <TextField
                label="National Permit Number"
                value={form.nationalPermit.number}
                onChange={(v) => setDoc("nationalPermit", "number", v)}
              />
              <TextField
                label="National Permit — Valid Up To"
                type="date"
                value={form.nationalPermit.validUpto}
                onChange={(v) => setDoc("nationalPermit", "validUpto", v)}
              />
              <TextField
                label="Insurance Policy Number"
                value={form.insurance.number}
                onChange={(v) => setDoc("insurance", "number", v)}
              />
              <TextField
                label="Insurance — Valid Up To"
                type="date"
                value={form.insurance.validUpto}
                onChange={(v) => setDoc("insurance", "validUpto", v)}
              />
              <TextField
                label="Pollution Certificate Number"
                value={form.pollution.number}
                onChange={(v) => setDoc("pollution", "number", v)}
              />
              <TextField
                label="Pollution — Valid Up To"
                type="date"
                value={form.pollution.validUpto}
                onChange={(v) => setDoc("pollution", "validUpto", v)}
              />
              <TextField
                label="Tax Receipt Number"
                value={form.taxReceipt.number}
                onChange={(v) => setDoc("taxReceipt", "number", v)}
              />
              <TextField
                label="Tax Receipt — Valid Up To"
                type="date"
                value={form.taxReceipt.validUpto}
                onChange={(v) => setDoc("taxReceipt", "validUpto", v)}
              />
              <TextField
                label="Fitness Certificate Number"
                value={form.fitness.number}
                onChange={(v) => setDoc("fitness", "number", v)}
              />
              <TextField
                label="Fitness — Valid Up To"
                type="date"
                value={form.fitness.validUpto}
                onChange={(v) => setDoc("fitness", "validUpto", v)}
              />
            </FormSection>
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Save Changes" : "Add Market Truck"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this market truck?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The market truck record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
