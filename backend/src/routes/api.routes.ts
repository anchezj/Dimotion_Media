import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { notImplemented } from '../middleware/not-implemented.js';
import { brandRoutes } from '../modules/brands/brand.routes.js';
import { campaignRoutes } from '../modules/campaigns/campaign.routes.js';
import { modelRoutes } from '../modules/models/model.routes.js';
import { packageRoutes } from '../modules/packages/package.routes.js';
import { reservationRoutes } from '../modules/reservations/reservation.routes.js';
import { userRoutes } from '../modules/users/user.routes.js';
import { clientRoutes } from '../modules/clients/client.routes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'dimotion-api' });
});

apiRoutes.use('/campaigns', requireAuth, campaignRoutes);
apiRoutes.use('/clients', requireAuth, clientRoutes);
apiRoutes.use('/brands', requireAuth, brandRoutes);
apiRoutes.use('/packages', requireAuth, packageRoutes);
apiRoutes.use('/models', requireAuth, modelRoutes);
apiRoutes.use('/users', requireAuth, userRoutes);
apiRoutes.use('/reservations', requireAuth, reservationRoutes);
apiRoutes.use('/', notImplemented);
