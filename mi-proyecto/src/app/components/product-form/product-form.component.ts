import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.35, 0, 0.25, 1)', 
          style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class ProductFormComponent implements OnInit {
  product = signal<Product>({ 
    name: '', 
    description: '',
    price: 0,
    stock: 0,
    categoryId: undefined,
    imageUrl: '',
    size: '',
    color: ''
  });
  
  isEditMode = signal<boolean>(false);
  productId = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<boolean>(false);

  // Categorías desde la API
  categories = signal<any[]>([]);
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
  colors = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Amarillo', 'Rosa', 'Morado', 'Multicolor'];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Cargar categorías
    this.loadCategories();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.productId.set(Number(id));
      this.loadProduct(Number(id));
    }
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

  loadProduct(id: number): void {
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el producto');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (!this.product().name.trim()) {
      this.error.set('El nombre del producto es requerido');
      return;
    }

    if (!this.product().price || this.product().price! <= 0) {
      this.error.set('El precio debe ser mayor a 0');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const operation = this.isEditMode()
      ? this.productService.updateProduct(this.productId()!, this.product())
      : this.productService.createProduct(this.product());

    operation.subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/products']);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Error al guardar el producto');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  updateField(field: keyof Product, value: any): void {
    this.product.update(prod => ({ ...prod, [field]: value }));
  }

  getCategoryName(categoryId: number | undefined): string {
    if (!categoryId) return '';
    const category = this.categories().find(cat => cat.id === categoryId);
    return category ? category.name : '';
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
