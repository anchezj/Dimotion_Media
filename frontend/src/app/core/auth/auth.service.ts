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
      .select('rol, is_active, cliente_id, debe_cambiar_contrasena')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data?.is_active) return null;
    if (data.rol !== 'admin' && (data.rol !== 'cliente' || !data.cliente_id)) return null;
    if (data.rol === 'admin' && (!clientName || clientName.trim().toLowerCase() === 'admin')) return 'admin';
    if (data.rol === 'cliente' && data.debe_cambiar_contrasena) return 'client';
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

  async mustChangePassword(): Promise<boolean> {
    const session = await this.getSession();
    const clientPromise = this.getSupabase();
    if (!session || !clientPromise) return false;
    const { data, error } = await (await clientPromise)
      .from('usuarios')
      .select('debe_cambiar_contrasena')
      .eq('id', session.user.id)
      .maybeSingle();
    if (error) throw error;
    return data?.debe_cambiar_contrasena ?? false;
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
    phone: string,
  ): Promise<void> {
    let notification: Response;
    try {
      notification = await globalThis.fetch(`${environment.apiUrl}/account-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          requesterName: requesterName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });
    } catch {
      throw new Error('No se pudo enviar la solicitud a Dimotion. Inténtalo nuevamente más tarde.');
    }
    if (!notification.ok) {
      const body = await notification.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? 'No se pudo enviar la solicitud a Dimotion. Inténtalo nuevamente más tarde.');
    }
  }

  async changePassword(password: string): Promise<void> {
    const session = await this.getSession();
    if (!session?.access_token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    let response: Response;
    try {
      response = await globalThis.fetch(`${environment.apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ password }),
      });
    } catch {
      throw new Error('No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    }
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    }
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
