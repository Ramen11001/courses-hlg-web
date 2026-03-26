import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { Product } from 'src/app/core/interfaces/product';
import { ProductsService } from 'src/app/core/services/course.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class EditProductComponent {
  productForm: FormGroup;
  isLoading = false;
  productId: number;
  errorMessage: string | null = null;
  canEdit = false;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductsService,
    private authService: AuthService,
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.minLength(3)]],
      price: [0],
      description: ['', Validators.minLength(10)],
    });
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadProduct();
  }
  /**
   * Handles errors by displaying a message and navigating after delay.
   * @private
   * @param {string} message - Error message to display
   */
  private handleError(message: string): void {
    this.errorMessage = message;
    this.isLoading = false;
    setTimeout(() => this.router.navigate(['/edit/:']), 2000);
  }
  /**
   * Loads product data from API and checks edit permissions.
   * - Verifies user authentication
   * - Checks if current user owns the product
   * - Populates form with product data
   * @private
   */
  loadProduct(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.handleError('Debes iniciar sesión para editar productos');
      return;
    }

    this.productService.getProductId(this.productId).subscribe({
      next: (product: Product) => {
        if (product.userId !== currentUserId) {
          this.handleError('No tienes permiso para editar este producto');
          return;
        }

        this.canEdit = true;
        this.productForm.patchValue({
          name: product.name,
          price: product.price,
          description: product.description,
        });
        this.isLoading = false;
      },
      error: (err: string) => {
        if (err === 'Producto no encontrado') {
          this.showError('Producto no encontrado');
        } else {
          this.showError('Error al cargar el producto');
        }
      },
    });
  }
  showError(arg0: string) {
    throw new Error('Method not implemented.');
  }

  /**
   * Navigates to the product page.
   * Uses Angular Router to navigate to '/product' route.
   * @returns {void}
   */
  navigateToProduct() {
    this.router.navigate(['/product']);
  }

  /**
   * Handles form submission for product updates.
   * - Validates form inputs
   * - Converts price to number
   * - Calls product service to update product
   * - Navigates to product list on success
   * - Handles errors with appropriate messages
   */
  onSubmit(): void {
    this.productForm.markAllAsTouched();

    // Proceed only if form is valid
    if (this.productForm.valid) {
      this.isLoading = true;
      this.errorMessage = null;

      const formData = {
        ...this.productForm.value,
        price: Number(this.productForm.value.price),
        userId: this.authService.getCurrentUserId()!,
      };

      this.productService.saveProduct(this.productId, formData).subscribe({
        next: () => {
          this.isLoading = false;

          this.router.navigate(['/product'], {
            state: { message: 'Producto actualizado exitosamente' },
          });
        },
        error: (error) => {
          this.isLoading = false;

          if (error.status === 403) {
            this.errorMessage =
              'No tienes permiso para actualizar este producto';
          } else if (error.status === 404) {
            this.errorMessage = 'Producto no encontrado';
          } else {
            this.errorMessage =
              'Error al actualizar el producto: ' +
              (error.error?.message || error.message);
          }
        },
      });
    }
  }
}
