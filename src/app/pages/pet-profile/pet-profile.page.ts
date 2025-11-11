import { Component, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonText,
} from '@ionic/angular/standalone';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AlertController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trigger, transition, style, animate } from '@angular/animations';
import { PetProfile, PetService } from '../../services/pet.service';

@Component({
  selector: 'app-pet-profile',
  templateUrl: './pet-profile.page.html',
  styleUrls: ['./pet-profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonText,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
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
export class PetProfilePage {
  readonly speciesOptions = ['Perro', 'Gato', 'Ave', 'Pez', 'Roedor', 'Otro'];

  readonly petForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    species: ['', Validators.required],
    breed: [''],
    birthDate: ['', Validators.required],
    weight: [null as number | null, [Validators.required, Validators.min(0.1)]],
    vetName: ['', [Validators.required]],
    vetPhone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{7,15}$/)]],
    notes: [''],
    avatarUrl: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly petService: PetService,
    private readonly alertCtrl: AlertController,
    private readonly destroyRef: DestroyRef,
  ) {
    this.petService.pet$.pipe(takeUntilDestroyed(destroyRef)).subscribe((pet) => {
      if (!pet) {
        return;
      }
      this.patchForm(pet);
    });
  }

  async save(): Promise<void> {
    if (this.petForm.invalid) {
      await this.presentAlert('Formulario incompleto', 'Revisa la información de la mascota antes de guardar.');
      return;
    }

    const value = this.petForm.getRawValue();

    const profile: PetProfile = {
      id: 'pet-1',
      ...value,
      birthDate: new Date(value.birthDate).toISOString(),
      weight: Number(value.weight),
    };

    this.petService.setPetProfile(profile);
    await this.presentAlert('Perfil actualizado', 'La información de tu mascota se guardó correctamente.');
  }

  private patchForm(pet: PetProfile): void {
    this.petForm.patchValue({
      ...pet,
      birthDate: pet.birthDate || '',
    });
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
