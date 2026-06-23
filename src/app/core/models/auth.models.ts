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

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'MECANICIEN' | 'FOURNISSEUR';
  phone?: string;
  company?: string;
}

export interface BackendAuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ManagedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  active: boolean;
  phone: string;
  company: string;
  createdAt: string;
}
