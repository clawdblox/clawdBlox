import type { Role } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  role: Role;
  project_id: string;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic {
  id: string;
  email: string;
  display_name: string;
  role: Role;
  project_id: string;
  is_active: boolean;
  last_login_at: Date | null;
  created_at: Date;
}
