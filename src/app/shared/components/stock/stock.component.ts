import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StockService }  from '../../../core/services/stock.service';
import { UserService }   from '../../../core/services/user.service';
import { AuthService }   from '../../../core/services/auth.service';
import { StockItem, SupplierPiece, Order, OrderItem } from '../../../core/models/models';
import { ManagedUser } from '../../../core/models/auth.models';

type SupplierMode = 'registered' | 'external';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.css']
})
export class StockComponent implements OnInit {

  // ── Onglets principaux ─────────────────────────────────────────
  mainTab = 'inventory';

  // ── Mes commandes (vue mécanicien) ─────────────────────────────
  mechOrders:        Order[] = [];
  mechOrdersLoading  = false;
  expandedMechOrderId: number | null = null;

  // ── Inventaire ─────────────────────────────────────────────────
  items: StockItem[]    = [];
  filtered: StockItem[] = [];
  loading  = false;
  error    = '';

  // ── Ajout pièce (modal) ────────────────────────────────────────
  showModal  = false;
  submitting = false;
  formError  = '';
  form!: FormGroup;
  supplierMode: SupplierMode = 'registered';
  registeredSuppliers: ManagedUser[] = [];

  // ── Suppression ────────────────────────────────────────────────
  itemToDelete: StockItem | null = null;
  deleting = false;

  // ── Catalogue fournisseurs (vue mécanicien) ────────────────────
  suppliersLoading  = false;
  catalogLoading    = false;
  selectedSupplier: ManagedUser | null = null;
  catalog:          SupplierPiece[] = [];
  catalogSearch     = '';

  // ── Vue fournisseur ────────────────────────────────────────────
  fournisseurTab: 'pieces' | 'orders' = 'pieces';
  myPieces:       SupplierPiece[] = [];
  myPiecesLoading = false;
  receivedOrders: Order[] = [];
  ordersLoading   = false;

  // Edit piece modal (fournisseur)
  editingPiece:     SupplierPiece | null = null;
  editPieceForm!:   FormGroup;
  editSubmitting    = false;
  editError         = '';

  // Add piece modal (fournisseur)
  showAddPieceModal = false;
  addPieceForm!:    FormGroup;
  addSubmitting     = false;
  addError          = '';

  // Expand order rows
  expandedOrderId: number | null = null;

  // ── Sélection commande ─────────────────────────────────────────
  selection = new Map<number, number>();   // pieceId → qty
  orderView:   'catalog' | 'review' = 'catalog';
  orderLoading = false;
  orderSuccess = false;
  orderError   = '';

  get selectedItems(): Array<{ piece: SupplierPiece; qty: number }> {
    return Array.from(this.selection.entries())
      .map(([id, qty]) => ({ piece: this.catalog.find(x => x.id === id)!, qty }))
      .filter(x => !!x.piece);
  }

  openReview(): void    { this.orderView = 'review'; this.orderError = ''; }
  backToCatalog(): void { this.orderView = 'catalog'; }

  get filteredCatalog(): SupplierPiece[] {
    if (!this.catalogSearch.trim()) return this.catalog;
    const t = this.catalogSearch.toLowerCase();
    return this.catalog.filter(p =>
      p.name.toLowerCase().includes(t) ||
      p.ref.toLowerCase().includes(t)  ||
      p.category.toLowerCase().includes(t)
    );
  }

  get catalogGrouped(): { category: string; pieces: SupplierPiece[] }[] {
    const map = new Map<string, SupplierPiece[]>();
    this.filteredCatalog.forEach(p => {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    });
    return Array.from(map.entries()).map(([category, pieces]) => ({ category, pieces }));
  }

  get orderCount():  number { return Array.from(this.selection.values()).reduce((a, b) => a + b, 0); }
  get orderTotal():  number {
    let total = 0;
    this.selection.forEach((qty, id) => {
      const p = this.catalog.find(x => x.id === id);
      if (p) total += p.unitPrice * qty;
    });
    return total;
  }

