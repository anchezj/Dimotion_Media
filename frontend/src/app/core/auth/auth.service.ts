import { Injectable } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'client';

const legacyDemoSessionKey = 'dimotion-local-session-v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabasePromise?: Promise<SupabaseClient>;

  constructor() {
    globalThis.localStorage.removeItem(legacyDemoSessionKey);
  }

  isConfigured(): boolean {
    return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  }

  private getSupabase(): Promise<SupabaseClient> | null {
    if (!this.isConfigured()) return null;
    this.supabasePromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(environment.supabaseUrl, environment.supabaseAnonKey),
    );
    return this.supabasePromise;
  }

  async getSession(): Promise<Session | null> {
    if (!this.isConfigured()) {
      globalThis.localStorage.removeItem(legacyDemoSessionKey);
      return null;
    }
    const clientPromise = this.getSupabase();
    if (!clientPromise) return null;
    const { data, error } = await (await clientPromise).auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getRole(clientName?: string): Promise<UserRole | null> {
    const session = await this.getSession();
    const clientPromise = this.getSupabase();
    if (!session || !clientPromise) return null;

    const { data, error } = await (await clientPromise)
      .from('usuarios')
      .select('rol, is_active, cliente_id')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data?.is_active) return null;
    if (data.rol !== 'admin' && (data.rol !== 'cliente' || !data.cliente_id)) return null;
    if (data.rol === 'admin' && (!clientName || clientName.trim().toLowerCase() === 'admin')) return 'admin';
    if (!data.cliente_id) return null;

    const { data: client, error: clientError } = await (await clientPromise)
      .from('clientes')
      .select('nombre_cliente, is_active')
      .eq('id', data.cliente_id)
      .maybeSingle();
    if (clientError) throw clientError;
    if (!client?.is_active) return null;
    if (clientName && client.nombre_cliente.trim().toLowerCase() !== clientName.trim().toLowerCase()) return null;
    return data.rol === 'admin' ? 'admin' : 'client';
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.isConfigured()) {
      globalThis.localStorage.removeItem(legacyDemoSessionKey);
      throw new Error('Configura la URL y la clave pública de Supabase para iniciar sesión.');
    }

    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Configura la URL y la clave pública de Supabase para iniciar sesión.');
    }
    const { error } = await (await clientPromise).auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
  }

  async requestAccount(
    email: string,
    clientName: string,
    requesterName: string,
    username: string,
    password: string,
  ): Promise<void> {
    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Configura la URL y la clave pública de Supabase para solicitar una cuenta.');
    }

    const { data, error } = await (await clientPromise).auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${globalThis.location.origin}/cliente`,
        data: {
          client_name: clientName.trim(),
          requester_name: requesterName.trim(),
          username: username.trim(),
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error('Supabase no devolvió el usuario registrado.');
  }

  async signOut(): Promise<void> {
    if (!this.isConfigured()) {
      globalThis.localStorage.removeItem(legacyDemoSessionKey);
      return;
    }

    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Supabase no está configurado.');
    }
    const { error } = await (await clientPromise).auth.signOut();
    if (error) throw error;
  }
}
