import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Receipt, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

import { useOpsStore, type VoucherCode } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { FormSection, TextField, TextAreaField } from "@/components/form-kit";
import { ActiveBadge } from "@/components/status-badge";
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

export const Route = createFileRoute("/_app/voucher-code-master")({
  head: () => ({
    meta: [
      { title: "Voucher Code Master — JRKS Logistics ERP" },
      { name: "description", content: "Manage voucher expense codes and descriptions." },
    ],
  }),
  component: VoucherCodeMaster,
});

type VoucherCodeForm = Omit<VoucherCode, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">;
const emptyForm: VoucherCodeForm = {
  code: "",
  expenseAccountName: "",
  description: "",
  active: 1,
};

import { getIsAdmin } from "@/lib/auth";

function VoucherCodeMaster() {
  const isAdmin = getIsAdmin();

  const { voucherCodes, addVoucherCode, updateVoucherCode, deleteVoucherCode, loadVoucherCodes } = useOpsStore();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VoucherCodeForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadVoucherCodes();
  }, [loadVoucherCodes]);


  const set = <K extends keyof VoucherCodeForm>(k: K, v: VoucherCodeForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = voucherCodes.filter((c) => {
      const matchQ =
        !q ||
        [c.code, c.expenseAccountName].some((v) =>
          v.toLowerCase().includes(q),
        );
      return matchQ;
    });
    // Sort numerically by code
    return result.sort((a, b) => Number(a.code) - Number(b.code));
  }, [voucherCodes, search]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (c: VoucherCode) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      expenseAccountName: c.expenseAccountName,
      description: c.description,
      active: c.active,
    });
    setErrors({});
    setOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = "Voucher code is required";
    if (!form.expenseAccountName.trim()) e.expenseAccountName = "Expense account name is required";
    if (!form.description.trim()) e.description = "Description is required";
    
    // Check uniqueness on add
    if (!editingId && voucherCodes.some(v => v.code.toLowerCase() === form.code.toLowerCase().trim())) {
        e.code = "Voucher code already exists";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    let success = false;
    if (editingId) {
      success = await updateVoucherCode(editingId, form);
      if (success) toast.success("Voucher code updated successfully.");
    } else {
      success = await addVoucherCode(form);
      if (success) toast.success("Voucher code added successfully.");
    }
    setIsSubmitting(false);
    if (success) setOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const success = await deleteVoucherCode(deleteId);
    if (success) toast.success("Voucher code deleted successfully.");
    setDeleteId(null);
  };



  return (
    <div className="space-y-6">
      <PageHeader
        title="Voucher Code Master"
        description="Manage voucher expense codes."
        icon={<Receipt className="h-5 w-5" />}
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search by code or name..."

        onAdd={isAdmin ? openAdd : undefined}
      />

      <TableCard>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Expense Account Name</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{c.code}</td>
                    <td className="px-4 py-3">{c.expenseAccountName}</td>
                    <td className="px-4 py-3 max-w-xs truncate" title={c.description}>{c.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => openEdit(c)}
                              title="Edit Code"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteId(c.id)}
                              title="Delete Code"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No voucher codes found"
            description="Add a new voucher code or adjust your search filters."
            actionLabel={isAdmin ? "Add First Code" : undefined}
            onAction={isAdmin ? openAdd : undefined}
          />
        )}
      </TableCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Voucher Code" : "Add Voucher Code"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the voucher code details below." : "Enter details for the new voucher code."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <TextField
              label="Voucher Code"
              value={form.code}
              onChange={(v) => set("code", v)}
              error={errors.code}
              placeholder="e.g. 34"
              disabled={!!editingId}
              required
            />
            <TextField
              label="Expense Account Name"
              value={form.expenseAccountName}
              onChange={(v) => set("expenseAccountName", v)}
              error={errors.expenseAccountName}
              placeholder="e.g. NEW EXPENSE ACC"
              required
            />
            <TextAreaField
              label="Description"
              value={form.description}
              onChange={(v) => set("description", v)}
              error={errors.description}
              placeholder="Description of the expense..."
              required
              rows={3}
            />

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Voucher Code"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the voucher code from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
