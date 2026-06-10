import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Repair, RepairInvoice, RepairPart } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RepairService {
  private apiUrl = `${environment.apiUrl}/repairs`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Repair[]> {
    return this.http.get<Repair[]>(this.apiUrl);
  }

  getById(id: number): Observable<Repair> {
    return this.http.get<Repair>(`${this.apiUrl}/${id}`);
  }

  getByClient(clientId: number): Observable<Repair[]> {
    return this.http.get<Repair[]>(`${this.apiUrl}?clientId=${clientId}`);
  }

  getByVehicle(vehicleId: number): Observable<Repair[]> {
    return this.http.get<Repair[]>(`${this.apiUrl}?vehicleId=${vehicleId}`);
  }

  create(repair: Partial<Repair>): Observable<Repair> {
    return this.http.post<Repair>(this.apiUrl, repair);
  }

  update(id: number, repair: Partial<Repair>): Observable<Repair> {
    return this.http.put<Repair>(`${this.apiUrl}/${id}`, repair);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createInvoice(invoice: Omit<RepairInvoice, 'id' | 'invoiceNumber'>): Observable<RepairInvoice> {
    return this.http.post<RepairInvoice>(`${environment.apiUrl}/repair-invoices`, invoice);
  }

  addPart(repairId: number, stockItemId: number, quantity: number): Observable<Repair> {
    return this.http.post<Repair>(`${this.apiUrl}/${repairId}/parts`, { stockItemId, quantity });
  }

  removePart(repairId: number, stockItemId: number): Observable<Repair> {
    return this.http.delete<Repair>(`${this.apiUrl}/${repairId}/parts/${stockItemId}`);
  }
}
