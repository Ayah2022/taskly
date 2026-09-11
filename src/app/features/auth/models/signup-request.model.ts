export interface SignupRequest {
  email: string;
  password: string;
  data: {
    name: string;
    job_title?: string;
  };
}
