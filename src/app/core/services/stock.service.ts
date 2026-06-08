import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockItem } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private apiUrl = `${environment.apiUrl}/stock`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(this.apiUrl);
  }

  getById(id: number): Observable<StockItem> {
    return this.http.get<StockItem>(`${this.apiUrl}/${id}`);
  }

  getLowStock(): Observable<StockItem[]> {
    return this.http.get<StockItem[]>(`${this.apiUrl}/low-stock`);
  }

  create(item: Partial<StockItem>): Observable<StockItem> {
    return this.http.post<StockItem>(this.apiUrl, item);
  }

  update(id: number, item: Partial<StockItem>): Observable<StockItem> {
    return this.http.put<StockItem>(`${this.apiUrl}/${id}`, item);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
