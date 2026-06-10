import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockItem, SupplierPiece, Order } from '../models/models';
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

  getCatalogBySupplier(supplierId: number): Observable<SupplierPiece[]> {
    return this.http.get<SupplierPiece[]>(`${this.apiUrl}/catalog/${supplierId}`);
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

  sendOrder(order: Order): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/orders`, order);
  }

  getOrdersBySupplier(supplierId: number): Observable<Order[]> {
    const params = new HttpParams().set('supplierId', supplierId.toString());
    return this.http.get<Order[]>(`${environment.apiUrl}/orders`, { params });
  }

  getOrdersByMechanic(mechanicName: string): Observable<Order[]> {
    const params = new HttpParams().set('mechanicName', mechanicName);
    return this.http.get<Order[]>(`${environment.apiUrl}/orders`, { params });
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${environment.apiUrl}/orders/${id}/status`, { status });
  }

  updateCatalogPiece(id: number, data: Partial<SupplierPiece>): Observable<SupplierPiece> {
    return this.http.put<SupplierPiece>(`${this.apiUrl}/catalog/piece/${id}`, data);
  }
}
