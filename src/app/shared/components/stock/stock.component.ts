import { Component, OnInit } from '@angular/core';
import { StockService } from '../../../core/services/stock.service';
import { StockItem } from '../../../core/models/models';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html'
})
export class StockComponent implements OnInit {
  items: StockItem[] = [];
  filtered: StockItem[] = [];
  loading = false;
  error = '';

  constructor(private stockService: StockService) {}

  ngOnInit(): void {
    this.loading = true;
    this.stockService.getAll().subscribe({
      next: data => { this.items = data; this.filtered = [...data]; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement du stock.'; this.loading = false; }
    });
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.items.filter(i =>
      i.name.toLowerCase().includes(t) ||
      i.ref.toLowerCase().includes(t) ||
      i.category.toLowerCase().includes(t)
    );
  }

  statusBadge(s: string): string {
    return { ok: 'badge-green', bas: 'badge-amber', critique: 'badge-red' }[s] || 'badge-gray';
  }

  statusLabel(s: string): string {
    return { ok: 'OK', bas: 'Bas', critique: 'Critique' }[s] || s;
  }

  qtyColor(s: StockItem): string {
    if (s.status === 'critique') return 'var(--red)';
    if (s.status === 'bas')      return 'var(--accent)';
    return 'var(--green)';
  }

  delete(id: number): void {
    if (!confirm('Supprimer cet article ?')) return;
    this.stockService.delete(id).subscribe(() => {
      this.items = this.items.filter(i => i.id !== id);
      this.filtered = this.filtered.filter(i => i.id !== id);
    });
  }
}
