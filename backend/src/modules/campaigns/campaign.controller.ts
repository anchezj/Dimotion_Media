import type { RequestHandler } from 'express';
import { AppError } from '../../middleware/errors.js';
import { campaignService } from './campaign.service.js';

export const listCampaigns: RequestHandler = async (req, res, next) => {
  try {
    res.json(await campaignService.listForUser(req));
  } catch (error) {
    next(error);
  }
};

export const createCampaign: RequestHandler = async (req, res, next) => {
  try {
    const campaign = await campaignService.create(req, req.body);
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
};

export const updateCampaign: RequestHandler = async (req, res, next) => {
  try {
    const campaignId = req.params['campaignId'];
    if (typeof campaignId !== 'string') throw new AppError(400, 'El identificador de campaña no es válido.');
    await campaignService.update(req, campaignId, req.body);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
