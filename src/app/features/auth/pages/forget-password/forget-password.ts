import { Component, OnDestroy, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { email, form, FormField, FormRoot, required } from '@angular/forms/signals';

import { ForgotPasswordService } from '../../services/forgot-password.service';

interface ForgotPasswordModel {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  imports: [RouterLink, FormField, FormRoot],
  templateUrl: './forget-password.html',
})
export class ForgotPassword implements OnDestroy {
  readonly forgotPasswordModel = signal<ForgotPasswordModel>({
    email: '',
  });
  private readonly forgotPasswordService = inject(ForgotPasswordService);

  readonly forgotPasswordError = signal<string | null>(null);
  readonly forgotPasswordSuccess = signal(false);

  readonly resendCountdown = signal(5);
  readonly resendDisabled = signal(false);

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  readonly forgotPasswordForm = form(
    this.forgotPasswordModel,
    (schema) => {
      required(schema.email);

      email(schema.email);
    },
    {
      submission: {
        action: async (field) => {
          this.forgotPasswordError.set(null);
          this.forgotPasswordSuccess.set(false);

          try {
            await this.forgotPasswordService.sendResetLink(field().value().email);

            this.forgotPasswordSuccess.set(true);
            this.startResendCountdown();
          } catch (error) {
            console.error('Failed to send password reset link:', error);

            this.forgotPasswordError.set('Something went wrong. Please try again.');
          }
        },
      },
    },
  );

  resendResetLink(): void {
    if (this.resendDisabled()) {
      return;
    }

    this.sendResetLink();
  }

  private async sendResetLink(): Promise<void> {
    this.forgotPasswordError.set(null);

    try {
      await this.forgotPasswordService.sendResetLink(this.forgotPasswordModel().email);

      this.forgotPasswordSuccess.set(true);
      this.startResendCountdown();
    } catch (error) {
      console.error('Failed to resend password reset link:', error);

      this.forgotPasswordError.set('Something went wrong. Please try again.');
    }
  }

  private startResendCountdown(): void {
    this.clearCountdown();

    this.resendCountdown.set(5);
    this.resendDisabled.set(true);

    this.countdownTimer = setInterval(() => {
      const current = this.resendCountdown();

      if (current <= 1) {
        this.clearCountdown();
        this.resendCountdown.set(0);
        this.resendDisabled.set(false);
        return;
      }

      this.resendCountdown.set(current - 1);
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownTimer !== null) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
