import { DatePipe } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';

import type { EpicModel, EpicPatch, EpicUser } from '../../../features/projects/models/epic.model';

import { EpicsService } from '../../../features/projects/services/epics.service';
import { MembersService } from '../../../features/projects/services/members.service';
import { MemberModel } from '../../../features/projects/models/member.model';

@Component({
  selector: 'app-epic-details-modal',
  imports: [DatePipe],
  templateUrl: './epic-details-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  host: {
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class EpicDetailsModal {
  private readonly epicsService = inject(EpicsService);
  private readonly membersService = inject(MembersService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly projectId = input.required<string>();
  readonly epicId = input.required<string>();

  readonly closed = output<void>();

  /**
   * Emits the updated epic after every successful save.
   * The parent list can use this to update its card.
   */
  readonly updated = output<EpicModel>();

  protected readonly linkCopied = signal(false);
  protected readonly titleError = signal(false);
  protected readonly assigneeOpen = signal(false);

  /**
   * Loads the epic details.
   */
  protected readonly epic = rxResource({
    params: () => ({
      projectId: this.projectId(),
      epicId: this.epicId(),
    }),

    stream: ({ params }) => this.epicsService.getEpicById(params.projectId, params.epicId),
  });

  /**
   * Local working copy.
   *
   * It initially follows the fetched epic and then becomes
   * the optimistic local state while editing.
   */
  protected readonly current = linkedSignal<EpicModel | null>(() => this.epic.value() ?? null);

  /**
   * Members are loaded lazily.
   *
   * No request is made until the assignee dropdown is opened.
   */
  protected readonly members = resource({
    params: () => ({
      projectId: this.projectId(),
    }),

    loader: async ({ params }) => {
      return this.membersService.getProjectMembers(params.projectId);
    },
  });

  constructor() {
    // Prevent the page behind the modal from scrolling.
    document.body.classList.add('overflow-hidden');

    // Focus the dialog after it has been rendered.
    afterNextRender(() => {
      this.dialog().nativeElement.focus();
    });

    this.destroyRef.onDestroy(() => {
      document.body.classList.remove('overflow-hidden');

      // Restore focus to the element that opened the modal.
      this.previouslyFocused?.focus();
    });
  }

  // ============================================================
  // MODAL KEYBOARD HANDLING
  // ============================================================

  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') {
      return;
    }

    /**
     * If the assignee dropdown is open, Escape should close
     * the dropdown first instead of closing the whole modal.
     */
    if (this.assigneeOpen()) {
      this.assigneeOpen.set(false);
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    this.trapTab(event);
  }

  private trapTab(event: KeyboardEvent): void {
    const dialogElement = this.dialog().nativeElement;

    const focusable = Array.from(
      dialogElement.querySelectorAll<HTMLElement>(
        [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(','),
      ),
    ).filter((element) => {
      return !element.hasAttribute('hidden');
    });

    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === dialogElement)) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ============================================================
  // ASSIGNEE
  // ============================================================

  protected toggleAssignee(): void {
    this.assigneeOpen.update((open) => !open);
  }

  protected onAssigneeFocusOut(event: FocusEvent, box: HTMLElement): void {
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (!box.contains(nextFocusedElement)) {
      this.assigneeOpen.set(false);
    }
  }

  protected async selectAssignee(member: MemberModel | null): Promise<void> {
    this.assigneeOpen.set(false);

    const epic = this.current();

    if (!epic) {
      return;
    }

    const assignee = member ? toEpicUser(member) : null;

    if ((epic.assignee?.sub ?? null) === (assignee?.sub ?? null)) {
      return;
    }

    await this.save({ assignee_id: assignee?.sub ?? null }, { assignee });
  }

  openDatePicker(input: HTMLInputElement): void {
    input.showPicker();
  }
  // ============================================================
  // EDITING
  // ============================================================

  /**
   * Optimistically applies a patch, saves it through the API,
   * and rolls back only the changed properties if saving fails.
   */
  private async save(patch: EpicPatch, optimistic: Partial<EpicModel>): Promise<boolean> {
    const before = this.current();

    if (!before) {
      return false;
    }

    const rollback = Object.fromEntries(
      Object.keys(optimistic).map((key) => [key, before[key as keyof EpicModel]]),
    ) as Partial<EpicModel>;

    // Optimistic UI update.
    this.current.set({
      ...before,
      ...optimistic,
    });

    try {
      await firstValueFrom(this.epicsService.updateEpic(before.id, patch));

      const after = this.current();

      if (after) {
        this.updated.emit(after);
      }

      return true;
    } catch {
      // Roll back only the properties modified by this save.
      this.current.update((current) =>
        current
          ? {
              ...current,
              ...rollback,
            }
          : current,
      );

      return false;
    }
  }

  protected async saveTitle(input: HTMLInputElement, epic: EpicModel): Promise<void> {
    const title = input.value.trim();

    if (!title) {
      input.value = epic.title;
      this.titleError.set(true);
      return;
    }

    this.titleError.set(false);
    input.value = title;

    if (title === epic.title) {
      return;
    }

    const ok = await this.save({ title }, { title });

    if (!ok) {
      input.value = epic.title;
    }
  }

  protected async saveDescription(area: HTMLTextAreaElement, epic: EpicModel): Promise<void> {
    const description = area.value.trim() || null;

    area.value = description ?? '';

    const currentDescription = epic.description?.trim() || null;

    if (description === currentDescription) {
      return;
    }

    const ok = await this.save({ description }, { description });

    if (!ok) {
      area.value = epic.description ?? '';
    }
  }

  protected async saveDeadline(input: HTMLInputElement, epic: EpicModel): Promise<void> {
    const deadline = input.value || null;

    const currentDeadline = epic.deadline?.slice(0, 10) ?? null;

    if (deadline === currentDeadline) {
      return;
    }

    const ok = await this.save({ deadline }, { deadline });

    if (!ok) {
      input.value = currentDeadline ?? '';
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  protected initials(user: EpicUser | null): string {
    const words = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);

    if (!words.length) {
      return '?';
    }

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
    if (!user) {
      return null;
    }

    return [user.email, user.department].filter(Boolean).join(' · ') || null;
  }

  protected async copyLink(): Promise<void> {
    await navigator.clipboard.writeText(window.location.href);

    this.linkCopied.set(true);

    setTimeout(() => {
      this.linkCopied.set(false);
    }, 2000);
  }
}

// ============================================================
// MAPPER
// ============================================================

function toEpicUser(member: MemberModel): EpicUser {
  return {
    sub: member.user_id,
    name: member.metadata.name || member.email,
    email: member.email,
    department: member.metadata.job_title,
  };
}
