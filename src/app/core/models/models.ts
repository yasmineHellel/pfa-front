// ── UI-only types ────────────────────────────────────────────────────────────

export interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down';
  color: string;
}

// ── Spring Boot API response types ───────────────────────────────────────────

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleCount: number;
  repairCount: number;
  totalSpent: number;
  lastVisit: string;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  engine: string;
  year: number;
  clientId: number;
  clientName: string;
  mileage: number;
  repairCount: number;
}

export interface Repair {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  vehicleId: number;
  vehicleName: string;
  plate: string;
  description: string;
  mechanicName: string;
  status: string;
  cost: number;
  entryDate: string;
}

export interface Invoice {
  id: number;
  clientId: number;
  clientName: string;
  date: string;
  amount: number;
  paid: number;
  remaining: number;
  status: string;
  paymentMethod: string;
}

export interface StockItem {
  id: number;
  ref: string;
  name: string;
  category: string;
  categoryColor: string;
  unitPrice: number;
  quantity: number;
  alertThreshold: number;
  status: string;
}

export interface Quote {
  id: number;
  clientId: number;
  clientName: string;
  date: string;
  description: string;
  total: number;
  status: string;
}

export interface DashboardStats {
  revenue: number;
  revenueDeltaPercent: number;
  activeRepairs: number;
  pendingRepairs: number;
  newClients: number;
  unpaidAmount: number;
  unpaidCount: number;
}

export interface ActivityItem {
  dotColor: string;
  text: string;
  time: string;
}
