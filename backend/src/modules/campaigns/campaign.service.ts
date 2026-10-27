import type { Request } from 'express';
import type { CampaignStatus, CampaignStage } from './campaign.validation.js';
import { AppError } from '../../middleware/errors.js';
import { getRequestSupabaseClient, throwSupabaseError } from '../shared/supabase-request.js';

const stages = ['pago', 'guion', 'grabacion', 'cambios', 'entrega'] as const;
const stageLabels = ['Pago', 'Guion', 'Grabación', 'Cambios', 'Entrega'] as const;

const stageLabelByValue: Record<CampaignStage, string> = {
  pago: 'Pago',
  guion: 'Guion',
  grabacion: 'Grabación',
  cambios: 'Cambios',
  entrega: 'Entrega',
};

function stageIndex(stage: CampaignStage): number {
  return stages.indexOf(stage);
}

export const campaignService = {
  async listForUser(req: Request) {
    const { data, error } = await getRequestSupabaseClient(req)
      .from('campanas')
      .select(`
        id, cliente_id, titulo, fecha, hora, etapa, estado, observaciones, created_at, closed_at,
        clientes!inner(nombre_cliente, campanas_cerradas),
        campana_etapas_historial(etapa, cambiado_en)
      `)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    if (error) throwSupabaseError(error);

    return (data ?? []).map((campaign) => {
      const history = Array.isArray(campaign.campana_etapas_historial)
        ? campaign.campana_etapas_historial
        : [];
      const stageDates = Array.from({ length: stageLabels.length }, () => '');
      for (const change of history) {
        const index = stages.indexOf(change.etapa);
        if (index >= 0) stageDates[index] = change.cambiado_en;
      }
      const client = Array.isArray(campaign.clientes) ? campaign.clientes[0] : campaign.clientes;
      return {
        id: campaign.id,
        clientId: campaign.cliente_id,
        clientName: client?.nombre_cliente ?? '',
        closedCampaigns: client?.campanas_cerradas ?? 0,
        title: campaign.titulo,
        date: campaign.fecha,
        time: String(campaign.hora).slice(0, 5),
        stageIndex: stageIndex(campaign.etapa),
        status: campaign.estado,
        observation: campaign.observaciones,
        createdAt: campaign.created_at,
        closedAt: campaign.closed_at,
        stageDates,
      };
    });
  },

  async create(req: Request, input: {
    clientId?: string;
    title: string;
    date: string;
    time: string;
  }) {
    if (!req.authContext) throw new AppError(401, 'Se requiere una sesión activa.');
    let clientId = input.clientId;
    if (req.authContext.role === 'client') {
      const { data: user, error: userError } = await getRequestSupabaseClient(req)
        .from('usuarios')
        .select('cliente_id')
        .eq('id', req.authContext.userId)
        .maybeSingle();
      if (userError) throwSupabaseError(userError);
      clientId = user?.cliente_id ?? undefined;
    }
    if (!clientId) throw new AppError(400, 'No se encontró el cliente asociado a la campaña.');

    const { data, error } = await getRequestSupabaseClient(req)
      .from('campanas')
      .insert({
        cliente_id: clientId,
        titulo: input.title,
        fecha: input.date,
        hora: input.time,
        solicitada_por: req.authContext.userId,
      })
      .select('id')
      .single();
    if (error) throwSupabaseError(error);
    return { id: data.id };
  },

  async update(req: Request, campaignId: string, input: {
    stageIndex?: number;
    status?: CampaignStatus;
    observation?: string;
  }) {
    const update: Record<string, unknown> = {};
    if (input.stageIndex !== undefined) {
      update['etapa'] = stages[input.stageIndex];
      if (input.stageIndex === stages.length - 1) update['estado'] = 'closed';
    }
    if (input.status !== undefined) update['estado'] = input.status;
    const nextStatus = input.status ?? (input.stageIndex === stages.length - 1 ? 'closed' : undefined);
    if (nextStatus === 'closed') update['closed_at'] = new Date().toISOString();
    else if (nextStatus === 'active' || nextStatus === 'paused') update['closed_at'] = null;
    if (input.observation !== undefined) update['observaciones'] = input.observation;
    if (!Object.keys(update).length) throw new AppError(400, 'No hay cambios de campaña para guardar.');

    const { data, error } = await getRequestSupabaseClient(req)
      .from('campanas')
      .update(update)
      .eq('id', campaignId)
      .select('id')
      .maybeSingle();
    if (error) throwSupabaseError(error);
    if (!data) throw new AppError(404, 'No se encontró la campaña.');
  },
};

export { stageLabelByValue };
