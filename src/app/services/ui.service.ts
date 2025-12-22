import { Injectable } from '@angular/core';
import { 
  LoadingController, 
  ToastController, 
  AlertController, 
  AnimationController,
  Animation
} from '@ionic/angular';
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
    private alertController: AlertController,
    private animationCtrl: AnimationController
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

  // Método para mostrar loading con animación de Ionic (usando estilos predefinidos de Ionic)
  async showLoadingWithAnimation(
    message: string = 'Cargando...',
    animationType: 'login' | 'logout' = 'login'
  ): Promise<void> {
    try {
      // Si ya hay un loading activo, no crear otro
      if (this.currentLoading) {
        return;
      }

      this.loadingStateSubject.next({ isLoading: true, message });

      this.currentLoading = await this.loadingController.create({
        message,
        spinner: 'crescent',
        cssClass: `custom-loading loading-${animationType}`,
        backdropDismiss: false
      });

      await this.currentLoading.present();

      // Aplicar animación de Ionic usando AnimationController con estilos predefinidos
      setTimeout(async () => {
        try {
          // Obtener el elemento del loading wrapper usando querySelector
          const loadingElement = document.querySelector('ion-loading .loading-wrapper') as HTMLElement;
          
          if (loadingElement) {
            // Crear animación usando los mismos parámetros que las animaciones predefinidas de Ionic
            let animation: Animation;
            
            if (animationType === 'login') {
              // Animación estilo iOS: fade in con escala y desplazamiento desde abajo
              animation = this.animationCtrl.create()
                .addElement(loadingElement)
                .duration(400)
                .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
                .fromTo('opacity', 0, 1)
                .fromTo('transform', 'scale(0.8) translateY(20px)', 'scale(1) translateY(0)');
            } else {
              // Animación estilo Material Design: fade in con desplazamiento desde arriba
              animation = this.animationCtrl.create()
                .addElement(loadingElement)
                .duration(400)
                .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
                .fromTo('opacity', 0, 1)
                .fromTo('transform', 'translateY(-20px) scale(0.9)', 'translateY(0) scale(1)');
            }
            
            await animation.play();
          }
        } catch (error) {
          console.warn('No se pudo aplicar animación de Ionic:', error);
        }
      }, 10);
    } catch (error) {
      console.error('Error mostrando loading con animación:', error);
    }
  }

  // Método para ocultar loading con animación de Ionic (usando estilos predefinidos de Ionic)
  async hideLoadingWithAnimation(animationType: 'login' | 'logout' = 'login'): Promise<void> {
    try {
      if (this.currentLoading) {
        // Obtener el elemento del loading wrapper usando querySelector
        const loadingElement = document.querySelector('ion-loading .loading-wrapper') as HTMLElement;
        
        if (loadingElement) {
          // Crear animación de salida usando los mismos parámetros que las animaciones predefinidas de Ionic
          let leaveAnimation: Animation;
          
          if (animationType === 'login') {
            // Animación estilo iOS: fade out con escala
            leaveAnimation = this.animationCtrl.create()
              .addElement(loadingElement)
              .duration(300)
              .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
              .fromTo('opacity', 1, 0)
              .fromTo('transform', 'scale(1)', 'scale(0.9)');
          } else {
            // Animación estilo Material Design: fade out con desplazamiento hacia arriba
            leaveAnimation = this.animationCtrl.create()
              .addElement(loadingElement)
              .duration(300)
              .easing('cubic-bezier(0.36, 0.66, 0.04, 1)')
              .fromTo('opacity', 1, 0)
              .fromTo('transform', 'translateY(0) scale(1)', 'translateY(-10px) scale(0.95)');
          }
          
          // Ejecutar animación de salida antes de cerrar
          await leaveAnimation.play();
        }

        this.loadingStateSubject.next({ isLoading: false });
        await this.currentLoading.dismiss();
        this.currentLoading = null;
      }
    } catch (error) {
      console.error('Error ocultando loading con animación:', error);
      // Fallback: cerrar sin animación
      await this.hideLoading();
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
