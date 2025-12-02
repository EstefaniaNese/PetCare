import { Component } from '@angular/core';
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
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonSpinner,
  IonChip,
} from '@ionic/angular/standalone';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { PetService } from '../../services/pet.service';
import { GeolocationService, VeterinaryLocation, LocationCoordinates } from '../../services/geolocation.service';

@Component({
  selector: 'app-emergencies',
  templateUrl: './emergencies.page.html',
  styleUrls: ['./emergencies.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonSpinner,
    IonChip,
    CommonModule,
    AsyncPipe,
    NgIf,
    NgForOf,
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
export class EmergenciesPage {
  readonly pet$ = this.petService.pet$;
  readonly quickActions = [
    { title: 'Convulsiones', icon: 'flash', description: 'Asegura el entorno, protege la cabeza y llama al veterinario.' },
    { title: 'Envenenamiento', icon: 'warning', description: 'Identifica el tóxico, no induzcas vómito sin indicación profesional.' },
    { title: 'Golpe de calor', icon: 'thermometer', description: 'Traslada al lugar fresco, hidrata con paños húmedos y visita al veterinario.' },
  ];

  // Propiedades para geolocalización
  currentLocation: LocationCoordinates | null = null;
  nearbyVeterinaries: VeterinaryLocation[] = [];
  isLoadingLocation = false;

  constructor(
    private readonly petService: PetService,
    private readonly alertCtrl: AlertController,
    private readonly geolocationService: GeolocationService,
  ) {
    // Suscribirse a los observables de geolocalización
    this.geolocationService.currentLocation$.subscribe(location => {
      this.currentLocation = location;
    });

    this.geolocationService.nearbyVeterinaries$.subscribe(veterinaries => {
      this.nearbyVeterinaries = veterinaries;
    });
  }

  async showSOS(): Promise<void> {
    const pet = this.petService.getPetProfile();
    const message = pet
      ? `Mascota: ${pet.name} (${pet.species})<br/> Peso: ${pet.weight} kg<br/> Veterinario: ${pet.vetName} - ${pet.vetPhone}`
      : 'Completa el perfil de tu mascota para mostrar información personalizada.';

    const alert = await this.alertCtrl.create({
      header: 'SOS Veterinario',
      message,
      buttons: [
        {
          text: 'Llamar',
          handler: () => {
            if (pet?.vetPhone) {
              this.callEmergency(pet.vetPhone);
            }
          },
        },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  callEmergency(number: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    const url = `tel:${number}`;
    window.open(url, '_system') ?? window.open(url, '_blank');
  }

  // Métodos para geolocalización
  async findNearbyVeterinaries(): Promise<void> {
    console.log('🔍 Iniciando búsqueda de veterinarias...');
    this.isLoadingLocation = true;
    
    try {
      console.log('📍 Obteniendo ubicación actual...');
      const location = await this.geolocationService.getCurrentPosition();
      console.log('📍 Ubicación obtenida:', location);
      
      if (location) {
        console.log('🏥 Verificando veterinarias encontradas...');
        console.log('🏥 Número de veterinarias:', this.nearbyVeterinaries.length);
        console.log('🏥 Lista de veterinarias:', this.nearbyVeterinaries);
        
        const locationText = location.city 
          ? `en ${location.city}${location.country ? ', ' + location.country : ''}`
          : 'en tu ubicación actual';
          
        const veterinariesCount = this.nearbyVeterinaries.length;
        const isNoVetsFound = this.nearbyVeterinaries[0]?.id === 'no-vets-found';
        
        if (isNoVetsFound) {
          console.log('⚠️ No se encontraron veterinarias cercanas');
          await this.presentAlert(
            'Búsqueda completada', 
            `Ubicación: ${locationText}\n\nNo se encontraron veterinarias en un radio de 50km. Se muestran recomendaciones de emergencia.`
          );
        } else {
          console.log('✅ Veterinarias encontradas:', veterinariesCount);
          await this.presentAlert(
            'Veterinarias encontradas', 
            `Ubicación: ${locationText}\n\nSe encontraron ${veterinariesCount} veterinarias cercanas ordenadas por distancia.`
          );
        }
      } else {
        console.log('❌ No se pudo obtener ubicación');
        await this.presentAlert(
          'Error de ubicación', 
          'No se pudo obtener tu ubicación. Verifica que los permisos estén habilitados.'
        );
      }
    } catch (error) {
      console.error('❌ Error buscando veterinarias:', error);
      await this.presentAlert(
        'Error', 
        `Ocurrió un error al buscar veterinarias cercanas: ${error}`
      );
    } finally {
      this.isLoadingLocation = false;
      console.log('🔍 Búsqueda finalizada');
    }
  }

  async callVeterinary(phone: string): Promise<void> {
    try {
      await this.geolocationService.callVeterinary(phone);
    } catch (error) {
      console.error('Error llamando veterinaria:', error);
      // Fallback: usar el método normal
      this.callEmergency(phone);
    }
  }

  async openInMaps(veterinary: VeterinaryLocation): Promise<void> {
    try {
      await this.geolocationService.openInMaps(veterinary);
    } catch (error) {
      console.error('Error abriendo mapas:', error);
      await this.presentAlert(
        'Error', 
        'No se pudo abrir la aplicación de mapas.'
      );
    }
  }

  getVeterinaryIcon(type: string): string {
    switch (type) {
      case 'Veterinaria':
        return 'medical';
      case 'Clínica':
        return 'business';
      case 'Hospital':
        return 'medkit';
      case 'Emergencia':
        return 'warning';
      default:
        return 'location';
    }
  }

  formatDistance(distance: number): string {
    return this.geolocationService.formatDistance(distance);
  }

  private async presentAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['Entendido'],
    });
    await alert.present();
  }

}
