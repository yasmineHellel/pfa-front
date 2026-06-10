import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

import { LoginComponent }      from './shared/components/login/login.component';
import { RegisterComponent }   from './shared/components/register/register.component';
import { UsersComponent }      from './shared/components/users/users.component';
import { DashboardComponent }  from './shared/components/dashboard/dashboard.component';
import { ClientsComponent }   from './shared/components/clients/clients.component';
import { VehiclesComponent }  from './shared/components/vehicles/vehicles.component';
import { RepairsComponent }   from './shared/components/repairs/repairs.component';
import { QuotesComponent }    from './shared/components/quotes/quotes.component';
import { InvoicesComponent }  from './shared/components/invoices/invoices.component';
import { StockComponent }     from './shared/components/stock/stock.component';
import { PlanningComponent }  from './shared/components/planning/planning.component';
import { WhatsappComponent }  from './shared/components/whatsapp/whatsapp.component';

const A  = ['ADMIN'];
const AM = ['ADMIN', 'MECANICIEN'];
const AF = ['ADMIN', 'FOURNISSEUR'];
const ALL = ['ADMIN', 'MECANICIEN', 'FOURNISSEUR'];

const routes: Routes = [
  { path: 'login',    component: LoginComponent    },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard], data: { roles: A,   title: 'Tableau de bord', breadcrumb: "Vue d'ensemble"         } },
  { path: 'clients',   component: ClientsComponent,   canActivate: [AuthGuard], data: { roles: A,   title: 'Clients',         breadcrumb: 'Gestion des clients'    } },
  { path: 'vehicles',  component: VehiclesComponent,  canActivate: [AuthGuard], data: { roles: A,   title: 'Véhicules',       breadcrumb: 'Parc automobile'        } },
  { path: 'repairs',   component: RepairsComponent,   canActivate: [AuthGuard], data: { roles: AM,  title: 'Réparations',     breadcrumb: 'Suivi des interventions'} },
  { path: 'invoices',  component: InvoicesComponent,  canActivate: [AuthGuard], data: { roles: A,   title: 'Factures',        breadcrumb: 'Facturation'            } },
  { path: 'quotes',    component: QuotesComponent,    canActivate: [AuthGuard], data: { roles: AF,  title: 'Devis',           breadcrumb: 'Devis & estimations'    } },
  { path: 'stock',     component: StockComponent,     canActivate: [AuthGuard], data: { roles: ALL, title: 'Stock Pièces',    breadcrumb: 'Gestion inventaire'     } },
  { path: 'planning',  component: PlanningComponent,  canActivate: [AuthGuard], data: { roles: AM,  title: 'Planning',        breadcrumb: 'Planning mécaniciens'   } },
  { path: 'whatsapp',  component: WhatsappComponent,  canActivate: [AuthGuard], data: { roles: A,   title: 'WhatsApp Auto',   breadcrumb: 'Notifications auto'     } },
  { path: 'users',     component: UsersComponent,     canActivate: [AuthGuard], data: { roles: A,   title: 'Utilisateurs',    breadcrumb: 'Gestion des accès'      } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
