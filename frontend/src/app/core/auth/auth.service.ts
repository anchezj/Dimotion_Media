import { Injectable } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabasePromise?: Promise<SupabaseClient>;

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

  async getSession() {
    const clientPromise = this.getSupabase();
    if (!clientPromise) return null;
    const { data, error } = await (await clientPromise).auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getRole(): Promise<UserRole | null> {
    const session = await this.getSession();
    const clientPromise = this.getSupabase();
    if (!session || !clientPromise) return null;

    const { data, error } = await (await clientPromise)
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (error) throw error;
    return data.role === 'admin' || data.role === 'client' ? data.role : null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Configura la URL y la clave pública de Supabase para iniciar sesión.');
    }
    const { error } = await (await clientPromise).auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async requestAccount(email: string, clientName: string, requesterName: string): Promise<void> {
    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Configura la URL y la clave pública de Supabase para solicitar una cuenta.');
    }

    const { error } = await (await clientPromise).auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${globalThis.location.origin}/cliente`,
        data: {
          client_name: clientName.trim(),
          requester_name: requesterName.trim(),
        },
      },
    });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Supabase no está configurado.');
    }
    const { error } = await (await clientPromise).auth.signOut();
    if (error) throw error;
  }
}
