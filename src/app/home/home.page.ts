import { Component } from '@angular/core';
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
} from '@ionic/angular/standalone';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../services/auth.service';
import { CareReminder, PetService } from '../services/pet.service';

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
export class HomePage {
  readonly user$ = this.authService.currentUser$;
  readonly pet$ = this.petService.pet$;
  readonly reminders$ = this.petService.reminders$;

  constructor(
    private readonly navCtrl: NavController,
    private readonly authService: AuthService,
    private readonly petService: PetService,
  ) {}

  goTo(url: string): void {
    this.navCtrl.navigateForward(url, { animated: true, animationDirection: 'forward' });
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
}
