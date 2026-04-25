export type UserRole = 'Gerente' | 'Analista' | 'Administrador';

export interface User {
  id:    string;
  name:  string;
  email: string;
  role:  UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email:    string;
  password: string;
}

// Módulos accesibles por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Gerente:        ['overview', 'geographic', 'temporal', 'factors', 'prediction'],
  Analista:       ['overview', 'geographic', 'temporal', 'factors', 'tables'],
  Administrador:  ['overview', 'users', 'logs'],
};