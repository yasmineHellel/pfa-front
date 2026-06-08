import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  Client, Vehicle, Repair, Invoice, StockItem,
  Quote, DashboardStats, ActivityItem
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
  { id: 1, ref: 'REF-0012', name: 'Plaquettes de frein AV',  category: 'Freinage',     categoryColor: 'blue',   unitPrice: 45,  quantity: 2,  alertThreshold: 10, status: 'critique' },
  { id: 2, ref: 'REF-0008', name: 'Filtre à huile',           category: 'Moteur',       categoryColor: 'amber',  unitPrice: 12,  quantity: 5,  alertThreshold: 15, status: 'bas'      },
  { id: 3, ref: 'REF-0021', name: 'Courroie de distribution', category: 'Distribution', categoryColor: 'purple', unitPrice: 85,  quantity: 18, alertThreshold: 5,  status: 'ok'       },
  { id: 4, ref: 'REF-0033', name: 'Batterie 60Ah',            category: 'Électrique',   categoryColor: 'blue',   unitPrice: 220, quantity: 9,  alertThreshold: 3,  status: 'ok'       },
  { id: 5, ref: 'REF-0045', name: 'Amortisseur AV gauche',    category: 'Suspension',   categoryColor: 'green',  unitPrice: 135, quantity: 3,  alertThreshold: 4,  status: 'bas'      },
];

const QUOTES: Quote[] = [
  { id: 21, clientId: 1, clientName: 'Mohamed Ali', date: '08/05/2025', description: 'Révision + freins + vidange',            total: 520, status: 'accepte'    },
  { id: 20, clientId: 4, clientName: 'Habiba Sfar', date: '09/05/2025', description: 'Réparation climatisation + recharge gaz', total: 280, status: 'en-attente' },
];

const STATS: DashboardStats = {
  revenue: 28450,
  revenueDeltaPercent: 12.4,
  activeRepairs: 14,
  pendingRepairs: 3,
  newClients: 7,
  unpaidAmount: 5200,
  unpaidCount: 4,
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

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const url = req.url;

    // ── Auth ──────────────────────────────────────────────────────────────────
    if (url.includes('/auth/login') && req.method === 'POST') {
      const { email, password } = req.body as { email: string; password: string };
      const users = [
        { email: 'admin@garage.com',       password: 'admin123', user: { id: 1, firstName: 'Admin',   lastName: 'Garage',     email: 'admin@garage.com',       role: 'ADMIN'       } },
        { email: 'mecanicien@garage.com',  password: 'meca123',  user: { id: 2, firstName: 'Sami',    lastName: 'Khelifa',    email: 'mecanicien@garage.com',  role: 'MECANICIEN'  } },
        { email: 'fournisseur@garage.com', password: 'four123',  user: { id: 3, firstName: 'Kamel',   lastName: 'Fournisseur',email: 'fournisseur@garage.com', role: 'FOURNISSEUR' } },
      ];
      const match = users.find(u => u.email === email && u.password === password);
      if (match) return this.respond({ token: `mock-token-${match.user.role}`, user: match.user });
      return throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Identifiants incorrects' } })).pipe(delay(300));
    }

    if (url.includes('/dashboard/stats'))    return this.respond(STATS);
    if (url.includes('/dashboard/activity')) return this.respond(ACTIVITY);
    if (url.includes('/stock/low-stock'))    return this.respond(STOCK.filter(s => s.status !== 'ok'));
    if (url.includes('/clients'))            return this.respond(CLIENTS);
    if (url.includes('/vehicles'))           return this.respond(VEHICLES);
    if (url.includes('/repairs'))            return this.respond(REPAIRS);
    if (url.includes('/invoices'))           return this.respond(INVOICES);
    if (url.includes('/stock'))              return this.respond(STOCK);
    if (url.includes('/quotes'))             return this.respond(QUOTES);

    return next.handle(req);
  }

  private respond(body: any) {
    return of(new HttpResponse({ status: 200, body })).pipe(delay(300));
  }
}
