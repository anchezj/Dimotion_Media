import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { createSupabaseAdminClient } from '../../config/supabase.js';
import { requireRole } from '../../middleware/auth.js';
import { AppError } from '../../middleware/errors.js';
import { validateBody } from '../../middleware/validate.js';
import { getRequestSupabaseClient, throwSupabaseError } from '../shared/supabase-request.js';
import { sendClientCredentialsEmail } from '../account-requests/account-request.mailer.js';

const clientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(25).regex(/^\+?[0-9\s().-]+$/),
});

const createClientSchema = clientSchema.extend({
  username: z.string().trim().min(1).max(120).regex(/^[^\r\n]*$/),
});
const updateClientSchema = clientSchema.extend({
  username: z.string().trim().min(1).max(120).regex(/^[^\r\n]*$/).optional(),
});

const activeSchema = z.object({ active: z.boolean() });
const closedCampaignsSchema = z.object({ count: z.number().int().min(0) });

export const clientRoutes = Router();

clientRoutes.get('/users', requireRole('admin'), async (req, res, next) => {
  try {
    const supabase = getRequestSupabaseClient(req);
    const [usersResult, clientsResult] = await Promise.all([
      supabase
        .from('usuarios')
        .select('id, cliente_id, nombre_usuario, correo_electronico, rol, is_active, deleted_at, created_at'),
      supabase
        .from('clientes')
        .select('id, nombre_cliente, telefono_contacto, is_active, deleted_at'),
    ]);
    if (usersResult.error) throwSupabaseError(usersResult.error);
    if (clientsResult.error) throwSupabaseError(clientsResult.error);
    const clients = new Map((clientsResult.data ?? []).map((client) => [client.id, client]));
    res.json((usersResult.data ?? []).map((user) => {
      const client = user.cliente_id ? clients.get(user.cliente_id) : undefined;
      return {
        id: user.id,
        clientId: user.cliente_id,
        clientName: client?.nombre_cliente ?? (user.rol === 'admin' ? 'Administración Dimotion' : ''),
        phone: client?.telefono_contacto ?? '',
        username: user.nombre_usuario,
        email: user.correo_electronico,
        role: user.rol,
        active: user.is_active && Boolean(client?.is_active ?? true),
        deleted: Boolean(user.deleted_at || client?.deleted_at),
        createdAt: user.created_at,
      };
    }));
  } catch (error) {
    next(error);
  }
});

