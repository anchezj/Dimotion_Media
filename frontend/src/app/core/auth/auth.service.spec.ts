import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService local demo accounts', () => {
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  it('signs into the client account and restores its local session', async () => {
    await auth.signIn('cliente@dimotion.test', 'Cliente123!');

    expect(await auth.getRole()).toBe('client');
    expect((await auth.getSession())?.user.email).toBe('cliente@dimotion.test');
  });

  it('signs into the admin account', async () => {
    await auth.signIn('admin@dimotion.test', 'Admin123!');

    expect(await auth.getRole()).toBe('admin');
  });

  it('rejects credentials that are not in the local demo account list', async () => {
    let caughtError: unknown;
    try {
      await auth.signIn('admin@dimotion.test', 'wrong-password');
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError instanceof Error).toBe(true);
    if (caughtError instanceof Error) {
      expect(caughtError.message).toBe(
        'Correo o contraseña incorrectos. Usa una de las cuentas locales de prueba.',
      );
    }
  });

  it('clears the local session when signing out', async () => {
    await auth.signIn('cliente@dimotion.test', 'Cliente123!');
    await auth.signOut();

    expect(await auth.getSession()).toBeNull();
  });
});
