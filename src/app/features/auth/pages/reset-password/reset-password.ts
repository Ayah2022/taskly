// reset-password.component.ts
import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { form, validate, FormField, FormRoot } from '@angular/forms/signals';

import { ForgotPasswordService } from '../../services/forgot-password.service';
import { passwordStrengthValidators } from '../../../../shared/validators/password.validators';
import type { ResetPasswordModel } from '../../models/password';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, FormField, FormRoot],
  templateUrl: './reset-password.html',
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  // Extracted from the recovery link — never hardcoded.
  readonly accessToken = signal<string | null>(null);
  readonly tokenChecked = signal(false); // avoids flashing "invalid" before we've checked

  readonly hasValidToken = computed(() => this.tokenChecked() && !!this.accessToken());

  readonly resetPasswordModel = signal<ResetPasswordModel>({
    password: '',
    confirmPassword: '',
  });

  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly success = signal(false);
  readonly redirectCountdown = signal(3);

  private redirectTimer: ReturnType<typeof setInterval> | null = null;

  readonly resetPasswordForm = form(this.resetPasswordModel, (schema) => {
    passwordStrengthValidators(schema.password);

    // Cross-field: confirmPassword must equal password.
    validate(schema.confirmPassword, ({ value, valueOf }) =>
      value() === valueOf(schema.password) ? null : { kind: 'mismatch' },
    );
  });

  ngOnInit(): void {
    this.accessToken.set(this.extractAccessToken());
    this.tokenChecked.set(true);
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  async onSubmit(): Promise<void> {
    const token = this.accessToken();

    // Belt-and-braces — the form/button are already disabled without a token.
    if (!token || this.submitting()) {
      return;
    }

    this.serverError.set(null);
    this.submitting.set(true);

    try {
      await this.forgotPasswordService.updatePassword(
        token,
        this.resetPasswordModel().password,
      );

      this.success.set(true);
      this.startRedirectCountdown();
    } catch (error) {
      console.error('Failed to update password:', error);
      // Keep the form on screen — do NOT redirect on failure.
      this.serverError.set('We could not update your password. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  private startRedirectCountdown(): void {
    this.redirectCountdown.set(3);

    this.redirectTimer = setInterval(() => {
      const remaining = this.redirectCountdown();

      if (remaining <= 1) {
        this.clearRedirectTimer();
        this.router.navigateByUrl('/login');
        return;
      }

      this.redirectCountdown.set(remaining - 1);
    }, 1000);
  }

  private clearRedirectTimer(): void {
    if (this.redirectTimer !== null) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  // Supabase recovery links usually deliver the token in the URL hash
  // fragment (#access_token=...&type=recovery), not a query param —
  // check both so this works regardless of how the redirect lands.
  private extractAccessToken(): string | null {
    const fromQuery = this.route.snapshot.queryParamMap.get('access_token');

    if (fromQuery) {
      return fromQuery;
    }

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;

    return new URLSearchParams(hash).get('access_token');
  }
}