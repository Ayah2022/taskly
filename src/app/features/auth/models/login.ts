export interface LoginModel {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
  };
}
