import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useOpsStore } from "@/lib/ops-store";
import { PageHeader } from "@/components/master-ui";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, SelectField, TextAreaField } from "@/components/form-kit";
import { PlusCircle, Search, Printer, Receipt, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/export";

export const Route = createFileRoute("/_app/outstanding/$type")({
  component: OutstandingAccounts,
});

function OutstandingAccounts() {
  const { type } = Route.useParams();
  const accountTypeFilter = type === "company" ? "Company" : "Lorry Vendor";
  
  const loadOutstandingSummaries = useOpsStore(s => s.loadOutstandingSummaries);
  const outstandingSummaries = useOpsStore(s => s.outstandingSummaries) || [];
  
  const loadLedger = useOpsStore(s => s.loadLedger);
  const ledgers = useOpsStore(s => s.ledgers) || {};
  
  const saveOpeningBalance = useOpsStore(s => s.saveOpeningBalance);
  const saveManualAdjustment = useOpsStore(s => s.saveManualAdjustment);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;
  
  // Modal states
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [openingForm, setOpeningForm] = useState({ date: new Date().toISOString().slice(0, 10), balanceType: "Debit", amount: "" });
  const [adjForm, setAdjForm] = useState({ date: new Date().toISOString().slice(0, 10), adjustmentType: "Debit", amount: "", reason: "", remarks: "" });

  useEffect(() => {
    loadOutstandingSummaries();
  }, [loadOutstandingSummaries, accountTypeFilter]);

  // Reset selected party when switching between company and vendor views
  useEffect(() => {
    setSelectedPartyId(null);
  }, [accountTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
    setLedgerSearchTerm("");
    if (selectedPartyId) {
      loadLedger(accountTypeFilter, selectedPartyId);
    }
  }, [selectedPartyId, accountTypeFilter, loadLedger]);

  const filteredParties = outstandingSummaries.filter(o => 
    o.accountType === accountTypeFilter &&
    o.partyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedParty = outstandingSummaries.find(o => o.id === selectedPartyId);
  const currentLedger = selectedPartyId ? (ledgers[`${accountTypeFilter}-${selectedPartyId}`] || []) : [];

  const filteredLedger = currentLedger.filter((l: any) => {
    if (!ledgerSearchTerm) return true;
    const lr = (l.lrNo || "").toLowerCase();
    const ref = (l.refNo || "").toLowerCase();
    const search = ledgerSearchTerm.toLowerCase();
    return lr.includes(search) || ref.includes(search);
  });

  const totalPages = Math.ceil(filteredLedger.length / recordsPerPage);
  const paginatedLedger = filteredLedger.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleOpenOpeningModal = () => {
    setOpeningForm({ date: new Date().toISOString().slice(0, 10), balanceType: accountTypeFilter === "Company" ? "Debit" : "Credit", amount: "" });
    setOpeningModalOpen(true);
  };

  const handleOpenAdjModal = () => {
    setAdjForm({ date: new Date().toISOString().slice(0, 10), adjustmentType: "Debit", amount: "", reason: "", remarks: "" });
    setAdjModalOpen(true);
  };

  const submitOpening = async () => {
    if (!openingForm.amount || !selectedPartyId) return;
    const p = selectedParty;
    if (!p) return;
    
    const ok = await saveOpeningBalance({
      partyType: accountTypeFilter,
      partyId: p.id,
      partyName: p.partyName,
      ...openingForm
    });
    if (ok) {
      setOpeningModalOpen(false);
      loadLedger(accountTypeFilter, p.id);
      loadOutstandingSummaries();
    }
  };

  const submitAdj = async () => {
    if (!adjForm.amount || !adjForm.reason || !selectedPartyId) return;
    const p = selectedParty;
    if (!p) return;
    
    const ok = await saveManualAdjustment({
      partyType: accountTypeFilter,
      partyId: p.id,
      partyName: p.partyName,
      ...adjForm
    });
    if (ok) {
      setAdjModalOpen(false);
      loadLedger(accountTypeFilter, p.id);
      loadOutstandingSummaries();
    }
  };

  const formatCurrency = (amt: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt);

  // Quick view handlers for source documents
  const handleRecordClick = (refType: string, refNo: string) => {
    // Basic alert placeholder. Can be swapped with TanStack router navigation to actual record pages.
    alert(`Quick View: Opening source record for ${refType} - ${refNo}`);
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-4 max-w-[1400px] mx-auto w-full">
      <PageHeader 
        title={selectedPartyId ? `${selectedParty?.partyName} Ledger` : `${accountTypeFilter} Master List`} 
        description={selectedPartyId ? `Detailed chronological transaction ledger` : `Select a ${accountTypeFilter} to view their complete ledger history`} 
      />
      
      {!selectedPartyId ? (
        // Master View (List of Parties)
        <>
          <div className="flex items-center justify-between pb-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={`Search ${accountTypeFilter}...`} 
                className="pl-9 bg-white border-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParties.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPartyId(p.id)}
                className="bg-white border rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col group"
              >
                <div className="font-semibold text-slate-900 group-hover:text-[#0B2E6B] transition-colors line-clamp-1">{p.partyName}</div>
                <div className="text-xs text-slate-500 mt-1">{p.mobileNumber || "No Contact Info"}</div>
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Outstanding</div>
                    <div className="text-xl font-bold text-slate-800">{formatCurrency(p.outstandingBalance)}</div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                      (p.status as string) === 'Receivable' || (p.status as string) === 'Received' || (p.status as string) === 'Paid' || (p.status as string) === 'Settled' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      (p.status as string) === 'Payable' || (p.status as string) === 'Not Paid' || (p.status as string) === 'Not Received' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      (p.status as string) === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredParties.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50/50 rounded-xl border border-dashed">
                No {accountTypeFilter}s found. Ensure they are added in the Master modules.
              </div>
            )}
          </div>
        </>
      ) : (
        // Detail View (Ledger for Selected Party)
        <>
          <div className="flex items-center justify-between pb-4">
            <Button variant="outline" onClick={() => setSelectedPartyId(null)}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back to List
            </Button>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder={`Search by LR Number...`} 
                className="pl-9 bg-white border-slate-200"
                value={ledgerSearchTerm}
                onChange={(e) => {
                  setLedgerSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex gap-2">
            </div>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0 print:border-none print:shadow-none">
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 border-b print:bg-transparent text-left font-medium text-slate-500">
                  <tr>
                    <th className="p-4 whitespace-nowrap">Date</th>
                    <th className="p-4 whitespace-nowrap">Ref Type</th>
                    {accountTypeFilter === "Company" && <th className="p-4">Ref No</th>}
                    <th className="p-4 whitespace-nowrap">LR No</th>
                    <th className="p-4">Description</th>
                    {accountTypeFilter === "Company" && <th className="p-4 text-right">Profit / Loss</th>}
                    <th className="p-4 text-right">Balance</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {paginatedLedger.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 whitespace-nowrap">{formatDate(l.timestamp)}</td>
                      <td className="p-4 text-slate-500 whitespace-nowrap">{l.type}</td>
                      {accountTypeFilter === "Company" && (
                        <td className="p-4 text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => handleRecordClick(l.type, l.refNo)}>
                          {l.refNo}
                        </td>
                      )}
                      <td className="p-4 text-slate-700 font-medium whitespace-nowrap">
                        {accountTypeFilter === "Lorry Vendor" ? (
                          <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => handleRecordClick(l.type, l.refNo)}>
                            {l.lrNo || l.refNo || "—"}
                          </span>
                        ) : (
                          l.lrNo || "—"
                        )}
                      </td>
                      <td className="p-4 max-w-xs truncate" title={l.description}>{l.description}</td>
                      {accountTypeFilter === "Company" && (
                        <td className={`p-4 text-right whitespace-nowrap font-medium ${
                          l.profitLoss > 0 ? 'text-emerald-600' :
                          l.profitLoss < 0 ? 'text-red-600' :
                          'text-slate-500'
                        }`}>
                          {l.profitLoss > 0 ? `+ ${formatCurrency(l.profitLoss)}` :
                           l.profitLoss < 0 ? `- ${formatCurrency(Math.abs(l.profitLoss))}` :
                           formatCurrency(0)}
                        </td>
                      )}
                      <td className="p-4 text-right font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(l.runningBalance)}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium ${
                          l.status === 'Received' || l.status === 'Paid' || l.status === 'Settled'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : l.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {paginatedLedger.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-500">No transactions found in this ledger.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredLedger.length > recordsPerPage && (
              <div className="p-4 border-t bg-slate-50 flex items-center justify-between text-sm text-slate-500">
                <div>
                  Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, filteredLedger.length)} of {filteredLedger.length} entries
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Modals specific to this party */}
          <Dialog open={openingModalOpen} onOpenChange={setOpeningModalOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Set Opening Balance for {selectedParty?.partyName}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <TextField type="date" label="Date" value={openingForm.date} onChange={(v: string) => setOpeningForm(f => ({ ...f, date: v }))} />
                <SelectField label="Type" value={openingForm.balanceType} onChange={v => setOpeningForm(f => ({ ...f, balanceType: v }))} options={["Debit", "Credit"]} />
                <div className="col-span-2">
                  <TextField label="Amount" value={openingForm.amount} onChange={v => setOpeningForm(f => ({ ...f, amount: v }))} type="number" />
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpeningModalOpen(false)}>Cancel</Button><Button onClick={submitOpening}>Save Balance</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={adjModalOpen} onOpenChange={setAdjModalOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Manual Adjustment for {selectedParty?.partyName}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <TextField label="Date" value={adjForm.date} onChange={(v: string) => setAdjForm(f => ({ ...f, date: v }))} type="date" />
                <SelectField label="Type" value={adjForm.adjustmentType} onChange={v => setAdjForm(f => ({ ...f, adjustmentType: v }))} options={["Debit", "Credit"]} />
                <TextField label="Amount" value={adjForm.amount} onChange={v => setAdjForm(f => ({ ...f, amount: v }))} type="number" />
                <TextField label="Reason" value={adjForm.reason} onChange={v => setAdjForm(f => ({ ...f, reason: v }))} placeholder="E.g. Discount, Penalty" />
                <div className="col-span-2">
                  <TextAreaField label="Remarks" value={adjForm.remarks} onChange={v => setAdjForm(f => ({ ...f, remarks: v }))} />
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setAdjModalOpen(false)}>Cancel</Button><Button onClick={submitAdj}>Save Adjustment</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
