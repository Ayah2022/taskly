export interface EpicUser {
  sub: string;
  name: string;
  email: string;
  department: string;
}

export interface EpicModel {
  id: string;
  epic_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  created_at: string;
  created_by: EpicUser | null;
  assignee: EpicUser | null;
}

export interface EpicPatch {
  title?: string;
  description?: string | null;
  assignee_id?: string | null;
  deadline?: string | null;
}
