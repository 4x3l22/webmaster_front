import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'scale(0.8)' }),
          stagger(80, [
            animate('0.6s cubic-bezier(0.35, 0, 0.25, 1)', 
              style({ opacity: 1, transform: 'scale(1)' }))
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
export class ProductListComponent implements OnInit {
  products = signal<Product[]>([]);
  categories = signal<any[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  searchTerm = signal<string>('');
  selectedFilter = signal<string>('all');
  imageErrorCounts = signal<Map<number, number>>(new Map());
  defaultImage = 'https://imgs.search.brave.com/vLZ44Uli4ZlkgAjdMiftogg6vX7--GvMQWTk4ZDQ8zc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/cmVkZGl0c3RhdGlj/LmNvbS9hdmF0YXJz/L2RlZmF1bHRzL3Yy/L2F2YXRhcl9kZWZh/dWx0XzcucG5n';

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err) => {
        console.error('Error al cargar categorías:', err);
      }
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(''); 
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
        this.error.set(''); 
      },
      error: (err) => {
        this.error.set('Error al cargar los productos');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/products/create']);
  }

  navigateToEdit(id: number): void {
    this.router.navigate(['/products/edit', id]);
  }

  deleteProduct(id: number, name: string): void {
    if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert('Error al eliminar el producto');
          console.error(err);
        }
      });
    }
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm().toLowerCase();
    let filtered = this.products();

    if (term) {
      filtered = filtered.filter(product => {
        const categoryName = this.getCategoryName(product.categoryId);
        return product.name.toLowerCase().includes(term) || 
          categoryName.toLowerCase().includes(term);
      });
    }

    return filtered;
  }

  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return '';
    const category = this.categories().find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '$0.00';
    return `$${price.toFixed(2)}`;
  }

  getStockStatus(stock: number | undefined): string {
    if (!stock || stock === 0) return 'Agotado';
    if (stock < 5) return 'Pocas unidades';
    return 'Disponible';
  }

  getStockClass(stock: number | undefined): string {
    if (!stock || stock === 0) return 'stock-out';
    if (stock < 5) return 'stock-low';
    return 'stock-available';
  }

  onImageError(event: any, productId: number): void {
    const errorCounts = this.imageErrorCounts();
    const currentCount = errorCounts.get(productId) || 0;
    
    if (currentCount >= 5) {
      event.target.src = this.defaultImage;
    } else {
      errorCounts.set(productId, currentCount + 1);
      this.imageErrorCounts.set(errorCounts);
    }
  }
}
