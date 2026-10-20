export type TaskStatus =
  | 'TO_DO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'IN_REVIEW'
  | 'READY_FOR_QA'
  | 'REOPENED'
  | 'READY_FOR_PRODUCTION'
  | 'DONE';

export interface TaskUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

export interface TaskEpic {
  id: string;
  title: string;
  epic_id: string;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  status: TaskStatus;
  epic_id?: string;
  description?: string;
  assignee_id?: string;
  due_date?: string;
}

export interface Task {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  due_date: string | null;
  task_id: string;

  epic: TaskEpic | null;
  created_by: TaskUser | null;
  assignee: TaskUser | null;
}
