import { Component, inject, signal } from '@angular/core';
import {
  email,
  FormField,
  FormRoot,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';

import { SignupService } from '../../services/signup.service';
import type { SignupModel } from '../../models/signup.model';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.html',
  styleUrl: './signup.css',
  imports: [FormField, FormRoot, RouterLink],
})
export class Signup {
  private readonly signupService = inject(SignupService);
  private readonly router = inject(Router);
  readonly showPassword = signal(false);
  // readonly showConfirmPassword = signal(false);

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
      /*  NAME */

      required(schemaPath.name, {
        message: 'Full name is required.',
      });

      minLength(schemaPath.name, 3, {
        message: 'Full name must be at least 3 characters.',
      });

      maxLength(schemaPath.name, 50, {
        message: 'Full name must not exceed 50 characters.',
      });

      validate(schemaPath.name, ({ value }) => {
        const name = value();

        if (!name) {
          return null;
        }

        const namePattern = /^\p{L}+(?: \p{L}+)*$/u;

        if (!namePattern.test(name)) {
          return {
            kind: 'invalidName',
            message: 'Full name can contain letters and single spaces only.',
          };
        }

        return null;
      });

      /* EMAIL */

      required(schemaPath.email, {
        message: 'Email address is required.',
      });

      email(schemaPath.email, {
        message: 'Enter a valid email address.',
      });

      /* PASSWORD */

      required(schemaPath.password, {
        message: 'Password is required.',
      });

      minLength(schemaPath.password, 8, {
        message: 'Password must be at least 8 characters.',
      });

      maxLength(schemaPath.password, 64, {
        message: 'Password must not exceed 64 characters.',
      });

      validate(schemaPath.password, ({ value }) => {
        const password = value();

        if (!password) {
          return null;
        }

        const errors = [];

        if (/\s/.test(password)) {
          errors.push({
            kind: 'whitespace',
            message: 'Password cannot contain spaces.',
          });
        }

        if (!/[a-z]/.test(password)) {
          errors.push({
            kind: 'lowercase',
            message: 'Password must contain a lowercase letter.',
          });
        }

        if (!/[A-Z]/.test(password)) {
          errors.push({
            kind: 'uppercase',
            message: 'Password must contain an uppercase letter.',
          });
        }

        if (!/\d/.test(password)) {
          errors.push({
            kind: 'number',
            message: 'Password must contain a number.',
          });
        }

        if (!/[!@#$%^&*]/.test(password)) {
          errors.push({
            kind: 'special',
            message: 'Password must contain a special character (!@#$%^&*).',
          });
        }

        return errors.length > 0 ? errors : null;
      });

      /* CONFIRM PASSWORD */

      required(schemaPath.confirmPassword, {
        message: 'Please confirm your password.',
      });

      validate(schemaPath.confirmPassword, ({ value, valueOf }) => {
        const password = valueOf(schemaPath.password);
        const confirmPassword = value();

        if (!confirmPassword) {
          return null;
        }

        if (confirmPassword !== password) {
          return {
            kind: 'passwordMismatch',
            message: 'Passwords do not match.',
          };
        }

        return null;
      });
    },

    /* SUBMISSION */

    {
      submission: {
        action: async (field) => {
          this.signupError.set(null);
          this.signupSuccess.set(false);

          const result = await this.signupService.signup(field().value());

          if (!result.ok) {
            this.signupError.set(result.message ?? 'Unable to create your account.');

            return {
              kind: 'serverError',
              message: result.message ?? 'Unable to create your account.',
            };
          }

          this.signupSuccess.set(true);

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
          return null;
        },
      },
    },
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  // toggleConfirmPasswordVisibility(): void {
  //   this.showConfirmPassword.update((value) => !value);
  // }
}
