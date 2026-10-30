import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

const supabaseMocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: supabaseMocks.createClient,
}));

describe('AuthService without Supabase configuration', () => {
  const configuredEnvironment = { ...environment };
  let auth: AuthService;

  beforeEach(() => {
    environment.supabaseUrl = '';
    environment.supabaseAnonKey = '';
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    Object.assign(environment, configuredEnvironment);
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('does not create or restore a local session', async () => {
    localStorage.setItem('dimotion-local-session-v1', JSON.stringify({ user: { role: 'admin' } }));

    expect(await auth.getSession()).toBeNull();
    expect(localStorage.getItem('dimotion-local-session-v1')).toBeNull();
  });

  it('removes any old local account session when the service starts', () => {
    localStorage.setItem('dimotion-local-session-v1', JSON.stringify({ user: { role: 'admin' } }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);

    expect(localStorage.getItem('dimotion-local-session-v1')).toBeNull();
  });

  it('requires Supabase to sign in', async () => {
    await expect(auth.signIn('user@example.com', 'password')).rejects.toThrow(
      'Configura la URL y la clave pública de Supabase para iniciar sesión.',
    );
  });

  it('renews the Supabase session with the new password after the backend updates it', async () => {
    environment.supabaseUrl = 'https://example.supabase.co';
    environment.supabaseAnonKey = 'public-key';
    const session = {
      access_token: 'old-access-token',
      user: { id: 'user-id', email: 'client@example.com' },
    };
    supabaseMocks.getSession.mockResolvedValue({ data: { session }, error: null });
    supabaseMocks.signInWithPassword.mockResolvedValue({ data: { session: {} }, error: null });
    supabaseMocks.createClient.mockReturnValue({
      auth: {
        getSession: supabaseMocks.getSession,
        signInWithPassword: supabaseMocks.signInWithPassword,
      },
    });
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);

    await auth.changePassword('a-secure-new-password');

    expect(fetch).toHaveBeenCalledWith(
      `${environment.apiUrl}/auth/change-password`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer old-access-token' }),
      }),
    );
    expect(supabaseMocks.signInWithPassword).toHaveBeenCalledWith({
      email: 'client@example.com',
      password: 'a-secure-new-password',
    });
  });
});
