import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'pet-profile',
    loadComponent: () => import('./pages/pet-profile/pet-profile.page').then((m) => m.PetProfilePage),
    canActivate: [AuthGuard],
  },
  {
    path: 'care-calendar',
    loadComponent: () => import('./pages/care-calendar/care-calendar.page').then((m) => m.CareCalendarPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'emergencies',
    loadComponent: () => import('./pages/emergencies/emergencies.page').then((m) => m.EmergenciesPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'community',
    loadComponent: () => import('./pages/community/community.page').then((m) => m.CommunityPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'nearby-services',
    loadComponent: () => import('./pages/nearby-services/nearby-services.page').then((m) => m.NearbyServicesPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'debug',
    loadComponent: () => import('./pages/debug/debug.page').then((m) => m.DebugPage),
    canActivate: [AuthGuard],
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
