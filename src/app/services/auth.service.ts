import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  constructor() {
    // Cargar usuario desde localStorage si existe
    const savedUser = localStorage.getItem('petcare_user');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginCredentials): AuthResult {
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
      localStorage.setItem('petcare_user', JSON.stringify(user));
      
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
        localStorage.setItem('petcare_user', JSON.stringify(foundUser));
        
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

  register(data: RegisterData): AuthResult {
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
    localStorage.setItem('petcare_user', JSON.stringify(user));

    return {
      success: true,
      message: 'Registro exitoso'
    };
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('petcare_user');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getRegisteredUsers(): User[] {
    const users = localStorage.getItem('petcare_registered_users');
    return users ? JSON.parse(users) : [];
  }
}
