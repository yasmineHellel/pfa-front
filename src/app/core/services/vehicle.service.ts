import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Vehicle } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private apiUrl = `${environment.vehicleUrl}/vehicles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Vehicle[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(map(list => list.map(v => this.mapVehicle(v))));
  }

  getById(id: number): Observable<Vehicle> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(map(v => this.mapVehicle(v)));
  }

  getByClient(clientId: number): Observable<Vehicle[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owner/${clientId}`).pipe(
      map(list => list.map(v => this.mapVehicle(v)))
    );
  }

  create(vehicle: Partial<Vehicle>): Observable<Vehicle> {
    const body = this.mapToCreateRequest(vehicle);
    return this.http.post<any>(this.apiUrl, body).pipe(map(v => this.mapVehicle(v)));
  }

  update(id: number, vehicle: Partial<Vehicle>): Observable<Vehicle> {
    const body = this.mapToUpdateRequest(vehicle);
    return this.http.put<any>(`${this.apiUrl}/${id}`, body).pipe(map(v => this.mapVehicle(v)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private mapVehicle(v: any): Vehicle {
    const clientName = (v.clientFirstName || v.clientLastName)
      ? `${v.clientFirstName ?? ''} ${v.clientLastName ?? ''}`.trim()
      : (v.clientName ?? '');
    return {
      id:          v.id,
      plate:       v.licensePlate ?? v.plate ?? '',
      brand:       v.make ?? v.brand ?? '',
      model:       v.model ?? '',
      engine:      v.notes ?? v.engine ?? '',
      year:        v.year ?? new Date().getFullYear(),
      clientId:    v.clientId ?? 0,
      clientName,
      mileage:     v.mileage ?? 0,
      repairCount: v.repairCount ?? 0,
    };
  }

  private mapToCreateRequest(v: Partial<Vehicle>): any {
    return {
      licensePlate: v.plate,
      make:         v.brand,
      model:        v.model,
      year:         v.year,
      mileage:      v.mileage ?? 0,
      color:        '',
      vin:          '',
      notes:        v.engine ?? '',
      clientId:     v.clientId ?? null,
    };
  }

  private mapToUpdateRequest(v: Partial<Vehicle>): any {
    const req: any = {};
    if (v.brand   !== undefined) req.make    = v.brand;
    if (v.model   !== undefined) req.model   = v.model;
    if (v.mileage !== undefined) req.mileage = v.mileage;
    if (v.engine  !== undefined) req.notes   = v.engine;
    return req;
  }
}
