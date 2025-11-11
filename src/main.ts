import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideAnimations } from '@angular/platform-browser/animations';
import { addIcons } from 'ionicons';
import {
  calendar,
  medkit,
  navigate,
  home,
  paw,
  people,
  add,
  checkmarkCircle,
  ellipseOutline,
  close,
  person,
  mail,
  eye,
  eyeOff,
  locationOutline,
  map,
  call,
  pawOutline,
  calendarOutline,
  medicalOutline,
  peopleOutline,
  sparklesOutline,
  constructOutline,
  flash,
  warning,
  thermometer,
  documentText,
  alert,
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { LOCALE_ID } from '@angular/core';

// Registrar iconos
addIcons({
  calendar,
  medkit,
  navigate,
  home,
  paw,
  people,
  add,
  checkmarkCircle,
  ellipseOutline,
  close,
  person,
  mail,
  eye,
  eyeOff,
  locationOutline,
  map,
  call,
  pawOutline,
  calendarOutline,
  medicalOutline,
  peopleOutline,
  sparklesOutline,
  constructOutline,
  flash,
  warning,
  thermometer,
  documentText,
  alert,
});

registerLocaleData(localeEs, 'es');

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
});
