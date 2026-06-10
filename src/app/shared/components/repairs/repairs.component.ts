import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RepairService }  from '../../../core/services/repair.service';
import { ClientService }  from '../../../core/services/client.service';
import { VehicleService } from '../../../core/services/vehicle.service';
import { AuthService }    from '../../../core/services/auth.service';
import { Repair, Client, Vehicle, InvoiceLine, RepairInvoice } from '../../../core/models/models';

type ClientMode  = 'existing' | 'new';
type VehicleMode = 'existing' | 'new';
type ModalMode   = 'create' | 'edit';

@Component({
  selector: 'app-repairs',
  templateUrl: './repairs.component.html',
  styleUrls: ['./repairs.component.css']
})
export class RepairsComponent implements OnInit {
  repairs:  Repair[] = [];
  filtered: Repair[] = [];
  loading   = false;
  error     = '';
  activeTab = 0;

  // ── Detail panel ──────────────────────────────────────────────
  selectedRepair: Repair | null = null;
  openDetail(r: Repair): void { this.selectedRepair = r; }
  closeDetail(): void         { this.selectedRepair = null; }

  // ── Delete confirm ────────────────────────────────────────────
  repairToDelete: Repair | null = null;
  deleting = false;

  confirmDelete(r: Repair): void { this.repairToDelete = r; }
  cancelDelete(): void           { this.repairToDelete = null; }

  doDelete(): void {
    if (!this.repairToDelete) return;
    const id = this.repairToDelete.id;
    this.deleting = true;
    this.repairService.delete(id).subscribe({
      next: () => {
        this.repairs = this.repairs.filter(r => r.id !== id);
        this.applyFilter();
        if (this.selectedRepair?.id === id) this.selectedRepair = null;
        this.repairToDelete = null;
        this.deleting = false;
      },
      error: () => { this.deleting = false; }
    });
  }

  // ── Modal ──────────────────────────────────────────────────────
  showModal    = false;
  modalMode:   ModalMode   = 'create';
  editingRepair: Repair | null = null;
  submitting   = false;
  formError    = '';
  form!: FormGroup;

  clientMode:  ClientMode  = 'existing';
  vehicleMode: VehicleMode = 'existing';

  clients:           Client[]  = [];
  allVehicles:       Vehicle[] = [];
  vehiclesForClient: Vehicle[] = [];
  dataLoading = false;

  readonly STATUS_OPTIONS = [
    { value: 'en-attente', label: 'En attente pièces' },
    { value: 'en-cours',   label: 'En cours'           },
    { value: 'diagnostic', label: 'Diagnostic'          },
    { value: 'termine',    label: 'Terminé'             },
  ];

  constructor(
    private fb:             FormBuilder,
    private repairService:  RepairService,
    private clientService:  ClientService,
    private vehicleService: VehicleService,
    public  authService:    AuthService
  ) {}

  get isAdmin():      boolean { return this.authService.getRole() === 'ADMIN'; }
  get isMecanicien(): boolean { return this.authService.getRole() === 'MECANICIEN'; }

  get tabs(): string[] {
    const total     = this.repairs.length;
    const enCours   = this.repairs.filter(r => r.status === 'en-cours').length;
    const termine   = this.repairs.filter(r => r.status === 'termine').length;
    const enAttente = this.repairs.filter(r => r.status === 'en-attente').length;
    return [
      `Toutes (${total})`,
      `En cours (${enCours})`,
      `Terminées (${termine})`,
      `En attente (${enAttente})`
    ];
  }

  ngOnInit(): void { this.loadRepairs(); }

