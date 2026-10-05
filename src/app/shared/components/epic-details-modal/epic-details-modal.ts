import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import type { EpicUser } from '../../../features/projects/models/epic.model';
import { EpicsService } from '../../../features/projects/services/epics.service';

@Component({
  selector: 'app-epic-details-modal',
  imports: [DatePipe],
  templateUrl: './epic-details-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class EpicDetailsModal {
  private readonly epicsService = inject(EpicsService);
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly projectId = input.required<string>();
  readonly epicId = input.required<string>();
  readonly closed = output<void>();

  protected readonly linkCopied = signal(false);

  protected readonly epic = rxResource({
    params: () => ({ projectId: this.projectId(), epicId: this.epicId() }),
    stream: ({ params }) => this.epicsService.getEpicById(params.projectId, params.epicId),
  });

  constructor() {
    // lock background scroll while the modal is open
    document.body.classList.add('overflow-hidden');
    afterNextRender(() => this.dialog().nativeElement.focus());

    inject(DestroyRef).onDestroy(() => {
      document.body.classList.remove('overflow-hidden');
      this.previouslyFocused?.focus();
    });
  }

  protected initials(user: EpicUser | null): string {

    const name = (user?.name ?? '');
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  }

  protected userTooltip(user: EpicUser | null): string | null {
    if (!user) return null;
    return [user.email, user.department].filter(Boolean).join(' · ') || null;
  }

  protected async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    this.trapTab(event);
  }

  private trapTab(event: KeyboardEvent): void {
    const focusable = this.dialog().nativeElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === this.dialog().nativeElement)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}