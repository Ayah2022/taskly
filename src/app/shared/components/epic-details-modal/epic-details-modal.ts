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

import type { EpicModel, EpicPatch, EpicUser } from '../../../features/projects/models/epic.model';
import { EpicsService } from '../../../features/projects/services/epics.service';
import { MembersService } from '../../../features/projects/services/members.service';
import { MemberModel } from '../../../features/projects/models/member.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-epic-details-modal',
  imports: [DatePipe],
  templateUrl: './epic-details-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closed.emit()' },
})
export class EpicDetailsModal {
  private readonly epicsService = inject(EpicsService);
  private readonly membersService = inject(MembersService);

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly previouslyFocused = document.activeElement as HTMLElement | null;

  readonly projectId = input.required<string>();
  readonly epicId = input.required<string>();
  readonly closed = output<void>();

  /** Emits the epic after every successful save so the list can sync its cards. */
  readonly updated = output<EpicModel>();
  private readonly membersRequested = signal(false);

  protected readonly linkCopied = signal(false);
  protected readonly titleError = signal(false);
  protected readonly assigneeOpen = signal(false);
  protected readonly epic = rxResource({
    params: () => ({ projectId: this.projectId(), epicId: this.epicId() }),
    stream: ({ params }) => this.epicsService.getEpicById(params.projectId, params.epicId),
  });

  /** Local working copy: follows the fetched epic, and is updated optimistically on edits. */
  protected readonly current = linkedSignal<EpicModel | null>(() => this.epic.value() ?? null);


  /** Fetched lazily: only when the assignee dropdown is opened (params undefined => idle). */

  protected readonly members = resource({
    params: () => (this.membersRequested() ? { projectId: this.projectId() } : undefined),
    loader: async ({ params }) => {
      const members = await this.membersService.getProjectMembers(params.projectId);
      return members.filter((m) => m.role !== 'viewer').map(toEpicUser);
    },
  });

  protected toggleAssignee(): void {
    this.membersRequested.set(true); // starts the fetch on first open, a no-op afterwards
    this.assigneeOpen.update((open) => !open);
  }

  constructor() {
    // lock background scroll while the modal is open
    document.body.classList.add('overflow-hidden');
    afterNextRender(() => this.dialog().nativeElement.focus());

    inject(DestroyRef).onDestroy(() => {
      document.body.classList.remove('overflow-hidden');
      this.previouslyFocused?.focus();
    });
  }

  /**
   * Optimistically applies `optimistic` to the UI, sends `patch`, and on failure
   * restores only the keys that were changed (so concurrent edits don't clobber each other).
   */
  private async save(patch: EpicPatch, optimistic: Partial<EpicModel>): Promise<boolean> {
    const before = this.current();
    if (!before) return false;

    const rollback = Object.fromEntries(
      Object.keys(optimistic).map((key) => [key, before[key as keyof EpicModel]]),
    ) as Partial<EpicModel>;

    this.current.set({ ...before, ...optimistic });

    try {
      await firstValueFrom(this.epicsService.updateEpic(before.id, patch));
      const after = this.current();
      if (after) this.updated.emit(after);
      return true;
    } catch {
      this.current.update((c) => (c ? { ...c, ...rollback } : c));
      // this.toast.error('Failed to update epic. Please try again');
      return false;
    }
  }

  protected async saveTitle(input: HTMLInputElement, epic: EpicModel): Promise<void> {
    const title = input.value.trim();

    if (!title) {
      input.value = epic.title; // required: restore and flag it
      this.titleError.set(true);
      return;
    }
    input.value = title;
    if (title === epic.title) return;

    const ok = await this.save({ title }, { title });
    if (!ok) input.value = epic.title;
  }

  protected async saveDescription(area: HTMLTextAreaElement, epic: EpicModel): Promise<void> {
    const description = area.value.trim() || null;
    area.value = description ?? '';
    if (description === (epic.description?.trim() || null)) return;

    const ok = await this.save({ description }, { description });
    if (!ok) area.value = epic.description ?? '';
  }

  protected async saveDeadline(input: HTMLInputElement, epic: EpicModel): Promise<void> {
    const deadline = input.value || null; // '' (cleared) => null
    if (deadline === (epic.deadline?.slice(0, 10) ?? null)) return;

    const ok = await this.save({ deadline }, { deadline });
    if (!ok) input.value = epic.deadline?.slice(0, 10) ?? '';
  }

  protected async selectAssignee(member: EpicUser | null): Promise<void> {
    this.assigneeOpen.set(false);
    const epic = this.current();
    if (!epic || (epic.assignee?.sub ?? null) === (member?.sub ?? null)) return;

    await this.save({ assignee_id: member?.sub ?? null }, { assignee: member });
  }

  // ---------- Assignee dropdown ----------

  protected onAssigneeFocusOut(event: FocusEvent, box: HTMLElement): void {
    if (!box.contains(event.relatedTarget as Node | null)) this.assigneeOpen.set(false);
  }

  
  protected initials(user: EpicUser | null): string {
    const words = (user?.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return words.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
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

// bottom of the file, outside the class
function toEpicUser(member: MemberModel): EpicUser {
  return {
    sub: member.user_id,
    name: member.metadata.name || member.email,
    email: member.email,
    department: member.metadata.job_title,
  };
}