import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Connexion — eFashion BI',
    loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'login' },
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Inscription — eFashion BI',
    loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent),
    data: { mode: 'register' },
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        title: 'Accueil — eFashion BI',
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'dashboards/:id',
        title: 'Dashboard — eFashion BI',
        loadComponent: () => import('./pages/viewer/viewer.component').then((m) => m.ViewerComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        title: 'Administration — eFashion BI',
        loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
