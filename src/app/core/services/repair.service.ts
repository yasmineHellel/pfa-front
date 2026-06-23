import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repair, RepairInvoice } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RepairService {
  private apiUrl = `${environment.vehicleUrl}/repairs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Repair[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(map(list => list.map(r => this.mapRepair(r))));
  }

  getById(id: number): Observable<Repair> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(r => this.mapRepair(r)));
  }

  getByClient(clientId: number): Observable<Repair[]> {
    return this.http.get<any[]>(`${this.apiUrl}?clientId=${clientId}`).pipe(
      map(list => list.map(r => this.mapRepair(r)))
    );
  }

  getByVehicle(vehicleId: number): Observable<Repair[]> {
    return this.http.get<any[]>(`${this.apiUrl}?vehicleId=${vehicleId}`).pipe(
      map(list => list.map(r => this.mapRepair(r)))
    );
  }

  create(repair: Partial<Repair>): Observable<Repair> {
    const body = this.mapToCreateRequest(repair);
    return this.http.post<any>(`${this.apiUrl}?vehicleId=${repair.vehicleId || 0}`, body).pipe(
      map(r => this.mapRepair(r))
    );
  }

  update(id: number, repair: Partial<Repair>): Observable<Repair> {
    const body = this.mapToUpdateRequest(repair);
    const vehicleId = repair.vehicleId || 0;
    return this.http.put<any>(`${this.apiUrl}/${id}?vehicleId=${vehicleId}`, body).pipe(
      map(r => this.mapRepair(r))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // No backend endpoint for repair invoices — kept for interface compatibility
  createInvoice(invoice: Omit<RepairInvoice, 'id' | 'invoiceNumber'>): Observable<RepairInvoice> {
    return of({
      ...invoice,
      id: Date.now(),
      invoiceNumber: `F-${String(Date.now()).slice(-4)}`,
    } as RepairInvoice);
  }

  // Parts management not available in backend — no-op stubs
  addPart(_repairId: number, _stockItemId: number, _quantity: number): Observable<Repair> {
    return of(null as any);
  }

  removePart(_repairId: number, _stockItemId: number): Observable<Repair> {
    return of(null as any);
  }

  private mapRepair(r: any): Repair {
    return {
      id:          r.id,
      clientId:    r.clientId    ?? 0,
      clientName:  r.clientName  ?? '',
      clientPhone: r.clientPhone ?? '',
      vehicleId:   r.vehicleId   ?? 0,
      vehicleName: r.vehicleLicensePlate ?? r.vehicleName ?? '',
      plate:       r.vehicleLicensePlate ?? r.plate ?? '',
      description: r.description ?? '',
      mechanicName: r.mechanicUsername ?? r.mechanicName ?? '',
      status:      this.mapStatusToFrontend(r.serviceStatus ?? r.status),
      cost:        typeof r.cost === 'string' ? parseFloat(r.cost) : (r.cost ?? 0),
      entryDate:   r.serviceDate ?? r.entryDate ?? '',
      usedParts:   r.usedParts ?? [],
    };
  }

  private mapToCreateRequest(r: Partial<Repair>): any {
    return {
      description:      r.description ?? '',
      serviceType:      'OTHER',
      serviceDate:      new Date().toISOString().split('T')[0],
      cost:             r.cost ?? 0,
      mileageAtService: 0,
      notes:            '',
    };
  }

  private mapToUpdateRequest(r: Partial<Repair>): any {
    const req: any = {};
    if (r.description !== undefined) req.description   = r.description;
    if (r.cost        !== undefined) req.cost          = r.cost;
    if (r.status      !== undefined) req.serviceStatus = this.mapStatusToBackend(r.status);
    return req;
  }

  private mapStatusToFrontend(s: string): string {
    const map: Record<string, string> = {
      SCHEDULED:      'en-attente',
      IN_PROGRESS:    'en-cours',
      AWAITING_PARTS: 'diagnostic',
      COMPLETED:      'termine',
      CANCELLED:      'en-attente',
    };
    return map[s] ?? s ?? 'en-attente';
  }

  private mapStatusToBackend(s: string): string {
    const map: Record<string, string> = {
      'en-attente': 'SCHEDULED',
      'en-cours':   'IN_PROGRESS',
      'diagnostic': 'AWAITING_PARTS',
      'termine':    'COMPLETED',
    };
    return map[s] ?? 'SCHEDULED';
  }
}
