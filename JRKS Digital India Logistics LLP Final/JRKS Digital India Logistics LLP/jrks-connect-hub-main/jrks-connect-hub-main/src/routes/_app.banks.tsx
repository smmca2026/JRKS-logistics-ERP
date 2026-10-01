import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Landmark, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

import { useMasterStore, type BankAccount, type AccountType } from "@/lib/master-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { FormSection, TextField, SelectField } from "@/components/form-kit";
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

export const Route = createFileRoute("/_app/banks")({
  head: () => ({
    meta: [
      { title: "Bank Master — JRKS Logistics ERP" },
      { name: "description", content: "Manage bank account records used for settlements." },
    ],
  }),
  component: BankMaster,
});

const ACCOUNT_TYPES: AccountType[] = ["Savings", "Current", "Cash Credit"];

type BankForm = Omit<BankAccount, "id" | "createdAt">;
const emptyForm: BankForm = {
  accountHolder: "",
  accountNumber: "",
  accountType: "Savings",
  bankName: "",
  branch: "",
  ifsc: "",
  mobileNumber: "",
  active: true,
};

import { getIsAdmin } from "@/lib/auth";

function BankMaster() {
  const isAdmin = getIsAdmin();

  const { banks, addBank, updateBank, deleteBank } = useMasterStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewRecord = viewId ? (banks.find((b) => b.id === viewId) ?? null) : null;

  const set = <K extends keyof BankForm>(k: K, v: BankForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return banks.filter((b) => {
      const matchQ =
        !q ||
        [b.accountHolder, b.accountNumber, b.bankName, b.ifsc, b.branch].some((v) =>
          v.toLowerCase().includes(q),
        );
      const matchS = filter === "all" || (filter === "active" ? b.active : !b.active);
      return matchQ && matchS;
    });
  }, [banks, search, filter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };
  const openEdit = (b: BankAccount) => {
    setEditingId(b.id);
    const { id, createdAt, ...rest } = b;
    setForm(rest);
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.accountHolder.trim()) e.accountHolder = "Account holder is required";
    if (!/^\d{9,18}$/.test(form.accountNumber)) e.accountNumber = "Enter a valid account number";
    if (!form.bankName.trim()) e.bankName = "Bank name is required";
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase()))
      e.ifsc = "Invalid IFSC (e.g. HDFC0000123)";
    if (form.mobileNumber && !/^\d{10}$/.test(form.mobileNumber))
      e.mobileNumber = "Enter a valid 10-digit mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const payload = { ...form, ifsc: form.ifsc.toUpperCase() };
    if (editingId) {
      updateBank(editingId, payload);
      toast.success("Bank account updated successfully.");
    } else {
      addBank(payload);
      toast.success("Bank account added successfully.");
    }
    setOpen(false);
  };

  const handleExport = () => {
    exportToCsv(
      "bank-accounts.csv",
      [
        "Account Holder",
        "Account Number",
        "Account Type",
        "Bank Name",
        "Branch",
        "IFSC",
        "Mobile",
        "Status",
      ],
      filtered.map((b) => [
        b.accountHolder,
        b.accountNumber,
        b.accountType,
        b.bankName,
        b.branch,
        b.ifsc,
        b.mobileNumber,
        b.active ? "Active" : "Inactive",
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bank Master"
        description="Bank accounts used for payments and settlements."
        icon={<Landmark className="h-5 w-5" />}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search holder, account, bank, IFSC…"
        onAdd={openAdd}
        addLabel="Add Bank Account"
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
            title="No bank accounts found"
            description={
              search || filter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first bank account to get started."
            }
            actionLabel={search || filter !== "all" ? undefined : "Add Bank Account"}
            onAction={openAdd}
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Account Holder</th>
                <th className="px-4 py-3">Account Number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Bank Name</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">IFSC</th>
                <th className="px-4 py-3">Mobile</th>
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
                  <td className="px-4 py-3 font-semibold text-foreground">{b.accountHolder}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {b.accountNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {b.accountType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{b.bankName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.branch}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{b.ifsc}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.mobileNumber || "—"}</td>
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
                <DialogTitle className="text-blue-900">Bank Account Details</DialogTitle>
                <DialogDescription className="text-blue-600 text-xs">
                  {viewRecord?.accountHolder}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {viewRecord && (
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Account Holder
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {viewRecord.accountHolder}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Account Number
                  </p>
                  <p className="text-lg font-bold font-mono text-foreground tracking-widest">
                    {viewRecord.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Account Type
                  </p>
                  <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-xs font-medium">
                    {viewRecord.accountType}
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
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Bank Name
                  </p>
                  <p className="text-sm text-foreground">{viewRecord.bankName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Branch
                  </p>
                  <p className="text-sm text-foreground">{viewRecord.branch || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    IFSC Code
                  </p>
                  <p className="text-sm font-mono text-foreground">{viewRecord.ifsc || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Mobile
                  </p>
                  <p className="text-sm font-mono text-foreground">
                    {viewRecord.mobileNumber || "—"}
                  </p>
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
            <DialogTitle>{editingId ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle>
            <DialogDescription>Capture account and branch details.</DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6">
            <FormSection title="Account Information">
              <TextField
                label="Account Holder Name"
                value={form.accountHolder}
                onChange={(v) => set("accountHolder", v)}
                placeholder="Holder name"
                required
                error={errors.accountHolder}
              />
              <TextField
                label="Account Number"
                value={form.accountNumber}
                onChange={(v) => set("accountNumber", v)}
                placeholder="Account number"
                required
                error={errors.accountNumber}
              />
              <SelectField
                label="Account Type"
                value={form.accountType}
                onChange={(v) => set("accountType", v as AccountType)}
                options={ACCOUNT_TYPES}
                required
              />
              <TextField
                label="Bank Name"
                value={form.bankName}
                onChange={(v) => set("bankName", v)}
                placeholder="Bank name"
                required
                error={errors.bankName}
              />
              <TextField
                label="Branch Name"
                value={form.branch}
                onChange={(v) => set("branch", v)}
                placeholder="Branch"
              />
              <TextField
                label="IFSC Number"
                value={form.ifsc}
                onChange={(v) => set("ifsc", v)}
                placeholder="HDFC0000123"
                error={errors.ifsc}
              />
              <TextField
                label="Contact Person Mobile Number"
                value={form.mobileNumber}
                onChange={(v) => set("mobileNumber", v)}
                placeholder="10-digit number"
                error={errors.mobileNumber}
              />
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-2.5">
                <Label className="text-sm font-medium text-foreground">Active</Label>
                <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
              </div>
            </FormSection>
          </div>

          <DialogFooter className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Save Changes" : "Add Bank Account"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bank account?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteBank(deleteId);
                  toast.success("Bank account deleted.");
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
