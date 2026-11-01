export type Role = 'ADMIN' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Dashboard {
  id: string;
  title: string;
  authorName: string;
  description: string;
  embedUrl: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DashboardInput = Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>;

export interface EmbedValidation {
  valid: boolean;
  url: string | null;
  inputType: 'iframe' | 'url' | 'empty' | 'unknown';
  error?: string;
}
