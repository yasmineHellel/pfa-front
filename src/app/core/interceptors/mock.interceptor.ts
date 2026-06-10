import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  Client, Vehicle, Repair, Invoice, StockItem, SupplierPiece,
  Quote, DashboardStats, ActivityItem, Order, RepairInvoice
} from '../models/models';

const CLIENTS: Client[] = [
  { id: 1, firstName: 'Mohamed', lastName: 'Ali',      phone: '+216 98 123 456', email: 'm.ali@email.com',    vehicleCount: 2, repairCount: 8,  totalSpent: 3420, lastVisit: 'Il y a 2 jours' },
  { id: 2, firstName: 'Fatma',   lastName: 'Bouzid',   phone: '+216 22 345 678', email: 'fatma.b@email.com',  vehicleCount: 1, repairCount: 3,  totalSpent: 890,  lastVisit: "Aujourd'hui"    },
  { id: 3, firstName: 'Karim',   lastName: 'Trabelsi', phone: '+216 55 789 012', email: 'karim.t@email.com',  vehicleCount: 1, repairCount: 1,  totalSpent: 1200, lastVisit: 'Il y a 1 jour'  },
  { id: 4, firstName: 'Habiba',  lastName: 'Sfar',     phone: '+216 29 456 123', email: 'habiba.s@email.com', vehicleCount: 1, repairCount: 2,  totalSpent: 640,  lastVisit: 'Il y a 3 jours' },
  { id: 5, firstName: 'Sami',    lastName: 'Khelifa',  phone: '+216 71 234 567', email: 'sami.k@email.com',   vehicleCount: 2, repairCount: 5,  totalSpent: 2100, lastVisit: 'Il y a 5 jours' },
];

const VEHICLES: Vehicle[] = [
  { id: 1, plate: 'TU 5521 2024', brand: 'Peugeot', model: '308',   engine: '2.0 HDi Diesel',  year: 2022, clientId: 1, clientName: 'Mohamed Ali',    mileage: 87420, repairCount: 3 },
  { id: 2, plate: 'RS 1234 2022', brand: 'Renault', model: 'Clio',  engine: '1.2 TCe Essence', year: 2020, clientId: 2, clientName: 'Fatma Bouzid',   mileage: 42100, repairCount: 1 },
  { id: 3, plate: 'TN 8821 2023', brand: 'Toyota',  model: 'Yaris', engine: '1.5 VVT-i',       year: 2023, clientId: 3, clientName: 'Karim Trabelsi', mileage: 15200, repairCount: 1 },
  { id: 4, plate: 'SB 3390 2021', brand: 'VW',      model: 'Golf',  engine: '1.4 TSI',         year: 2021, clientId: 4, clientName: 'Habiba Sfar',    mileage: 63000, repairCount: 2 },
];

const REPAIRS: Repair[] = [
  { id: 87, clientId: 1, clientName: 'Mohamed Ali',    clientPhone: '+216 98 123 456', vehicleId: 1, vehicleName: 'Peugeot 308', plate: 'TU 5521 2024', description: 'Révision complète + plaquettes de frein', mechanicName: 'Sami K.',   status: 'en-cours',   cost: 450,  entryDate: '10/05/2025' },
  { id: 86, clientId: 3, clientName: 'Karim Trabelsi', clientPhone: '+216 55 789 012', vehicleId: 3, vehicleName: 'Toyota Yaris',plate: 'TN 8821 2023', description: 'Remplacement embrayage complet',          mechanicName: 'Sami K.',   status: 'en-attente', cost: 1200, entryDate: '11/05/2025' },
  { id: 85, clientId: 2, clientName: 'Fatma Bouzid',   clientPhone: '+216 22 345 678', vehicleId: 2, vehicleName: 'Renault Clio',plate: 'RS 1234 2022', description: 'Vidange huile + remplacement filtres',     mechanicName: 'Khaled M.', status: 'termine',    cost: 180,  entryDate: '12/05/2025' },
  { id: 84, clientId: 4, clientName: 'Habiba Sfar',    clientPhone: '+216 29 456 123', vehicleId: 4, vehicleName: 'VW Golf',     plate: 'SB 3390 2021', description: 'Climatisation — diagnostic',               mechanicName: 'Anis B.',   status: 'diagnostic', cost: 320,  entryDate: '12/05/2025' },
  { id: 83, clientId: 5, clientName: 'Sami Khelifa',   clientPhone: '+216 71 234 567', vehicleId: 1, vehicleName: 'Peugeot 308', plate: 'TU 5521 2024', description: 'Remplacement courroie distribution',        mechanicName: 'Khaled M.', status: 'en-cours',   cost: 750,  entryDate: '09/05/2025' },
];

