import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Quote } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly base = `${environment.invoiceUrl}/quotes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Quote[]> {
    return this.http.get<any[]>(this.base).pipe(map(list => list.map(r => this.map(r))));
  }

  getById(id: number): Observable<Quote> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => this.map(r)));
  }

  create(quote: Partial<Quote>): Observable<Quote> {
    const body = {
      clientId:    quote.clientId,
      clientName:  quote.clientName,
      description: quote.description,
      date:        quote.date ? this.toIsoDate(quote.date) : null,
      lines: quote.total
        ? [{ description: quote.description || 'Prestation', quantity: 1, unitPrice: quote.total }]
        : [],
    };
    return this.http.post<any>(this.base, body).pipe(map(r => this.map(r)));
  }

  update(id: number, quote: Partial<Quote>): Observable<Quote> {
    const body: any = {
      clientName:  quote.clientName,
      description: quote.description,
      date:        quote.date ? this.toIsoDate(quote.date) : undefined,
    };
    if (quote.total !== undefined) {
      body.lines = [{ description: quote.description || 'Prestation', quantity: 1, unitPrice: quote.total }];
    }
    return this.http.put<any>(`${this.base}/${id}`, body).pipe(map(r => this.map(r)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  convert(id: number): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/convert`, {});
  }

  private map(r: any): Quote {
    const total = parseFloat(r.total) || 0;
    return {
      id:          r.id,
      clientId:    r.clientId,
      clientName:  r.clientName,
      date:        r.date || r.createdAt || '',
      description: r.description || '',
      total,
      status:      this.mapStatus(r.status),
    };
  }

  private mapStatus(s: string): string {
    if (s === 'ACCEPTED' || s === 'CONVERTED') return 'accepte';
    return 'en-attente';
  }

  private toIsoDate(d: string): string | null {
    if (!d) return null;
    const parts = d.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return d;
  }
}
