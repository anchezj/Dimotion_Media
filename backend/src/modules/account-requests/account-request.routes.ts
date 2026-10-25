import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { validateBody } from '../../middleware/validate.js';
import { sendAccountRequestEmail } from './account-request.mailer.js';

const accountRequestSchema = z.object({
  clientName: z.string().trim().min(1).max(160).regex(/^[^\r\n]*$/),
  requesterName: z.string().trim().min(1).max(120).regex(/^[^\r\n]*$/),
  email: z.email().trim().max(254),
  phone: z.string().trim().min(7).max(25).regex(/^\+?[0-9\s().-]+$/),
});

export const accountRequestRoutes = Router();

accountRequestRoutes.post(
  '/',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
  validateBody(accountRequestSchema),
  async (req, res, next) => {
    try {
      await sendAccountRequestEmail(req.body);
      res.status(202).json({ message: 'La solicitud fue enviada a Dimotion.' });
    } catch (error) {
      next(error);
    }
  },
);
