import { ChangeDetectorRef, Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule, ActivatedRoute } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { AuthService } from "../../core/services/auth.service";
import { UserService } from "../../core/services/user.service.service";
import { CourseService } from "../../core/services/course.service";
import { Course } from "../../core/interfaces/course";
import { User } from "../../core/interfaces/user";
import { CommentsService } from "../../core/services/comment.service";
import { Comment } from "../../core/interfaces/comment";
import { CourseCardComponent } from "../../shared/cards/course-card/course-card.component";
import { ImageCarouselComponent } from "../../shared/components/image-carousel/image-carousel.component";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CourseCardComponent,
    ImageCarouselComponent,
  ],
  templateUrl: "./profile.component.html",
})
export class ProfileComponent implements OnInit {
  private _authService = inject(AuthService);
  private _userService = inject(UserService);
  private _commentService = inject(CommentsService);
  private _courseService = inject(CourseService);
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _fb = inject(FormBuilder);
  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  user: User | null = null;
  users: User[] = [];
  course: Course[] = [];
  userCourses: Course[] = [];
  userComments: Comment[] = [];
  isLoading = true;
  isEditing = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  currentUserId: number | null = null;
  profileUserId: number | null = null;
  selectedCourse: Course | null = null;
  selectedUser: User | null = null;
  profileForm: FormGroup;
  comments: Comment | null = null;
  delete: boolean = false;
  title: any = "";
  cantCreate: boolean = false;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImages: string[] = [];
  removedExisting: boolean[] = [];

