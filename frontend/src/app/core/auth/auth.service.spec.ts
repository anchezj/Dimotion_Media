import { TestBed } from '@angular/core/testing';
import { afterEach } from 'vitest';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

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
});
