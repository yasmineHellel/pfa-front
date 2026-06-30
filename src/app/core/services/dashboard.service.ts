import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, ActivityItem, Repair, Client } from '../models/models';
import { RepairService } from './repair.service';
import { ClientService } from './client.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private http: HttpClient,
    private repairService: RepairService,
    private clientService: ClientService,
  ) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      stats:   this.http.get<any>(`${environment.invoiceUrl}/dashboard/stats`).pipe(catchError(() => of(null))),
      repairs: this.repairService.getAll().pipe(catchError(() => of([] as Repair[]))),
      clients: this.clientService.getAll().pipe(catchError(() => of([] as Client[]))),
    }).pipe(
      map(({ stats, repairs, clients }) => {
        if (stats) {
          return {
            revenue:             parseFloat(stats.revenue) || 0,
            revenueDeltaPercent: stats.revenueDeltaPercent ?? 0,
            activeRepairs:       stats.activeRepairs ?? repairs.filter(r => r.status === 'en-cours').length,
            pendingRepairs:      stats.pendingRepairs ?? repairs.filter(r => r.status === 'en-attente').length,
            newClients:          stats.newClients ?? clients.length,
            unpaidAmount:        parseFloat(stats.unpaidAmount) || 0,
            unpaidCount:         stats.unpaidCount ?? 0,
          };
        }
        return {
          revenue:             repairs.reduce((s, r) => s + (r.cost ?? 0), 0),
          revenueDeltaPercent: 0,
          activeRepairs:       repairs.filter(r => r.status === 'en-cours').length,
          pendingRepairs:      repairs.filter(r => r.status === 'en-attente').length,
          newClients:          clients.length,
          unpaidAmount:        0,
          unpaidCount:         0,
        };
      })
    );
  }

  getRecentActivity(): Observable<ActivityItem[]> {
    return this.http.get<any[]>(`${environment.invoiceUrl}/dashboard/activity`).pipe(
      catchError(() => this.repairService.getAll().pipe(
        catchError(() => of([] as Repair[])),
        map(repairs => repairs.slice(0, 5).map(r => ({
          dotColor: r.status === 'termine'    ? 'var(--green)'  :
                    r.status === 'en-cours'   ? 'var(--accent)' :
                    r.status === 'diagnostic' ? 'var(--purple)' : 'var(--blue)',
          text: `Réparation <strong>#${r.id}</strong> — ${r.vehicleName || r.plate} — ${r.description}`,
          time: r.entryDate,
        })))
      ))
    );
  }
}
