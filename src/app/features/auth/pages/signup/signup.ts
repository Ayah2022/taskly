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
import { passwordStrengthValidators } from '../../../../shared/validators/password.validators';

import { SignupService } from '../../services/signup.service';
import type { SignupModel } from '../../models/signup';
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
    /* NAME */
    required(schemaPath.name);
    minLength(schemaPath.name, 3);
    maxLength(schemaPath.name, 50);

    validate(schemaPath.name, ({ value }) => {
      const name = value();

      if (!name) {
        return null;
      }

      const namePattern = /^\p{L}+(?: \p{L}+)*$/u;

      return namePattern.test(name) ? null : { kind: 'invalidName' };
    });

    /* EMAIL */
    required(schemaPath.email);
    email(schemaPath.email);

    /* PASSWORD */
    required(schemaPath.password);
    passwordStrengthValidators(schemaPath.password);

    /* CONFIRM PASSWORD */
    required(schemaPath.confirmPassword);

    validate(schemaPath.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(schemaPath.password) ? null : { kind: 'passwordMismatch' },
    );
  },

  /* SUBMISSION  */
  {
    submission: {
      action: async (field) => {
        this.signupError.set(null);
        this.signupSuccess.set(false);

        const result = await this.signupService.signup(field().value());

        if (!result.ok) {
          this.signupError.set(result.message ?? 'Unable to create your account.');

          return { kind: 'serverError' };
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
