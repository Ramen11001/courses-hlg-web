import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductsService } from 'src/app/core/services/course.service';
/**
 * Component for creating new products.
 * Provides a form to input product details and handles submission to the API.
 *
 * @component
 * @selector app-create-product
 * @standalone true
 */
@Component({
  selector: 'app-create-product',
  standalone: true,
  templateUrl: './create-product.component.html',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
})
export class CreateProductComponent {
  /**
   * Form group for product creation.
   * Contains fields: name, price, description.
   * @type {FormGroup}
   */
  productForm: FormGroup;
  /**
   * Loading state indicator.
   * Set to true during form submission.
   * @type {boolean}
   */
  isLoading = false;
  /**
   * Component constructor.
   * Initializes the product form with validation rules.
   *
   * @param {FormBuilder} fb - Angular form builder service
   * @param {Router} router - Angular router for navigation
   * @param {ProductsService} productService - Product API service
   */
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductsService,
  ) {
    // Initialize form with validation rules
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      price: [null, [Validators.required, Validators.min(0)]],
      description: ['', Validators.minLength(10)],
    });
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
   * Handles form submission.
   * - Validates form inputs
   * - Converts price to number
   * - Calls product service to save new product
   * - Navigates to product list on success
   * - Shows error alerts on failure
   *
   * @returns {void}
   */
  onSubmit() {
    // Trigger validation UI for all fields
    this.productForm.markAllAsTouched();

    if (this.productForm.valid) {
      this.isLoading = true;

      // Convert price to number type for API
      const formData = {
        ...this.productForm.value,
        price: Number(this.productForm.value.price),
      };
      // Call product service to create new product
      this.productService.saveProduct(null, formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          // Navigate to product list after successful creation
          this.router.navigate(['/product']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error:', error);
          alert(
            'Error al crear producto: ' +
              (error.error?.message || error.message),
          );
        },
      });
    }
  }
}
