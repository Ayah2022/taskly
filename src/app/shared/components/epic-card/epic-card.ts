import { Component, input } from '@angular/core';
import { EpicUser } from '../../../features/projects/models/epic.model';

@Component({
  selector: 'app-epic-card',
  templateUrl: './epic-card.html',
})
export class EpicCard {
  readonly epicId = input.required<string>();
  readonly title = input.required<string>();
  readonly assignee = input<EpicUser | null>(null);
  readonly creator = input<EpicUser | null>(null);
  readonly createdAt = input<string | null>(null);
  readonly deadline = input<string | null>(null);

  get assigneeInitials(): string {
    const name = this.assignee()?.name?.trim();

    // if (!name) {
    //   return '?';
    // }
    if (!name) {
      return '';
    }

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

  formatDate(date: string | null): string {
    if (!date) {
      return '—';
    }

    // Avoid timezone shifts for date-only values such as 2025-12-30.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const parsedDate = dateOnly ? new Date(`${date}T00:00:00`) : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(dateOnly ? { timeZone: 'UTC' } : {}),
    }).format(parsedDate);
  }
}
