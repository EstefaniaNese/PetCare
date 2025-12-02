import { Injectable } from '@angular/core';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ToastOptions {
  message: string;
  duration?: number;
  color?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private loadingStateSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  private currentLoading: HTMLIonLoadingElement | null = null;

  public loadingState$ = this.loadingStateSubject.asObservable();

  constructor(
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  // Métodos de Loading
  async showLoading(message: string = 'Cargando...'): Promise<void> {
    try {
      // Si ya hay un loading activo, no crear otro
      if (this.currentLoading) {
        return;
      }

      this.loadingStateSubject.next({ isLoading: true, message });

      this.currentLoading = await this.loadingController.create({
        message,
        spinner: 'crescent',
        cssClass: 'custom-loading'
      });

      await this.currentLoading.present();
    } catch (error) {
      console.error('Error mostrando loading:', error);
    }
  }

  async hideLoading(): Promise<void> {
    try {
      this.loadingStateSubject.next({ isLoading: false });

      if (this.currentLoading) {
        await this.currentLoading.dismiss();
        this.currentLoading = null;
      }
    } catch (error) {
      console.error('Error ocultando loading:', error);
    }
  }

  async updateLoadingMessage(message: string): Promise<void> {
    try {
      if (this.currentLoading) {
        this.loadingStateSubject.next({ isLoading: true, message });
        // Ionic no permite actualizar el mensaje directamente,
        // así que recreamos el loading
        await this.hideLoading();
        await this.showLoading(message);
      }
    } catch (error) {
      console.error('Error actualizando mensaje de loading:', error);
    }
  }

  // Métodos de Toast
  async showToast(options: ToastOptions): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message: options.message,
        duration: options.duration || 3000,
        color: options.color || 'primary',
        position: options.position || 'bottom',
        buttons: options.showCloseButton ? [
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ] : undefined,
        cssClass: 'custom-toast'
      });

      await toast.present();
    } catch (error) {
      console.error('Error mostrando toast:', error);
    }
  }

  async showSuccessToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'success',
      duration: 2000
    });
  }

  async showErrorToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'danger',
      duration: 4000,
      showCloseButton: true
    });
  }

  async showWarningToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'warning',
      duration: 3000
    });
  }

  async showInfoToast(message: string): Promise<void> {
    await this.showToast({
      message,
      color: 'primary',
      duration: 2500
    });
  }

  // Métodos de Alert
  async showAlert(header: string, message: string, buttons?: string[]): Promise<void> {
    try {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: buttons || ['Entendido'],
        cssClass: 'custom-alert'
      });

      await alert.present();
    } catch (error) {
      console.error('Error mostrando alert:', error);
    }
  }

  async showConfirmAlert(
    header: string, 
    message: string, 
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ): Promise<boolean> {
    try {
      return new Promise(async (resolve) => {
        const alert = await this.alertController.create({
          header,
          message,
          buttons: [
            {
              text: cancelText,
              role: 'cancel',
              handler: () => resolve(false)
            },
            {
              text: confirmText,
              handler: () => resolve(true)
            }
          ],
          cssClass: 'custom-alert'
        });

        await alert.present();
      });
    } catch (error) {
      console.error('Error mostrando confirm alert:', error);
      return false;
    }
  }

  async showErrorAlert(error: any, title: string = 'Error'): Promise<void> {
    let message = 'Ha ocurrido un error inesperado.';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    } else if (error?.error?.message) {
      message = error.error.message;
    }

    await this.showAlert(title, message);
  }

  // Método para manejar operaciones asíncronas con loading automático
  async withLoading<T>(
    operation: () => Promise<T>,
    loadingMessage: string = 'Procesando...'
  ): Promise<T> {
    try {
      await this.showLoading(loadingMessage);
      const result = await operation();
      await this.hideLoading();
      return result;
    } catch (error) {
      await this.hideLoading();
      throw error;
    }
  }

  // Método para manejar operaciones con feedback completo
  async handleOperation<T>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      successMessage?: string;
      errorMessage?: string;
      showSuccessToast?: boolean;
      showErrorAlert?: boolean;
    } = {}
  ): Promise<T | null> {
    try {
      const result = await this.withLoading(
        operation,
        options.loadingMessage || 'Procesando...'
      );

      if (options.showSuccessToast && options.successMessage) {
        await this.showSuccessToast(options.successMessage);
      }

      return result;
    } catch (error) {
      console.error('Error en operación:', error);

      if (options.showErrorAlert) {
        await this.showErrorAlert(error, options.errorMessage);
      } else if (options.errorMessage) {
        await this.showErrorToast(options.errorMessage);
      }

      return null;
    }
  }

  // Método para verificar conectividad y mostrar estado
  async checkConnectivityAndNotify(): Promise<boolean> {
    // Este método se puede integrar con NetworkService
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      await this.showWarningToast('Sin conexión a internet. Trabajando en modo offline.');
    }
    
    return isOnline;
  }

  // Método para limpiar todos los elementos de UI
  async dismissAll(): Promise<void> {
    try {
      await this.hideLoading();
      
      // Cerrar todos los toasts
      const toasts = await this.toastController.getTop();
      if (toasts) {
        await toasts.dismiss();
      }

      // Cerrar todos los alerts
      const alerts = await this.alertController.getTop();
      if (alerts) {
        await alerts.dismiss();
      }
    } catch (error) {
      console.error('Error limpiando UI:', error);
    }
  }

  // Getters para el estado actual
  get isLoading(): boolean {
    return this.loadingStateSubject.value.isLoading;
  }

  get loadingMessage(): string | undefined {
    return this.loadingStateSubject.value.message;
  }
}
