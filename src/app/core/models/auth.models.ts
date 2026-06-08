export type Role = 'ADMIN' | 'MECANICIEN' | 'FOURNISSEUR';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