clientRoutes.get('/me', async (req, res, next) => {
  try {
    const supabase = getRequestSupabaseClient(req);
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('cliente_id, nombre_usuario')
      .eq('id', req.authContext!.userId)
      .maybeSingle();
    if (userError) throwSupabaseError(userError);
    if (!user?.cliente_id) throw new AppError(404, 'El usuario no tiene un cliente asociado.');
    const { data: client, error: clientError } = await supabase
      .from('clientes')
      .select('id, nombre_cliente, correo_contacto, telefono_contacto, is_active, deleted_at, campanas_cerradas, created_at')
      .is('deleted_at', null)
      .eq('id', user.cliente_id)
      .maybeSingle();
    if (clientError) throwSupabaseError(clientError);
    if (!client) throw new AppError(404, 'No se encontró el cliente asociado.');
    res.json({
      id: client.id,
      name: client.nombre_cliente,
      email: client.correo_contacto ?? '',
      phone: client.telefono_contacto ?? '',
      username: user.nombre_usuario,
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
    const supabase = getRequestSupabaseClient(req);
    const [clientsResult, usersResult] = await Promise.all([
      supabase
      .from('clientes')
      .select('id, nombre_cliente, correo_contacto, telefono_contacto, is_active, deleted_at, campanas_cerradas, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
      supabase.from('usuarios').select('cliente_id, nombre_usuario').eq('rol', 'cliente'),
    ]);
    if (clientsResult.error) throwSupabaseError(clientsResult.error);
    if (usersResult.error) throwSupabaseError(usersResult.error);
    const usernames = new Map((usersResult.data ?? [])
      .filter((user) => user.cliente_id)
      .map((user) => [user.cliente_id!, user.nombre_usuario]));
    res.json((clientsResult.data ?? []).map((client) => ({
      id: client.id,
      name: client.nombre_cliente,
      email: client.correo_contacto ?? '',
      phone: client.telefono_contacto ?? '',
      username: usernames.get(client.id) ?? '',
      active: client.is_active,
      closedCampaigns: client.campanas_cerradas,
      createdAt: client.created_at,
    })));
  } catch (error) {
    next(error);
  }
});

clientRoutes.post('/', requireRole('admin'), validateBody(createClientSchema), async (req, res, next) => {
  let clientId: string | undefined;
  let authUserId: string | undefined;
  try {
    const { name, email, phone, username } = req.body as z.infer<typeof createClientSchema>;
    const supabase = createSupabaseAdminClient();
    const { data: client, error: clientError } = await supabase
      .from('clientes')
      .insert({ nombre_cliente: name, correo_contacto: email, telefono_contacto: phone })
      .select('id, nombre_cliente, correo_contacto, telefono_contacto, is_active, campanas_cerradas, created_at')
      .single();
    if (clientError) throwSupabaseError(clientError);
    clientId = client.id;

    const temporaryPassword = randomBytes(24).toString('base64url');
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { client_name: name, username },
    });
    if (createUserError) throwSupabaseError(createUserError);
    authUserId = createdUser.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .update({
        cliente_id: client.id,
        nombre_usuario: username,
        correo_electronico: email,
        rol: 'cliente',
        is_active: true,
        debe_cambiar_contrasena: true,
      })
      .eq('id', createdUser.user.id)
      .select('id')
      .maybeSingle();
    if (profileError) throwSupabaseError(profileError);
    if (!profile) {
      throw new AppError(500, 'No se creó el perfil del usuario. Verifica el trigger de creación de perfiles en Supabase.');
    }

    await sendClientCredentialsEmail({ clientName: name, username, email, temporaryPassword });

    res.status(201).json({
      id: client.id,
      name: client.nombre_cliente,
      email: client.correo_contacto ?? '',
      phone: client.telefono_contacto ?? '',
      username,
      active: client.is_active,
      closedCampaigns: client.campanas_cerradas,
      createdAt: client.created_at,
      message: 'Cliente creado y credenciales enviadas por correo.',
    });
  } catch (error) {
    if (clientId) {
      const admin = createSupabaseAdminClient();
      if (authUserId) {
        const { error: deleteUserError } = await admin.auth.admin.deleteUser(authUserId);
        if (deleteUserError) console.error('No se pudo revertir el usuario tras fallar la creación del cliente.', deleteUserError);
      }
      const { error: deleteClientError } = await admin.from('clientes').delete().eq('id', clientId);
      if (deleteClientError) console.error('No se pudo revertir el cliente tras fallar su creación.', deleteClientError);
    }
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
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from('clientes')
        .update({ is_active: active })
        .eq('id', req.params['clientId'])
        .is('deleted_at', null)
        .select('id')
        .maybeSingle();
        if (error) throwSupabaseError(error);
        if (!data) throw new AppError(404, 'No se encontró el cliente.');
        const { error: usersError } = await supabase
          .from('usuarios')
          .update({ is_active: active })
          .eq('cliente_id', req.params['clientId'])
          .eq('rol', 'cliente')
          .is('deleted_at', null);
        if (usersError) throwSupabaseError(usersError);
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

clientRoutes.patch('/:clientId/restore', requireRole('admin'), async (req, res, next) => {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('clientes')
      .update({ is_active: true, deleted_at: null })
      .eq('id', req.params['clientId'])
      .not('deleted_at', 'is', null)
      .select('id')
      .maybeSingle();
    if (error) throwSupabaseError(error);
    if (!data) throw new AppError(404, 'No se encontró un cliente eliminado.');
    const { error: userError } = await supabase
      .from('usuarios')
      .update({ is_active: true, deleted_at: null })
      .eq('cliente_id', req.params['clientId'])
      .eq('rol', 'cliente');
    if (userError) throwSupabaseError(userError);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

clientRoutes.delete('/:clientId', requireRole('admin'), async (req, res, next) => {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: client, error: clientError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', req.params['clientId'])
      .is('deleted_at', null)
      .maybeSingle();
    if (clientError) throwSupabaseError(clientError);
    if (!client) throw new AppError(404, 'No se encontró el cliente.');

    const deletedAt = new Date().toISOString();
    const { error: userError } = await supabase
      .from('usuarios')
      .update({ is_active: false, deleted_at: deletedAt })
      .eq('cliente_id', client.id)
      .eq('rol', 'cliente');
    if (userError) throwSupabaseError(userError);

    const { error } = await supabase
      .from('clientes')
      .update({ is_active: false, deleted_at: deletedAt })
      .eq('id', client.id);
    if (error) {
      const { error: rollbackError } = await supabase
        .from('usuarios')
        .update({ is_active: true, deleted_at: null })
        .eq('cliente_id', client.id)
        .eq('rol', 'cliente');
      if (rollbackError) console.error('No se pudo revertir la inactivación de usuarios después de fallar el archivado.', rollbackError);
      throwSupabaseError(error);
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
clientRoutes.patch(
  '/:clientId',
  requireRole('admin'),
  validateBody(updateClientSchema),
  async (req, res, next) => {
    try {
      const { name, email, phone, username } = req.body as z.infer<typeof updateClientSchema>;
      const supabase = createSupabaseAdminClient();
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id, correo_electronico, nombre_usuario')
        .eq('cliente_id', req.params['clientId'])
        .eq('rol', 'cliente');
      if (usersError) throwSupabaseError(usersError);
      if (username && users.length !== 1) {
        throw new AppError(409, 'No se puede cambiar el usuario: el cliente debe tener exactamente una cuenta asociada.');
      }

      const user = users.length === 1 ? users[0] : null;
      if (user && user.correo_electronico.toLowerCase() !== email.toLowerCase()) {
        const { error: authUserError } = await supabase.auth.admin.updateUserById(user.id, {
          email,
          email_confirm: true,
        });
        if (authUserError) throwSupabaseError(authUserError);
      }
      if (user && (username || user.correo_electronico.toLowerCase() !== email.toLowerCase())) {
        const { error: profileError } = await supabase
          .from('usuarios')
          .update({
            ...(username ? { nombre_usuario: username } : {}),
            correo_electronico: email,
          })
          .eq('id', user.id);
        if (profileError) throwSupabaseError(profileError);
      }

      const { data, error } = await supabase
        .from('clientes')
        .update({ nombre_cliente: name, correo_contacto: email, telefono_contacto: phone })
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
