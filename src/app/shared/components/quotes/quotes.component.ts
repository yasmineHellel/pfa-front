import { Component, OnInit } from '@angular/core';
import { QuoteService } from '../../../core/services/quote.service';
import { Quote } from '../../../core/models/models';

@Component({
  selector: 'app-quotes',
  templateUrl: './quotes.component.html'
})
export class QuotesComponent implements OnInit {
  quotes: Quote[] = [];
  filtered: Quote[] = [];
  activeTab = 0;
  tabs = ['Tous', 'Acceptés', 'En attente'];
  loading = false;
  error = '';

  constructor(private quoteService: QuoteService) {}

  ngOnInit(): void {
    this.loading = true;
    this.quoteService.getAll().subscribe({
      next: data => { this.quotes = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des devis.'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.quotes]; return; }
    const map = ['', 'accepte', 'en-attente'];
    this.filtered = this.quotes.filter(q => q.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  statusBadge(s: string): string {
    return { 'accepte': 'badge-green', 'en-attente': 'badge-amber' }[s] || 'badge-gray';
  }
  statusLabel(s: string): string {
    return { 'accepte': 'Accepté', 'en-attente': 'En attente' }[s] || s;
  }
}
