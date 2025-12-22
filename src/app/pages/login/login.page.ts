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
import { UiService } from '../../services/ui.service';

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
    private readonly uiService: UiService,
  ) {}

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      await this.uiService.showErrorToast('Por favor completa todos los campos requeridos.');
      return;
    }

    // Mostrar loading inicial
    await this.uiService.showLoading('Iniciando sesión...');

    try {
      const result = await this.authService.login(this.loginForm.getRawValue());

      if (result.success) {
        // Ocultar loading inicial
        await this.uiService.hideLoading();
        
        // Mostrar loading con animación de Ionic después del login exitoso
        await this.uiService.showLoadingWithAnimation('Cargando tu perfil...', 'login');
        
        // Simular tiempo de carga para mostrar la animación
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Ocultar loading con animación de Ionic
        await this.uiService.hideLoadingWithAnimation('login');
        
        // Mostrar mensaje de éxito
        await this.uiService.showSuccessToast('¡Bienvenido! Disfruta de PetCare+');
        
        // Navegar a home
        this.navCtrl.navigateForward('/home', { animated: true, animationDirection: 'forward' });
      } else {
        await this.uiService.hideLoading();
        await this.uiService.showErrorToast(result.message);
      }
    } catch (error) {
      await this.uiService.hideLoading();
      await this.uiService.showErrorToast('Error al iniciar sesión');
    }
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
