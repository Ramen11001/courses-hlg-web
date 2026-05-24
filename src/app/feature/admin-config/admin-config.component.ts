import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart, BarController, DoughnutController, CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend } from 'chart.js';
import { User } from '../../core/interfaces/user';
import { Course } from '../../core/interfaces/course';
import { UserService } from '../../core/services/user.service.service';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { NotificationService } from '../../core/services/notification.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { UserCardComponent } from '../../shared/cards/user-card/user-card.component';
import { RequestService } from '../../core/services/request.service';

Chart.register(BarController, DoughnutController, CategoryScale, LinearScale, ArcElement, BarElement, Tooltip, Legend);

@Component({
  selector: 'app-admin-config',
  standalone: true,
  templateUrl: './admin-config.component.html',
  styleUrls: ['./admin-config.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UserCardComponent,
  ],
})
export class AdminConfigComponent implements OnInit, OnDestroy {
  private _userService: UserService = inject(UserService);
  private _authService: AuthService = inject(AuthService);
  private _courseService: CourseService = inject(CourseService);
  private _enrollmentService: EnrollmentService = inject(EnrollmentService);
  private _router: Router = inject(Router);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _requestService: RequestService = inject(RequestService);
  private _notificationService: NotificationService = inject(NotificationService);

  users: User[] = [];
  allCourses: Course[] = [];
  pendingRequests: any[] = [];
  currentUserId: number | null = null;
  isLoading: boolean = true;
  filterName: string = '';
  filterCourse: string = '';
  activeTab: 'dashboard' | 'users' | 'courses' | 'requests' = 'dashboard';

  reviewForm: FormGroup = new FormGroup({ message: new FormControl('') });
  selectedRequestId: number | null = null;
  selectedCourse: Course | null = null;

  totalUsers = 0;
  totalCourses = 0;
  totalEnrollments = 0;
  totalSuppliers = 0;
  totalStudents = 0;
  totalAdmins = 0;

  popularCourses: Course[] = [];
  coursesByArea: { area: string; count: number }[] = [];

