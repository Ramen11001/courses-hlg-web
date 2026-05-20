import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/interfaces/user';
import { UserService } from '../../core/services/user.service.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { UserCardComponent } from '../../shared/cards/user-card/user-card.component';
import { RequestService } from '../../core/services/request.service';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  templateUrl: './admin-config.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserCardComponent,
  ],
})
export class AdminConfigComponent implements OnInit {
  private _userService: UserService = inject(UserService);
  private _authService: AuthService = inject(AuthService);
  private _router: Router = inject(Router);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _requestService: RequestService = inject(RequestService);
  private _notificationService: NotificationService = inject(NotificationService);

  users: User[] = [];
  pendingRequests: any[] = [];
  currentUserId: number | null = null;
  isLoading: boolean = true;
  filterName: string = '';
  activeTab: 'users' | 'requests' = 'users';
  reviewForm: FormGroup = new FormGroup({ message: new FormControl('') });
  selectedRequestId: number | null = null;

  ngOnInit() {
    const token = this._authService.getToken();
    if (!token) {
      this._router.navigate(['/login']);
      return;
    }

    const role = localStorage.getItem('role');
    if (role !== 'ADMINISTRADOR') {
      this._router.navigate(['/home']);
      return;
    }

    this.currentUserId = this._userService.getCurrentUserId();
    this.loadUsers();
    this.loadPendingRequests();
  }

  loadUsers(): void {
    this.isLoading = true;
    this._userService.allUsers().subscribe({
      next: (users) => {
        this.users = users.filter((user) => user.id !== this.currentUserId);
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
      },
    });
  }

  loadPendingRequests(): void {
    this._requestService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this._cdr.detectChanges();
      },
      error: () => {},
    });
  }

  reviewRequest(id: number, status: string): void {
    const message = this.reviewForm.get('message')?.value || '';
    this._requestService.reviewRequest(id, status, message).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter((r) => r.id !== id);
        this.reviewForm.reset();
        this.selectedRequestId = null;
        this._cdr.detectChanges();
        this.loadUsers();
        this._notificationService.loadNotifications();
      },
      error: (err) => {
        console.error('Error al revisar solicitud:', err);
      },
    });
  }

  selectRequest(id: number): void {
    this.selectedRequestId = id;
    this.reviewForm.reset();
    this._cdr.detectChanges();
  }

  openReviewForm(id: number): void {
    this.selectedRequestId = id;
    this.reviewForm.reset();
  }

  changeRoleToSupplier(user: User): void {
    if (user.role !== 'USER') return;

    this._userService.updatedUser(user.id, { role: 'COURSE_SUPPLIER' }).subscribe({
      next: () => {
        user.role = 'COURSE_SUPPLIER';
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar rol:', err);
      },
    });
  }

  toggleVerification(user: User): void {
    if (user.role !== 'COURSE_SUPPLIER') return;

    const newVerifiedState = !user.verified;
    this._userService.updatedUser(user.id, { verified: newVerifiedState }).subscribe({
      next: () => {
        user.verified = newVerifiedState;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al actualizar verificación:', err);
      },
    });
  }

  navigateToHome(): void {
    this._router.navigate(['/home']);
  }

  get filteredUsers(): User[] {
    if (!this.filterName) return this.users;
    return this.users.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(this.filterName.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(this.filterName.toLowerCase()) ||
        user.email?.toLowerCase().includes(this.filterName.toLowerCase())
    );
  }
}
