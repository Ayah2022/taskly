export interface SignupModel {
  name: string;
  email: string;
  jobTitle: string;
  password: string;
  confirmPassword: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  data: {
    name: string;
    job_title?: string;
  };
}
