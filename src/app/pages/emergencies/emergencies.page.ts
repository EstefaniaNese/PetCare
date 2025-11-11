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
} from '@ionic/angular/standalone';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { AlertController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { PetService } from '../../services/pet.service';

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

  constructor(
    private readonly petService: PetService,
    private readonly alertCtrl: AlertController,
  ) {}

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
}
