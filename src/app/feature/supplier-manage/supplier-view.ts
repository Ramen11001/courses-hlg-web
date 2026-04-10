import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { User } from "src/app/core/interfaces/user";
import { UserService } from "src/app/core/services/user.service.service";

@Component({
    selector: 'app-course-details',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './supplier-view.html',
})
export class SupplierView {

    private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
    private _userService: UserService = inject(UserService);

    user: User | null = null;
    isLoading = true;
    error: string | null = null;
    isSupplier: boolean = false;

    /**
        * Loads users by ID.
        *
        * @param {number} id - user ID to load
        */
    loadCurrentUserInfo(id: number): void {
        this.isLoading = true;

        this._userService.getUserById(id).subscribe({
            next: (user) => {
                this.user = user;
            },
            error: (err) => {
                this.error = 'Error al cargar el usuario';
                this.isLoading = false;
                console.error(err);
            },
        });
    }

    //Chek if the user is a course supplier 
    roleCheck() {
        const role = this._userService.getCurrentUserRole();
        if (role === "COURSE_SUPPLIER") {
            this.isSupplier === true
            this._cdr.detectChanges();
        }
    }

}