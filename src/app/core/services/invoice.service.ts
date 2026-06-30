import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Invoice } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly base = `${environment.invoiceUrl}/invoices`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Invoice[]> {
    return this.http.get<any[]>(this.base).pipe(map(list => list.map(r => this.map(r))));
  }

  getById(id: number): Observable<Invoice> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => this.map(r)));
  }

  getByClient(clientId: number): Observable<Invoice[]> {
    const params = new HttpParams().set('clientId', String(clientId));
    return this.http.get<any[]>(this.base, { params }).pipe(map(list => list.map(r => this.map(r))));
  }

  create(invoice: Partial<Invoice>): Observable<Invoice> {
    const body = {
      clientId:         invoice.clientId,
      clientName:       invoice.clientName,
      clientPhone:      invoice.clientPhone,
      vehicleId:        invoice.vehicleId,
      vehicleName:      invoice.vehicleName,
      licensePlate:     invoice.licensePlate,
      serviceRecordId:  invoice.serviceRecordId,
      mechanicName:     invoice.mechanicName,
      description:      invoice.description,
      entryDate:        invoice.entryDate ? this.toIsoDate(invoice.entryDate) : null,
      invoiceDate:      invoice.invoiceDate ? this.toIsoDate(invoice.invoiceDate) : null,
      laborDescription: invoice.laborDescription,
      laborCost:        invoice.laborCost ?? 0,
      lines:            (invoice.lines ?? []).map((l: any) => ({
        name: l.description, ref: '', quantity: l.quantity, unitPrice: l.unitPrice,
      })),
    };
    return this.http.post<any>(this.base, body).pipe(map(r => this.map(r)));
  }

  update(id: number, invoice: Partial<Invoice>): Observable<Invoice> {
    const body: any = {};
    if (invoice.clientName       !== undefined) body.clientName       = invoice.clientName;
    if (invoice.clientPhone      !== undefined) body.clientPhone      = invoice.clientPhone;
    if (invoice.mechanicName     !== undefined) body.mechanicName     = invoice.mechanicName;
    if (invoice.description      !== undefined) body.description      = invoice.description;
    if (invoice.laborDescription !== undefined) body.laborDescription = invoice.laborDescription;
    if (invoice.laborCost        !== undefined) body.laborCost        = invoice.laborCost;
    if (invoice.invoiceDate      !== undefined) body.invoiceDate      = this.toIsoDate(invoice.invoiceDate!);
    if (invoice.lines            !== undefined) {
      body.lines = invoice.lines.map((l: any) => ({
        name: l.description, ref: '', quantity: l.quantity, unitPrice: l.unitPrice,
      }));
    }
    return this.http.put<any>(`${this.base}/${id}`, body).pipe(map(r => this.map(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  markAsPaid(id: number, paymentMethod: string): Observable<Invoice> {
    return this.http.put<any>(`${this.base}/${id}/pay`, { paymentMethod }).pipe(map(r => this.map(r)));
  }

  private map(r: any): Invoice {
    return {
      id:               r.id,
      invoiceNumber:    r.invoiceNumber,
      clientId:         r.clientId,
      clientName:       r.clientName,
      clientPhone:      r.clientPhone,
      vehicleId:        r.vehicleId,
      vehicleName:      r.vehicleName,
      licensePlate:     r.licensePlate,
      serviceRecordId:  r.serviceRecordId,
      mechanicName:     r.mechanicName,
      description:      r.description,
      date:             r.invoiceDate || r.createdAt || '',
      invoiceDate:      r.invoiceDate,
      entryDate:        r.entryDate,
      laborDescription: r.laborDescription,
      laborCost:        parseFloat(r.laborCost) || 0,
      totalParts:       parseFloat(r.totalParts) || 0,
      amount:           parseFloat(r.total) || 0,
      paid:             parseFloat(r.paidAmount) || 0,
      remaining:        parseFloat(r.remaining) || parseFloat(r.total) || 0,
      status:           this.mapStatus(r.status),
      paymentMethod:    r.paymentMethod || '-',
      lines:            (r.lines || []).map((l: any) => ({
        description: l.name, quantity: l.quantity, unitPrice: parseFloat(l.unitPrice),
      })),
    };
  }

  private mapStatus(s: string): string {
    const m: Record<string, string> = {
      PAID: 'payee', PARTIAL: 'partielle',
      DRAFT: 'impayee', SENT: 'impayee', CANCELLED: 'impayee',
    };
    return m[s] ?? 'impayee';
  }

  private toIsoDate(d: string): string | null {
    if (!d) return null;
    const parts = d.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  }
}
