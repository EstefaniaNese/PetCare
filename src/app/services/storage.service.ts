import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  notifications: {
    reminders: boolean;
    emergencies: boolean;
    community: boolean;
  };
  location: {
    enabled: boolean;
    lastLatitude?: number;
    lastLongitude?: number;
  };
}

export interface SessionData {
  token?: string;
  userId?: string;
  lastLogin?: string;
  rememberMe: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private isReady = new BehaviorSubject<boolean>(false);
  
  // BehaviorSubjects para datos reactivos
  private preferencesSubject = new BehaviorSubject<UserPreferences>(this.getDefaultPreferences());
  private sessionSubject = new BehaviorSubject<SessionData | null>(null);

  // Observables públicos
  public preferences$ = this.preferencesSubject.asObservable();
  public session$ = this.sessionSubject.asObservable();
  public ready$ = this.isReady.asObservable();

  // Claves de almacenamiento
  private readonly KEYS = {
    USER_PREFERENCES: 'petcare_user_preferences',
    SESSION_DATA: 'petcare_session_data',
    USER_TOKEN: 'petcare_user_token',
    OFFLINE_DATA: 'petcare_offline_data',
    LAST_SYNC: 'petcare_last_sync'
  };

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    try {
      // Crear la instancia de storage
      const storage = await this.storage.create();
      this._storage = storage;
      
      // Cargar datos existentes
      await this.loadStoredData();
      
      this.isReady.next(true);
    } catch (error) {
      console.error('Error inicializando Storage:', error);
      // Fallback a localStorage
      this.isReady.next(true);
      await this.loadFromLocalStorage();
    }
  }

  private async loadStoredData() {
    try {
      // Cargar preferencias
      const preferences = await this.get(this.KEYS.USER_PREFERENCES);
      if (preferences) {
        this.preferencesSubject.next({ ...this.getDefaultPreferences(), ...preferences });
      }

      // Cargar datos de sesión
      const sessionData = await this.get(this.KEYS.SESSION_DATA);
      if (sessionData) {
        this.sessionSubject.next(sessionData);
      }
    } catch (error) {
      console.error('Error cargando datos almacenados:', error);
    }
  }

  private async loadFromLocalStorage() {
    try {
      // Fallback usando localStorage
      const preferences = localStorage.getItem(this.KEYS.USER_PREFERENCES);
      if (preferences) {
        this.preferencesSubject.next({ ...this.getDefaultPreferences(), ...JSON.parse(preferences) });
      }

      const sessionData = localStorage.getItem(this.KEYS.SESSION_DATA);
      if (sessionData) {
        this.sessionSubject.next(JSON.parse(sessionData));
      }
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'auto',
      language: 'es',
      notifications: {
        reminders: true,
        emergencies: true,
        community: true
      },
      location: {
        enabled: false
      }
    };
  }

  // Métodos generales de Storage
  async set(key: string, value: any): Promise<boolean> {
    try {
      if (this._storage) {
        await this._storage.set(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      console.error('Error guardando en storage:', error);
      return false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      if (this._storage) {
        return await this._storage.get(key);
      } else {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.error('Error obteniendo de storage:', error);
      return null;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      if (this._storage) {
        await this._storage.remove(key);
      } else {
        localStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error('Error eliminando de storage:', error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (this._storage) {
        await this._storage.clear();
      } else {
        localStorage.clear();
      }
      
      // Resetear BehaviorSubjects
      this.preferencesSubject.next(this.getDefaultPreferences());
      this.sessionSubject.next(null);
      
      return true;
    } catch (error) {
      console.error('Error limpiando storage:', error);
      return false;
    }
  }

  // Métodos específicos para Preferencias de Usuario
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const currentPreferences = this.preferencesSubject.value;
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      const success = await this.set(this.KEYS.USER_PREFERENCES, updatedPreferences);
      if (success) {
        this.preferencesSubject.next(updatedPreferences);
      }
      
      return success;
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      return false;
    }
  }

  getCurrentPreferences(): UserPreferences {
    return this.preferencesSubject.value;
  }

  async resetPreferences(): Promise<boolean> {
    const defaultPreferences = this.getDefaultPreferences();
    const success = await this.set(this.KEYS.USER_PREFERENCES, defaultPreferences);
    if (success) {
      this.preferencesSubject.next(defaultPreferences);
    }
    return success;
  }

  // Métodos específicos para Datos de Sesión
  async saveSession(sessionData: SessionData): Promise<boolean> {
    try {
      const success = await this.set(this.KEYS.SESSION_DATA, sessionData);
      if (success) {
        this.sessionSubject.next(sessionData);
        
        // También guardar el token por separado para fácil acceso
        if (sessionData.token) {
          await this.set(this.KEYS.USER_TOKEN, sessionData.token);
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error guardando sesión:', error);
      return false;
    }
  }

  async getSession(): Promise<SessionData | null> {
    return this.sessionSubject.value;
  }

  async getUserToken(): Promise<string | null> {
    return await this.get(this.KEYS.USER_TOKEN);
  }

  async clearSession(): Promise<boolean> {
    try {
      await this.remove(this.KEYS.SESSION_DATA);
      await this.remove(this.KEYS.USER_TOKEN);
      
      this.sessionSubject.next(null);
      return true;
    } catch (error) {
      console.error('Error limpiando sesión:', error);
      return false;
    }
  }

  // Métodos para Datos Offline
  async saveOfflineData(key: string, data: any): Promise<boolean> {
    try {
      const offlineData = await this.get(this.KEYS.OFFLINE_DATA) || {};
      offlineData[key] = {
        data,
        timestamp: new Date().toISOString()
      };
      
      return await this.set(this.KEYS.OFFLINE_DATA, offlineData);
    } catch (error) {
      console.error('Error guardando datos offline:', error);
      return false;
    }
  }

  async getOfflineData(key: string): Promise<any> {
    try {
      const offlineData = await this.get(this.KEYS.OFFLINE_DATA) || {};
      const item = offlineData[key];
      
      if (item) {
        // Verificar si los datos no son muy antiguos (ej: 7 días)
        const itemDate = new Date(item.timestamp);
        const now = new Date();
        const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff <= 7) {
          return item.data;
        } else {
          // Datos muy antiguos, eliminar
          delete offlineData[key];
          await this.set(this.KEYS.OFFLINE_DATA, offlineData);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error obteniendo datos offline:', error);
      return null;
    }
  }

  async clearOfflineData(): Promise<boolean> {
    return await this.remove(this.KEYS.OFFLINE_DATA);
  }

  // Métodos para Sincronización
  async updateLastSync(): Promise<boolean> {
    return await this.set(this.KEYS.LAST_SYNC, new Date().toISOString());
  }

  async getLastSync(): Promise<Date | null> {
    try {
      const lastSync = await this.get(this.KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Error obteniendo última sincronización:', error);
      return null;
    }
  }

  // Métodos de utilidad
  async getStorageInfo(): Promise<{ keys: string[], size: number }> {
    try {
      if (this._storage) {
        const keys = await this._storage.keys();
        return {
          keys,
          size: keys.length
        };
      } else {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('petcare_'));
        return {
          keys,
          size: keys.length
        };
      }
    } catch (error) {
      console.error('Error obteniendo información de storage:', error);
      return { keys: [], size: 0 };
    }
  }

  // Método para exportar datos (útil para backup)
  async exportData(): Promise<any> {
    try {
      const data: any = {};
      
      if (this._storage) {
        const keys = await this._storage.keys();
        for (const key of keys) {
          if (key.startsWith('petcare_')) {
            data[key] = await this._storage.get(key);
          }
        }
      } else {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('petcare_')) {
            try {
              data[key] = JSON.parse(localStorage.getItem(key) || '');
            } catch {
              data[key] = localStorage.getItem(key);
            }
          }
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error exportando datos:', error);
      return {};
    }
  }

  // Método para importar datos (útil para restore)
  async importData(data: any): Promise<boolean> {
    try {
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith('petcare_')) {
          await this.set(key, value);
        }
      }
      
      // Recargar datos en BehaviorSubjects
      await this.loadStoredData();
      
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }
}
