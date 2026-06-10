import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuoteService }  from '../../../core/services/quote.service';
import { ClientService } from '../../../core/services/client.service';
import { Quote, Client } from '../../../core/models/models';

@Component({
  selector: 'app-quotes',
  templateUrl: './quotes.component.html',
  styleUrls: ['./quotes.component.css']
})
export class QuotesComponent implements OnInit {
  quotes:  Quote[]  = [];
  filtered: Quote[] = [];
  clients: Client[] = [];
  activeTab = 0;
  tabs = ['Tous', 'Acceptés', 'En attente'];
  loading = false;
  error   = '';

  showModal    = false;
  modalMode: 'create' | 'edit' = 'create';
  editingQuote: Quote | null = null;
  form: FormGroup;
  submitting = false;
  formError  = '';

  confirmDeleteId: number | null = null;
  convertingId:    number | null = null;
  convertSuccess   = false;

  constructor(
    private quoteService:  QuoteService,
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      clientId:    ['', Validators.required],
      clientName:  [''],
      description: ['', Validators.required],
      total:       [0,  [Validators.required, Validators.min(0.01)]],
      date:        ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.quoteService.getAll().subscribe({
      next:  d => { this.quotes = d; this.applyFilter(); this.loading = false; },
      error: () => { this.error = 'Erreur de chargement des devis.'; this.loading = false; }
    });
    this.clientService.getAll().subscribe(c => this.clients = c);
  }

  applyFilter(): void {
    if (this.activeTab === 0) { this.filtered = [...this.quotes]; return; }
    const map = ['', 'accepte', 'en-attente'];
    this.filtered = this.quotes.filter(q => q.status === map[this.activeTab]);
  }

  setTab(i: number): void { this.activeTab = i; this.applyFilter(); }

  openCreate(): void {
    this.modalMode = 'create';
    this.editingQuote = null;
    const today = new Date().toLocaleDateString('fr-FR');
    this.form.reset({ total: 0, date: today });
    this.formError = '';
    this.showModal = true;
  }

  openEdit(q: Quote): void {
    this.modalMode = 'edit';
    this.editingQuote = q;
    this.form.patchValue({ clientId: q.clientId, clientName: q.clientName, description: q.description, total: q.total, date: q.date });
    this.formError = '';
    this.showModal = true;
  }

  closeModal(): void { this.showModal = false; }

  onClientChange(clientId: string): void {
    const cl = this.clients.find(c => c.id === parseInt(clientId));
    if (cl) this.form.patchValue({ clientName: `${cl.firstName} ${cl.lastName}` });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.formError  = '';
    const data = this.form.value;
    if (this.modalMode === 'create') {
      this.quoteService.create(data).subscribe({
        next: created => {
          this.quotes.unshift(created);
          this.applyFilter();
          this.submitting = false; this.showModal = false;
        },
        error: () => { this.formError = 'Erreur lors de la création.'; this.submitting = false; }
      });
    } else {
      this.quoteService.update(this.editingQuote!.id, data).subscribe({
        next: updated => {
          const idx = this.quotes.findIndex(q => q.id === updated.id);
          if (idx !== -1) this.quotes[idx] = updated;
          this.applyFilter();
          this.submitting = false; this.showModal = false;
        },
        error: () => { this.formError = 'Erreur.'; this.submitting = false; }
      });
    }
  }

  convertToInvoice(q: Quote): void {
    this.convertingId = q.id;
    this.quoteService.convert(q.id).subscribe({
      next: () => {
        const idx = this.quotes.findIndex(x => x.id === q.id);
        if (idx !== -1) this.quotes[idx] = { ...this.quotes[idx], status: 'accepte' };
        this.applyFilter();
        this.convertingId = null;
        this.convertSuccess = true;
        setTimeout(() => this.convertSuccess = false, 3000);
      },
      error: () => { this.convertingId = null; }
    });
  }

  confirmDelete(id: number): void { this.confirmDeleteId = id; }
  cancelDelete():  void { this.confirmDeleteId = null; }

  doDelete(): void {
    if (this.confirmDeleteId == null) return;
    const id = this.confirmDeleteId;
    this.confirmDeleteId = null;
    this.quoteService.delete(id).subscribe({
      next: () => { this.quotes = this.quotes.filter(q => q.id !== id); this.applyFilter(); }
    });
  }

  statusBadge(s: string): string {
    return ({ 'accepte': 'badge-green', 'en-attente': 'badge-amber' } as any)[s] || 'badge-gray';
  }
  statusLabel(s: string): string {
    return ({ 'accepte': 'Accepté', 'en-attente': 'En attente' } as any)[s] || s;
  }

  f(name: string) { return this.form.get(name)!; }
}
