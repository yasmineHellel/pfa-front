import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Invoice } from '../models/models';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private invoices: Invoice[] = [];
  private nextId = 1;

  getAll(): Observable<Invoice[]> {
    return of([...this.invoices]);
  }

  getById(id: number): Observable<Invoice> {
    return of(this.invoices.find(i => i.id === id)!);
  }

  getByClient(clientId: number): Observable<Invoice[]> {
    return of(this.invoices.filter(i => i.clientId === clientId));
  }

  create(invoice: Partial<Invoice>): Observable<Invoice> {
    const created: Invoice = {
      ...(invoice as Invoice),
      id:            this.nextId++,
      paid:          0,
      remaining:     invoice.amount ?? 0,
      status:        'impayee',
      paymentMethod: '-',
    };
    this.invoices.unshift(created);
    return of(created);
  }

  update(id: number, invoice: Partial<Invoice>): Observable<Invoice> {
    const idx = this.invoices.findIndex(i => i.id === id);
    if (idx !== -1) this.invoices[idx] = { ...this.invoices[idx], ...invoice };
    return of(this.invoices[idx]);
  }

  delete(id: number): Observable<void> {
    this.invoices = this.invoices.filter(i => i.id !== id);
    return of(void 0);
  }

  markAsPaid(id: number, paymentMethod: string): Observable<Invoice> {
    const inv = this.invoices.find(i => i.id === id);
    if (inv) {
      inv.paid          = inv.amount;
      inv.remaining     = 0;
      inv.status        = 'payee';
      inv.paymentMethod = paymentMethod;
    }
    return of(inv!);
  }
}