  qtyFor(id: number): number { return this.selection.get(id) ?? 0; }

  addPiece(p: SupplierPiece): void {
    this.selection.set(p.id, 1);
  }

  removePiece(id: number): void {
    this.selection.delete(id);
  }

  changeQty(id: number, delta: number): void {
    const current = this.selection.get(id) ?? 0;
    const next    = current + delta;
    if (next <= 0) { this.selection.delete(id); }
    else           { this.selection.set(id, next); }
  }

  sendOrder(): void {
    if (!this.selection.size || !this.selectedSupplier) return;
    this.orderLoading = true;
    this.orderError   = '';

    const u = this.authService.getCurrentUser()!;
    const items = Array.from(this.selection.entries()).map(([id, qty]) => {
      const p = this.catalog.find(x => x.id === id)!;
      return { pieceId: id, pieceName: p.name, ref: p.ref, quantity: qty, unitPrice: p.unitPrice };
    });

    const order: Order = {
      supplierId:    this.selectedSupplier.id,
      supplierName:  this.selectedSupplier.company || `${this.selectedSupplier.firstName} ${this.selectedSupplier.lastName}`,
      mechanicId:    u.id,
      mechanicName:  `${u.firstName} ${u.lastName}`,
      mechanicPhone: (u as any).phone || '',
      mechanicEmail: u.email || '',
      items,
      totalAmount:   this.orderTotal,
      date:          new Date().toLocaleDateString('fr-TN'),
      status:        'en-attente',
    };

    this.stockService.sendOrder(order).subscribe({
      next: () => {
        this.orderSuccess = true;
        this.orderLoading = false;
        this.selection.clear();
      },
      error: () => {
        this.orderError   = 'Erreur lors de l\'envoi de la commande.';
        this.orderLoading = false;
      }
    });
  }

