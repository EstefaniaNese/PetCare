import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  private networkStatusSubject = new BehaviorSubject<NetworkStatus>({
    connected: true,
    connectionType: 'unknown'
  });

  public isOnline$ = this.isOnlineSubject.asObservable();
  public networkStatus$ = this.networkStatusSubject.asObservable();

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private async initializeNetworkMonitoring() {
    try {
      if (Capacitor.isNativePlatform()) {
        // Para dispositivos móviles, usar Capacitor Network
        const status = await Network.getStatus();
        this.updateNetworkStatus(status.connected, status.connectionType);

        // Escuchar cambios de conectividad
        Network.addListener('networkStatusChange', status => {
          this.updateNetworkStatus(status.connected, status.connectionType);
        });
      } else {
        // Para web, usar navigator.onLine y eventos
        this.updateNetworkStatus(navigator.onLine, this.getConnectionType());

        window.addEventListener('online', () => {
          this.updateNetworkStatus(true, this.getConnectionType());
        });

        window.addEventListener('offline', () => {
          this.updateNetworkStatus(false, 'none');
        });
      }
    } catch (error) {
      console.error('Error inicializando monitoreo de red:', error);
      // Fallback: asumir que hay conexión
      this.updateNetworkStatus(true, 'unknown');
    }
  }

  private updateNetworkStatus(connected: boolean, connectionType: string) {
    this.isOnlineSubject.next(connected);
    this.networkStatusSubject.next({
      connected,
      connectionType
    });

    // Log para debugging
    console.log(`Estado de red: ${connected ? 'Conectado' : 'Desconectado'} (${connectionType})`);
  }

  private getConnectionType(): string {
    // Para web, intentar determinar el tipo de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Métodos públicos
  getCurrentStatus(): NetworkStatus {
    return this.networkStatusSubject.value;
  }

  isCurrentlyOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const status = await Network.getStatus();
        return status.connected;
      } else {
        return navigator.onLine;
      }
    } catch (error) {
      console.error('Error verificando conectividad:', error);
      return false;
    }
  }

  // Método para probar conectividad real (ping a un servidor)
  async testRealConnectivity(url: string = 'https://www.google.com', timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.error('Test de conectividad falló:', error);
      return false;
    }
  }

  // Método para obtener información detallada de la red
  async getNetworkInfo(): Promise<any> {
    try {
      if (Capacitor.isNativePlatform()) {
        return await Network.getStatus();
      } else {
        return {
          connected: navigator.onLine,
          connectionType: this.getConnectionType(),
          platform: 'web'
        };
      }
    } catch (error) {
      console.error('Error obteniendo información de red:', error);
      return {
        connected: false,
        connectionType: 'unknown',
        error: error
      };
    }
  }
}
