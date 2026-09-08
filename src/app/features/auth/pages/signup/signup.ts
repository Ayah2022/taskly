import { Component, inject, signal } from '@angular/core';
import {
  email,
  FormField,
  FormRoot,
  form,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

import { AuthService } from '../../services/auth.service';
import type { SignupModel } from '../../models/signup.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  imports: [FormField, FormRoot],
})
export class Signup {
  private readonly authService = inject(AuthService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly signupError = signal<string | null>(null);
  readonly signupSuccess = signal(false);

  readonly signupModel = signal<SignupModel>({
    name: '',
    email: '',
    jobTitle: '',
    password: '',
    confirmPassword: '',
  });

  readonly signupForm = form(
    this.signupModel,
    (schemaPath) => {
      required(schemaPath.name, {
        message: 'Full name is required.',
      });

      required(schemaPath.email, {
        message: 'Email address is required.',
      });

      email(schemaPath.email, {
        message: 'Enter a valid email address.',
      });

      minLength(schemaPath.password, 8, {
        message: 'Password must be at least 8 characters.',
      });

      required(schemaPath.password, {
        message: 'Password is required.',
      });

      required(schemaPath.confirmPassword, {
        message: 'Please confirm your password.',
      });

      validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
        const password = valueOf(schemaPath.password);
        const confirmPassword = value();

        if (confirmPassword !== password) {
          return {
            kind: 'passwordMismatch',
            message: 'Passwords do not match.',
          };
        }

        return null;
      });

      validate(schemaPath.password, ({ value }) => {
        const password = value();

        if (!/[a-z]/.test(password)) {
          return {
            kind: 'lowercase',
            message: 'Password must contain a lowercase letter.',
          };
        }

        if (!/[A-Z]/.test(password)) {
          return {
            kind: 'uppercase',
            message: 'Password must contain an uppercase letter.',
          };
        }

        if (!/\d/.test(password)) {
          return {
            kind: 'number',
            message: 'Password must contain a number.',
          };
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
          return {
            kind: 'special',
            message: 'Password must contain a special character.',
          };
        }

        return null;
      });
    },
    // {
    //   submission: {
    //     action: async (field) => {
    //       this.signupError.set(null);
    //       this.signupSuccess.set(false);

    //       const result = await this.authService.signup(field().value());

    //       if (!result.ok) {
    //         return {
    //           kind: 'serverError',
    //           message: result.message ?? 'Unable to create your account.',
    //         };
    //       }

    //       this.signupSuccess.set(true);
    //     },
    //   },
    // },
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }
}