import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="search-input-wrapper">
        <input 
          type="text" 
          placeholder="Buscar productos..."
          [(ngModel)]="searchTerm"
          (input)="onSearch()"
          class="search-input"
        />
        <button class="search-btn" (click)="onSearch()">
          🔍
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./product-search.component.scss']
})
export class ProductSearchComponent {
  @Output() searchEvent = new EventEmitter<string>();

  searchTerm: string = '';

  onSearch(): void {
    this.searchEvent.emit(this.searchTerm);
  }
} 