const INVOICES: Invoice[] = [
  { id: 41, clientId: 1, clientName: 'Mohamed Ali',    date: '12/05/2025', amount: 450,  paid: 450,  remaining: 0,   status: 'payee',     paymentMethod: 'Cash'     },
  { id: 40, clientId: 3, clientName: 'Karim Trabelsi', date: '11/05/2025', amount: 1200, paid: 600,  remaining: 600, status: 'partielle', paymentMethod: 'Virement' },
  { id: 39, clientId: 4, clientName: 'Habiba Sfar',    date: '10/05/2025', amount: 320,  paid: 0,    remaining: 320, status: 'impayee',   paymentMethod: 'D17'      },
  { id: 38, clientId: 2, clientName: 'Fatma Bouzid',   date: '09/05/2025', amount: 180,  paid: 180,  remaining: 0,   status: 'payee',     paymentMethod: 'Cash'     },
];

const STOCK: StockItem[] = [
  { id: 1, ref: 'REF-0012', name: 'Plaquettes de frein AV',  category: 'Freinage',     categoryColor: 'blue',   unitPrice: 45,  quantity: 2,  alertThreshold: 10, status: 'critique', mechanicName: 'Sami Khelifa',   supplierId: 4, supplierName: 'Auto Parts SARL'  },
  { id: 2, ref: 'REF-0008', name: 'Filtre à huile',           category: 'Moteur',       categoryColor: 'amber',  unitPrice: 12,  quantity: 5,  alertThreshold: 15, status: 'bas',      mechanicName: 'Sami Khelifa',   supplierId: 4, supplierName: 'Auto Parts SARL'  },
  { id: 3, ref: 'REF-0021', name: 'Courroie de distribution', category: 'Distribution', categoryColor: 'purple', unitPrice: 85,  quantity: 18, alertThreshold: 5,  status: 'ok',       mechanicName: 'Khaled Mrabti',  supplierId: 5, supplierName: 'Pièces Pro Tunis' },
  { id: 4, ref: 'REF-0033', name: 'Batterie 60Ah',            category: 'Électrique',   categoryColor: 'blue',   unitPrice: 220, quantity: 9,  alertThreshold: 3,  status: 'ok',       mechanicName: 'Khaled Mrabti',  supplierId: 4, supplierName: 'Auto Parts SARL'  },
  { id: 5, ref: 'REF-0045', name: 'Amortisseur AV gauche',    category: 'Suspension',   categoryColor: 'green',  unitPrice: 135, quantity: 3,  alertThreshold: 4,  status: 'bas',      mechanicName: 'Sami Khelifa',   supplierId: 5, supplierName: 'Pièces Pro Tunis' },
];

