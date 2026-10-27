import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/auth/auth.guards';
import { AdminDashboardComponent } from './admin-dashboard.component';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/campanas',
  },
  {
    path: 'admin/campanas',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/campanas-cerradas',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/clientes',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/usuarios',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
];
