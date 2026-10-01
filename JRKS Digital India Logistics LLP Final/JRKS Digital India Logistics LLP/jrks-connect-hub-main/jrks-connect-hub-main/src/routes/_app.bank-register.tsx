import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Banknote, ArrowUpCircle, ArrowDownCircle, IndianRupee } from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { SummaryCard, inr } from "@/components/ops-ui";
import { exportToCsv, formatDate } from "@/lib/export";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/bank-register")({
  head: () => ({
    meta: [
      { title: "Daily Bank Register — JRKS Logistics ERP" },
      { name: "description", content: "Track daily bank transactions." },
    ],
  }),
  component: BankRegister,
});

function BankRegister() {
  const { bankTxns } = useOpsStore();
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("all");

  const banks = useMemo(() => Array.from(new Set(bankTxns.map((t) => t.bankName))), [bankTxns]);

  // Running balance computed in chronological order across all txns.
  const withBalance = useMemo(() => {
    const sorted = [...bankTxns].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    return sorted.map((t) => {
      bal += t.credit - t.debit;
      return { ...t, balance: bal };
    });
  }, [bankTxns]);

  const totals = useMemo(() => {
    const credit = bankTxns.reduce((s, t) => s + t.credit, 0);
    const debit = bankTxns.reduce((s, t) => s + t.debit, 0);
    return { credit, debit, balance: credit - debit };
  }, [bankTxns]);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...withBalance].reverse().filter((t) => {
      const matchQ = !q || [t.bankName, t.description].some((v) => v.toLowerCase().includes(q));
      const matchB = bank === "all" || t.bankName === bank;
      return matchQ && matchB;
    });
  }, [withBalance, search, bank]);

  const handleExport = () => {
    exportToCsv(
      "daily-bank-register.csv",
      ["Date", "Bank Name", "Description", "Credit", "Debit", "Balance"],
      rows.map((t) => [
        formatDate(t.date),
        t.bankName,
        t.description,
        t.credit,
        t.debit,
        t.balance,
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Daily Bank Register"
        description="All bank credits, debits and running balance."
        icon={<Banknote className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SummaryCard
          label="Total Credits"
          value={inr(totals.credit)}
          icon={ArrowUpCircle}
          tone="green"
        />
        <SummaryCard
          label="Total Debits"
          value={inr(totals.debit)}
          icon={ArrowDownCircle}
          tone="rose"
        />
        <SummaryCard
          label="Current Balance"
          value={inr(totals.balance)}
          icon={IndianRupee}
          tone="blue"
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search bank, description…"
        onExport={handleExport}
        filter={
          <Select value={bank} onValueChange={setBank}>
            <SelectTrigger className="h-10 w-[170px] bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Banks</SelectItem>
              {banks.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <TableCard>
        {rows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Bank transactions will appear here."
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bank Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.date)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{t.bankName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">
                    {t.credit ? inr(t.credit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">
                    {t.debit ? inr(t.debit) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                    {inr(t.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  );
}
