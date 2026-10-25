import type { Request } from 'express';
import { createSupabaseClient } from '../../config/supabase.js';
import { AppError } from '../../middleware/errors.js';

export function getRequestSupabaseClient(req: Request) {
  const accessToken = req.header('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) throw new AppError(401, 'Se requiere una sesión activa.');
  return createSupabaseClient(accessToken);
}

export function throwSupabaseError(error: { message: string; code?: string }): never {
  if (
    error.code === '42703'
    || error.code === '42P01'
    || error.code === 'PGRST204'
    || error.code === 'PGRST205'
  ) {
    throw new AppError(
      503,
      'Falta actualizar el esquema de Supabase. Ejecuta supabase/setup.sql completo en el SQL Editor y vuelve a intentarlo.',
    );
  }
  if (error.code === '23505') {
    throw new AppError(409, 'Ya existe un registro con esos datos.');
  }
  if (error.code === '23503') {
    throw new AppError(409, 'El registro está relacionado con otros datos y no puede eliminarse.');
  }
  if (error.code === '42501') {
    throw new AppError(403, 'No tienes permiso para realizar esta operación.');
  }
  throw new Error(error.message);
}
