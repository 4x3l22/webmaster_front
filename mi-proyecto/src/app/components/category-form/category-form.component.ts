import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CategoryService, Category } from '../../services/category.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('0.5s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class CategoryFormComponent implements OnInit {
  category = signal<Category>({ name: '', description: '' });
  isEditMode = signal<boolean>(false);
  categoryId = signal<number | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<boolean>(false);

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.categoryId.set(Number(id));
      this.loadCategory(Number(id));
    }
  }

  loadCategory(id: number): void {
    this.loading.set(true);
    this.categoryService.getCategoryById(id).subscribe({
      next: (data) => {
        this.category.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la categoría');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    if (!this.category().name.trim()) {
      this.error.set('El nombre de la categoría es requerido');
      return;
    }

    if (!this.category().description?.trim()) {
      this.error.set('La descripción es requerida');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const operation = this.isEditMode()
      ? this.categoryService.updateCategory(this.categoryId()!, this.category())
      : this.categoryService.createCategory(this.category());

    operation.subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
        setTimeout(() => {
          this.router.navigate(['/categories']);
        }, 1500);
      },
      error: (err) => {
        this.error.set('Error al guardar la categoría');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  updateName(value: string): void {
    this.category.update(cat => ({ ...cat, name: value }));
  }

  updateDescription(value: string): void {
    this.category.update(cat => ({ ...cat, description: value }));
  }

  cancel(): void {
    this.router.navigate(['/categories']);
  }
}
