import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RequestService } from '../../../core/services/request.service';
import { UserService } from '../../../core/services/user.service.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-request-role',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-role.component.html',
  styleUrls: ['./request-role.component.scss'],
})
export class RequestRoleComponent implements OnInit {
  private _requestService = inject(RequestService);
  private _userService = inject(UserService);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);

  requestForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;
  userRole: string = '';
  myRequests: any[] = [];

  ngOnInit() {
    const token = this._authService.getToken();
    if (!token) {
      this._router.navigate(['/login']);
      return;
    }
    this.userRole = this._userService.getUserRole() || '';
    const defaultType = this.userRole === 'USER' ? 'become_teacher' : this.userRole === 'COURSE_SUPPLIER' ? 'request_verification' : '';
    this.requestForm = this._fb.group({
      type: [defaultType, Validators.required],
      message: ['', [Validators.maxLength(500)]],
    });
    this.loadMyRequests();
  }

  loadMyRequests() {
    this._requestService.getMyRequests().subscribe({
      next: (requests) => {
        this.myRequests = requests;
      },
      error: () => {},
    });
  }

  submit() {
    if (this.requestForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { type, message } = this.requestForm.value;
    this._requestService.createRequest(type, message).subscribe({
      next: () => {
        this.successMessage = 'Solicitud enviada correctamente. Un administrador la revisará pronto.';
        this.requestForm.reset();
        this.loadMyRequests();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error al enviar la solicitud';
        this.loading = false;
      },
    });
  }

 goToMyProfile() {
    const id = this._userService.getCurrentUserId();
    if (id) {
      this._router.navigate(['/user', id]);
    }
  }

  get canRequestTeacher() {
    return this.userRole === 'USER';
  }

  get canRequestVerification() {
    return this.userRole === 'COURSE_SUPPLIER';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning bg-opacity-10 text-warning';
      case 'approved': return 'bg-success bg-opacity-10 text-success';
      case 'rejected': return 'bg-danger bg-opacity-10 text-danger';
      default: return 'bg-secondary bg-opacity-10 text-secondary';
    }
  }
}
