import { Component, OnInit } from '@angular/core';
import { ClientService } from '../../../core/services/client.service';
import { Client } from '../../../core/models/models';

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filtered: Client[] = [];
  loading = false;
  error = '';

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loading = true;
    this.clientService.getAll().subscribe({
      next: data => { this.clients = data; this.filtered = [...data]; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des clients.'; this.loading = false; }
    });
  }

  onSearch(term: string): void {
    const t = term.toLowerCase();
    this.filtered = this.clients.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(t) ||
      c.phone.includes(t) ||
      c.email.toLowerCase().includes(t)
    );
  }

  initials(c: Client): string {
    return (c.firstName[0] + c.lastName[0]).toUpperCase();
  }

  avatarColor(c: Client): string {
    const colors = ['amber', 'blue', 'green', 'purple'];
    return colors[c.id % colors.length];
  }
}
