import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../core/services/vehicle.service';
import { ClientService }  from '../../../core/services/client.service';
import { Vehicle, Client } from '../../../core/models/models';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css']
})
export class VehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filtered: Vehicle[] = [];
  clients:  Client[]  = [];
  loading = false;
  error   = '';

  showModal    = false;
  modalMode: 'create' | 'edit' = 'create';
  editingVehicle: Vehicle | null = null;
  form: FormGroup;
  submitting = false;
  formError  = '';

  confirmDeleteId: number | null = null;

  createNewClient = false;

  constructor(
    private vehicleService: VehicleService,
    private clientService:  ClientService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      plate:           ['', Validators.required],
      brand:           ['', Validators.required],
      model:           ['', Validators.required],
      engine:          [''],
      year:            ['', [Validators.required, Validators.min(1900)]],
      mileage:         [0,  Validators.required],
      clientId:        [''],
      clientFirstName: [''],
      clientLastName:  [''],
      clientPhone:     [''],
      clientEmail:     ['', Validators.email],
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.vehicleService.getAll().subscribe({
      next:  d => { this.vehicles = d; this.filtered = [...d]; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement.'; this.loading = false; }
    });
    this.clientService.getAll().subscribe(c => this.clients = c);
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.vehicles.filter(v =>
      v.plate.toLowerCase().includes(t) || v.brand.toLowerCase().includes(t) ||
      v.model.toLowerCase().includes(t)  || v.clientName.toLowerCase().includes(t)
    );
  }

  toggleCreateNewClient(): void {
    this.createNewClient = !this.createNewClient;
    if (this.createNewClient) {
      this.form.get('clientId')!.clearValidators();
      this.form.get('clientFirstName')!.setValidators(Validators.required);
      this.form.get('clientLastName')!.setValidators(Validators.required);
      this.form.get('clientPhone')!.setValidators(Validators.required);
      this.form.get('clientEmail')!.setValidators([Validators.required, Validators.email]);
    } else {
      this.form.get('clientId')!.setValidators(Validators.required);
      this.form.get('clientFirstName')!.clearValidators();
      this.form.get('clientLastName')!.clearValidators();
      this.form.get('clientPhone')!.clearValidators();
      this.form.get('clientEmail')!.setValidators(Validators.email);
    }
    ['clientId', 'clientFirstName', 'clientLastName', 'clientPhone', 'clientEmail']
      .forEach(k => this.form.get(k)!.updateValueAndValidity());
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.editingVehicle = null;
    this.createNewClient = false;
    this.form.reset({ mileage: 0 });
    this.form.get('clientId')!.setValidators(Validators.required);
    ['clientFirstName', 'clientLastName', 'clientPhone'].forEach(k => this.form.get(k)!.clearValidators());
    this.form.get('clientEmail')!.setValidators(Validators.email);
    ['clientId', 'clientFirstName', 'clientLastName', 'clientPhone', 'clientEmail']
      .forEach(k => this.form.get(k)!.updateValueAndValidity());
    this.formError = '';
    this.showModal = true;
  }

  openEdit(v: Vehicle): void {
    this.modalMode = 'edit';
    this.editingVehicle = v;
    this.form.patchValue({ plate: v.plate, brand: v.brand, model: v.model, engine: v.engine, year: v.year, mileage: v.mileage, clientId: v.clientId });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; this.createNewClient = false; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.formError  = '';
    const data = this.form.value;

    if (this.modalMode === 'create' && this.createNewClient) {
      const clientPayload = {
        firstName: data.clientFirstName,
        lastName:  data.clientLastName,
        phone:     data.clientPhone,
        email:     data.clientEmail,
      };
      this.clientService.create(clientPayload).subscribe({
        next: newClient => {
          this.clients.push(newClient);
          this.vehicleService.create({ ...data, clientId: newClient.id }).subscribe({
            next: created => {
              this.vehicles.unshift(created);
              this.filtered = [...this.vehicles];
              this.submitting = false; this.showModal = false;
            },
            error: () => { this.formError = 'Erreur lors de la création du véhicule.'; this.submitting = false; }
          });
        },
        error: () => { this.formError = 'Erreur lors de la création du client.'; this.submitting = false; }
      });
      return;
    }

    if (this.modalMode === 'create') {
      this.vehicleService.create(data).subscribe({
        next: created => {
          this.vehicles.unshift(created);
          this.filtered = [...this.vehicles];
          this.submitting = false; this.showModal = false;
        },
        error: () => { this.formError = 'Erreur lors de la création.'; this.submitting = false; }
      });
    } else {
      this.vehicleService.update(this.editingVehicle!.id, data).subscribe({
        next: updated => {
          const idx = this.vehicles.findIndex(v => v.id === updated.id);
          if (idx !== -1) this.vehicles[idx] = updated;
          this.filtered = [...this.vehicles];
          this.submitting = false; this.showModal = false;
        },
        error: () => { this.formError = 'Erreur lors de la mise à jour.'; this.submitting = false; }
      });
    }
  }

  confirmDelete(id: number): void { this.confirmDeleteId = id; }
  cancelDelete():  void { this.confirmDeleteId = null; }

  doDelete(): void {
    if (this.confirmDeleteId == null) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;
    this.vehicleService.delete(id).subscribe({
      next: () => { this.vehicles = this.vehicles.filter(v => v.id !== id); this.filtered = [...this.vehicles]; }
    });
  }

  f(name: string) { return this.form.get(name)!; }
}
