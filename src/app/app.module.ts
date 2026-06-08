import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockInterceptor } from './core/interceptors/mock.interceptor';
import { environment } from '../environments/environment';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Layout
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { TopbarComponent } from './shared/components/topbar/topbar.component';
import { SearchBarComponent } from './shared/components/search-bar/search-bar.component';
import { StatCardComponent } from './shared/components/stat-card/stat-card.component';

// Pages
import { DashboardComponent } from './shared/components/dashboard/dashboard.component';
import { ClientsComponent } from './shared/components/clients/clients.component';
import { VehiclesComponent } from './shared/components/vehicles/vehicles.component';
import { RepairsComponent } from './shared/components/repairs/repairs.component';
import { QuotesComponent } from './shared/components/quotes/quotes.component';
import { InvoicesComponent } from './shared/components/invoices/invoices.component';
import { StockComponent } from './shared/components/stock/stock.component';
import { PlanningComponent } from './shared/components/planning/planning.component';
import { WhatsappComponent } from './shared/components/whatsapp/whatsapp.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    TopbarComponent,
    SearchBarComponent,
    StatCardComponent,
    DashboardComponent,
    ClientsComponent,
    VehiclesComponent,
    RepairsComponent,
    QuotesComponent,
    InvoicesComponent,
    StockComponent,
    PlanningComponent,
    WhatsappComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
  ],
  providers: [
    ...(!environment.production
      ? [{ provide: HTTP_INTERCEPTORS, useClass: MockInterceptor, multi: true }]
      : [])
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
