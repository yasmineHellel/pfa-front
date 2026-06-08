import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { ClientsComponent } from './shared/components/clients/clients.component';
import { VehiclesComponent } from './shared/components/vehicles/vehicles.component';
import { RepairsComponent } from './shared/components/repairs/repairs.component';
import { QuotesComponent } from './shared/components/quotes/quotes.component';
import { InvoicesComponent } from './shared/components/invoices/invoices.component';
import { StockComponent } from './shared/components/stock/stock.component';
import { PlanningComponent } from './shared/components/planning/planning.component';
import { WhatsappComponent } from './shared/components/whatsapp/whatsapp.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, data: { title: 'Tableau de bord',  breadcrumb: "Vue d'ensemble" } },
  { path: 'clients',   component: ClientsComponent,   data: { title: 'Clients',           breadcrumb: 'Gestion des clients' } },
  { path: 'vehicles',  component: VehiclesComponent,  data: { title: 'Véhicules',         breadcrumb: 'Parc automobile' } },
  { path: 'repairs',   component: RepairsComponent,   data: { title: 'Réparations',       breadcrumb: 'Suivi des interventions' } },
  { path: 'quotes',    component: QuotesComponent,    data: { title: 'Devis',             breadcrumb: 'Devis & estimations' } },
  { path: 'invoices',  component: InvoicesComponent,  data: { title: 'Factures',          breadcrumb: 'Facturation' } },
  { path: 'stock',     component: StockComponent,     data: { title: 'Stock Pièces',      breadcrumb: 'Gestion inventaire' } },
  { path: 'planning',  component: PlanningComponent,  data: { title: 'Planning',          breadcrumb: 'Planning mécaniciens' } },
  { path: 'whatsapp',  component: WhatsappComponent,  data: { title: 'WhatsApp Auto',     breadcrumb: 'Notifications automatiques' } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
