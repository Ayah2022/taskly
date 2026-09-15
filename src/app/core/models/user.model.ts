export interface UserModel {
  id: string;
  email: string;
  user_metadata: {
    email: string;
    email_verified: boolean;
    job_title: string;
    name: string;
    phone_verified: boolean;
    sub: string;
  };
}