  // ── Images par catégorie ───────────────────────────────────────
  readonly CATEGORY_ICONS: Record<string, { bg: string; color: string; svg: string }> = {
    'Freinage':     { bg: 'rgba(239,68,68,.1)',    color: '#ef4444', svg: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
    'Moteur':       { bg: 'rgba(245,158,11,.1)',   color: '#d97706', svg: 'M12 6V4m0 2a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m-6 8a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 1 0 0-4m0 4a2 2 0 1 1 0-4m0 4v2m0-6V4' },
    'Distribution': { bg: 'rgba(139,92,246,.1)',   color: '#7c3aed', svg: 'M4 4h16v4H4zm0 12h16v4H4zm2-6h12M6 10v4m12-4v4' },
    'Électrique':   { bg: 'rgba(59,130,246,.1)',   color: '#2563eb', svg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    'Suspension':   { bg: 'rgba(16,185,129,.1)',   color: '#059669', svg: 'M12 2v8m0 4v8M8 6l4-4 4 4M8 18l4 4 4-4' },
    'Direction':    { bg: 'rgba(236,72,153,.1)',   color: '#db2777', svg: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0 0v-8m-4 4h8' },
    'Carrosserie':  { bg: 'rgba(107,114,128,.1)',  color: '#6b7280', svg: 'M5 17H3V13L5 7h9l3 4h3l1 3v3h-2M5 17h10M9 17v2m6-2v2' },
    'Autre':        { bg: 'rgba(107,114,128,.1)',  color: '#6b7280', svg: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  };

  getCategoryStyle(cat: string): { bg: string; color: string; svg: string } {
    return this.CATEGORY_ICONS[cat] ?? this.CATEGORY_ICONS['Autre'];
  }

  readonly CATEGORIES = [
    { label: 'Freinage',     color: 'blue'   },
    { label: 'Moteur',       color: 'amber'  },
    { label: 'Distribution', color: 'purple' },
    { label: 'Électrique',   color: 'blue'   },
    { label: 'Suspension',   color: 'green'  },
    { label: 'Direction',    color: 'purple' },
    { label: 'Carrosserie',  color: 'gray'   },
    { label: 'Autre',        color: 'gray'   },
  ];

  constructor(
    private fb:           FormBuilder,
    private stockService: StockService,
    private userService:  UserService,
    public  authService:  AuthService
  ) {}

  get isAdmin():      boolean { return this.authService.getRole() === 'ADMIN'; }
  get isMecanicien(): boolean { return this.authService.getRole() === 'MECANICIEN'; }
  get isFournisseur():boolean { return this.authService.getRole() === 'FOURNISSEUR'; }

  ngOnInit(): void {
    if (this.isFournisseur) {
      this.loadMyPieces();
      this.loadMyOrders();
    } else {
      this.loadStock();
      this.loadSuppliers();
    }
  }

  // ── Fournisseur: mes pièces ────────────────────────────────────
  loadMyPieces(): void {
    const u = this.authService.getCurrentUser()!;
    this.myPiecesLoading = true;
    this.stockService.getCatalogBySupplier(u.id).subscribe({
      next: data => { this.myPieces = data; this.myPiecesLoading = false; },
      error: ()   => { this.myPiecesLoading = false; }
    });
  }

  loadMyOrders(): void {
    const u = this.authService.getCurrentUser()!;
    this.ordersLoading = true;
    this.stockService.getOrdersBySupplier(u.id).subscribe({
      next: data => { this.receivedOrders = data; this.ordersLoading = false; },
      error: ()   => { this.ordersLoading = false; }
    });
  }

  openEditPiece(p: SupplierPiece): void {
    this.editingPiece = p;
    this.editError    = '';
    this.editPieceForm = this.fb.group({
      availableQty: [p.availableQty, [Validators.required, Validators.min(0)]],
      unitPrice:    [p.unitPrice,    [Validators.required, Validators.min(0)]],
      description:  [p.description  || ''],
    });
  }

  closeEditPiece(): void { this.editingPiece = null; }

  submitEditPiece(): void {
    if (this.editPieceForm.invalid) { this.editPieceForm.markAllAsTouched(); return; }
    this.editSubmitting = true;
    this.editError      = '';
    const v = this.editPieceForm.value;
    this.stockService.updateCatalogPiece(this.editingPiece!.id, {
      availableQty: +v.availableQty, unitPrice: +v.unitPrice, description: v.description
    }).subscribe({
      next: updated => {
        const idx = this.myPieces.findIndex(p => p.id === updated.id);
        if (idx !== -1) this.myPieces[idx] = updated;
        this.closeEditPiece();
        this.editSubmitting = false;
      },
      error: err => {
        this.editError      = err.error?.message || 'Erreur lors de la mise à jour.';
        this.editSubmitting = false;
      }
    });
  }

  openAddPiece(): void {
    this.addError  = '';
    this.addPieceForm = this.fb.group({
      name:        ['', Validators.required],
      ref:         [''],
      category:    ['Autre', Validators.required],
      unitPrice:   [0, [Validators.required, Validators.min(0)]],
      quantity:    [0, [Validators.required, Validators.min(0)]],
      description: [''],
    });
    this.showAddPieceModal = true;
  }

  closeAddPiece(): void { this.showAddPieceModal = false; }

  submitAddPiece(): void {
    if (this.addPieceForm.invalid) { this.addPieceForm.markAllAsTouched(); return; }
    this.addSubmitting = true;
    this.addError      = '';
    const v = this.addPieceForm.value;
    const u = this.authService.getCurrentUser()!;
    const supplierName = `${u.firstName} ${u.lastName}`;

    this.stockService.create({
      name:            v.name,
      ref:             v.ref || `REF-${Date.now()}`,
      category:        v.category,
      unitPrice:       +v.unitPrice,
      quantity:        +v.quantity,
      supplierId:      u.id,
      supplierName,
      description:     v.description,
      supplierCatalog: true,
    } as any).subscribe({
      next: created => {
        this.myPieces.unshift({
          id:           created.id,
          ref:          created.ref,
          name:         created.name,
          category:     created.category,
          categoryColor: created.categoryColor,
          unitPrice:    created.unitPrice,
          availableQty: created.quantity,
          supplierId:   u.id,
          supplierName,
          description:  v.description,
        });
        this.closeAddPiece();
        this.addSubmitting = false;
      },
      error: err => {
        this.addError      = err.error?.message || 'Erreur lors de la création.';
        this.addSubmitting = false;
      }
    });
  }

  toggleOrder(id: number): void {
    this.expandedOrderId = this.expandedOrderId === id ? null : id;
  }

  orderItemsSummary(items: OrderItem[]): string {
    return items.map(i => `${i.pieceName} ×${i.quantity}`).join(', ');
  }

  // ── Statut commande ────────────────────────────────────────────
  readonly ORDER_STATUSES: { value: string; label: string }[] = [
    { value: 'en-attente', label: 'En attente'  },
    { value: 'en-cours',   label: 'En cours'    },
    { value: 'expediee',   label: 'Expédiée'    },
    { value: 'livree',     label: 'Livrée'      },
    { value: 'annulee',    label: 'Annulée'     },
  ];

  orderStatusLabel(s: string): string {
    return this.ORDER_STATUSES.find(x => x.value === s)?.label ?? s;
  }

  orderStatusBadge(s: string): string {
    const map: Record<string, string> = {
      'en-attente': 'badge-gray',
      'en-cours':   'badge-amber',
      'expediee':   'badge-blue',
      'livree':     'badge-green',
      'annulee':    'badge-red',
    };
    return map[s] ?? 'badge-gray';
  }

  updateStatus(order: Order, status: string): void {
    order.status = status as Order['status'];   // optimistic update → badge colour refreshes immediately
    this.stockService.updateOrderStatus(order.id!, status).subscribe({
      next: updated => {
        const idx = this.receivedOrders.findIndex(o => o.id === updated.id);
        if (idx !== -1) this.receivedOrders[idx] = updated;
      }
    });
  }

  // ── Commandes mécanicien ───────────────────────────────────────
  loadMechOrders(): void {
    const u  = this.authService.getCurrentUser()!;
    const me = `${u.firstName} ${u.lastName}`;
    this.mechOrdersLoading = true;
    this.stockService.getOrdersByMechanic(me).subscribe({
      next: data => { this.mechOrders = data; this.mechOrdersLoading = false; },
      error: ()   => { this.mechOrdersLoading = false; }
    });
  }

  toggleMechOrder(id: number): void {
    this.expandedMechOrderId = this.expandedMechOrderId === id ? null : id;
  }

  // ── Stock ──────────────────────────────────────────────────────
  loadStock(): void {
    this.loading = true;
    const u = this.authService.getCurrentUser();
    const stock$ = this.isMecanicien && u
      ? this.stockService.getMechanicStock(u.id)
      : this.stockService.getAll();

    stock$.subscribe({
      next: data => {
        this.items    = data;
        this.filtered = [...this.items];
        this.loading  = false;
      },
      error: () => { this.error = 'Erreur de chargement du stock.'; this.loading = false; }
    });
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.items.filter(i =>
      i.name.toLowerCase().includes(t) ||
      i.ref.toLowerCase().includes(t)  ||
      i.category.toLowerCase().includes(t)
    );
  }

  // ── Fournisseurs inscrits ──────────────────────────────────────
  loadSuppliers(): void {
    this.suppliersLoading = true;
    this.userService.getSuppliers().subscribe({
      next: users => {
        this.registeredSuppliers = users;
        this.suppliersLoading    = false;
      },
      error: () => { this.suppliersLoading = false; }
    });
  }

  viewCatalog(s: ManagedUser): void {
    this.selectedSupplier = s;
    this.catalogLoading   = true;
    this.orderSuccess     = false;
    this.orderError       = '';
    this.orderView        = 'catalog';
    this.catalogSearch    = '';
    this.selection.clear();
    this.catalog          = [];
    this.stockService.getCatalogBySupplier(s.id).subscribe({
      next: items => { this.catalog = items; this.catalogLoading = false; },
      error: ()    => { this.catalogLoading = false; }
    });
  }

  closeCatalog(): void {
    this.selectedSupplier = null;
    this.catalog          = [];
    this.selection.clear();
    this.orderSuccess     = false;
    this.orderError       = '';
    this.orderView        = 'catalog';
  }

  supplierInitials(s: ManagedUser): string {
    return (s.firstName[0] + s.lastName[0]).toUpperCase();
  }

  // ── Modal ajout ────────────────────────────────────────────────
  openModal(): void {
    this.formError    = '';
    this.submitting   = false;
    this.supplierMode = 'registered';
    this.buildForm();
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  private buildForm(): void {
    this.form = this.fb.group({
      name:           ['', Validators.required],
      ref:            [''],
      category:       ['Freinage', Validators.required],
      unitPrice:      [0,  [Validators.required, Validators.min(0)]],
      quantity:       [1,  [Validators.required, Validators.min(0)]],
      alertThreshold: [5,  [Validators.required, Validators.min(0)]],
      // Registered supplier
      supplierId:     [''],
      supplierName:   [''],
      // External supplier
      externalName:   [''],
      externalPhone:  [''],
    });
  }

  setSupplierMode(mode: SupplierMode): void {
    this.supplierMode = mode;
    this.form.get('supplierId')!.setValue('');
    this.form.get('externalName')!.setValue('');
  }

  invalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.formError  = '';
    const v = this.form.value;

    const catColor = this.CATEGORIES.find(c => c.label === v.category)?.color ?? 'gray';

    let supplierId   = 0;
    let supplierName = '';

    if (this.supplierMode === 'registered' && v.supplierId) {
      const s = this.registeredSuppliers.find(x => x.id === +v.supplierId);
      supplierId   = +v.supplierId;
      supplierName = s?.company || `${s?.firstName} ${s?.lastName}` || '';
    } else if (this.supplierMode === 'external') {
      supplierName = v.externalName || '';
    }

    const u  = this.authService.getCurrentUser()!;

    const payload: Partial<StockItem> = {
      name:           v.name,
      ref:            v.ref || '',
      category:       v.category,
      categoryColor:  catColor,
      unitPrice:      +v.unitPrice,
      quantity:       +v.quantity,
      alertThreshold: +v.alertThreshold,
      mechanicName:   `${u.firstName} ${u.lastName}`,
      supplierId:     supplierId || undefined,
      supplierName:   supplierName || undefined,
    };

    this.stockService.create(payload).subscribe({
      next: created => {
        this.items.unshift(created);
        this.filtered = [...this.items];
        this.closeModal();
        this.submitting = false;
      },
      error: err => {
        this.formError  = err.error?.message || 'Erreur lors de l\'ajout.';
        this.submitting = false;
      }
    });
  }

  // ── Suppression ────────────────────────────────────────────────
  confirmDelete(item: StockItem): void { this.itemToDelete = item; }
  cancelDelete(): void                 { this.itemToDelete = null; }

  doDelete(): void {
    if (!this.itemToDelete) return;
    const id = this.itemToDelete.id;
    this.deleting = true;
    this.stockService.delete(id).subscribe({
      next: () => {
        this.items    = this.items.filter(i => i.id !== id);
        this.filtered = this.filtered.filter(i => i.id !== id);
        this.itemToDelete = null;
        this.deleting     = false;
      },
      error: () => { this.deleting = false; }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────
  statusBadge(s: string): string {
    return ({ ok: 'badge-green', bas: 'badge-amber', critique: 'badge-red' } as any)[s] || 'badge-gray';
  }

  statusLabel(s: string): string {
    return ({ ok: 'OK', bas: 'Stock bas', critique: 'Critique' } as any)[s] || s;
  }

  qtyColor(s: StockItem): string {
    if (s.status === 'critique') return 'var(--red)';
    if (s.status === 'bas')      return 'var(--accent)';
    return 'var(--green)';
  }
}
