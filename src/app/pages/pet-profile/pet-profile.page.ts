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
  IonIcon,
  IonSpinner,
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
import { CameraService } from '../../services/camera.service';
import { ActionSheetController } from '@ionic/angular';

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
    IonIcon,
    IonSpinner,
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
  
  petPhoto: string | null = null;
  isLoadingPhoto = false;

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
    private readonly cameraService: CameraService,
    private readonly actionSheetCtrl: ActionSheetController,
  ) {
    this.petService.pet$.pipe(takeUntilDestroyed(destroyRef)).subscribe((pet) => {
      if (!pet) {
        return;
      }
      this.patchForm(pet);
    });
    
    this.loadPetPhoto();
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

  // Métodos para manejo de fotos
  async takePhoto(): Promise<void> {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar Foto',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => {
            this.capturePhoto();
          }
        },
        {
          text: 'Seleccionar de Galería',
          icon: 'images',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  async capturePhoto(): Promise<void> {
    this.isLoadingPhoto = true;
    
    try {
      // Verificar permisos
      const hasPermission = await this.cameraService.checkCameraPermissions();
      if (!hasPermission) {
        const granted = await this.cameraService.requestCameraPermissions();
        if (!granted) {
          await this.presentAlert('Permisos requeridos', 'Se necesitan permisos de cámara para tomar fotos.');
          this.isLoadingPhoto = false;
          return;
        }
      }

      const result = await this.cameraService.takePicture();
      
      if (result.success && result.photoUrl) {
        this.petPhoto = result.photoUrl;
        // Guardar la foto en storage
        await this.cameraService.savePhotoToStorage(result.photoUrl, 'pet_photo_pet-1');
        // Actualizar el formulario con la URL
        this.petForm.patchValue({ avatarUrl: result.photoUrl });
      } else {
        await this.presentAlert('Error', result.error || 'No se pudo tomar la foto');
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      await this.presentAlert('Error', 'Ocurrió un error al tomar la foto');
    } finally {
      this.isLoadingPhoto = false;
    }
  }

  async selectFromGallery(): Promise<void> {
    this.isLoadingPhoto = true;
    
    try {
      const result = await this.cameraService.selectFromGallery();
      
      if (result.success && result.photoUrl) {
        this.petPhoto = result.photoUrl;
        // Guardar la foto en storage
        await this.cameraService.savePhotoToStorage(result.photoUrl, 'pet_photo_pet-1');
        // Actualizar el formulario con la URL
        this.petForm.patchValue({ avatarUrl: result.photoUrl });
      } else {
        await this.presentAlert('Error', result.error || 'No se pudo seleccionar la foto');
      }
    } catch (error) {
      console.error('Error seleccionando foto:', error);
      await this.presentAlert('Error', 'Ocurrió un error al seleccionar la foto');
    } finally {
      this.isLoadingPhoto = false;
    }
  }

  async removePhoto(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Foto',
      message: '¿Estás seguro de que quieres eliminar la foto de la mascota?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            this.petPhoto = null;
            this.petForm.patchValue({ avatarUrl: '' });
            await this.cameraService.deletePhotoFromStorage('pet_photo_pet-1');
          }
        }
      ]
    });
    await alert.present();
  }

  private async loadPetPhoto(): Promise<void> {
    try {
      const savedPhoto = await this.cameraService.getPhotoFromStorage('pet_photo_pet-1');
      if (savedPhoto) {
        this.petPhoto = savedPhoto;
      }
    } catch (error) {
      console.error('Error cargando foto guardada:', error);
    }
  }
}