  loadRepairs(): void {
    this.loading = true;
    this.repairService.getAll().subscribe({
      next: data => {
        if (this.isMecanicien) {
          const u      = this.authService.getCurrentUser()!;
          const myName = `${u.firstName} ${u.lastName}`;
          this.repairs = data.filter(r => r.mechanicName === myName);
        } else {
          this.repairs = data;
        }
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.error = 'Erreur de chargement des réparations.'; this.loading = false; }
    });
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.repairs]; return; }
    const map = ['', 'en-cours', 'termine', 'en-attente'];
    this.filtered = this.repairs.filter(r => r.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  // ── Open CREATE ────────────────────────────────────────────────
  openModal(): void {
    this.modalMode    = 'create';
    this.editingRepair = null;
    this.formError    = '';
    this.submitting   = false;
    this.clientMode   = 'existing';
    this.vehicleMode  = 'existing';
    this.buildCreateForm();
    this.showModal = true;

    if (!this.clients.length) {
      this.dataLoading = true;
      forkJoin({
        clients:  this.clientService.getAll(),
        vehicles: this.vehicleService.getAll(),
      }).subscribe({
        next: ({ clients, vehicles }) => {
          this.clients     = clients;
          this.allVehicles = vehicles;
          this.dataLoading = false;
        },
        error: () => { this.dataLoading = false; }
      });
    }
  }

  // ── Open EDIT ─────────────────────────────────────────────────
  openEdit(r: Repair): void {
    this.modalMode     = 'edit';
    this.editingRepair = r;
    this.formError     = '';
    this.submitting    = false;
    this.buildEditForm(r);
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  // ── Forms ──────────────────────────────────────────────────────
  private buildCreateForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      clientId:        [''],
      clientFirstName: [''],
      clientLastName:  [''],
      clientPhone:     [''],
      vehicleId:       [''],
      vehiclePlate:    [''],
      vehicleBrand:    [''],
      vehicleModel:    [''],
      vehicleYear:     [''],
      description:     ['', Validators.required],
      status:          ['en-attente', Validators.required],
      cost:            [0, [Validators.required, Validators.min(0)]],
      entryDate:       [today, Validators.required],
    });

    this.form.get('clientId')!.valueChanges.subscribe(cid => {
      this.vehiclesForClient = this.allVehicles.filter(v => v.clientId === +cid);
      this.form.get('vehicleId')!.setValue('');
    });
  }

  private buildEditForm(r: Repair): void {
    // Convert "DD/MM/YYYY" → "YYYY-MM-DD" for date input
    const parts = r.entryDate?.split('/') ?? [];
    const dateValue = parts.length === 3
      ? `${parts[2]}-${parts[1]}-${parts[0]}`
      : new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      description:  [r.description,  Validators.required],
      status:       [r.status,       Validators.required],
      cost:         [r.cost,         [Validators.required, Validators.min(0)]],
      entryDate:    [dateValue,      Validators.required],
      mechanicName: [r.mechanicName],
    });
  }

  // ── Toggle client/vehicle mode (create only) ───────────────────
  setClientMode(mode: ClientMode): void {
    this.clientMode  = mode;
    this.vehicleMode = 'existing';
    this.vehiclesForClient = [];
    this.form.get('clientId')!.setValue('');
    this.form.get('vehicleId')!.setValue('');
    ['clientFirstName','clientLastName','vehiclePlate','vehicleBrand','vehicleModel'].forEach(f =>
      this.form.get(f)!.setValue('')
    );
  }

  setVehicleMode(mode: VehicleMode): void {
    this.vehicleMode = mode;
    this.form.get('vehicleId')!.setValue('');
    ['vehiclePlate','vehicleBrand','vehicleModel'].forEach(f => this.form.get(f)!.setValue(''));
  }

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }

  // ── Submit ─────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.modalMode === 'edit') { this.submitEdit(); return; }
    this.submitCreate();
  }

  private submitCreate(): void {
    if (!this.validateCreate()) { this.form.markAllAsTouched(); return; }

    this.submitting = true;
    this.formError  = '';
    const v = this.form.value;

    let clientId = 0, clientName = '', clientPhone = '';
    let vehicleId = 0, vehicleName = '', plate = '';

    if (this.clientMode === 'existing') {
      const client = this.clients.find(c => c.id === +v.clientId);
      clientId    = +v.clientId;
      clientName  = client ? `${client.firstName} ${client.lastName}` : '';
      clientPhone = client?.phone ?? '';
    } else {
      clientName  = `${v.clientFirstName} ${v.clientLastName}`;
      clientPhone = v.clientPhone;
    }

    if (this.clientMode === 'existing' && this.vehicleMode === 'existing') {
      const vehicle = this.vehiclesForClient.find(x => x.id === +v.vehicleId);
      vehicleId   = +v.vehicleId;
      vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : '';
      plate       = vehicle?.plate ?? '';
    } else {
      vehicleName = `${v.vehicleBrand} ${v.vehicleModel}`.trim();
      plate       = v.vehiclePlate;
    }

    const u = this.authService.getCurrentUser()!;

    this.repairService.create({
      clientId, clientName, clientPhone, vehicleId, vehicleName, plate,
      description:  v.description,
      mechanicName: `${u.firstName} ${u.lastName}`,
      status:       v.status,
      cost:         +v.cost,
      entryDate:    new Date(v.entryDate).toLocaleDateString('fr-TN'),
    }).subscribe({
      next: created => {
        this.repairs.unshift(created);
        this.applyFilter();
        this.closeModal();
        this.submitting = false;
      },
      error: err => {
        this.formError  = err.error?.message || 'Erreur lors de la création.';
        this.submitting = false;
      }
    });
  }

  private submitEdit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting = true;
    this.formError  = '';
    const v = this.form.value;
    const r = this.editingRepair!;

    const payload: Partial<Repair> = {
      ...r,
      description:  v.description,
      status:       v.status,
      cost:         +v.cost,
      entryDate:    new Date(v.entryDate).toLocaleDateString('fr-TN'),
      mechanicName: this.isAdmin ? v.mechanicName : r.mechanicName,
    };

    this.repairService.update(r.id, payload).subscribe({
      next: updated => {
        const idx = this.repairs.findIndex(x => x.id === r.id);
        if (idx !== -1) this.repairs[idx] = updated;
        this.applyFilter();
        // sync detail panel if open
        if (this.selectedRepair?.id === r.id) this.selectedRepair = updated;
        this.closeModal();
        this.submitting = false;
      },
      error: err => {
        this.formError  = err.error?.message || 'Erreur lors de la modification.';
        this.submitting = false;
      }
    });
  }

  private validateCreate(): boolean {
    const v = this.form.value;
    if (this.clientMode === 'existing') {
      if (!v.clientId) { this.formError = 'Veuillez sélectionner un client.'; return false; }
      if (this.vehicleMode === 'existing' && !v.vehicleId) {
        this.formError = 'Veuillez sélectionner un véhicule.'; return false;
      }
      if (this.vehicleMode === 'new' && (!v.vehiclePlate || !v.vehicleBrand || !v.vehicleModel)) {
        this.formError = 'Renseignez la plaque, la marque et le modèle du véhicule.'; return false;
      }
    } else {
      if (!v.clientFirstName || !v.clientLastName) {
        this.formError = 'Renseignez le prénom et le nom du client.'; return false;
      }
      if (!v.vehiclePlate || !v.vehicleBrand || !v.vehicleModel) {
        this.formError = 'Renseignez la plaque, la marque et le modèle du véhicule.'; return false;
      }
    }
    if (this.form.get('description')!.invalid) return false;
    return true;
  }

  // ── Facture ────────────────────────────────────────────────────
  showInvoiceModal  = false;
  invoiceRepair:    Repair | null = null;
  invoiceLines:     InvoiceLine[] = [];
  laborDescription  = 'Main d\'œuvre';
  laborCost         = 0;
  invoiceSubmitting = false;
  invoiceError      = '';
  generatedInvoice: RepairInvoice | null = null;

  get invoiceTotalParts(): number {
    return this.invoiceLines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
  }
  get invoiceTotal(): number { return this.invoiceTotalParts + this.laborCost; }

  openInvoice(r: Repair): void {
    this.invoiceRepair    = r;
    this.invoiceLines     = [{ description: '', quantity: 1, unitPrice: 0 }];
    this.laborDescription = 'Main d\'œuvre';
    this.laborCost        = 0;
    this.invoiceError     = '';
    this.invoiceSubmitting = false;
    this.generatedInvoice  = null;
    this.showInvoiceModal  = true;
  }

  closeInvoice(): void {
    this.showInvoiceModal = false;
    this.invoiceRepair    = null;
    this.generatedInvoice = null;
  }

  addInvoiceLine(): void { this.invoiceLines.push({ description: '', quantity: 1, unitPrice: 0 }); }
  removeInvoiceLine(i: number): void { this.invoiceLines.splice(i, 1); }

  submitInvoice(): void {
    const r = this.invoiceRepair!;
    this.invoiceSubmitting = true;
    this.invoiceError      = '';
    const u = this.authService.getCurrentUser()!;

    this.repairService.createInvoice({
      repairId:          r.id,
      clientName:        r.clientName,
      clientPhone:       r.clientPhone,
      vehicleName:       r.vehicleName,
      plate:             r.plate,
      mechanicName:      `${u.firstName} ${u.lastName}`,
      repairDescription: r.description,
      entryDate:         r.entryDate,
      invoiceDate:       new Date().toLocaleDateString('fr-TN'),
      lines:             this.invoiceLines.filter(l => l.description.trim()),
      totalParts:        this.invoiceTotalParts,
      laborDescription:  this.laborDescription,
      laborCost:         this.laborCost,
      total:             this.invoiceTotal,
    }).subscribe({
      next: inv => {
        this.generatedInvoice  = inv;
        this.invoiceSubmitting = false;
      },
      error: err => {
        this.invoiceError      = err.error?.message || 'Erreur lors de la génération.';
        this.invoiceSubmitting = false;
      }
    });
  }

  printInvoice(): void { window.print(); }

  // ── Table helpers ──────────────────────────────────────────────
  statusBadge(s: string): string {
    return ({ 'en-cours': 'badge-amber', termine: 'badge-green', 'en-attente': 'badge-red', diagnostic: 'badge-blue' } as any)[s] || 'badge-gray';
  }

  statusLabel(s: string): string {
    return ({ 'en-cours': 'En cours', termine: 'Terminé', 'en-attente': 'En attente pièces', diagnostic: 'Diagnostic' } as any)[s] || s;
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  avatarColor(id: number): string {
    return ['amber', 'blue', 'green', 'purple'][id % 4];
  }
}
