import type { Role } from '../constants/roles';

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  project_id: string;
  type: 'access' | 'refresh';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SetupRequest {
  email: string;
  password: string;
  display_name: string;
  project_name: string;
}
