import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export function createSupabaseClient(accessToken: string) {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY deben configurarse para usar rutas autenticadas.');
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseSecretKey) {
    throw new Error('SUPABASE_URL y SUPABASE_SECRET_KEY deben configurarse para crear cuentas de clientes.');
  }

  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