  private areaChart: Chart | null = null;
  private roleChart: Chart | null = null;
  private popularChart: Chart | null = null;

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
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    if (this.areaChart) { this.areaChart.destroy(); this.areaChart = null; }
    if (this.roleChart) { this.roleChart.destroy(); this.roleChart = null; }
    if (this.popularChart) { this.popularChart.destroy(); this.popularChart = null; }
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadUsers();
    this.loadCourses();
    this.loadPendingRequests();
  }

  loadUsers(): void {
    this._userService.allUsers().subscribe({
      next: (users) => {
        this.users = users.filter((user) => user.id !== this.currentUserId);
        this.totalUsers = users.length;
        this.totalSuppliers = users.filter(u => u.role === 'COURSE_SUPPLIER').length;
        this.totalStudents = users.filter(u => u.role === 'USER').length;
        this.totalAdmins = users.filter(u => u.role === 'ADMINISTRADOR' || u.role === 'ADMIN').length;
        this.isLoading = false;
        this._cdr.detectChanges();
        if (this.activeTab === 'dashboard') {
          setTimeout(() => this.initCharts(), 100);
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
      },
    });
  }

  loadCourses(): void {
    this._courseService.getCourses('', null, null, 1, 9999).subscribe({
      next: (courses: any) => {
        const list = Array.isArray(courses) ? courses : (courses.data || courses.courses || []);
        this.allCourses = list;
        this.totalCourses = list.length;

        const areaMap = new Map<string, number>();
        list.forEach((c: Course) => {
          const area = c.area || 'Otra';
          areaMap.set(area, (areaMap.get(area) || 0) + 1);
        });
        this.coursesByArea = Array.from(areaMap.entries()).map(([area, count]) => ({ area, count }));

        this.popularCourses = list
          .map((c: Course) => {
            const ratings = c.comments?.map((com: any) => com.rating) || [];
            const avgRating = ratings.length > 0
              ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length
              : 0;
            return { ...c, averageRating: avgRating };
          })
          .sort((a: any, b: any) => (b.comments?.length || 0) - (a.comments?.length || 0))
          .slice(0, 8);

        this.totalEnrollments = list.reduce((sum: number, c: Course) => sum + (c.comments?.length || 0), 0);

        this._cdr.detectChanges();
        if (this.activeTab === 'dashboard') {
          setTimeout(() => this.initCharts(), 100);
        }
      },
      error: (error) => {
        console.error('Error al cargar cursos:', error);
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

  initCharts(): void {
    this.destroyCharts();
    this.initAreaChart();
    this.initRoleChart();
    this.initPopularChart();
  }

  private initAreaChart(): void {
    const canvas = document.getElementById('areaChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#EF4444',
      '#F59E0B', '#10B981', '#06B6D4', '#6366F1'
    ];

    this.areaChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.coursesByArea.map(a => a.area),
        datasets: [{
          label: 'Cursos',
          data: this.coursesByArea.map(a => a.count),
          backgroundColor: this.coursesByArea.map((_, i) => colors[i % colors.length] + '33'),
          borderColor: this.coursesByArea.map((_, i) => colors[i % colors.length]),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#D1D5DB',
            cornerRadius: 8,
            padding: 12,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: '#6B7280' },
            grid: { color: '#F3F4F6' },
          },
          x: {
            ticks: { color: '#6B7280', maxRotation: 45 },
            grid: { display: false },
          }
        }
      }
    });
  }

  private initRoleChart(): void {
    const canvas = document.getElementById('roleChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.roleChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Estudiantes', 'Profesores', 'Administradores'],
        datasets: [{
          data: [this.totalStudents, this.totalSuppliers, this.totalAdmins],
          backgroundColor: ['#10B981', '#4F46E5', '#EF4444'],
          borderWidth: 3,
          borderColor: '#FFFFFF',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#374151',
              font: { size: 12, weight: 500 } as any,
            }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#D1D5DB',
            cornerRadius: 8,
            padding: 12,
            callbacks: {
              label: (ctx) => {
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const value = ctx.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return ` ${ctx.label}: ${value} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  private initPopularChart(): void {
    const canvas = document.getElementById('popularChart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const top = this.popularCourses.slice(0, 6);
    const maxComments = Math.max(...top.map(c => c.comments?.length || 0), 1);

    this.popularChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map(c => c.title.length > 20 ? c.title.slice(0, 20) + '...' : c.title),
        datasets: [
          {
            label: 'Comentarios',
            data: top.map(c => c.comments?.length || 0),
            backgroundColor: '#4F46E533',
            borderColor: '#4F46E5',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
            order: 1,
          },
          {
            label: 'Rating',
            data: top.map(c => ((c as any).averageRating || 0) / 5 * maxComments),
            backgroundColor: '#F59E0B33',
            borderColor: '#F59E0B',
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
            yAxisID: 'y1',
            order: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 16,
              color: '#374151',
              font: { size: 12, weight: 500 } as any,
            }
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#D1D5DB',
            cornerRadius: 8,
            padding: 12,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            ticks: { stepSize: 1, color: '#6B7280' },
            grid: { color: '#F3F4F6' },
            title: {
              display: true,
              text: 'Comentarios',
              color: '#6B7280',
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            min: 0,
            max: 5,
            ticks: { color: '#6B7280', callback: (v) => `${v} ★` },
            grid: { display: false },
            title: {
              display: true,
              text: 'Rating',
              color: '#6B7280',
            }
          },
          x: {
            ticks: { color: '#6B7280', maxRotation: 20 },
            grid: { display: false },
          }
        }
      }
    });
  }

  onTabChange(tab: 'dashboard' | 'users' | 'courses' | 'requests'): void {
    this.activeTab = tab;
    this._cdr.detectChanges();
    if (tab === 'dashboard') {
      setTimeout(() => this.initCharts(), 100);
    } else {
      this.destroyCharts();
    }
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
        console.error('Error al actualizar verificaci�n:', err);
      },
    });
  }

  navigateToHome(): void {
    this._router.navigate(['/home']);
  }

  logout(): void {
    this._authService.logout();
  }

  openDeleteCourseModal(course: Course): void {
    this.selectedCourse = course;
  }

  deleteCourse(): void {
    if (!this.selectedCourse) return;
    this._courseService.deleteCourse(this.selectedCourse.id).subscribe({
      next: () => {
        this.allCourses = this.allCourses.filter(c => c.id !== this.selectedCourse!.id);
        this.loadCourses();
        this.selectedCourse = null;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar curso:', err);
      },
    });
  }

  navigateToCourseDetail(courseId: number): void {
    this._router.navigate(['/courseDetails', courseId]);
  }

  get filteredCourses(): Course[] {
    if (!this.filterCourse) return this.allCourses;
    return this.allCourses.filter(
      (course) =>
        course.title?.toLowerCase().includes(this.filterCourse.toLowerCase()) ||
        course.area?.toLowerCase().includes(this.filterCourse.toLowerCase())
    );
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