  constructor() {
    this.profileForm = this._fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2)]],
      lastName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.pattern(/^[0-9+\-\s]+$/)]],
      bio: ["", [Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.currentUserId = this._userService.getCurrentUserId();
    const userID = this._route.snapshot.paramMap.get("id");
    if (userID) {
      this.profileUserId = parseInt(userID);
      this.rolePermisson();
      this.loadUserProfile(this.profileUserId);
      this.loadUserCourses(this.profileUserId);
      (this, this.loadUserComments(this.profileUserId));
    } else {
      this.errorMessage = "Usuario no encontrado";
      this.isLoading = false;
    }
  }

  //region LOAD INFORMATION:

  loadUserProfile(userId: number): void {
    this.isLoading = true;
    this._userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || "",
          bio: user.biography || "",
        });

        const imgs = (user as any).images;
        if (Array.isArray(imgs) && imgs.length > 0) {
          this.existingImages = imgs;
          this.removedExisting = imgs.map(() => false);
        } else if (typeof imgs === "string") {
          try {
            const parsed = JSON.parse(imgs);
            if (Array.isArray(parsed)) {
              this.existingImages = parsed;
              this.removedExisting = parsed.map(() => false);
            }
          } catch {}
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = "Error al cargar el perfil";
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadUserCourses(userId: number): void {
    const user_id = this._userService.getCurrentUserId();
    this._courseService.allCourses().subscribe({
      next: (courses) => {
        courses.map((user_course) => {
          let user_course_id = user_course.user_id;
          if (user_course_id === user_id) {
            this.userCourses.push(user_course);
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar cursos del usuario:", err);
      },
    });
  }

  loadUserComments(userId: number): void {
    const user_id = this._userService.getCurrentUserId()!;
    this._commentService.getCommentsByUser(user_id).subscribe({
      next: (comments) => {
        comments.map((comment) => {
          let comment_current = comment.user_id;
          if (comment_current === user_id) {
            this.userComments.push(comment);
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar cursos del usuario:", err);
      },
    });
  }

  // region EDIT:
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.errorMessage = null;
    this.successMessage = null;
    if (!this.isEditing && this.user) {
      this.profileForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        phone: this.user.phone || "",
        bio: this.user.biography || "",
      });
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid || !this.profileUserId) {
      this.errorMessage = "Por favor, corrige los errores en el formulario";
      return;
    }

    this.isLoading = true;

    const images: string[] = [];

    this.existingImages.forEach((img, i) => {
      if (!this.removedExisting[i]) {
        images.push(img);
      }
    });

    if (this.imageFiles.length > 0) {
      try {
        for (const file of this.imageFiles) {
          const base64 = await this.fileToBase64(file);
          images.push(base64);
        }
      } catch (err) {
        console.error("Error reading images:", err);
      }
    }

    const updatedData: any = {
      firstName: this.profileForm.value.firstName,
      lastName: this.profileForm.value.lastName,
      email: this.profileForm.value.email,
      phone: this.profileForm.value.phone,
      biography: this.profileForm.value.bio,
    };

    if (images.length > 0 || this.existingImages.length > 0) {
      updatedData.images = images;
    }

    this._userService.updatedUser(this.profileUserId, updatedData).subscribe({
      next: (response) => {
        this.user = response;
        this.successMessage = "Perfil actualizado exitosamente";
        this.isEditing = false;
        this.isLoading = false;
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (err) => {
        this.errorMessage = "Error al actualizar el perfil";
        this.isLoading = false;
      },
    });
  }

  // region NAVIGATE
  navigateToCourse(id: number): void {
    this._router.navigate(["/courseDetails/" + id]);
  }

  navigateToHome(): void {
    this._router.navigate(["/home"]);
  }

  navigateToLogout(): void {
    this._authService.logout();
  }

  navigateToEditCourse(id: number): void {
    this._router.navigate(["edit/" + id]);
  }

  navigateToCreateCourse(): void {
    this._router.navigate(["/createCourse"]);
  }

  navigateToProfile(): void {
    const id = this._userService.getCurrentUserId();
    if (id) {
      this._router.navigate(["/user/" + id]);
    } else {
      this._router.navigate(["/home"]);
    }
  }

  //region GET:

  getInitials(): string {
    if (!this.user) return "U";
    const firstName = this.user.firstName || "";
    const lastName = this.user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getFullName(): string {
    if (!this.user) return "Usuario";
    return (
      `${this.user.firstName || ""} ${this.user.lastName || ""}`.trim() ||
      "Usuario"
    );
  }

  getUserImages(): string[] {
    if (!this.user) return [];
    const imgs = (this.user as any).images;
    if (!imgs) return [];
    if (Array.isArray(imgs) && imgs.length > 0) return imgs;
    if (typeof imgs === "string") {
      try {
        const parsed = JSON.parse(imgs);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.imageFiles = [...this.imageFiles, ...newFiles];
      newFiles.forEach((file) => {
        this.imagePreviews.push(URL.createObjectURL(file));
      });
    }
  }

  removeNewImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number): void {
    this.removedExisting[index] = true;
  }

  restoreExistingImage(index: number): void {
    this.removedExisting[index] = false;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  get imageCount(): number {
    const kept = this.existingImages.filter(
      (_, i) => !this.removedExisting[i],
    ).length;
    return kept + this.imageFiles.length;
  }

  //region DELETE
  /**
   * Deletes a courses by ID and updates local course list.
   *
   * @param {number} id - ID of the course to delete
   */
  deleteCourse(id: number): void {
    if (!id) return;
    this.delete = true;
    this._cdr.detectChanges();
    this._courseService.deleteCourse(id).subscribe({
      next: () => {
        this.userCourses = this.userCourses.filter(
          (course_id) => course_id.id !== id,
        );
        this._cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error deleting course:", err);
      },
    });
  }

  openDeleteAccountModal(): void {
    const modalEl = document.getElementById("deleteAccountModal");
    if (modalEl) {
      const modal = new (window as any).bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  confirmDeleteAccount(): void {
    if (!this.user?.id) return;
    this._userService.deleteUser(this.user.id).subscribe({
      next: () => {
        const modalEl = document.getElementById("deleteAccountModal");
        if (modalEl) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }
        document
          .querySelectorAll(".modal-backdrop")
          .forEach((el) => el.remove());
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        this._router.navigate(["/login"]);
      },
      error: (err) => {
        console.error("Error deleting user:", err);
      },
    });
  }

  openDeleteModal(course: Course): void {
    this.selectedCourse = course;
  }

  //region ROLE PERMISSION:
  rolePermisson() {
    const user_id = this._userService.getCurrentUserId()!;
    const user = this._userService.getUserById(user_id);
    user.forEach((is_curse_supplier) => {
      const role = is_curse_supplier.role;
      if (role === "COURSE_SUPPLIER") {
        this.cantCreate = true;
        this._cdr.detectChanges();
      }
    });
  }

  //region TITLE:
  getTitle() {
    if (this.delete) {
      this.title = this.course.map((course) => {
        course.title;
        this._cdr.detectChanges();
      });
    }
    this.title = this.user?.firstName;
    this._cdr.detectChanges();
  }
}
