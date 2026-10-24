import type { RequestHandler } from 'express';
import type { UserRole } from '../modules/users/user.types.js';
import { env } from '../config/env.js';
import { createSupabaseClient } from '../config/supabase.js';
import { AppError } from './errors.js';

declare global {
  namespace Express {
    interface Request {
      authContext?: { userId: string; role: UserRole };
    }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const authorization = req.header('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    next(new AppError(401, 'Se requiere un token Bearer válido.'));
    return;
  }

  try {
    if (!env.supabaseUrl || !env.supabaseAnonKey) {
      next(new AppError(503, 'La autenticación de Supabase no está configurada en el servidor.'));
      return;
    }
    const supabase = createSupabaseClient(accessToken);
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !user) {
      next(new AppError(401, 'La sesión no es válida o ha expirado.'));
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('rol, is_active, cliente_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (
      !profile?.is_active
      || (profile.rol !== 'admin' && profile.rol !== 'cliente')
    ) {
      next(new AppError(403, 'El perfil no tiene un rol autorizado.'));
      return;
    }

    if (profile.rol === 'cliente') {
      if (!profile.cliente_id) {
        next(new AppError(403, 'El usuario no está asociado a un cliente activo.'));
        return;
      }
      const { data: client, error: clientError } = await supabase
        .from('clientes')
        .select('is_active')
        .eq('id', profile.cliente_id)
        .maybeSingle();
      if (clientError) throw clientError;
      if (!client?.is_active) {
        next(new AppError(403, 'El cliente está inactivo.'));
        return;
      }
    }

    req.authContext = {
      userId: user.id,
      role: profile.rol === 'admin' ? 'admin' : 'client',
    };
    next();
  } catch (error) {
    next(error);
  }
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.authContext || !roles.includes(req.authContext.role)) {
      next(new AppError(403, 'No tienes permisos para realizar esta operación.'));
      return;
    }
    next();
  };
}