const SUPPLIER_CATALOGS: Record<number, SupplierPiece[]> = {
  4: [
    { id: 101, ref: 'AP-F001', name: 'Plaquettes de frein AV',    category: 'Freinage',     categoryColor: 'blue',   unitPrice: 42,  availableQty: 50,  supplierId: 4, supplierName: 'Auto Parts SARL',  description: 'Compatible toutes marques européennes'     },
    { id: 102, ref: 'AP-F002', name: 'Filtre à huile',             category: 'Moteur',       categoryColor: 'amber',  unitPrice: 11,  availableQty: 120, supplierId: 4, supplierName: 'Auto Parts SARL',  description: 'Filtre haute performance — longue durée'   },
    { id: 103, ref: 'AP-F003', name: 'Courroie de distribution',   category: 'Distribution', categoryColor: 'purple', unitPrice: 80,  availableQty: 30,  supplierId: 4, supplierName: 'Auto Parts SARL',  description: 'Kit complet avec tendeur'                  },
    { id: 104, ref: 'AP-F004', name: 'Batterie 60Ah',              category: 'Électrique',   categoryColor: 'blue',   unitPrice: 210, availableQty: 15,  supplierId: 4, supplierName: 'Auto Parts SARL',  description: '12V — garantie 2 ans'                      },
    { id: 105, ref: 'AP-F005', name: 'Disques de frein avant',     category: 'Freinage',     categoryColor: 'blue',   unitPrice: 75,  availableQty: 25,  supplierId: 4, supplierName: 'Auto Parts SARL',  description: 'Ventilés — haute résistance thermique'     },
    { id: 106, ref: 'AP-F006', name: 'Bougies d\'allumage (x4)',   category: 'Moteur',       categoryColor: 'amber',  unitPrice: 38,  availableQty: 60,  supplierId: 4, supplierName: 'Auto Parts SARL',  description: 'Iridium — longue durée de vie'             },
  ],
  5: [
    { id: 201, ref: 'PP-001',  name: 'Amortisseur AV gauche',      category: 'Suspension',   categoryColor: 'green',  unitPrice: 128, availableQty: 20,  supplierId: 5, supplierName: 'Pièces Pro Tunis', description: 'Gaz — sport confort'                       },
    { id: 202, ref: 'PP-002',  name: 'Amortisseur AV droit',       category: 'Suspension',   categoryColor: 'green',  unitPrice: 128, availableQty: 20,  supplierId: 5, supplierName: 'Pièces Pro Tunis', description: 'Gaz — sport confort'                       },
    { id: 203, ref: 'PP-003',  name: 'Biellette de barre stab.',   category: 'Suspension',   categoryColor: 'green',  unitPrice: 35,  availableQty: 40,  supplierId: 5, supplierName: 'Pièces Pro Tunis', description: 'Acier traité anti-corrosion'               },
    { id: 204, ref: 'PP-004',  name: 'Rotule de direction',        category: 'Direction',    categoryColor: 'purple', unitPrice: 55,  availableQty: 18,  supplierId: 5, supplierName: 'Pièces Pro Tunis', description: 'Paire gauche + droite incluse'             },
    { id: 205, ref: 'PP-005',  name: 'Courroie accessoires',       category: 'Distribution', categoryColor: 'purple', unitPrice: 45,  availableQty: 35,  supplierId: 5, supplierName: 'Pièces Pro Tunis', description: 'Serpentine — compatible Peugeot/Renault'   },
  ],
};

let REPAIR_INVOICES: RepairInvoice[] = [];
let invoiceCounter  = 1;
let clientIdCounter  = 5;
let vehicleIdCounter = 4;
let quoteIdCounter   = 21;
let invoiceIdCounter = 41;

let ORDERS: Order[] = [
  {
    id: 1, supplierId: 4, supplierName: 'Auto Parts SARL',
    mechanicName: 'Sami Khelifa', mechanicPhone: '+216 98 111 222',
    items: [
      { pieceId: 101, pieceName: 'Plaquettes de frein AV', ref: 'AP-F001', quantity: 4, unitPrice: 42 },
      { pieceId: 102, pieceName: 'Filtre à huile',         ref: 'AP-F002', quantity: 6, unitPrice: 11 },
    ],
    totalAmount: 234, date: '08/06/2026', status: 'livree',
  },
  {
    id: 2, supplierId: 4, supplierName: 'Auto Parts SARL',
    mechanicName: 'Khaled Mrabti', mechanicPhone: '+216 22 333 444',
    items: [
      { pieceId: 104, pieceName: 'Batterie 60Ah', ref: 'AP-F004', quantity: 2, unitPrice: 210 },
    ],
    totalAmount: 420, date: '05/06/2026', status: 'expediee',
  },
  {
    id: 3, supplierId: 5, supplierName: 'Pièces Pro Tunis',
    mechanicName: 'Sami Khelifa', mechanicPhone: '+216 98 111 222',
    items: [
      { pieceId: 201, pieceName: 'Amortisseur AV gauche', ref: 'PP-001', quantity: 1, unitPrice: 128 },
      { pieceId: 203, pieceName: 'Biellette de barre stab.', ref: 'PP-003', quantity: 2, unitPrice: 35 },
    ],
    totalAmount: 198, date: '07/06/2026', status: 'en-cours',
  },
];

const QUOTES: Quote[] = [
  { id: 21, clientId: 1, clientName: 'Mohamed Ali', date: '08/05/2025', description: 'Révision + freins + vidange',            total: 520, status: 'accepte'    },
  { id: 20, clientId: 4, clientName: 'Habiba Sfar', date: '09/05/2025', description: 'Réparation climatisation + recharge gaz', total: 280, status: 'en-attente' },
];

const STATS: DashboardStats = {
  revenue: 28450, revenueDeltaPercent: 12.4, activeRepairs: 14,
  pendingRepairs: 3, newClients: 7, unpaidAmount: 5200, unpaidCount: 4,
};

