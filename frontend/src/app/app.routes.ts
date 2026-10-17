import { Routes } from '@angular/router';
import { adminRoutes } from './features/admin/admin.routes';
import { authRoutes } from './features/auth/auth.routes';
import { brandRoutes } from './features/brands/brand.routes';
import { campaignTrackingRoutes } from './features/campaign-tracking/campaign-tracking.routes';
import { clientRoutes } from './features/client/client.routes';
import { modelRoutes } from './features/models/model.routes';
import { packageRoutes } from './features/packages/package.routes';
import { publicRoutes } from './features/public/public.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...publicRoutes,
  ...authRoutes,
  ...clientRoutes,
  ...campaignTrackingRoutes,
  ...adminRoutes,
  ...brandRoutes,
  ...packageRoutes,
  ...modelRoutes,
  { path: '**', redirectTo: '' },
];
