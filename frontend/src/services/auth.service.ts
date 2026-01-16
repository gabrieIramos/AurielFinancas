import { api } from './api';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  async login(data: LoginData) {
    const response = await api.post<LoginResponse>('/auth/login', data);
    
    if (response.data) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  async register(data: RegisterData) {
    const response = await api.post<LoginResponse>('/auth/register', data);
    
    if (response.data) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
