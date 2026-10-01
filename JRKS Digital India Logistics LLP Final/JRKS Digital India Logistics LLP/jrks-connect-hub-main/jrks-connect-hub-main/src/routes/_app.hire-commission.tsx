import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Percent, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

import { useOpsStore } from "@/lib/ops-store";
import { PageHeader, Toolbar, TableCard, EmptyState } from "@/components/master-ui";
import { SummaryCard, PayStateBadge, inr } from "@/components/ops-ui";
import { exportToCsv } from "@/lib/export";

export const Route = createFileRoute("/_app/hire-commission")({
  head: () => ({
    meta: [
      { title: "Hire & Commission — JRKS Logistics ERP" },
      { name: "description", content: "Track transport hire charges and brokerage commission." },
    ],
  }),
  component: HireCommission,
});

function HireCommission() {
  const { bookings } = useOpsStore();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bookings.filter(
      (b) =>
        !q || [b.bookingNo, b.vehicleNumber, b.brokerName].some((v) => v.toLowerCase().includes(q)),
    );
  }, [bookings, search]);

  const totals = useMemo(() => {
    let hire = 0,
      commission = 0,
      pending = 0,
      paid = 0;
    for (const b of bookings) {
      hire += b.hireAmount;
      commission += b.commissionAmount;
      if (b.commissionPaid) paid += b.commissionAmount;
      else pending += b.commissionAmount;
    }
    return { hire, commission, pending, paid };
  }, [bookings]);

  const handleExport = () => {
    exportToCsv(
      "hire-commission.csv",
      [
        "Booking No",
        "Vehicle",
        "Broker",
        "Hire",
        "Commission",
        "Balance Payable",
        "Commission Status",
      ],
      rows.map((b) => [
        b.bookingNo,
        b.vehicleNumber,
        b.brokerName,
        b.hireAmount,
        b.commissionAmount,
        b.balanceAmount,
        b.commissionPaid ? "Paid" : "Pending",
      ]),
    );
    toast.success("Exported to CSV.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hire & Commission"
        description="Transport hire charges and brokerage commission tracking."
        icon={<Percent className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Hire Amount"
          value={inr(totals.hire)}
          icon={IndianRupee}
          tone="blue"
        />
        <SummaryCard
          label="Total Commission"
          value={inr(totals.commission)}
          icon={Percent}
          tone="violet"
        />
        <SummaryCard
          label="Pending Commission"
          value={inr(totals.pending)}
          icon={Clock}
          tone="amber"
        />
        <SummaryCard
          label="Paid Commission"
          value={inr(totals.paid)}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search booking, vehicle, broker…"
        onExport={handleExport}
      />

      <TableCard>
        {rows.length === 0 ? (
          <EmptyState title="No records found" description="Try adjusting your search." />
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Booking No</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Broker</th>
                <th className="px-4 py-3 text-right">Hire</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Balance Payable</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr
                  key={b.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">
                    {b.bookingNo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{b.vehicleNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.brokerName || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {inr(b.hireAmount)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {inr(b.commissionAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">
                    {inr(b.balanceAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <PayStateBadge
                      state={b.commissionPaid ? "cleared" : "pending"}
                      label={b.commissionPaid ? "Paid" : "Pending"}
                    />
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
