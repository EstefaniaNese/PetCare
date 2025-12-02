import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService, User } from '../../services/auth.service';
import { PetProfile, PetService } from '../../services/pet.service';
import { NetworkService } from '../../services/network.service';
import { UiService } from '../../services/ui.service';

interface DebugData {
  currentUser: User | null;
  petProfile: PetProfile | null;
  networkStatus: boolean;
  localStorageKeys: string[];
}

@Component({
  selector: 'app-debug',
  templateUrl: './debug.page.html',
  styleUrls: ['./debug.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    CommonModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(12px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class DebugPage implements OnInit {
  debugData: DebugData | null = null;

  constructor(
    private authService: AuthService,
    private petService: PetService,
    private networkService: NetworkService,
    private uiService: UiService,
    private alertCtrl: AlertController,
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

  async loadAllData(): Promise<void> {
    await this.uiService.showLoading('Cargando datos de debug...');
    
    try {
      const currentUser = this.authService.getCurrentUser();
      const petProfile = this.petService.getPetProfile();
      const networkStatus = this.networkService.getCurrentStatus().connected;
      
      // Obtener claves de localStorage que empiecen con 'petcare_'
      const localStorageKeys = Object.keys(localStorage).filter(key => key.startsWith('petcare_'));

      this.debugData = {
        currentUser,
        petProfile,
        networkStatus,
        localStorageKeys,
      };
      
      await this.uiService.hideLoading();
      await this.uiService.showSuccessToast('Datos de debug cargados.');
    } catch (error) {
      console.error('Error loading debug data:', error);
      await this.uiService.hideLoading();
      await this.uiService.showErrorToast('Error al cargar datos de debug.');
    }
  }

  async clearAllData(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Limpieza',
      message: '¿Estás seguro de que quieres eliminar TODOS los datos locales?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: async () => {
            await this.uiService.showLoading('Limpiando datos...');
            
            try {
              // Limpiar localStorage
              localStorage.clear();
              
              // Cerrar sesión
              await this.authService.logout();
              
              this.debugData = null;
              await this.uiService.hideLoading();
              await this.uiService.showSuccessToast('Todos los datos locales han sido eliminados.');
              
              // Recargar la aplicación
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } catch (error) {
              console.error('Error clearing data:', error);
              await this.uiService.hideLoading();
              await this.uiService.showErrorToast('Error al limpiar datos.');
            }
          },
        },
      ],
    });
    await alert.present();
  }

  getLocalStorageValue(key: string): string {
    const value = localStorage.getItem(key);
    if (!value) return 'null';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  trackByKey(index: number, key: string): string {
    return key;
  }
}