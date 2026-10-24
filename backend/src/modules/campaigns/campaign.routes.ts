import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createCampaign, listCampaigns, updateCampaign } from './campaign.controller.js';

const createCampaignSchema = z.object({
  clientId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  date: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateCampaignSchema = z.object({
  stageIndex: z.number().int().min(0).max(4).optional(),
  status: z.enum(['active', 'paused', 'closed']).optional(),
  observation: z.string().max(2000).optional(),
}).refine((input) => Object.keys(input).length > 0);

export const campaignRoutes = Router();

campaignRoutes.get('/', listCampaigns);
campaignRoutes.post(
  '/',
  requireRole('admin', 'client'),
  validateBody(createCampaignSchema),
  createCampaign,
);
campaignRoutes.patch(
  '/:campaignId',
  requireRole('admin'),
  validateBody(updateCampaignSchema),
  updateCampaign,
);
