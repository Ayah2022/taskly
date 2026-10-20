import {
  Component,
  effect,
  inject,
  Input,
  input,
  output,
  resource,
  signal,
  OnInit,
} from '@angular/core';

import { form, FormField, required } from '@angular/forms/signals';

import { firstValueFrom, isObservable } from 'rxjs';

import { TasksService } from '../../../features/projects/services/tasks.service';
import { EpicsService } from '../../../features/projects/services/epics.service';
import { MembersService } from '../../../features/projects/services/members.service';
import { CreateTaskRequest, Task, TaskStatus } from '../../../features/projects/models/task.model';

interface CreateTaskFormModel {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string;
  epicId: string;
  dueDate: string;
}

@Component({
  selector: 'app-add-task-modal',
  standalone: true,
  imports: [FormField],
  templateUrl: './add-task-modal.html',
  styleUrl: './add-task-modal.css',
})
export class AddTaskModal implements OnInit {
  private readonly tasksService = inject(TasksService);
  private readonly EpicsService = inject(EpicsService);
  private readonly membersService = inject(MembersService);

  readonly projectId = input.required<string>();
  readonly initialEpicId = input<string | null>(null);

  readonly closed = output<void>();
  readonly created = output<Task>();

  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly statuses: {
    value: TaskStatus;
    label: string;
  }[] = [
    { value: 'TO_DO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'BLOCKED', label: 'Blocked' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'READY_FOR_QA', label: 'Ready for QA' },
    { value: 'REOPENED', label: 'Reopened' },
    {
      value: 'READY_FOR_PRODUCTION',
      label: 'Ready for Production',
    },
    { value: 'DONE', label: 'Done' },
  ];

  @Input() initialStatus: TaskStatus = 'TO_DO';
  protected readonly formModel = signal<CreateTaskFormModel>({
    title: '',
    description: '',
    status: 'TO_DO',
    assigneeId: '',
    epicId: '',
    dueDate: '',
  });

  ngOnInit(): void {
    this.formModel.update((form) => ({
      ...form,
      status: this.initialStatus ?? 'TO_DO',
    }));
  }

  protected readonly taskForm = form(this.formModel, (path) => {
    required(path.title, {
      message: 'Title is required.',
    });
  });
  openDatePicker(input: HTMLInputElement): void {
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
    }
  }
  protected readonly epics = resource({
    params: () => ({
      projectId: this.projectId(),
    }),

    loader: async ({ params }) => {
      return firstValueFrom(this.EpicsService.getProjectEpicsForTask(params.projectId));
    },
  });

  protected readonly members = resource({
    params: () => ({
      projectId: this.projectId(),
    }),

    loader: async ({ params }) => {
      return this.membersService.getProjectMembers(params.projectId);
    },
  });

  constructor() {
    // Apply the initial epic after the project's epic options load.
    effect(() => {
      const initialEpicId = this.initialEpicId();
      const availableEpics = this.epics.value();

      console.log('Selected Epic ID:', this.formModel().epicId);

      if (availableEpics === undefined) {
        return;
      }

      const epicExists = availableEpics.some((epic) => epic.id === initialEpicId);

      this.taskForm
        .epicId()
        .value.set(epicExists && initialEpicId ? initialEpicId : this.taskForm.epicId().value());
    });
  }

  protected async submitTask(): Promise<void> {
    if (this.submitting()) {
      return;
    }

    const title = this.taskForm.title().value().trim();

    if (!title) {
      this.submitError.set('Please enter a task title.');
      return;
    }

    if (!this.taskForm().valid()) {
      this.submitError.set('Please correct the form errors.');
      return;
    }

    const values = this.formModel();
    console.log('values', values);
    const payload: CreateTaskRequest = {
      project_id: this.projectId(),
      title,
      status: values.status || 'TO_DO',
    };

    const description = values.description.trim();

    if (description) {
      payload.description = description;
    }

    if (values.epicId) {
      payload.epic_id = values.epicId;
    }

    if (values.assigneeId) {
      payload.assignee_id = values.assigneeId;
    }

    if (values.dueDate) {
      // Interpret the selected date as a local calendar date,
      // then convert it into the ISO timestamp expected by the API.
      const localMidnight = new Date(`${values.dueDate}T00:00:00`);

      if (Number.isNaN(localMidnight.getTime())) {
        this.submitError.set('Please select a valid due date.');
        return;
      }

      payload.due_date = localMidnight.toISOString();
    }

    this.submitting.set(true);
    this.submitError.set(null);

    try {
      const result = this.tasksService.createTask(payload);

      const task = isObservable(result) ? await firstValueFrom(result) : await result;

      this.created.emit(task as Task);
      this.closed.emit();
    } catch (error) {
      console.error('Failed to create task:', error);

      this.submitError.set('Could not create the task. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected closeModal(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }
}
