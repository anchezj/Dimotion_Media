import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/auth/auth.guards';
import { ClientDashboardComponent } from './client-dashboard.component';

const clientAccess = [authGuard, roleGuard];

export const clientRoutes: Routes = [
  {
    path: 'cliente',
    component: ClientDashboardComponent,
    canActivate: clientAccess,
    data: { roles: ['client'] },
  },
  {
    path: 'cliente/campanas',
    component: ClientDashboardComponent,
    canActivate: clientAccess,
    data: { roles: ['client'] },
  },
];
