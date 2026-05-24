import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import md5 from "md5";

import { AuthService } from "../../../core/services/auth.service";
import { UserService } from "../../../core/services/user.service.service";

@Component({
  selector: "app-sign-up",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent {
  private _authService = inject(AuthService);
  private _userService = inject(UserService);
  private _router = inject(Router);

  errorMessage: string = "";
  loading: boolean = false;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  /**
   * FORM
   */
  signUpForm = new FormGroup({
    firstName: new FormControl("", [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    lastName: new FormControl("", [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
    ]),
    email: new FormControl("", [Validators.required, Validators.email]),
    birthday: new FormControl("", [
      Validators.required,
      (control) => {
        const selectedDate = new Date(control.value);
        const limitDate = new Date("2014-01-01");
        return selectedDate > limitDate ? { invalidAge: true } : null;
      },
    ]),
    phone: new FormControl(""),
    entity_type: new FormControl("privado"),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(6),

      Validators.pattern(/^(?=.*[A-Z])(?=.*[0-9])/),
    ]),
  });

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

  removeImage(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async submit(): Promise<void> {
    if (this.signUpForm.invalid) {
      this.errorMessage =
        "Por favor, completa los campos correctamente siguiendo las reglas indicadas.";
      this.signUpForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    const images: string[] = [];
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

    const rawValues = this.signUpForm.value;
    const encryptedPassword = md5(rawValues.password ?? "").toString();

    const signUpData = {
      firstName: rawValues.firstName,
      lastName: rawValues.lastName,
      email: rawValues.email,
      birthday: rawValues.birthday,
      phone: rawValues.phone || undefined,
      entity_type: rawValues.entity_type,
      password: encryptedPassword,
      images,
    };

    this._userService.signUp(signUpData).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response.token && response.user) {
          this._authService.saveAuthData(
            response.token,
            response.user.email,
            response.user.id,
            response.user.role,
            response.user.firstName,
          );
          this._router.navigate(["/login"]);
        } else {
          this._router.navigate(["/login"]);
        }
      },
      error: (error: any) => {
        this.loading = false;
        console.error("Error en registro:", error);

        if (error.error?.errors && Array.isArray(error.error.errors)) {
          this.errorMessage = error.error.errors[0].msg;
        } else {
          this.errorMessage =
            error.error?.message || "Error al conectar con el servidor.";
        }
      },
    });
  }

  goToLogin(): void {
    this._router.navigate(["/login"]);
  }
}
