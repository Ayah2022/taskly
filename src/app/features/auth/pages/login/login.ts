import { Component, inject, signal } from '@angular/core';
import { email, FormField, FormRoot, form, required, minLength } from '@angular/forms/signals';
import { RouterLink, Router } from '@angular/router';

import { LoginService } from '../../services/login.service';
import type { LoginModel } from '../../models/login.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './login.html',
})
export class Login {
  private readonly loginService = inject(LoginService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly loginSuccess = signal(false);

  readonly loginModel = signal<LoginModel>({
    email: '',
    password: '',
    rememberMe: false,
  });

  readonly loginForm = form(
    this.loginModel,
    (schemaPath) => {
      required(schemaPath.email, {
        message: 'Email address is required.',
      });

      email(schemaPath.email, {
        message: 'Enter a valid email address.',
      });

      required(schemaPath.password, {
        message: 'Password is required.',
      });

      minLength(schemaPath.password, 8, {
        message: 'Password must be at least 8 characters.',
      });
    },
    {
      submission: {
        action: async (field) => {
          this.loginError.set(null);
          this.loginSuccess.set(false);

          try {
            const result = await this.loginService.login(field().value());

            if (!result.ok) {
              this.loginError.set(result.message ?? 'Unable to log in. Please try again.');

              return;
            }

            this.loginSuccess.set(true);
            this.router.navigate(['/projects']);
          } catch {
            this.loginError.set('Something went wrong. Please try again.');
          }
        },
      },
    },
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }
}
