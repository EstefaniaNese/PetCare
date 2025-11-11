import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonModal,
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';
import { AsyncPipe, DatePipe, NgForOf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AlertController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { CareReminder, CareType, PetService } from '../../services/pet.service';

@Component({
  selector: 'app-care-calendar',
  templateUrl: './care-calendar.page.html',
  styleUrls: ['./care-calendar.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonModal,
    IonFab,
    IonFabButton,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    NgForOf,
    AsyncPipe,
    DatePipe,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CareCalendarPage {
  isModalOpen = false;

  readonly reminders$ = this.petService.reminders$;
  readonly reminderForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    type: ['Vacuna' as CareType, Validators.required],
    scheduledDate: ['', Validators.required],
    notes: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly petService: PetService,
    private readonly alertCtrl: AlertController,
  ) {}

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.reminderForm.reset({
      title: '',
      type: 'Vacuna',
      scheduledDate: '',
      notes: '',
    });
  }

  addReminder(): void {
    if (this.reminderForm.invalid) {
      return;
    }

    const value = this.reminderForm.getRawValue();
    this.petService.addReminder({
      ...value,
      scheduledDate: new Date(value.scheduledDate).toISOString(),
      petId: 'pet-1'
    });
    this.closeModal();
  }

  toggleReminder(reminder: CareReminder): void {
    this.petService.toggleReminder(reminder.id);
  }

  async confirmDelete(reminder: CareReminder): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar recordatorio',
      message: `¿Deseas eliminar "${reminder.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.petService.deleteReminder(reminder.id),
        },
      ],
    });
    await alert.present();
  }

  trackByReminder(_index: number, reminder: CareReminder): string {
    return reminder.id;
  }
}
