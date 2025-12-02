import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { StorageService } from './storage.service';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(
    map(user => !!user)
  );

  constructor(private storageService: StorageService) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Esperar a que el storage esté listo
    this.storageService.ready$.subscribe(async (isReady) => {
      if (isReady) {
        await this.loadSavedUser();
      }
    });
  }

  private async loadSavedUser() {
    try {
      // Intentar cargar desde Storage primero
      const savedUser = await this.storageService.get('petcare_user');
      if (savedUser) {
        this.currentUserSubject.next(savedUser);
        return;
      }

      // Fallback a localStorage
      const localUser = localStorage.getItem('petcare_user');
      if (localUser) {
        const user = JSON.parse(localUser);
        this.currentUserSubject.next(user);
        // Migrar a Storage
        await this.storageService.set('petcare_user', user);
      }
    } catch (error) {
      console.error('Error cargando usuario guardado:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Simulación de login - en producción esto sería una llamada a API
    
    // 1. Verificar usuario de prueba hardcodeado
    if (credentials.email === 'test@petcare.com' && credentials.password === '123456') {
      const user: User = {
        id: '1',
        email: credentials.email,
        fullName: 'Tomas Martinez',
        phone: '+56 9 8765 4321'
      };
      
      this.currentUserSubject.next(user);
      await this.saveUserSession(user);
      
      return {
        success: true,
        message: 'Inicio de sesión exitoso'
      };
    }

    // 2. Verificar usuarios registrados
    const registeredUsers = this.getRegisteredUsers();
    const foundUser = registeredUsers.find(user => user.email === credentials.email);
    
    if (foundUser) {
      // Verificar contraseña (en este caso, usamos el email como contraseña por simplicidad)
      const storedPassword = localStorage.getItem(`petcare_password_${foundUser.email}`);
      
      if (storedPassword === credentials.password) {
        this.currentUserSubject.next(foundUser);
        await this.saveUserSession(foundUser);
        
        return {
          success: true,
          message: 'Inicio de sesión exitoso'
        };
      }
    }

    return {
      success: false,
      message: 'Credenciales incorrectas. Verifica tu email y contraseña.'
    };
  }

  async register(data: RegisterData): Promise<AuthResult> {
    // Verificar si el email ya está registrado
    const registeredUsers = this.getRegisteredUsers();
    const existingUser = registeredUsers.find(user => user.email === data.email);
    
    if (existingUser) {
      return {
        success: false,
        message: 'Este email ya está registrado. Intenta con otro email.'
      };
    }

    // Crear nuevo usuario
    const user: User = {
      id: Date.now().toString(),
      email: data.email,
      fullName: data.fullName,
      phone: data.phone
    };

    // Guardar usuario en la lista de registrados
    registeredUsers.push(user);
    localStorage.setItem('petcare_registered_users', JSON.stringify(registeredUsers));
    
    // Guardar contraseña por separado (en producción esto estaría hasheado)
    localStorage.setItem(`petcare_password_${user.email}`, data.password);

    // Loguear automáticamente al usuario
    this.currentUserSubject.next(user);
    await this.saveUserSession(user);

    return {
      success: true,
      message: 'Registro exitoso'
    };
  }

  async logout(): Promise<void> {
    this.currentUserSubject.next(null);
    await this.storageService.clearSession();
    localStorage.removeItem('petcare_user');
  }

  private async saveUserSession(user: User): Promise<void> {
    try {
      // Guardar en Storage
      await this.storageService.set('petcare_user', user);
      
      // Guardar sesión con token simulado
      await this.storageService.saveSession({
        token: `token_${user.id}_${Date.now()}`,
        userId: user.id,
        lastLogin: new Date().toISOString(),
        rememberMe: true
      });

      // Fallback a localStorage
      localStorage.setItem('petcare_user', JSON.stringify(user));
    } catch (error) {
      console.error('Error guardando sesión:', error);
      // Fallback a localStorage
      localStorage.setItem('petcare_user', JSON.stringify(user));
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getRegisteredUsers(): User[] {
    const users = localStorage.getItem('petcare_registered_users');
    return users ? JSON.parse(users) : [];
  }
}
