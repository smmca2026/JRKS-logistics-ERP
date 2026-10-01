import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Coins, ArrowUpCircle, ArrowDownCircle, IndianRupee } from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { SummaryCard, inr } from "@/components/ops-ui";
import { exportToCsv, formatDate } from "@/lib/export";

export const Route = createFileRoute("/_app/cash-register")({
  head: () => ({
    meta: [
      { title: "Cash Register — JRKS Logistics ERP" },
      { name: "description", content: "Track daily cash movement." },
    ],
  }),
  component: CashRegister,
});

function CashRegister() {
  const { cashTxns, cashOpening } = useOpsStore();
  const [search, setSearch] = useState("");

  const withBalance = useMemo(() => {
    const sorted = [...cashTxns].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    return sorted.map((t) => {
      bal += t.receipt - t.payment;
      return { ...t, balance: bal };
    });
  }, [cashTxns]);

  const totals = useMemo(() => {
    const cashIn = cashTxns.reduce((s, t) => s + t.receipt, 0);
    const cashOut = cashTxns.reduce((s, t) => s + t.payment, 0);
    return { opening: cashOpening, cashIn, cashOut, closing: cashIn - cashOut };
  }, [cashTxns, cashOpening]);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...withBalance].reverse().filter((t) => !q || t.description.toLowerCase().includes(q));
  }, [withBalance, search]);

  const handleExport = () => {
    exportToCsv(
      "cash-register.csv",
      ["Date", "Description", "Receipt", "Payment", "Balance"],
      rows.map((t) => [formatDate(t.date), t.description, t.receipt, t.payment, t.balance]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      
      <PageHeader
        title="Cash Register"
        description="Daily cash receipts, payments and closing balance."
        icon={<Coins className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Opening Balance"
          value={inr(totals.opening)}
          icon={IndianRupee}
          tone="slate"
        />
        <SummaryCard label="Cash In" value={inr(totals.cashIn)} icon={ArrowUpCircle} tone="green" />
        <SummaryCard
          label="Cash Out"
          value={inr(totals.cashOut)}
          icon={ArrowDownCircle}
          tone="rose"
        />
        <SummaryCard label="Closing Balance" value={inr(totals.closing)} icon={Coins} tone="blue" />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search description…"
        onExport={handleExport}
      />

      <TableCard>
        {rows.length === 0 ? (
          <EmptyState
            title="No cash entries found"
            description="Daily cash movement will appear here."
          />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Receipt</th>
                <th className="px-4 py-3 text-right">Payment</th>
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
                  <td className="px-4 py-3 text-foreground">{t.description}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-success">
                    {t.receipt ? inr(t.receipt) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">
                    {t.payment ? inr(t.payment) : "—"}
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
