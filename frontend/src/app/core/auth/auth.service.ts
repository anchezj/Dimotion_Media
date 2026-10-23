import { Injectable } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'client';

interface DemoSession {
  access_token: null;
  user: {
    id: string;
    email: string;
    role: UserRole;
    user_metadata: Record<string, string>;
  };
}

interface DemoAccount {
  email: string;
  password: string;
  role: UserRole;
  id: string;
  clientName: string;
}

const demoSessionKey = 'dimotion-local-session-v1';
const demoAccounts: DemoAccount[] = [
  {
    email: 'cliente@dimotion.test',
    password: 'Cliente123!',
    role: 'client',
    id: 'dimotion-local-client',
    clientName: 'Ruta Norte Logística',
  },
  {
    email: 'admin@dimotion.test',
    password: 'Admin123!',
    role: 'admin',
    id: 'dimotion-local-admin',
    clientName: 'Administración Dimotion',
  },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabasePromise?: Promise<SupabaseClient>;

  isConfigured(): boolean {
    return Boolean(environment.supabaseUrl && environment.supabaseAnonKey);
  }

  isDemoMode(): boolean {
    return !this.isConfigured();
  }

  private getSupabase(): Promise<SupabaseClient> | null {
    if (!this.isConfigured()) return null;
    this.supabasePromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(environment.supabaseUrl, environment.supabaseAnonKey),
    );
    return this.supabasePromise;
  }

  async getSession(): Promise<Session | DemoSession | null> {
    if (!this.isConfigured()) return this.getDemoSession();
    const clientPromise = this.getSupabase();
    if (!clientPromise) return null;
    const { data, error } = await (await clientPromise).auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getRole(): Promise<UserRole | null> {
    const session = await this.getSession();
    if (
      session
      && 'role' in session.user
      && (session.user.role === 'admin' || session.user.role === 'client')
    ) return session.user.role;
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
    if (!this.isConfigured()) {
      const account = demoAccounts.find(
        (candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password,
      );
      if (!account) throw new Error('Correo o contraseña incorrectos. Usa una de las cuentas locales de prueba.');

      const session: DemoSession = {
        access_token: null,
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
          user_metadata: { client_name: account.clientName, full_name: account.clientName },
        },
      };
      globalThis.localStorage.setItem(demoSessionKey, JSON.stringify(session));
      return;
    }

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
    if (!this.isConfigured()) {
      globalThis.localStorage.removeItem(demoSessionKey);
      return;
    }

    const clientPromise = this.getSupabase();
    if (!clientPromise) {
      throw new Error('Supabase no está configurado.');
    }
    const { error } = await (await clientPromise).auth.signOut();
    if (error) throw error;
  }

  private getDemoSession(): DemoSession | null {
    const serialized = globalThis.localStorage.getItem(demoSessionKey);
    if (!serialized) return null;
    try {
      const value: unknown = JSON.parse(serialized);
      if (
        typeof value === 'object'
        && value !== null
        && 'user' in value
        && typeof value.user === 'object'
        && value.user !== null
        && 'id' in value.user
        && 'email' in value.user
        && 'role' in value.user
        && (value.user.role === 'admin' || value.user.role === 'client')
        && 'user_metadata' in value.user
      ) {
        return value as DemoSession;
      }
      globalThis.localStorage.removeItem(demoSessionKey);
      return null;
    } catch (error) {
      globalThis.localStorage.removeItem(demoSessionKey);
      console.error('No se pudo leer la sesión de demostración.', error);
      return null;
    }
  }
}
