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

  categories = signal<any[]>([]);
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
  selectedSizes = signal<string[]>([]);
  selectedColors = signal<string[]>([]);
  
  colorOptions = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Gris', hex: '#808080' },
    { name: 'Azul', hex: '#0000FF' },
    { name: 'Azul Marino', hex: '#000080' },
    { name: 'Celeste', hex: '#87CEEB' },
    { name: 'Rojo', hex: '#FF0000' },
    { name: 'Verde', hex: '#008000' },
    { name: 'Verde Lima', hex: '#00FF00' },
    { name: 'Amarillo', hex: '#FFFF00' },
    { name: 'Naranja', hex: '#FFA500' },
    { name: 'Rosa', hex: '#FFC0CB' },
    { name: 'Morado', hex: '#800080' },
    { name: 'Café', hex: '#8B4513' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Dorado', hex: '#FFD700' },
    { name: 'Plateado', hex: '#C0C0C0' }
  ];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
        this.product.set({
          ...data,
          categoryId: data.categoryId,
          color: data.color || ''
        });
        
        if (data.size) {
          const sizesArray = data.size.split('-').filter(s => s.trim());
          this.selectedSizes.set(sizesArray);
        }
        
        if (data.color) {
          const colorsArray = data.color.split('-').filter(c => c.trim());
          this.selectedColors.set(colorsArray);
        }
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar el producto');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    const urlPattern = /^https?:\/\/.+/i;
    return urlPattern.test(url);
  }

  onSubmit(): void {
    if (!this.product().name.trim()) {
      this.error.set('El nombre del producto es requerido');
      return;
    }

    if (!this.product().categoryId) {
      this.error.set('Debes seleccionar una categoría');
      return;
    }

    if (!this.product().imageUrl?.trim()) {
      this.error.set('La URL de la imagen es requerida');
      return;
    }

    if (!this.isValidUrl(this.product().imageUrl)) {
      this.error.set('La URL de la imagen debe comenzar con http:// o https://');
      return;
    }

    if (!this.product().price || this.product().price! <= 0) {
      this.error.set('El precio debe ser mayor a 0');
      return;
    }

    if (this.product().stock === undefined || this.product().stock! < 0) {
      this.error.set('El stock es requerido y debe ser mayor o igual a 0');
      return;
    }

    if (this.selectedSizes().length === 0) {
      this.error.set('Debes seleccionar al menos una talla');
      return;
    }

    if (this.selectedColors().length === 0) {
      this.error.set('Debes seleccionar al menos un color');
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

  isFormValid(): boolean {
    const p = this.product();
    return !!(
      p.name.trim() &&
      p.categoryId &&
      p.imageUrl?.trim() &&
      this.isValidUrl(p.imageUrl) &&
      p.price &&
      p.price > 0 &&
      p.stock !== undefined &&
      p.stock !== null &&
      p.stock >= 0 &&
      this.selectedSizes().length > 0 &&
      this.selectedColors().length > 0
    );
  }

  updateField(field: keyof Product, value: any): void {
    this.product.update(prod => ({ ...prod, [field]: value }));
  }

  addSize(size: string): void {
    if (!size || this.selectedSizes().includes(size)) return;
    this.selectedSizes.update(sizes => [...sizes, size]);
    this.updateSizeField();
  }

  removeSize(size: string): void {
    this.selectedSizes.update(sizes => sizes.filter(s => s !== size));
    this.updateSizeField();
  }

  getSelectedSizes(): string[] {
    return this.selectedSizes();
  }

  availableSizes = (): string[] => {
    return this.sizes.filter(size => !this.selectedSizes().includes(size));
  }

  updateSizeField(): void {
    const sizesString = this.selectedSizes().join('-');
    this.product.update(prod => ({ ...prod, size: sizesString }));
  }

  // Funciones para manejar colores múltiples
  addColor(colorHex: string): void {
    if (!colorHex || this.selectedColors().includes(colorHex)) return;
    this.selectedColors.update(colors => [...colors, colorHex]);
    this.updateColorField();
  }

  removeColor(colorHex: string): void {
    this.selectedColors.update(colors => colors.filter(c => c !== colorHex));
    this.updateColorField();
  }

  getSelectedColors(): string[] {
    return this.selectedColors();
  }

  availableColors = (): typeof this.colorOptions => {
    return this.colorOptions.filter(color => !this.selectedColors().includes(color.hex));
  }

  updateColorField(): void {
    const colorsString = this.selectedColors().join('-');
    this.product.update(prod => ({ ...prod, color: colorsString }));
  }

  getColorNameFromHex(hex: string): string {
    const color = this.colorOptions.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    return color ? color.name : hex;
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
