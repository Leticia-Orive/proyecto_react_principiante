import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const USERS_STORAGE_KEY = 'tienda-users';
const SESSION_STORAGE_KEY = 'tienda-session';

const DEFAULT_ADMIN_USER: User = {
  id: 999001,
  name: 'Admin',
  email: 'admin@tienda.com',
  password: 'Admin123!',
  role: 'admin',
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.hydrateAuthState();
  }

  private hydrateAuthState(): void {
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        this.currentUserSubject.next(session);
      } catch (e) {
        console.error('Error hydrating session:', e);
      }
    }
  }

  private getStoredUsers(): User[] {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    if (!stored) {
      return [DEFAULT_ADMIN_USER];
    }
    try {
      const users = JSON.parse(stored);
      return Array.isArray(users) ? users : [DEFAULT_ADMIN_USER];
    } catch (e) {
      return [DEFAULT_ADMIN_USER];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'admin';
  }

  register(name: string, email: string, password: string): { success: boolean; error?: string } {
    const users = this.getStoredUsers();
    const exists = users.some(u => u.email === email);

    if (exists) {
      return { success: false, error: 'El email ya está registrado' };
    }

    if (password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const newUser: User = {
      id: Math.max(0, ...users.map(u => u.id)) + 1,
      name,
      email,
      password,
      role: 'user'
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true };
  }

  login(email: string, password: string): { success: boolean; error?: string } {
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return { success: false, error: 'Email o contraseña incorrectos' };
    }

    const currentUser: CurrentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    this.currentUserSubject.next(currentUser);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));
    return { success: true };
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
