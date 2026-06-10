import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { ManagedUser } from '../../../core/models/auth.models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: ManagedUser[] = [];
  loading = true;
  error   = '';
  filter: 'ALL' | 'MECANICIEN' | 'FOURNISSEUR' = 'ALL';
  confirmDeleteId: number | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next:  u => { this.users = u; this.loading = false; },
      error: () => { this.error = 'Erreur de chargement.'; this.loading = false; }
    });
  }

  get filtered(): ManagedUser[] {
    return this.filter === 'ALL' ? this.users : this.users.filter(u => u.role === this.filter);
  }

  get mecaCount():  number { return this.users.filter(u => u.role === 'MECANICIEN').length;  }
  get fourCount():  number { return this.users.filter(u => u.role === 'FOURNISSEUR').length; }
  get activeCount():number { return this.users.filter(u => u.active).length; }

  initials(u: ManagedUser): string {
    return (u.firstName[0] + u.lastName[0]).toUpperCase();
  }

  roleLabel(role: string): string {
    return role === 'MECANICIEN' ? 'Mécanicien' : 'Fournisseur';
  }

  toggleActive(u: ManagedUser): void {
    this.userService.toggleActive(u.id).subscribe({
      next: updated => {
        const idx = this.users.findIndex(x => x.id === u.id);
        if (idx !== -1) this.users[idx] = updated;
      }
    });
  }

  confirmDelete(id: number): void { this.confirmDeleteId = id; }

  cancelDelete(): void { this.confirmDeleteId = null; }

  doDelete(): void {
    if (this.confirmDeleteId == null) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;
    this.userService.delete(id).subscribe({
      next: () => { this.users = this.users.filter(u => u.id !== id); }
    });
  }
}
