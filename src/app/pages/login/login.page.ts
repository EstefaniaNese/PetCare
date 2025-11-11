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
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AlertController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    IonText,
    IonIcon,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class LoginPage {
  hidePassword = true;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly navCtrl: NavController,
    private readonly alertCtrl: AlertController,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      await this.presentAlert('Formulario incompleto', 'Por favor completa todos los campos requeridos.');
      return;
    }

    const result = this.authService.login(this.loginForm.getRawValue());

    if (!result.success) {
      await this.presentAlert('Ups...', result.message);
      return;
    }

    await this.presentAlert('¡Bienvenido!', 'Inicio de sesión correcto. Disfruta de PetCare+');
    this.navCtrl.navigateForward('/home', { animated: true, animationDirection: 'forward' });
  }

  togglePassword(): void {
    this.hidePassword = !this.hidePassword;
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
