import { createFileRoute } from "@tanstack/react-router";
import { Navigation, ExternalLink, Phone, MessageCircle, Smartphone, Truck } from "lucide-react";

import { PageHeader } from "@/components/master-ui";
import { Button } from "@/components/ui/button";

const logo = "/logo.png";

export const Route = createFileRoute("/_app/lorry-tracking")({
  head: () => ({
    meta: [
      { title: "Lorry Tracking — JRKS Logistics ERP" },
      {
        name: "description",
        content: "Live fleet telemetry and GPS tracking portal integration.",
      },
    ],
  }),
  component: LorryTrackingPage,
});

function LorryTrackingPage() {
  const handleTrack = () => {
    window.open("https://beta.roado.co.in/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6" style={{ zoom: 1.1 }}>

      <PageHeader
        title="Lorry Tracking"
        description="Live fleet telemetry and GPS tracking portal integration."
        icon={<Navigation className="h-5 w-5" />}
      />

      {/* ── GPS PORTAL CARD (Matching Screenshot) ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Truck className="h-12 w-12 sm:h-14 sm:w-14" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">Roado GPS Portal</h3>
            <p className="text-sm text-slate-500 leading-relaxed mt-2">
              Advanced tracking solution for fleets of all sizes.
              <br className="hidden sm:inline" />
              Live tracking, geofencing and more.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch justify-center md:items-end md:border-l md:border-slate-200 md:pl-8 min-w-[200px]">
          <Button
            onClick={handleTrack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open Tracking</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
