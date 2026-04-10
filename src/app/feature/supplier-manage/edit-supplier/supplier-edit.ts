import { Component } from '@angular/core';
import {
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-edit-course',
  templateUrl: './supplier-edit.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
})
export class SupplierEdit {

}
