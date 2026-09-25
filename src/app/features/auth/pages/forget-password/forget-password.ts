import { Component, OnDestroy, signal, inject, computed } from '@angular/core';
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

  // Countdown
  readonly resendCountdown = signal(0);
  readonly resendDisabled = signal(false);
  private readonly countdownSeconds = 300; 

  // Resend attempts
  readonly resendAttempts = signal(0);
  private readonly maxResendAttempts = 3;

  // True once the user has used up all resend attempts — button stays
  // disabled permanently after this, with no countdown shown.
  readonly maxAttemptsReached = computed(
    () => this.resendAttempts() >= this.maxResendAttempts,
  );

  private countdownTimer: ReturnType<typeof setInterval> | null = null;

  readonly forgotPasswordForm = form(
    this.forgotPasswordModel,
    (schema) => {
      required(schema.email);
      email(schema.email);
    },
    {
      submission: {
        // Initial submit — does NOT count as a resend attempt.
        action: async (field) => {
          await this.requestResetLink(field().value().email, {
            countAsAttempt: false,
          });
        },
      },
    },
  );

  resendResetLink(): void {
    // Blocked while a countdown is running, or attempts are exhausted.
    if (this.resendDisabled() || this.maxAttemptsReached()) {
      return;
    }

    // Lock the button immediately (not after the await resolves) so a
    // fast double-click can't fire two requests before this updates.
    this.resendDisabled.set(true);

    void this.requestResetLink(this.forgotPasswordModel().email, {
      countAsAttempt: true,
    });
  }

  // Single place that actually calls the API — used by both the initial
  // submit and every resend, so success/error handling only lives once.
  private async requestResetLink(
    email: string,
    opts: { countAsAttempt: boolean },
  ): Promise<void> {
    this.forgotPasswordError.set(null);

    try {
      await this.forgotPasswordService.sendResetLink(email);

      this.forgotPasswordSuccess.set(true);

      if (opts.countAsAttempt) {
        this.resendAttempts.update((attempts) => attempts + 1);
      }

      // Only start a new countdown if there's still an attempt left to use.
      if (!this.maxAttemptsReached()) {
        this.startResendCountdown();
      }
    } catch (error) {
      console.error('Failed to send password reset link:', error);
      this.forgotPasswordError.set('Something went wrong. Please try again.');

      // Failed request shouldn't leave the button stuck disabled.
      this.resendDisabled.set(false);
    }
  }

  private startResendCountdown(): void {
    this.clearCountdown();

    this.resendCountdown.set(this.countdownSeconds);
    this.resendDisabled.set(true);

    this.countdownTimer = setInterval(() => {
      const secondsLeft = this.resendCountdown();

      if (secondsLeft <= 1) {
        this.clearCountdown();
        this.resendCountdown.set(0);
        // Re-enable the button unless attempts are used up.
        this.resendDisabled.set(this.maxAttemptsReached());
        return;
      }

      this.resendCountdown.set(secondsLeft - 1);
    }, 1000);
  }

  // Derived display value — recalculates automatically from resendCountdown.
  readonly resendCountdownFormatted = computed(() => {
    const totalSeconds = this.resendCountdown();
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  });

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