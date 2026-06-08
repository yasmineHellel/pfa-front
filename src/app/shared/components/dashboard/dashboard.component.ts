import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../core/services/dashboard.service';
import { RepairService } from '../../../core/services/repair.service';
import { StockService } from '../../../core/services/stock.service';
import { ActivityItem, Repair, StatCard, StockItem } from '../../../core/models/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [];
  repairs: Repair[] = [];
  activities: ActivityItem[] = [];
  criticalStock: StockItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private repairService: RepairService,
    private stockService: StockService
  ) {}

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe(s => {
      this.stats = [
        { label: 'CA Ce Mois',          value: `${s.revenue.toLocaleString('fr-TN')} TND`, delta: `+${s.revenueDeltaPercent}% vs mois dernier`, deltaType: 'up',   color: 'amber'  },
        { label: 'Réparations Actives', value: `${s.activeRepairs}`,                       delta: `${s.pendingRepairs} en attente pièces`,        deltaType: 'up',   color: 'green'  },
        { label: 'Nouveaux Clients',    value: `${s.newClients}`,                           delta: 'Ce mois-ci',                                   deltaType: 'up',   color: 'blue'   },
        { label: 'Factures Impayées',   value: `${s.unpaidAmount.toLocaleString('fr-TN')} TND`, delta: `${s.unpaidCount} factures ouvertes`,       deltaType: 'down', color: 'purple' },
      ];
    });

    this.repairService.getAll().subscribe(r => { this.repairs = r.slice(0, 5); });

    this.dashboardService.getRecentActivity().subscribe(a => { this.activities = a; });

    this.stockService.getLowStock().subscribe(s => {
      this.criticalStock = s.filter(i => i.status !== 'ok');
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  avatarColor(id: number): string {
    const colors = ['amber', 'blue', 'green', 'purple'];
    return colors[id % colors.length];
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'en-cours':   'badge-amber',
      'termine':    'badge-green',
      'en-attente': 'badge-red',
      'diagnostic': 'badge-blue',
    };
    return map[status] || 'badge-gray';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      'en-cours':   'En cours',
      'termine':    'Terminé',
      'en-attente': 'En attente',
      'diagnostic': 'Diagnostic',
    };
    return map[status] || status;
  }

  getStockQtyColor(item: StockItem): string {
    if (item.status === 'critique') return 'var(--red)';
    if (item.status === 'bas')      return 'var(--accent)';
    return 'var(--green)';
  }

  getStockBarWidth(item: StockItem): string {
    const pct = Math.min(100, (item.quantity / (item.alertThreshold * 3)) * 100);
    return pct + '%';
  }

  getStockBarColor(item: StockItem): string {
    if (item.status === 'critique') return 'var(--red)';
    if (item.status === 'bas')      return 'var(--accent)';
    return 'var(--green)';
  }
}
