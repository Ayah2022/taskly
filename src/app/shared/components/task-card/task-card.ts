import { Component, Input } from '@angular/core';

import { Task, TaskStatus } from '../../../features/projects/models/task.model';
import { DatePipe, NgClass, UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, NgClass],
  templateUrl: './task-card.html',
  styleUrl: './task-card.css',
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() showStatus = true;

  readonly statusConfig: Record<
    TaskStatus,
    {
      label: string;
      badge: string;
      card: string;
      accent: string;
    }
  > = {
    TO_DO: {
      label: 'TO DO',
      badge: 'bg-[#DDE6FF] text-[#0B2145]',
      card: 'border-transparent bg-white',
      accent: 'text-[#8295B5]',
    },
    IN_PROGRESS: {
      label: 'IN PROGRESS',
      badge: 'bg-[#E4EDFF] text-[#0047BB]',
      card: 'border-transparent bg-white',
      accent: 'text-[#0047BB]',
    },
    BLOCKED: {
      label: 'BLOCKED',
      badge: 'bg-[#FFDAD7] text-[#B91C1C]',
      card: 'border-[#F8D6DB] bg-[#FCF3F5]',
      accent: 'text-[#DC2626]',
    },
    IN_REVIEW: {
      label: 'IN REVIEW',
      badge: 'bg-[#DDE6FF] text-[#0B2145]',
      card: 'border-transparent bg-white',
      accent: 'text-[#8295B5]',
    },
    REOPENED: {
      label: 'REOPENED',
      badge: 'bg-[#C71920] text-white',
      card: 'border-transparent bg-white',
      accent: 'text-[#8295B5]',
    },
    READY_FOR_PRODUCTION: {
      label: 'READY FOR PROD',
      badge: 'bg-[#00583B] text-white',
      card: 'border-transparent bg-white',
      accent: 'text-[#8295B5]',
    },
    READY_FOR_QA: {
      label: 'READY FOR QA',
      badge: 'bg-[#0755D9] text-white',
      card: 'border-transparent bg-white',
      accent: 'text-[#8295B5]',
    },
    DONE: {
      label: 'DONE',
      badge: 'bg-[#6DF3B1] text-[#00583B]',
      card: 'border-transparent bg-white',
      accent: 'text-[#00583B]',
    },
  };

  get statusStyle() {
    return this.statusConfig[this.task.status];
  }

  get isDone(): boolean {
    return this.task.status === 'DONE';
  }

  get isBlocked(): boolean {
    return this.task.status === 'BLOCKED';
  }

  get inProgress(): boolean {
    return this.task.status === 'IN_PROGRESS';
  }

  get assigneeInitials(): string {
    const name = this.task.assignee?.name?.trim();

    if (!name) return '';

    const words = name.split(/\s+/).filter(Boolean);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  get dateLabel(): string | null {
    if (!this.task.due_date) return null;

    const dueDate = new Date(this.task.due_date);

    if (Number.isNaN(dueDate.getTime())) return null;

    const today = new Date();

    const isToday =
      dueDate.getFullYear() === today.getFullYear() &&
      dueDate.getMonth() === today.getMonth() &&
      dueDate.getDate() === today.getDate();

    return isToday ? 'TODAY' : null;
  }
}
