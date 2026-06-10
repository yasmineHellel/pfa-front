import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { RepairService } from '../../../core/services/repair.service';
import { Client, Vehicle, Repair } from '../../../core/models/models';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients:  Client[] = [];
  filtered: Client[] = [];
  loading = false;
  error   = '';

  // Modal create/edit
  showModal    = false;
  modalMode: 'create' | 'edit' = 'create';
  editingClient: Client | null = null;
  form: FormGroup;
  submitting = false;
  formError  = '';

  // Delete
  confirmDeleteId: number | null = null;

  // Detail drawer
  selectedClient:  Client  | null = null;
  clientVehicles:  Vehicle[] = [];
  clientRepairs:   Repair[]  = [];
  drawerLoading    = false;

  constructor(
    private clientService:  ClientService,
    private vehicleService: VehicleService,
    private repairService:  RepairService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      phone:     ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.clientService.getAll().subscribe({
      next:  d => { this.clients = d; this.filtered = [...d]; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.clients.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(t) ||
      c.phone.includes(t) || c.email.toLowerCase().includes(t)
    );
  }

  openCreate(): void {
    this.modalMode = 'create';
    this.editingClient = null;
    this.form.reset();
    this.formError = '';
    this.showModal = true;
  }

  openEdit(c: Client): void {
    this.modalMode = 'edit';
    this.editingClient = c;
    this.form.patchValue({ firstName: c.firstName, lastName: c.lastName, phone: c.phone, email: c.email });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.formError  = '';
    const data = this.form.value;
    if (this.modalMode === 'create') {
      this.clientService.create(data).subscribe({
        next: created => {
          this.clients.unshift(created);
          this.filtered = [...this.clients];
          this.submitting = false; this.showModal = false;
        },
        error: () => { this.formError = 'Erreur lors de la création.'; this.submitting = false; }
      });
    } else {
      this.clientService.update(this.editingClient!.id, data).subscribe({
        next: updated => {
          const idx = this.clients.findIndex(c => c.id === updated.id);
          if (idx !== -1) this.clients[idx] = updated;
          this.filtered = [...this.clients];
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
    this.clientService.delete(id).subscribe({
      next: () => { this.clients = this.clients.filter(c => c.id !== id); this.filtered = [...this.clients]; }
    });
  }

  openDetail(c: Client): void {
    this.selectedClient = c;
    this.clientVehicles = [];
    this.clientRepairs  = [];
    this.drawerLoading  = true;
    this.vehicleService.getByClient(c.id).subscribe(v => this.clientVehicles = v);
    this.repairService.getByClient(c.id).subscribe(r => { this.clientRepairs = r; this.drawerLoading = false; });
  }

  closeDetail(): void { this.selectedClient = null; }

  initials(c: Client): string {
    return (c.firstName[0] + c.lastName[0]).toUpperCase();
  }

  avatarColor(c: Client): string {
    return ['amber', 'blue', 'green', 'purple'][c.id % 4];
  }

  repairStatusBadge(s: string): string {
    return ({ 'en-cours': 'badge-amber', 'termine': 'badge-green', 'en-attente': 'badge-red', 'diagnostic': 'badge-blue' } as any)[s] || 'badge-gray';
  }

  repairStatusLabel(s: string): string {
    return ({ 'en-cours': 'En cours', 'termine': 'Terminé', 'en-attente': 'En attente', 'diagnostic': 'Diagnostic' } as any)[s] || s;
  }

  f(name: string) { return this.form.get(name)!; }
}
