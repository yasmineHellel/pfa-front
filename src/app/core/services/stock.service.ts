import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, iif } from 'rxjs';
import { map, switchMap, catchError, mergeMap } from 'rxjs/operators';
import { StockItem, SupplierPiece, Order } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private stockUrl    = `${environment.stockUrl}/stock`;
  private productsUrl = `${environment.stockUrl}/stock/products`;
  private ordersUrl   = `${environment.stockUrl}/stock/orders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<StockItem[]> {
    return forkJoin({
      products: this.http.get<any[]>(this.productsUrl).pipe(catchError(() => of([]))),
      stocks:   this.http.get<any[]>(this.stockUrl).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ products, stocks }) =>
        products.map(p => {
          const s = stocks.find((st: any) => st.productId === p.id) || {};
          return this.mapToStockItem(p, s);
        })
      )
    );
  }

  getById(id: number): Observable<StockItem> {
    return forkJoin({
      product: this.http.get<any>(`${this.productsUrl}/${id}`),
      stock:   this.http.get<any>(`${this.stockUrl}/${id}`).pipe(catchError(() => of({}))),
    }).pipe(map(({ product, stock }) => this.mapToStockItem(product, stock)));
  }

  getLowStock(): Observable<StockItem[]> {
    return forkJoin({
      lowItems: this.http.get<any[]>(`${this.stockUrl}/low-stock`).pipe(catchError(() => of([]))),
      products: this.http.get<any[]>(this.productsUrl).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ lowItems, products }) =>
        lowItems.map(s => {
          const p = products.find((pr: any) => pr.id === s.productId) || {};
          return this.mapToStockItem(p, s);
        })
      )
    );
  }

  getCatalogBySupplier(supplierId: number): Observable<SupplierPiece[]> {
    return this.http.get<any[]>(`${this.stockUrl}/catalog/${supplierId}`).pipe(
      map(list => list.map(c => this.mapToCatalogItem(c)))
    );
  }

  create(item: Partial<StockItem>): Observable<StockItem> {
    const productBody = {
      code:            item.ref  || `REF-${Date.now()}`,
      name:            item.name,
      description:     (item as any).description ?? '',
      unitPrice:       item.unitPrice,
      category:        item.category,
      supplier:        item.supplierName || '',
      supplierId:      item.supplierId   || null,
      supplierCatalog: (item as any).supplierCatalog ?? false,
    };
    return this.http.post<any>(this.productsUrl, productBody).pipe(
      switchMap(product => {
        return this.http.post<any>(`${this.stockUrl}/initialize`, null, {
          params: new HttpParams()
            .set('productId',       String(product.id))
            .set('initialQuantity', String(item.quantity      ?? 0))
            .set('minThreshold',    String(item.alertThreshold ?? 10))
            .set('maxThreshold',    String((item.alertThreshold ?? 10) * 5))
        }).pipe(
          map(stock => this.mapToStockItem(product, stock))
        );
      })
    );
  }

  update(id: number, item: Partial<StockItem>): Observable<StockItem> {
    const body: any = {};
    if (item.name      !== undefined) body.name      = item.name;
    if (item.unitPrice !== undefined) body.unitPrice  = item.unitPrice;
    if (item.category  !== undefined) body.category   = item.category;
    return this.http.put<any>(`${this.productsUrl}/${id}`, body).pipe(
      map(p => this.mapToStockItem(p, {}))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.productsUrl}/${id}`);
  }

  sendOrder(order: Order): Observable<{ message: string }> {
    const requests = order.items.map(item => {
      let params = new HttpParams()
        .set('productId',  item.pieceId.toString())
        .set('quantity',   item.quantity.toString())
        .set('unitPrice',  item.unitPrice.toString())
        .set('supplier',   order.supplierName);
      if (order.mechanicName)  params = params.set('mechanicName',  order.mechanicName);
      if (order.mechanicPhone) params = params.set('mechanicPhone', order.mechanicPhone);
      if (order.mechanicEmail) params = params.set('mechanicEmail', order.mechanicEmail);
      return this.http.post<any>(`${this.ordersUrl}`, null, { params });
    });
    return forkJoin(requests).pipe(map(() => ({ message: 'Commandes envoyées avec succès.' })));
  }

  getOrdersBySupplier(supplierId: number, supplierName?: string): Observable<Order[]> {
    if (supplierName) {
      return this.http.get<any[]>(`${this.ordersUrl}/supplier/${encodeURIComponent(supplierName)}`).pipe(
        map(list => list.map(o => this.mapToOrder(o))),
        catchError(() => this.http.get<any[]>(this.ordersUrl).pipe(
          map(list => list.filter(o => o.supplierId === supplierId).map(o => this.mapToOrder(o)))
        ))
      );
    }
    return this.http.get<any[]>(this.ordersUrl).pipe(
      map(list => list.map(o => this.mapToOrder(o)))
    );
  }

  getOrdersByMechanic(mechanicName: string): Observable<Order[]> {
    return this.http.get<any[]>(`${this.ordersUrl}/mechanic/${encodeURIComponent(mechanicName)}`).pipe(
      map(list => list.map(o => this.mapToOrder(o))),
      catchError(() => of([]))
    );
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    const backendStatus = this.mapOrderStatusToBackend(status);
    return this.http.patch<any>(
      `${this.ordersUrl}/${id}/status`,
      null,
      { params: new HttpParams().set('status', backendStatus) }
    ).pipe(map(o => this.mapToOrder(o)));
  }

  updateCatalogPiece(id: number, data: Partial<SupplierPiece>): Observable<SupplierPiece> {
    const body: any = {};
    if (data.unitPrice   !== undefined) body.unitPrice   = data.unitPrice;
    if (data.description !== undefined) body.description = data.description;
    if (data.name        !== undefined) body.name        = data.name;

    const updateProduct$ = this.http.put<any>(`${this.stockUrl}/catalog/piece/${id}`, body);

    if (data.availableQty === undefined) {
      return updateProduct$.pipe(map(p => this.mapToCatalogItem(p)));
    }

    // Also update stock quantity: read current qty, then add or remove the delta
    return updateProduct$.pipe(
      switchMap(p =>
        this.http.get<any>(`${this.stockUrl}/${id}`).pipe(
          catchError(() => of({ availableQuantity: 0 })),
          switchMap(stock => {
            const currentQty = stock.availableQuantity ?? stock.quantity ?? 0;
            const delta = data.availableQty! - currentQty;
            if (delta === 0) return of(p);
            const endpoint = delta > 0 ? 'add' : 'remove';
            const qty = Math.abs(delta);
            return this.http.post<any>(`${this.stockUrl}/${id}/${endpoint}`, null, {
              params: new HttpParams().set('quantity', String(qty)).set('reference', 'mise-a-jour-manuelle'),
            }).pipe(catchError(() => of(p)));
          }),
          map(() => this.mapToCatalogItem({ ...p, availableQty: data.availableQty }))
        )
      )
    );
  }

  private mapToStockItem(p: any, s: any): StockItem {
    const qty       = s.availableQuantity ?? s.quantity ?? p.availableQty ?? 0;
    const threshold = s.minThreshold ?? 10;
    const status    = qty <= 0 ? 'critique' : qty <= threshold ? 'bas' : 'ok';
    return {
      id:             p.id ?? s.productId,
      ref:            p.code ?? p.ref ?? p.sku ?? '',
      name:           p.name ?? s.productName ?? '',
      category:       p.category ?? '',
      categoryColor:  this.getCategoryColor(p.category ?? ''),
      unitPrice:      typeof p.unitPrice === 'string' ? parseFloat(p.unitPrice) : (p.unitPrice ?? 0),
      quantity:       qty,
      alertThreshold: threshold,
      status,
      supplierId:     p.supplierId ?? null,
      supplierName:   p.supplier   ?? p.supplierName ?? '',
    };
  }

  private mapToCatalogItem(c: any): SupplierPiece {
    return {
      id:           c.id,
      ref:          c.ref ?? c.code ?? '',
      name:         c.name ?? '',
      category:     c.category ?? '',
      categoryColor: this.getCategoryColor(c.category ?? ''),
      unitPrice:    typeof c.unitPrice === 'string' ? parseFloat(c.unitPrice) : (c.unitPrice ?? 0),
      availableQty: c.availableQty ?? c.availableQuantity ?? 0,
      supplierId:   c.supplierId ?? 0,
      supplierName: c.supplierName ?? c.supplier ?? '',
      description:  c.description ?? '',
    };
  }

  private mapToOrder(o: any): Order {
    return {
      id:            o.id,
      supplierId:    o.supplierId  ?? 0,
      supplierName:  o.supplier    ?? o.supplierName ?? '',
      mechanicName:  o.mechanicName  ?? '',
      mechanicPhone: o.mechanicPhone ?? '',
      mechanicEmail: o.mechanicEmail ?? '',
      items: [{
        pieceId:   o.productId   ?? 0,
        pieceName: o.productName ?? '',
        ref:       o.productCode ?? '',
        quantity:  o.quantity    ?? 0,
        unitPrice: typeof o.unitPrice === 'string' ? parseFloat(o.unitPrice) : (o.unitPrice ?? 0),
      }],
      totalAmount: typeof o.totalPrice === 'string' ? parseFloat(o.totalPrice) : (o.totalPrice ?? 0),
      date:   o.orderDate ?? o.date ?? '',
      status: this.mapOrderStatusToFrontend(o.status ?? ''),
    };
  }

  private mapOrderStatusToFrontend(s: string): Order['status'] {
    const map: Record<string, Order['status']> = {
      PENDING:    'en-attente',
      PROCESSING: 'en-cours',
      SHIPPED:    'expediee',
      DELIVERED:  'livree',
      CANCELLED:  'annulee',
    };
    return map[s] ?? 'en-attente';
  }

  private mapOrderStatusToBackend(s: string): string {
    const map: Record<string, string> = {
      'en-attente': 'PENDING',
      'en-cours':   'PROCESSING',
      'expediee':   'SHIPPED',
      'livree':     'DELIVERED',
      'annulee':    'CANCELLED',
    };
    return map[s] ?? 'PENDING';
  }

  private getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      'Freinage':     'blue',
      'Moteur':       'amber',
      'Distribution': 'purple',
      'Électrique':   'blue',
      'Suspension':   'green',
      'Direction':    'purple',
    };
    return map[category] ?? 'gray';
  }
}
