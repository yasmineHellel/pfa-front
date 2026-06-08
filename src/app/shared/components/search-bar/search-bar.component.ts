import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  template: `
    <div class="table-search">
      <input
        class="search-input"
        [placeholder]="placeholder"
        (input)="searchChange.emit($any($event.target).value)"
      >
      <button *ngIf="showFilter" class="filter-btn">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        {{ filterLabel }}
      </button>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .search-input {
      flex: 1; padding: 7px 12px; border: 1px solid var(--border);
      border-radius: 7px; font-size: 13px; background: var(--surface-2);
      color: var(--text-1); outline: none; font-family: 'DM Sans', sans-serif;
    }
    .search-input:focus { border-color: var(--accent); }
    .filter-btn {
      padding: 7px 12px; border: 1px solid var(--border); border-radius: 7px;
      background: var(--surface-2); font-size: 13px; cursor: pointer;
      color: var(--text-2); display: flex; align-items: center; gap: 6px;
      font-family: 'DM Sans', sans-serif;
    }
  `]
})
export class SearchBarComponent {
  @Input() placeholder = '🔍  Rechercher…';
  @Input() showFilter = false;
  @Input() filterLabel = 'Filtrer';
  @Output() searchChange = new EventEmitter<string>();
}
