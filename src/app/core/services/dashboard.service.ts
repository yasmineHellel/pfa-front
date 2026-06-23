import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardStats, ActivityItem, Repair, Client } from '../models/models';
import { RepairService } from './repair.service';
import { ClientService } from './client.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private repairService: RepairService,
    private clientService: ClientService,
  ) {}

  getStats(): Observable<DashboardStats> {
    return forkJoin({
      repairs: this.repairService.getAll().pipe(catchError(() => of([] as Repair[]))),
      clients: this.clientService.getAll().pipe(catchError(() => of([] as Client[]))),
    }).pipe(
      map(({ repairs, clients }) => ({
        revenue:             repairs.reduce((s, r) => s + (r.cost ?? 0), 0),
        revenueDeltaPercent: 0,
        activeRepairs:       repairs.filter(r => r.status === 'en-cours').length,
        pendingRepairs:      repairs.filter(r => r.status === 'en-attente').length,
        newClients:          clients.length,
        unpaidAmount:        0,
        unpaidCount:         0,
      }))
    );
  }

  getRecentActivity(): Observable<ActivityItem[]> {
    return this.repairService.getAll().pipe(
      catchError(() => of([] as Repair[])),
      map(repairs => repairs.slice(0, 5).map(r => ({
        dotColor: r.status === 'termine'    ? 'var(--green)'  :
                  r.status === 'en-cours'   ? 'var(--accent)' :
                  r.status === 'diagnostic' ? 'var(--purple)' : 'var(--blue)',
        text: `Réparation <strong>#${r.id}</strong> — ${r.vehicleName || r.plate} — ${r.description}`,
        time: r.entryDate,
      })))
    );
  }
}
