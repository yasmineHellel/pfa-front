import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.models';

interface NavItem {
  label: string;
  route: string;
  badge?: string | number;
  badgeClass?: string;
  svgContent: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const SVG = {
  dashboard:  '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  clients:    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  vehicles:   '<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17H3V13L5 7h9l3 4h3l1 3v3h-2M5 17h10M9 7v4"/>',
  repairs:    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  quotes:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  invoices:   '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  stock:      '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  planning:   '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  whatsapp:   '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  users:      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

const NAV_ADMIN: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Tableau de bord', route: '/dashboard', svgContent: SVG.dashboard },
      { label: 'Clients',         route: '/clients',   svgContent: SVG.clients, badge: 48 },
      { label: 'Véhicules',       route: '/vehicles',  svgContent: SVG.vehicles },
      { label: 'Réparations',     route: '/repairs',   svgContent: SVG.repairs, badge: 3, badgeClass: 'red' },
    ],
  },
  {
    label: 'Finances',
    items: [
      { label: 'Devis',    route: '/quotes',   svgContent: SVG.quotes   },
      { label: 'Factures', route: '/invoices', svgContent: SVG.invoices },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { label: 'Stock Pièces',   route: '/stock',    svgContent: SVG.stock    },
      { label: 'Planning',       route: '/planning', svgContent: SVG.planning },
      { label: 'WhatsApp Auto',  route: '/whatsapp', svgContent: SVG.whatsapp },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Utilisateurs', route: '/users', svgContent: SVG.users },
    ],
  },
];

const NAV_MECANICIEN: NavGroup[] = [
  {
    label: 'Travaux',
    items: [
      { label: 'Réparations', route: '/repairs',  svgContent: SVG.repairs, badge: 3, badgeClass: 'red' },
      { label: 'Planning',    route: '/planning', svgContent: SVG.planning },
    ],
  },
  {
    label: 'Inventaire',
    items: [
      { label: 'Stock Pièces', route: '/stock', svgContent: SVG.stock },
    ],
  },
];

const NAV_FOURNISSEUR: NavGroup[] = [
  {
    label: 'Catalogue',
    items: [
      { label: 'Stock Pièces', route: '/stock',  svgContent: SVG.stock  },
      { label: 'Devis',        route: '/quotes', svgContent: SVG.quotes },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN:       'Administrateur',
  MECANICIEN:  'Mécanicien',
  FOURNISSEUR: 'Fournisseur',
};

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  constructor(public authService: AuthService) {}

  get user(): User | null { return this.authService.getCurrentUser(); }

  get roleLabel(): string { return ROLE_LABEL[this.authService.getRole()] || ''; }

  get navGroups(): NavGroup[] {
    const role = this.authService.getRole();
    if (role === 'MECANICIEN')  return NAV_MECANICIEN;
    if (role === 'FOURNISSEUR') return NAV_FOURNISSEUR;
    return NAV_ADMIN;
  }

  get userInitials(): string {
    const u = this.user;
    if (!u) return '?';
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }
}
