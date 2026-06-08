import { Component, OnInit } from '@angular/core';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice } from '../../../core/models/models';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html'
})
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  filtered: Invoice[] = [];
  activeTab = 0;
  tabs = ['Toutes', 'Payées', 'Impayées', 'Partielles'];
  loading = false;
  error = '';

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit(): void {
    this.loading = true;
    this.invoiceService.getAll().subscribe({
      next: data => { this.invoices = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des factures.'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.invoices]; return; }
    const map = ['', 'payee', 'impayee', 'partielle'];
    this.filtered = this.invoices.filter(i => i.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  statusBadge(status: string): string {
    return { payee: 'badge-green', impayee: 'badge-red', partielle: 'badge-amber' }[status] || 'badge-gray';
  }

  statusLabel(status: string): string {
    return { payee: 'Payée', impayee: 'Impayée', partielle: 'Partielle' }[status] || status;
  }
}
