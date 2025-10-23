import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CategoryService, Category } from '../../services/category.service';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CategoryListComponent implements OnInit {
  categories = signal<Category[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  searchTerm = signal<string>('');
  
  // Confirm Dialog
  showDeleteDialog = signal<boolean>(false);
  itemToDelete = signal<{ id: number; name: string } | null>(null);

  constructor(
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set(''); 
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
        this.error.set(''); 
      },
      error: (err) => {
        this.error.set('Error al cargar las categorías');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/categories/create']);
  }

  navigateToEdit(id: number): void {
    this.router.navigate(['/categories/edit', id]);
  }

  deleteCategory(id: number, name: string): void {
    this.itemToDelete.set({ id, name });
    this.showDeleteDialog.set(true);
  }

  confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.categoryService.deleteCategory(item.id).subscribe({
      next: () => {
        this.showDeleteDialog.set(false);
        this.itemToDelete.set(null);
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error al eliminar la categoría:', err);
        this.showDeleteDialog.set(false);
        this.itemToDelete.set(null);
        this.error.set('Error al eliminar la categoría');
      }
    });
  }

  cancelDelete(): void {
    this.showDeleteDialog.set(false);
    this.itemToDelete.set(null);
  }

  get filteredCategories(): Category[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.categories();
    
    return this.categories().filter(cat => 
      cat.name.toLowerCase().includes(term) || 
      (cat.description?.toLowerCase().includes(term) || false)
    );
  }
}
