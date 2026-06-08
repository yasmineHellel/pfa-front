import { Component, OnInit } from '@angular/core';
import { VehicleService } from '../../../core/services/vehicle.service';
import { Vehicle } from '../../../core/models/models';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html'
})
export class VehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filtered: Vehicle[] = [];
  loading = false;
  error = '';

  constructor(private vehicleService: VehicleService) {}

  ngOnInit(): void {
    this.loading = true;
    this.vehicleService.getAll().subscribe({
      next: data => { this.vehicles = data; this.filtered = [...data]; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des véhicules.'; this.loading = false; }
    });
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.vehicles.filter(v =>
      v.plate.toLowerCase().includes(t) ||
      v.brand.toLowerCase().includes(t) ||
      v.model.toLowerCase().includes(t) ||
      v.clientName.toLowerCase().includes(t)
    );
  }
}
