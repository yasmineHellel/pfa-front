import { Component, OnInit } from '@angular/core';
import { RepairService } from '../../../core/services/repair.service';
import { Repair } from '../../../core/models/models';

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html'
})
export class RepairsComponent implements OnInit {
  repairs: Repair[] = [];
  filtered: Repair[] = [];
  activeTab = 0;
  loading = false;
  error = '';

  get tabs(): string[] {
    const total     = this.repairs.length;
    const enCours   = this.repairs.filter(r => r.status === 'en-cours').length;
    const termine   = this.repairs.filter(r => r.status === 'termine').length;
    const enAttente = this.repairs.filter(r => r.status === 'en-attente').length;
    return [
      `Toutes (${total})`,
      `En cours (${enCours})`,
      `Terminées (${termine})`,
      `En attente (${enAttente})`
    ];
  }

  constructor(private repairService: RepairService) {}

  ngOnInit(): void {
    this.loading = true;
    this.repairService.getAll().subscribe({
      next: data => { this.repairs = data; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des réparations.'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.repairs]; return; }
    const map = ['', 'en-cours', 'termine', 'en-attente'];
    this.filtered = this.repairs.filter(r => r.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  statusBadge(s: string): string {
    return { 'en-cours': 'badge-amber', termine: 'badge-green', 'en-attente': 'badge-red', diagnostic: 'badge-blue' }[s] || 'badge-gray';
  }

  statusLabel(s: string): string {
    return { 'en-cours': 'En cours', termine: 'Terminé', 'en-attente': 'En attente pièces', diagnostic: 'Diagnostic' }[s] || s;
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  avatarColor(id: number): string {
    const colors = ['amber', 'blue', 'green', 'purple'];
    return colors[id % colors.length];
  }
}