const ACTIVITY: ActivityItem[] = [
  { dotColor: 'var(--green)',  text: '<strong>Facture #INV-0041</strong> payée par Mohamed Ali',         time: 'Il y a 12 min'   },
  { dotColor: 'var(--accent)', text: 'Réparation <strong>REP-0087</strong> passée à "Terminé"',          time: 'Il y a 45 min'   },
  { dotColor: 'var(--blue)',   text: 'Nouveau client <strong>Karim Trabelsi</strong> enregistré',        time: 'Il y a 1h 20min' },
  { dotColor: 'var(--red)',    text: 'Stock bas : <strong>Plaquettes de frein</strong> (2 restants)',    time: 'Il y a 2h'       },
  { dotColor: 'var(--purple)', text: 'WhatsApp envoyé à <strong>Fatma Bouzid</strong> — véhicule prêt', time: 'Il y a 3h'       },
];

@Injectable()
export class MockInterceptor implements HttpInterceptor {

  // ── Dynamic user registry (persists for the session) ──────────────────────
  private users: any[] = [
    { id: 1, firstName: 'Admin',  lastName: 'Garage',      email: 'admin@garage.com',       password: 'admin123', role: 'ADMIN',       active: true, phone: '',               company: '',                 createdAt: '01/01/2025' },
    { id: 2, firstName: 'Sami',   lastName: 'Khelifa',     email: 'mecanicien@garage.com',  password: 'meca123',  role: 'MECANICIEN',  active: true, phone: '+216 98 111 222', company: '',                 createdAt: '15/01/2025' },
    { id: 3, firstName: 'Khaled', lastName: 'Mrabti',      email: 'khaled@garage.com',      password: 'meca123',  role: 'MECANICIEN',  active: true, phone: '+216 22 333 444', company: '',                 createdAt: '18/01/2025' },
    { id: 4, firstName: 'Kamel',  lastName: 'Ben Salah',   email: 'fournisseur@garage.com', password: 'four123',  role: 'FOURNISSEUR', active: true, phone: '+216 71 555 666', company: 'Auto Parts SARL',  createdAt: '20/01/2025' },
    { id: 5, firstName: 'Nabil',  lastName: 'Chaouachi',   email: 'nabil@pieces.com',       password: 'four123',  role: 'FOURNISSEUR', active: false,phone: '+216 55 777 888', company: 'Pièces Pro Tunis', createdAt: '25/02/2025' },
  ];

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const url    = req.url;
    const method = req.method;

    // ── Auth: login ──────────────────────────────────────────────────────────
    if (url.includes('/auth/login') && method === 'POST') {
      const { email, password } = req.body as { email: string; password: string };
      const match = this.users.find(u => u.email === email && u.password === password);
      if (!match)         return this.error(401, 'Email ou mot de passe incorrect.');
      if (!match.active)  return this.error(403, 'Votre compte est désactivé. Contactez l\'administrateur.');
      return this.respond({ token: `mock-token-${match.role}-${match.id}`, user: this.toPublic(match) });
    }

    // ── Auth: register ───────────────────────────────────────────────────────
    if (url.includes('/auth/register') && method === 'POST') {
      const body = req.body as any;
      if (this.users.find(u => u.email === body.email))
        return this.error(409, 'Cette adresse email est déjà utilisée.');
      const newUser = {
        id: Date.now(),
        firstName: body.firstName,
        lastName:  body.lastName,
        email:     body.email,
        password:  body.password,
        role:      body.role,
        active:    true,
        phone:     body.phone    || '',
        company:   body.company  || '',
        createdAt: new Date().toLocaleDateString('fr-TN'),
      };
      this.users.push(newUser);
      return this.respond({ token: `mock-token-${newUser.role}-${newUser.id}`, user: this.toPublic(newUser) });
    }

    // ── Users: list (admin) ──────────────────────────────────────────────────
    if (url.includes('/users') && !url.includes('/toggle') && method === 'GET') {
      return this.respond(this.users.filter(u => u.role !== 'ADMIN').map(u => this.toManaged(u)));
    }

    // ── Users: toggle active ─────────────────────────────────────────────────
    if (url.includes('/users/') && url.includes('/toggle') && method === 'PATCH') {
      const id   = parseInt(url.split('/users/')[1]);
      const user = this.users.find(u => u.id === id);
      if (user) user.active = !user.active;
      return this.respond(this.toManaged(user));
    }

