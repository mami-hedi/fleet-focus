import { useState, useEffect, useMemo } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  Plus, Search, CreditCard, TrendingUp, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Pencil, Trash2, Car, Calendar, RefreshCw, Percent
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFleetStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PaymentDTO, PaymentInput, PaymentMethod, PaymentStatus } from '@/lib/paymentService';

export const Route = createFileRoute('/payments')({
  head: () => ({ meta: [{ title: 'Paiements — FleetOps' }] }),
  component: PaymentsPage,
});

const ITEMS_PER_PAGE = 10;

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Espèces', card: 'Carte', transfer: 'Virement', cheque: 'Chèque'
};
const methodIcons: Record<PaymentMethod, string> = {
  cash: '💵', card: '💳', transfer: '🏦', cheque: '📄'
};
const statusConfig: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'En attente', cls: 'bg-warning/15 text-warning-foreground border-warning/30' },
  paid: { label: 'Payé', cls: 'bg-success/10 text-success border-success/30' },
  partial: { label: 'Partiel', cls: 'bg-info/10 text-info border-info/30' },
  refunded: { label: 'Remboursé', cls: 'bg-muted text-muted-foreground border-border' },
};

function PaymentsPage() {
  const {
    payments, paymentsLoading, paymentsError, paymentStats,
    fetchPayments, fetchPaymentStats, addPayment, editPayment, removePayment,
    reservations, fetchReservations, reservationsLoaded
  } = useFleetStore();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentDTO | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchPayments();
    fetchPaymentStats();
    if (!reservationsLoaded) {
      fetchReservations();
    }
  }, [fetchPayments, fetchPaymentStats, fetchReservations, reservationsLoaded]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (methodFilter !== 'all' && p.method !== methodFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const reservation = reservations.find(r => r.id === p.reservationId);
        const matchRes = reservation ? (reservation.clientName.toLowerCase().includes(q) || reservation.vehicleId.toLowerCase().includes(q)) : false;
        const matchRef = p.reference ? p.reference.toLowerCase().includes(q) : false;
        if (!matchRes && !matchRef) return false;
      }
      return true;
    });
  }, [payments, statusFilter, methodFilter, query, reservations]);

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));
  const paginated = filteredPayments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSave = async (input: PaymentInput) => {
    try {
      if (editing) {
        await editPayment(editing.id, input);
        toast.success('Paiement modifié avec succès');
      } else {
        await addPayment(input);
        toast.success('Paiement ajouté avec succès');
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removePayment(deleteTarget.id);
      toast.success('Paiement supprimé avec succès');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <AppLayout title="Paiements">
      <div className="space-y-6 max-w-6xl mx-auto pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Paiements</h1>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nouveau paiement
          </Button>
        </div>

        {paymentsError && (
          <div className="p-4 border-l-4 border-destructive bg-destructive/10 text-destructive rounded-md">
            {paymentsError}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-success/10 text-success"><TrendingUp className="w-4 h-4" /></div>
              Total encaissé
            </div>
            <div className="text-xl font-semibold">
              {paymentStats?.totalPaid.toFixed(2) ?? '—'} TND
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-warning/15 text-warning-foreground"><Clock className="w-4 h-4" /></div>
              En attente
            </div>
            <div className="text-xl font-semibold">
              {paymentStats?.totalPending.toFixed(2) ?? '—'} TND
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><CreditCard className="w-4 h-4" /></div>
              Ce mois
            </div>
            <div className="text-xl font-semibold">
              {paymentStats?.monthRevenue.toFixed(2) ?? '—'} TND
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-card flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="p-1.5 rounded-lg bg-info/10 text-info"><Percent className="w-4 h-4" /></div>
              Taux recouvrement
            </div>
            <div className="text-xl font-semibold">
              {paymentStats?.recoveryRate ?? '—'}%
            </div>
          </div>
        </div>

        {paymentStats && (
          <div className="p-4 rounded-xl border bg-card">
            <h3 className="text-sm font-medium mb-4 text-muted-foreground">Revenus par méthode</h3>
            <div className="space-y-3">
              {(['cash', 'card', 'transfer', 'cheque'] as PaymentMethod[]).map(method => {
                const amount = paymentStats.revenueByMethod[method] || 0;
                const total = Math.max(1, Object.values(paymentStats.revenueByMethod).reduce((a,b) => a+b, 0));
                const pct = (amount / total) * 100;
                return (
                  <div key={method} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-center">{methodIcons[method]}</span>
                    <span className="w-20 text-muted-foreground">{methodLabels[method]}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-24 text-right font-medium">{amount.toFixed(2)} TND</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (client, réf, véhicule)..."
              value={query}
              onChange={e => { setQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">Tous statuts</option>
              <option value="pending">En attente</option>
              <option value="paid">Payé</option>
              <option value="partial">Partiel</option>
              <option value="refunded">Remboursé</option>
            </select>
            <select
              className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={methodFilter}
              onChange={e => { setMethodFilter(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">Toutes méthodes</option>
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
              <option value="transfer">Virement</option>
              <option value="cheque">Chèque</option>
            </select>
            <Button
              variant="outline"
              onClick={() => { setQuery(''); setStatusFilter('all'); setMethodFilter('all'); setCurrentPage(1); }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="hidden sm:block rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Réservation</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date paiement</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <div className="animate-pulse h-4 w-full bg-muted rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucun paiement trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(p => {
                  const r = reservations.find(x => x.id === p.reservationId);
                  const conf = statusConfig[p.status];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-xs">
                        {r ? `${r.vehicleId}` : '—'}
                      </TableCell>
                      <TableCell>{r ? r.clientName : '—'}</TableCell>
                      <TableCell className="font-bold">{p.amount.toFixed(2)} TND</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                          {methodIcons[p.method]} {methodLabels[p.method]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border", conf.cls)}>
                          {conf.label}
                        </span>
                      </TableCell>
                      <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{p.reference || '—'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="sm:hidden space-y-3">
          {paymentsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-24 w-full bg-card border rounded-xl" />
            ))
          ) : paginated.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-card border rounded-xl">
              Aucun paiement trouvé.
            </div>
          ) : (
            paginated.map(p => {
              const r = reservations.find(x => x.id === p.reservationId);
              const conf = statusConfig[p.status];
              return (
                <div key={p.id} className="p-4 bg-card border rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{r ? r.clientName : '—'}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Car className="w-3 h-3" /> {r ? r.vehicleId : '—'}
                      </div>
                    </div>
                    <span className={cn("inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border", conf.cls)}>
                      {conf.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-base">{p.amount.toFixed(2)} TND</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border">
                      {methodIcons[p.method]} {methodLabels[p.method]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(p); setDialogOpen(true); }}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {dialogOpen && (
        <PaymentDialog
          payment={editing}
          reservations={reservations}
          onClose={() => { setDialogOpen(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

function PaymentDialog({ payment, reservations, onClose, onSave }: { payment: PaymentDTO | null, reservations: any[], onClose: () => void, onSave: (p: PaymentInput) => Promise<void> }) {
  const [formData, setFormData] = useState<Partial<PaymentInput>>({
    reservationId: payment?.reservationId || '',
    amount: payment?.amount || 0,
    method: payment?.method || 'cash',
    status: payment?.status || 'paid',
    paymentDate: payment?.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    reference: payment?.reference || '',
    notes: payment?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reservationId) return toast.error('Sélectionnez une réservation');
    if (formData.amount! <= 0) return toast.error('Montant invalide');
    onSave(formData as PaymentInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-xl border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">{payment ? 'Modifier le paiement' : 'Nouveau paiement'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Réservation *</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={formData.reservationId}
              onChange={e => setFormData({ ...formData, reservationId: e.target.value })}
              required
            >
              <option value="" disabled>Sélectionner une réservation</option>
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  {r.clientName} — {r.vehicleId}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Montant (TND) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Méthode *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={formData.method}
                onChange={e => setFormData({ ...formData, method: e.target.value as PaymentMethod })}
                required
              >
                {Object.entries(methodLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
                required
              >
                {Object.entries(statusConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de paiement {formData.status === 'paid' && '*'}</label>
              <Input
                type="date"
                value={formData.paymentDate}
                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                required={formData.status === 'paid'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Référence (optionnel)</label>
            <Input
              placeholder="Ex: CHQ-123456"
              value={formData.reference}
              onChange={e => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optionnel)</label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires..."
            />
          </div>
          
          <div className="bg-muted p-3 rounded-lg text-sm flex items-center justify-between mt-4">
            <span className="font-medium text-muted-foreground">Aperçu du montant</span>
            <span className="font-bold text-lg">{Number(formData.amount).toFixed(2)} TND</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
