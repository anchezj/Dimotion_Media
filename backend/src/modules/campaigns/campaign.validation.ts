import { z } from 'zod';

export type CampaignStage = 'pago' | 'guion' | 'grabacion' | 'cambios' | 'entrega';
export type CampaignStatus = 'active' | 'paused' | 'closed';