    // ── Users: delete ────────────────────────────────────────────────────────
    if (url.match(/\/users\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/users/')[1]);
      this.users = this.users.filter(u => u.id !== id);
      return this.respond(null);
    }

    // ── Data endpoints ───────────────────────────────────────────────────────
    if (url.includes('/dashboard/stats'))    return this.respond(STATS);
    if (url.includes('/dashboard/activity')) return this.respond(ACTIVITY);
    if (url.includes('/stock/low-stock'))    return this.respond(STOCK.filter(s => s.status !== 'ok'));
    // ── Clients CRUD ────────────────────────────────────────────────────────
    if (url.match(/\/clients\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/clients/')[1]);
      const i  = CLIENTS.findIndex(c => c.id === id);
      if (i !== -1) CLIENTS.splice(i, 1);
      return this.respond(null);
    }
    if (url.match(/\/clients\/\d+$/) && method === 'PUT') {
      const id  = parseInt(url.split('/clients/')[1]);
      const idx = CLIENTS.findIndex(c => c.id === id);
      if (idx !== -1) CLIENTS[idx] = { ...CLIENTS[idx], ...req.body as any };
      return this.respond(CLIENTS[idx !== -1 ? idx : 0]);
    }
    if (url.includes('/clients') && method === 'POST') {
      const body = req.body as any;
      const created: Client = { ...body, id: ++clientIdCounter, vehicleCount: 0, repairCount: 0, totalSpent: 0, lastVisit: 'Nouveau' };
      CLIENTS.push(created);
      return this.respond(created);
    }
    if (url.includes('/clients'))            return this.respond(CLIENTS);

    // ── Vehicles CRUD ────────────────────────────────────────────────────────
    if (url.match(/\/vehicles\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/vehicles/')[1]);
      const i  = VEHICLES.findIndex(v => v.id === id);
      if (i !== -1) VEHICLES.splice(i, 1);
      return this.respond(null);
    }
    if (url.match(/\/vehicles\/\d+$/) && method === 'PUT') {
      const id   = parseInt(url.split('/vehicles/')[1]);
      const idx  = VEHICLES.findIndex(v => v.id === id);
      const body = req.body as any;
      if (body.clientId) {
        const cl = CLIENTS.find(c => c.id === parseInt(body.clientId));
        if (cl) body.clientName = `${cl.firstName} ${cl.lastName}`;
      }
      if (idx !== -1) VEHICLES[idx] = { ...VEHICLES[idx], ...body };
      return this.respond(VEHICLES[idx !== -1 ? idx : 0]);
    }
    if (url.includes('/vehicles') && method === 'POST') {
      const body = req.body as any;
      const cl   = CLIENTS.find(c => c.id === parseInt(body.clientId));
      const created: Vehicle = { ...body, id: ++vehicleIdCounter, clientName: cl ? `${cl.firstName} ${cl.lastName}` : '', repairCount: 0, mileage: parseInt(body.mileage) || 0, year: parseInt(body.year) || new Date().getFullYear() };
      VEHICLES.push(created);
      if (cl) cl.vehicleCount++;
      return this.respond(created);
    }
    if (url.includes('/vehicles')) {
      const params   = new URL(url, 'http://x').searchParams;
      const clientId = parseInt(params.get('clientId') || '0');
      return this.respond(clientId ? VEHICLES.filter(v => v.clientId === clientId) : VEHICLES);
    }
    if (url.includes('/repairs') && method === 'POST') {
      const body    = req.body as any;
      const created = { ...body, id: Math.floor(Math.random() * 900) + 100 };
      REPAIRS.unshift(created);
      return this.respond(created);
    }
    if (url.match(/\/repairs\/\d+\/parts\/\d+$/) && method === 'DELETE') {
      const segs       = url.split('/');
      const stockItemId = parseInt(segs[segs.length - 1]);
      const repairId    = parseInt(url.split('/repairs/')[1].split('/parts')[0]);
      const repair = REPAIRS.find(r => r.id === repairId);
      if (!repair) return this.error(404, 'Réparation non trouvée.');
      const partIdx = (repair as any).usedParts?.findIndex((p: any) => p.stockItemId === stockItemId) ?? -1;
      if (partIdx !== -1) {
        const qty = (repair as any).usedParts[partIdx].quantity;
        const stock = STOCK.find(s => s.id === stockItemId);
        if (stock) {
          stock.quantity += qty;
          stock.status = stock.quantity <= 0 ? 'critique' : stock.quantity <= stock.alertThreshold ? 'bas' : 'ok';
        }
        (repair as any).usedParts.splice(partIdx, 1);
      }
      (repair as any).cost = this.calcPartsCost(repair);
      return this.respond(repair);
    }
    if (url.match(/\/repairs\/\d+\/parts$/) && method === 'POST') {
      const repairId    = parseInt(url.split('/repairs/')[1].split('/parts')[0]);
      const { stockItemId, quantity } = req.body as any;
      const repair = REPAIRS.find(r => r.id === repairId);
      const stock  = STOCK.find(s => s.id === stockItemId);
      if (!repair || !stock) return this.error(404, 'Réparation ou pièce non trouvée.');
      if (!(repair as any).usedParts) (repair as any).usedParts = [];
      const existing = (repair as any).usedParts.find((p: any) => p.stockItemId === stockItemId);
      const qty = parseInt(quantity);
      if (existing) { existing.quantity += qty; }
      else { (repair as any).usedParts.push({ stockItemId, name: stock.name, ref: stock.ref, quantity: qty, unitPrice: stock.unitPrice }); }
      stock.quantity -= qty;
      stock.status = stock.quantity <= 0 ? 'critique' : stock.quantity <= stock.alertThreshold ? 'bas' : 'ok';
      (repair as any).cost = this.calcPartsCost(repair);
      return this.respond(repair);
    }
    if (url.match(/\/repairs\/\d+$/) && method === 'PUT') {
      const id  = parseInt(url.split('/repairs/')[1]);
      const idx = REPAIRS.findIndex(r => r.id === id);
      if (idx !== -1) REPAIRS[idx] = { ...REPAIRS[idx], ...req.body as any };
      return this.respond(REPAIRS[idx !== -1 ? idx : 0]);
    }
    if (url.match(/\/repairs\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/repairs/')[1]);
      const i  = REPAIRS.findIndex(r => r.id === id);
      if (i !== -1) REPAIRS.splice(i, 1);
      return this.respond(null);
    }
    if (url.includes('/repairs')) {
      const params   = new URL(url, 'http://x').searchParams;
      const clientId = parseInt(params.get('clientId') || '0');
      return this.respond(clientId ? REPAIRS.filter(r => r.clientId === clientId) : REPAIRS);
    }
    // ── Invoices ──────────────────────────────────────────────────────────────
    if (url.match(/\/invoices\/\d+\/pay$/) && method === 'PUT') {
      const id  = parseInt(url.split('/invoices/')[1].split('/pay')[0]);
      const idx = INVOICES.findIndex(i => i.id === id);
      if (idx !== -1) {
        const m = (req.body as any)?.paymentMethod || 'Cash';
        INVOICES[idx] = { ...INVOICES[idx], paid: INVOICES[idx].amount, remaining: 0, status: 'payee', paymentMethod: m };
      }
      return this.respond(INVOICES[idx !== -1 ? idx : 0]);
    }
    if (url.includes('/invoices'))           return this.respond(INVOICES);
    // ── Stock catalog ────────────────────────────────────────────────────────
    if (url.match(/\/stock\/catalog\/\d+$/) && method === 'GET') {
      const supplierId = parseInt(url.split('/catalog/')[1]);
      return this.respond(SUPPLIER_CATALOGS[supplierId] || []);
    }
    if (url.includes('/stock/low-stock'))    return this.respond(STOCK.filter(s => s.status !== 'ok'));
    if (url.includes('/stock') && method === 'POST') {
      const body    = req.body as any;
      const created: StockItem = {
        ...body,
        id:     Date.now(),
        ref:    body.ref || `REF-${Math.floor(Math.random() * 9000) + 1000}`,
        status: body.quantity <= 0 ? 'critique' : body.quantity <= body.alertThreshold ? 'bas' : 'ok',
      };
      STOCK.unshift(created);
      return this.respond(created);
    }
    if (url.match(/\/stock\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/stock/')[1]);
      const i  = STOCK.findIndex(s => s.id === id);
      if (i !== -1) STOCK.splice(i, 1);
      return this.respond(null);
    }
    if (url.includes('/stock'))              return this.respond(STOCK);
    // ── Orders ───────────────────────────────────────────────────────────────
    if (url.includes('/orders') && method === 'GET') {
      const params       = new URL(url, 'http://x').searchParams;
      const supplierId   = parseInt(params.get('supplierId')   || '0');
      const mechanicName = params.get('mechanicName') || '';
      let result = [...ORDERS];
      if (supplierId)   result = result.filter(o => o.supplierId   === supplierId);
      if (mechanicName) result = result.filter(o => o.mechanicName === mechanicName);
      return this.respond(result);
    }
    if (url.includes('/orders') && method === 'POST') {
      const order: Order = { ...req.body as Order, id: Date.now(), status: 'en-attente' };
      ORDERS.unshift(order);
      return this.respond({ message: 'Commande envoyée avec succès.' });
    }
    if (url.match(/\/orders\/\d+\/status$/) && method === 'PATCH') {
      const id  = parseInt(url.split('/orders/')[1].split('/status')[0]);
      const idx = ORDERS.findIndex(o => o.id === id);
      if (idx !== -1) ORDERS[idx] = { ...ORDERS[idx], ...(req.body as any) };
      return this.respond(ORDERS[idx !== -1 ? idx : 0]);
    }
    // ── Catalog piece update ─────────────────────────────────────────────────
    if (url.match(/\/stock\/catalog\/piece\/\d+$/) && method === 'PUT') {
      const id   = parseInt(url.split('/piece/')[1]);
      const body = req.body as Partial<SupplierPiece>;
      for (const pieces of Object.values(SUPPLIER_CATALOGS)) {
        const idx = pieces.findIndex(p => p.id === id);
        if (idx !== -1) { pieces[idx] = { ...pieces[idx], ...body }; return this.respond(pieces[idx]); }
      }
      return this.error(404, 'Pièce non trouvée.');
    }
    if (url.includes('/repair-invoices') && method === 'POST') {
      const inv: RepairInvoice = {
        ...req.body as any,
        id: Date.now(),
        invoiceNumber: `F-${String(invoiceCounter++).padStart(4, '0')}`,
      };
      REPAIR_INVOICES.push(inv);
      return this.respond(inv);
    }
    // ── Quotes CRUD ──────────────────────────────────────────────────────────
    if (url.match(/\/quotes\/\d+\/convert$/) && method === 'POST') {
      const id    = parseInt(url.split('/quotes/')[1].split('/convert')[0]);
      const quote = QUOTES.find(q => q.id === id);
      if (!quote) return this.error(404, 'Devis non trouvé.');
      const inv: Invoice = { id: ++invoiceIdCounter, clientId: quote.clientId, clientName: quote.clientName, date: new Date().toLocaleDateString('fr-FR'), amount: quote.total, paid: 0, remaining: quote.total, status: 'impayee', paymentMethod: '-' };
      INVOICES.unshift(inv);
      quote.status = 'accepte';
      return this.respond(inv);
    }
    if (url.match(/\/quotes\/\d+$/) && method === 'DELETE') {
      const id = parseInt(url.split('/quotes/')[1]);
      const i  = QUOTES.findIndex(q => q.id === id);
      if (i !== -1) QUOTES.splice(i, 1);
      return this.respond(null);
    }
    if (url.match(/\/quotes\/\d+$/) && method === 'PUT') {
      const id  = parseInt(url.split('/quotes/')[1]);
      const idx = QUOTES.findIndex(q => q.id === id);
      if (idx !== -1) QUOTES[idx] = { ...QUOTES[idx], ...req.body as any };
      return this.respond(QUOTES[idx !== -1 ? idx : 0]);
    }
    if (url.includes('/quotes') && method === 'POST') {
      const body    = req.body as any;
      const created: Quote = { ...body, id: ++quoteIdCounter, status: 'en-attente' };
      QUOTES.unshift(created);
      return this.respond(created);
    }
    if (url.includes('/quotes'))             return this.respond(QUOTES);

    return next.handle(req);
  }

  private calcPartsCost(repair: any): number {
    return (repair.usedParts ?? []).reduce((s: number, p: any) => s + p.quantity * p.unitPrice, 0);
  }

  private toPublic(u: any) {
    return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role };
  }

  private toManaged(u: any) {
    const { password, ...rest } = u;
    return rest;
  }

  private respond(body: any) {
    return of(new HttpResponse({ status: 200, body })).pipe(delay(300));
  }

  private error(status: number, message: string) {
    return throwError(() => new HttpErrorResponse({ status, error: { message } })).pipe(delay(300));
  }
}
