import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButtons,
  IonText,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { IonRouterLink } from '@ionic/angular/standalone';
import { AlertController, NavController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButtons,
    IonText,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
})
export class RegisterPage {
  hidePassword = true;
  hideConfirm = true;
  showLogo = false; // Cambiar a true cuando tengas el logo

  readonly platformPages = [
    { title: 'Inicio', url: '/home', icon: 'home-outline' },
    { title: 'Login', url: '/login', icon: 'log-in-outline' },
    { title: 'Perfil Mascota', url: '/pet-profile', icon: 'paw-outline' },
    { title: 'Calendario', url: '/care-calendar', icon: 'calendar-outline' },
    { title: 'Emergencias', url: '/emergencies', icon: 'medical-outline' },
    { title: 'Comunidad', url: '/community', icon: 'people-outline' },
  ];

  readonly features = [
    {
      title: 'Gestión de Mascotas',
      description: 'Perfil completo con información médica y veterinaria',
      icon: 'paw-outline'
    },
    {
      title: 'Calendario de Cuidados',
      description: 'Recordatorios para vacunas, baños y controles médicos',
      icon: 'calendar-outline'
    },
    {
      title: 'Emergencias',
      description: 'Acceso rápido a información de contacto veterinario',
      icon: 'medical-outline'
    },
    {
      title: 'Comunidad',
      description: 'Directorio de servicios para mascotas en tu área',
      icon: 'people-outline'
    }
  ];

  private passwordMatchValidator = (group: AbstractControl): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { mismatch: true };
  };

  readonly registerForm = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{7,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.passwordMatchValidator },
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      await this.presentAlert('Formulario incompleto', 'Revisa los campos resaltados e intenta nuevamente.');
      return;
    }

    const { confirmPassword, ...payload } = this.registerForm.getRawValue();
    const result = this.authService.register(payload);

    if (!result.success) {
      await this.presentAlert('Ups...', result.message);
      return;
    }

    await this.presentAlert('¡Bienvenido!', 'Tu cuenta ha sido creada exitosamente. ¡Disfruta de PetCare+!');
    this.navCtrl.navigateRoot('/home');
  }

  togglePassword(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
      return;
    }
    this.hideConfirm = !this.hideConfirm;
  }

  navigateToPage(url: string): void {
    this.navCtrl.navigateForward(url, { animated: true, animationDirection: 'forward' });
  }

  navigateToLogin(): void {
    this.navCtrl.navigateForward('/login', { animated: true, animationDirection: 'forward' });
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
