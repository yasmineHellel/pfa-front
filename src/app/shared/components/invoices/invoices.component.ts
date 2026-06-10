import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice } from '../../../core/models/models';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filtered: Invoice[] = [];
  activeTab = 0;
  tabs = ['Toutes', 'Payées', 'Impayées', 'Partielles'];
  loading = false;
  error   = '';

  // Pay modal
  showPayModal:   boolean = false;
  payingInvoice:  Invoice | null = null;
  paymentMethod   = 'Cash';
  payMethods      = ['Cash', 'Virement', 'Chèque', 'D17', 'Carte'];
  paySubmitting   = false;

  // Detail / print
  selectedInvoice: Invoice | null = null;

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loading = true;
    this.invoiceService.getAll().subscribe({
      next:  data => { this.invoices = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des factures.'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.invoices]; return; }
    const map = ['', 'payee', 'impayee', 'partielle'];
    this.filtered = this.invoices.filter(i => i.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  openPay(inv: Invoice): void {
    this.payingInvoice = inv;
    this.paymentMethod = inv.paymentMethod && inv.paymentMethod !== '-' ? inv.paymentMethod : 'Cash';
    this.showPayModal  = true;
  }

  closePay(): void { this.showPayModal = false; this.payingInvoice = null; }

  submitPay(): void {
    if (!this.payingInvoice) return;
    this.paySubmitting = true;
    this.invoiceService.markAsPaid(this.payingInvoice.id, this.paymentMethod).subscribe({
      next: updated => {
        const fresh = { ...updated };
        const idx = this.invoices.findIndex(i => i.id === fresh.id);
        if (idx !== -1) this.invoices[idx] = fresh;
        this.applyFilter();
        this.paySubmitting = false;
        this.closePay();
      },
      error: () => { this.paySubmitting = false; }
    });
  }

  openDetail(inv: Invoice): void  { this.selectedInvoice = inv; }
  closeDetail(): void              { this.selectedInvoice = null; }

  printInvoice(): void { window.print(); }

  statusBadge(s: string): string {
    return ({ payee: 'badge-green', impayee: 'badge-red', partielle: 'badge-amber' } as any)[s] || 'badge-gray';
  }
  statusLabel(s: string): string {
    return ({ payee: 'Payée', impayee: 'Impayée', partielle: 'Partielle' } as any)[s] || s;
  }
}
