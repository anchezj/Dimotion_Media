import { Router } from 'express';
import { z } from 'zod';
import { createSupabaseAdminClient } from '../../config/supabase.js';
import { AppError } from '../../middleware/errors.js';
import { validateBody } from '../../middleware/validate.js';

const passwordSchema = z.object({
  password: z.string().min(12).max(128),
});

export const passwordRoutes = Router();

passwordRoutes.post('/change-password', validateBody(passwordSchema), async (req, res, next) => {
  try {
    const userId = req.authContext?.userId;
    if (!userId) throw new AppError(401, 'Se requiere una sesión activa.');
    const supabase = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('debe_cambiar_contrasena')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.debe_cambiar_contrasena) {
      throw new AppError(409, 'Esta cuenta no requiere un cambio inicial de contraseña.');
    }

    const { error: passwordError } = await supabase.auth.admin.updateUserById(userId, {
      password: req.body.password,
    });
    if (passwordError) throw passwordError;

    const { data, error } = await supabase
      .from('usuarios')
      .update({ debe_cambiar_contrasena: false })
      .eq('id', userId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError(404, 'No se encontró el perfil del usuario.');

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
