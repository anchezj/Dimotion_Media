import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guards';
import { LoginComponent } from './login.component';
import { LogoutComponent } from './logout.component';
import { RequestAccountComponent } from './request-account.component';
import { ChangePasswordComponent } from './change-password.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'solicitar-cuenta', component: RequestAccountComponent },
  { path: 'cambiar-contrasena', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'logout', component: LogoutComponent, canActivate: [authGuard] },
];
