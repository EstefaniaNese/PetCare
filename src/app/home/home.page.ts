import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonChip,
} from '@ionic/angular/standalone';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CareReminder, PetService } from '../services/pet.service';
import { NetworkService } from '../services/network.service';
import { StorageService } from '../services/storage.service';
import { UiService } from '../services/ui.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonChip,
    NgIf,
    NgForOf,
    AsyncPipe,
    DatePipe,
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
export class HomePage implements OnInit, OnDestroy {
  readonly user$ = this.authService.currentUser$;
  readonly pet$ = this.petService.pet$;
  readonly reminders$ = this.petService.reminders$;

  isOnline = true;
  lastSync: Date | null = null;
  isSyncing = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly navCtrl: NavController,
    private readonly authService: AuthService,
    private readonly petService: PetService,
    private readonly networkService: NetworkService,
    private readonly storageService: StorageService,
    private readonly uiService: UiService,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.setupSubscriptions();
    this.loadLastSync();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Suscribirse al estado de conectividad
    const networkSub = this.networkService.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
    });
    this.subscriptions.push(networkSub);
  }

  private async loadLastSync() {
    this.lastSync = await this.storageService.getLastSync();
  }

  goTo(url: string): void {
    console.log('Navegando a:', url);
    try {
      this.router.navigate([url]).then(
        (success) => {
          console.log('Navegación exitosa:', success);
        },
        (error) => {
          console.error('Error en navegación:', error);
        }
      );
    } catch (error) {
      console.error('Error al navegar:', error);
      // Fallback a NavController
      this.navCtrl.navigateForward(url, { animated: true });
    }
  }

  toggleReminder(reminderId: string): void {
    this.petService.toggleReminder(reminderId);
  }

  trackByReminder(_index: number, reminder: CareReminder): string {
    return reminder.id;
  }

  getPetAge(birthDate: string | null | undefined): string {
    if (!birthDate) {
      return 'Sin información';
    }

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return 'Sin información';
    }

    const today = new Date();
    if (birth > today) {
      return 'Sin información';
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    const days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    if (years < 0) {
      return 'Sin información';
    }

    if (years === 0 && months <= 0) {
      const diffMs = today.getTime() - birth.getTime();
      const diffDays = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);

      if (diffDays === 0) {
        return 'Menos de un día';
      }

      return `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }

    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    if (months <= 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }

    return `${years} ${years === 1 ? 'año' : 'años'} ${months} ${months === 1 ? 'mes' : 'meses'}`;
  }

  async logout() {
    const confirmed = await this.uiService.showConfirmAlert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      'Cerrar Sesión',
      'Cancelar'
    );

    if (confirmed) {
      await this.uiService.withLoading(
        async () => {
          await this.authService.logout();
          this.router.navigate(['/login'], { replaceUrl: true });
        },
        'Cerrando sesión...'
      );
    }
  }

  async syncData() {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    
    try {
      await this.uiService.showLoading('Sincronizando datos...');
      
      // Simular sincronización
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await this.storageService.updateLastSync();
      this.lastSync = new Date();
      
      await this.uiService.hideLoading();
      await this.uiService.showSuccessToast('Datos sincronizados correctamente');
      
    } catch (error) {
      console.error('Error sincronizando:', error);
      await this.uiService.hideLoading();
      await this.uiService.showErrorToast('Error al sincronizar datos');
    } finally {
      this.isSyncing = false;
    }
  }

  formatLastSync(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
