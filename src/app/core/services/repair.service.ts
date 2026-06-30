import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Repair, RepairInvoice } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RepairService {
  private readonly vehiclesUrl = `${environment.vehicleUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  /** Fetches all vehicles then aggregates their service records. */
  getAll(): Observable<Repair[]> {
    return this.http.get<any[]>(this.vehiclesUrl).pipe(
      switchMap(vehicles => {
        if (!vehicles || vehicles.length === 0) return of([]);
        return forkJoin(
          vehicles.map(v =>
            this.http.get<any[]>(`${this.vehiclesUrl}/${v.id}/services`).pipe(
              map(records => records.map(r => this.mapRepair(r, v))),
              catchError(() => of([] as Repair[]))
            )
          )
        ).pipe(map(groups => ([] as Repair[]).concat(...groups)));
      }),
      catchError(() => of([]))
    );
  }

  getById(id: number): Observable<Repair> {
    return this.getAll().pipe(map(repairs => repairs.find(r => r.id === id)!));
  }

  getByClient(clientId: number): Observable<Repair[]> {
    return this.http.get<any[]>(`${this.vehiclesUrl}/owner/${clientId}`).pipe(
      switchMap(vehicles => {
        if (!vehicles || vehicles.length === 0) return of([]);
        return forkJoin(
          vehicles.map(v =>
            this.http.get<any[]>(`${this.vehiclesUrl}/${v.id}/services`).pipe(
              map(records => records.map(r => this.mapRepair(r, v))),
              catchError(() => of([] as Repair[]))
            )
          )
        ).pipe(map(groups => ([] as Repair[]).concat(...groups)));
      }),
      catchError(() => of([]))
    );
  }

  getByVehicle(vehicleId: number): Observable<Repair[]> {
    return forkJoin({
      vehicle: this.http.get<any>(`${this.vehiclesUrl}/${vehicleId}`).pipe(catchError(() => of({}))),
      records: this.http.get<any[]>(`${this.vehiclesUrl}/${vehicleId}/services`).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ vehicle, records }) => records.map(r => this.mapRepair(r, vehicle)))
    );
  }

  create(repair: Partial<Repair>): Observable<Repair> {
    const vehicleId = repair.vehicleId || 0;

    if (vehicleId > 0) {
      return this.createServiceRecord(vehicleId, repair);
    }

    // New vehicle — create it first then attach the service record
    const nameParts = (repair.vehicleName || '').split(' ');
    const vehicleBody = {
      licensePlate: repair.plate || '',
      make:         repair.vehicleMake  || nameParts[0] || '',
      model:        repair.vehicleModel || nameParts.slice(1).join(' ') || '',
      year:         repair.vehicleYear  || new Date().getFullYear(),
      mileage:      0,
      color:        '',
      vin:          '',
      notes:        '',
      clientId:     repair.clientId ?? null,
    };

    return this.http.post<any>(this.vehiclesUrl, vehicleBody).pipe(
      switchMap(vehicle => this.createServiceRecord(vehicle.id, { ...repair, vehicleId: vehicle.id }))
    );
  }

  update(id: number, repair: Partial<Repair>): Observable<Repair> {
    const vehicleId = repair.vehicleId || 0;
    const body = this.mapToUpdateRequest(repair);
    return this.http.put<any>(`${this.vehiclesUrl}/${vehicleId}/services/${id}`, body).pipe(
      map(r => ({
        ...this.mapRepair(r, { id: vehicleId, licensePlate: repair.plate, clientId: repair.clientId }),
        clientName:  repair.clientName,
        clientPhone: repair.clientPhone,
        vehicleName: repair.vehicleName,
        plate:       repair.plate,
      } as Repair))
    );
  }

  delete(id: number, vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.vehiclesUrl}/${vehicleId}/services/${id}`);
  }

  createInvoice(invoice: Omit<RepairInvoice, 'id' | 'invoiceNumber'>): Observable<RepairInvoice> {
    const body = {
      clientId:         invoice.clientId,
      clientName:       invoice.clientName,
      clientPhone:      invoice.clientPhone,
      vehicleId:        invoice.vehicleId,
      vehicleName:      invoice.vehicleName,
      licensePlate:     invoice.plate,
      serviceRecordId:  invoice.repairId,
      mechanicName:     invoice.mechanicName,
      description:      invoice.repairDescription,
      entryDate:        this.toIsoDate(invoice.entryDate),
      invoiceDate:      this.toIsoDate(invoice.invoiceDate),
      laborDescription: invoice.laborDescription,
      laborCost:        invoice.laborCost,
      lines: invoice.lines.map(l => ({
        name: l.description, ref: '', quantity: l.quantity, unitPrice: l.unitPrice,
      })),
    };
    return this.http.post<any>(`${environment.invoiceUrl}/invoices`, body).pipe(
      map(r => ({
        ...invoice,
        id:            r.id,
        invoiceNumber: r.invoiceNumber || `F-${r.id}`,
      } as RepairInvoice)),
      catchError(() => of({
        ...invoice,
        id:            Date.now(),
        invoiceNumber: `F-${String(Date.now()).slice(-4)}`,
      } as RepairInvoice))
    );
  }

  /** Reserves stock items for a repair via stock service. */
  addPart(repairId: number, stockItemId: number, quantity: number, vehicleId = 0): Observable<Repair> {
    return this.http.post<any>(
      `${environment.stockUrl}/stock/${stockItemId}/reserve`,
      null,
      { params: { quantity: String(quantity), serviceRecordId: String(repairId), vehicleId: String(vehicleId) } }
    ).pipe(
      switchMap(() => this.getById(repairId)),
      catchError(() => of(null as any))
    );
  }

  removePart(_repairId: number, _stockItemId: number): Observable<Repair> {
    return of(null as any);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private createServiceRecord(vehicleId: number, repair: Partial<Repair>): Observable<Repair> {
    const nameParts = (repair.clientName || '').split(' ');
    const body = {
      description:      repair.description ?? '',
      serviceType:      'OTHER',
      serviceDate:      this.toIsoDate(repair.entryDate || ''),
      scheduledDate:    this.toIsoDate(repair.entryDate || ''),
      mileageAtService: 0,
      cost:             repair.cost ?? 0,
      notes:            '',
      licensePlate:     repair.plate ?? '',
      clientId:         repair.clientId ?? null,
      clientFirstName:  nameParts[0] ?? '',
      clientLastName:   nameParts.slice(1).join(' ') ?? '',
      clientEmail:      '',
      clientPhone:      repair.clientPhone ?? '',
    };
    return this.http.post<any>(`${this.vehiclesUrl}/${vehicleId}/services`, body).pipe(
      map(r => ({
        ...this.mapRepair(r, { id: vehicleId, licensePlate: repair.plate, clientId: repair.clientId }),
        clientName:  repair.clientName  ?? '',
        clientPhone: repair.clientPhone ?? '',
        vehicleName: repair.vehicleName ?? '',
        plate:       repair.plate       ?? '',
      } as Repair))
    );
  }

  private mapRepair(r: any, vehicle: any = {}): Repair {
    const vehicleName = (vehicle.make && vehicle.model)
      ? `${vehicle.make} ${vehicle.model}`
      : (vehicle.licensePlate ?? '');
    const vehicleClientName = (vehicle.clientFirstName || vehicle.clientLastName)
      ? `${vehicle.clientFirstName ?? ''} ${vehicle.clientLastName ?? ''}`.trim()
      : (vehicle.clientName ?? '');
    return {
      id:           r.id,
      clientId:     vehicle.clientId   ?? r.clientId    ?? 0,
      clientName:   vehicleClientName  || r.clientName  || '',
      clientPhone:  r.clientPhone         ?? '',
      vehicleId:    r.vehicleId           ?? vehicle.id    ?? 0,
      vehicleName,
      plate:        r.vehicleLicensePlate ?? vehicle.licensePlate ?? '',
      description:  r.description         ?? '',
      mechanicName: r.mechanicUsername    ?? r.mechanicName ?? '',
      status:       this.mapStatusToFrontend(r.serviceStatus ?? r.status),
      cost:         typeof r.cost === 'string' ? parseFloat(r.cost) : (r.cost ?? 0),
      entryDate:    r.serviceDate         ?? r.entryDate   ?? '',
      usedParts:    r.usedParts           ?? [],
    };
  }

  private mapToUpdateRequest(r: Partial<Repair>): any {
    const req: any = {};
    if (r.description !== undefined) req.description   = r.description;
    if (r.cost        !== undefined) req.cost          = r.cost;
    if (r.status      !== undefined) req.serviceStatus = this.mapStatusToBackend(r.status);
    if (r.status === 'termine')      req.completedDate = new Date().toISOString().split('T')[0];
    return req;
  }

  private mapStatusToFrontend(s: string): string {
    const m: Record<string, string> = {
      SCHEDULED:      'en-attente',
      IN_PROGRESS:    'en-cours',
      AWAITING_PARTS: 'diagnostic',
      COMPLETED:      'termine',
      CANCELLED:      'en-attente',
    };
    return m[s] ?? s ?? 'en-attente';
  }

  private mapStatusToBackend(s: string): string {
    const m: Record<string, string> = {
      'en-attente': 'SCHEDULED',
      'en-cours':   'IN_PROGRESS',
      'diagnostic': 'AWAITING_PARTS',
      'termine':    'COMPLETED',
    };
    return m[s] ?? 'SCHEDULED';
  }

  /** Converts DD/MM/YYYY or any string to YYYY-MM-DD; falls back to today. */
  private toIsoDate(date: string): string {
    if (!date) return new Date().toISOString().split('T')[0];
    const parts = date.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return date;
  }
}
