import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-details.html',
})
export class SupplierDetails {

}
