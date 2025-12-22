import { Component } from '@angular/core';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
} from '@ionic/angular/standalone';
import { AsyncPipe, NgForOf, CommonModule } from '@angular/common';
import { NavController } from '@ionic/angular';
import { AuthService } from './services/auth.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { UiService } from './services/ui.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    NgForOf,
    AsyncPipe,
    CommonModule,
  ],
})
export class AppComponent {
  readonly appPages = [
    { title: 'Inicio', url: '/home', icon: 'home' },
    { title: 'Perfil de mascota', url: '/pet-profile', icon: 'paw' },
    { title: 'Calendario de cuidados', url: '/care-calendar', icon: 'calendar' },
    { title: 'Emergencias', url: '/emergencies', icon: 'medkit' },
    { title: 'Comunidad y servicios', url: '/community', icon: 'people' },
  ];

  readonly isLoggedIn$ = this.authService.currentUser$;
  isAuthRoute = false;

  isMenuOpen = false; // Estado del menú

  openMenu(): void {
    this.isMenuOpen = true;
    // @ts-ignore:
    const menu = document.querySelector('ion-menu');
    menu && menu.open && menu.open();
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    // @ts-ignore:
    const menu = document.querySelector('ion-menu');
    menu && menu.close && menu.close();
  }

  constructor(
    private readonly navCtrl: NavController,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly uiService: UiService,
  ) {
    // Evaluar ruta inicial
    this.isAuthRoute = this.isAuthUrl(this.router.url);

    // Actualizar estado al navegar
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isAuthRoute = this.isAuthUrl(e.urlAfterRedirects);
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  private isAuthUrl(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/register');
  }

  navigate(url: string): void {
    this.navCtrl.navigateForward(url, { animated: true, animationDirection: 'forward' });
  }

  async logout(): Promise<void> {
    // Mostrar loading con animación de Ionic al cerrar sesión
    await this.uiService.showLoadingWithAnimation('Cerrando sesión...', 'logout');
    
    // Simular tiempo de procesamiento para mostrar la animación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Cerrar sesión
    await this.authService.logout();
    
    // Ocultar loading con animación de Ionic
    await this.uiService.hideLoadingWithAnimation('logout');
    
    // Navegar al login
    this.navCtrl.navigateRoot('/login', { animated: true, animationDirection: 'forward' });
  }
}
