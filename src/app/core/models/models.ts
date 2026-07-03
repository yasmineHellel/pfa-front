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

export interface RepairPart {
  stockItemId: number;
  name: string;
  ref: string;
  quantity: number;
  unitPrice: number;
}

export interface Repair {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  vehicleId: number;
  vehicleName: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  plate: string;
  description: string;
  mechanicName: string;
  status: string;
  cost: number;
  entryDate: string;
  usedParts?: RepairPart[];
}

export interface Invoice {
  id: number;
  invoiceNumber?: string;
  clientId: number;
  clientName: string;
  clientPhone?: string;
  vehicleId?: number;
  vehicleName?: string;
  licensePlate?: string;
  serviceRecordId?: number;
  mechanicName?: string;
  description?: string;
  date: string;
  invoiceDate?: string;
  entryDate?: string;
  laborDescription?: string;
  laborCost?: number;
  totalParts?: number;
  amount: number;
  paid: number;
  remaining: number;
  status: string;
  paymentMethod: string;
  lines?: InvoiceLine[];
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
  mechanicName?: string;
  supplierId?: number;
  supplierName?: string;
}

export interface OrderItem {
  pieceId: number;
  pieceName: string;
  ref: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id?: number;
  supplierId: number;
  supplierName: string;
  mechanicId?: number;
  mechanicName: string;
  mechanicPhone?: string;
  mechanicEmail?: string;
  items: OrderItem[];
  totalAmount: number;
  date: string;
  status: 'en-attente' | 'en-cours' | 'expediee' | 'livree' | 'annulee';
}

export interface SupplierPiece {
  id: number;
  ref: string;
  name: string;
  category: string;
  categoryColor: string;
  unitPrice: number;
  availableQty: number;
  supplierId: number;
  supplierName: string;
  description?: string;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface RepairInvoice {
  id?: number;
  invoiceNumber: string;
  repairId: number;
  clientId?: number;
  vehicleId?: number;
  clientName: string;
  clientPhone: string;
  vehicleName: string;
  plate: string;
  mechanicName: string;
  repairDescription: string;
  entryDate: string;
  invoiceDate: string;
  lines: InvoiceLine[];
  totalParts: number;
  laborDescription: string;
  laborCost: number;
  total: number;
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
