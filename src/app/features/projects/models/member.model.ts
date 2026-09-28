export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface MemberMetadata {
  sub: string;
  name: string;
  email: string;
  job_title: string;
  email_verified: boolean;
  phone_verified: boolean;
}

export interface MemberModel {
  member_id: string;
  project_id: string;
  user_id: string;
  role: MemberRole;
  email: string;
  metadata: MemberMetadata;
}
