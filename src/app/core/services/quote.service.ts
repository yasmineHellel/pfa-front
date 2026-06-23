import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Quote } from '../models/models';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private quotes: Quote[] = [];
  private nextId = 1;

  getAll(): Observable<Quote[]> {
    return of([...this.quotes]);
  }

  getById(id: number): Observable<Quote> {
    return of(this.quotes.find(q => q.id === id)!);
  }

  create(quote: Partial<Quote>): Observable<Quote> {
    const created: Quote = { ...(quote as Quote), id: this.nextId++, status: 'en-attente' };
    this.quotes.unshift(created);
    return of(created);
  }

  update(id: number, quote: Partial<Quote>): Observable<Quote> {
    const idx = this.quotes.findIndex(q => q.id === id);
    if (idx !== -1) this.quotes[idx] = { ...this.quotes[idx], ...quote };
    return of(this.quotes[idx]);
  }

  delete(id: number): Observable<void> {
    this.quotes = this.quotes.filter(q => q.id !== id);
    return of(void 0);
  }

  convert(id: number): Observable<any> {
    const quote = this.quotes.find(q => q.id === id);
    if (quote) quote.status = 'accepte';
    return of({ message: 'Converti en facture.' });
  }
}
