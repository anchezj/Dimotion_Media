import { Router } from 'express';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errors.js';
import { validateBody } from '../../middleware/validate.js';
import { getRequestSupabaseClient, throwSupabaseError } from '../shared/supabase-request.js';

const clientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
});

const activeSchema = z.object({ active: z.boolean() });
const closedCampaignsSchema = z.object({ count: z.number().int().min(0) });

export const clientRoutes = Router();

clientRoutes.get('/me', async (req, res, next) => {
  try {
    const supabase = getRequestSupabaseClient(req);
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('cliente_id')
      .eq('id', req.authContext!.userId)
      .maybeSingle();
    if (userError) throwSupabaseError(userError);
    if (!user?.cliente_id) throw new AppError(404, 'El usuario no tiene un cliente asociado.');
    const { data: client, error: clientError } = await supabase
      .from('clientes')
      .select('id, nombre_cliente, correo_contacto, is_active, campanas_cerradas, created_at')
      .eq('id', user.cliente_id)
      .maybeSingle();
    if (clientError) throwSupabaseError(clientError);
    if (!client) throw new AppError(404, 'No se encontró el cliente asociado.');
    res.json({
      id: client.id,
      name: client.nombre_cliente,
      email: client.correo_contacto ?? '',
      active: client.is_active,
      closedCampaigns: client.campanas_cerradas,
      createdAt: client.created_at,
    });
  } catch (error) {
    next(error);
  }
});

clientRoutes.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { data, error } = await getRequestSupabaseClient(req)
      .from('clientes')
      .select('id, nombre_cliente, correo_contacto, is_active, campanas_cerradas, created_at')
      .order('created_at', { ascending: false });
    if (error) throwSupabaseError(error);
    res.json((data ?? []).map((client) => ({
      id: client.id,
      name: client.nombre_cliente,
      email: client.correo_contacto ?? '',
      active: client.is_active,
      closedCampaigns: client.campanas_cerradas,
      createdAt: client.created_at,
    })));
  } catch (error) {
    next(error);
  }
});

clientRoutes.post('/', requireRole('admin'), validateBody(clientSchema), async (req, res, next) => {
  try {
    const { name, email } = req.body as z.infer<typeof clientSchema>;
    const { data, error } = await getRequestSupabaseClient(req)
      .from('clientes')
      .insert({ nombre_cliente: name, correo_contacto: email })
      .select('id, nombre_cliente, correo_contacto, is_active, campanas_cerradas, created_at')
      .single();
    if (error) throwSupabaseError(error);
    res.status(201).json({
      id: data.id,
      name: data.nombre_cliente,
      email: data.correo_contacto ?? '',
      active: data.is_active,
      closedCampaigns: data.campanas_cerradas,
      createdAt: data.created_at,
    });
  } catch (error) {
    next(error);
  }
});

clientRoutes.patch(
  '/:clientId/active',
  requireRole('admin'),
  validateBody(activeSchema),
  async (req, res, next) => {
    try {
      const { active } = req.body as z.infer<typeof activeSchema>;
      const { data, error } = await getRequestSupabaseClient(req)
        .from('clientes')
        .update({ is_active: active })
        .eq('id', req.params['clientId'])
        .select('id')
        .maybeSingle();
      if (error) throwSupabaseError(error);
      if (!data) throw new AppError(404, 'No se encontró el cliente.');
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

clientRoutes.patch(
  '/:clientId/closed-campaigns',
  requireRole('admin'),
  validateBody(closedCampaignsSchema),
  async (req, res, next) => {
    try {
      const { count } = req.body as z.infer<typeof closedCampaignsSchema>;
      const { data, error } = await getRequestSupabaseClient(req)
        .from('clientes')
        .update({ campanas_cerradas: count })
        .eq('id', req.params['clientId'])
        .select('id')
        .maybeSingle();
      if (error) throwSupabaseError(error);
      if (!data) throw new AppError(404, 'No se encontró el cliente.');
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);

clientRoutes.delete('/:clientId', requireRole('admin'), async (req, res, next) => {
  try {
    const supabase = getRequestSupabaseClient(req);
    const { count, error: campaignError } = await supabase
      .from('campanas')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', req.params['clientId']);
    if (campaignError) throwSupabaseError(campaignError);
    if (count) throw new AppError(409, 'El cliente tiene campañas asociadas. Inactívalo para conservar su historial.');

    const { count: userCount, error: userError } = await supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', req.params['clientId']);
    if (userError) throwSupabaseError(userError);
    if (userCount) throw new AppError(409, 'El cliente tiene usuarios asociados. Inactívalo para conservar sus cuentas.');

    const { data, error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', req.params['clientId'])
      .select('id')
      .maybeSingle();
    if (error) throwSupabaseError(error);
    if (!data) throw new AppError(404, 'No se encontró el cliente.');
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

clientRoutes.patch(
  '/:clientId',
  requireRole('admin'),
  validateBody(clientSchema),
  async (req, res, next) => {
    try {
      const { name, email } = req.body as z.infer<typeof clientSchema>;
      const { data, error } = await getRequestSupabaseClient(req)
        .from('clientes')
        .update({ nombre_cliente: name, correo_contacto: email })
        .eq('id', req.params['clientId'])
        .select('id')
        .maybeSingle();
      if (error) throwSupabaseError(error);
      if (!data) throw new AppError(404, 'No se encontró el cliente.');
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  },
);
