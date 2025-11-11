import { Routes } from '@angular/router';

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
  },
  {
    path: 'pet-profile',
    loadComponent: () => import('./pages/pet-profile/pet-profile.page').then((m) => m.PetProfilePage),
  },
  {
    path: 'care-calendar',
    loadComponent: () => import('./pages/care-calendar/care-calendar.page').then((m) => m.CareCalendarPage),
  },
  {
    path: 'emergencies',
    loadComponent: () => import('./pages/emergencies/emergencies.page').then((m) => m.EmergenciesPage),
  },
  {
    path: 'community',
    loadComponent: () => import('./pages/community/community.page').then((m) => m.CommunityPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
