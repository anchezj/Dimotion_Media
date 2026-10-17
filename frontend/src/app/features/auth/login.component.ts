import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-layout" aria-labelledby="login-title">
      <div class="brand-panel">
        <img class="brand-logo" src="/dimotion-logo.png" alt="Dimotion Media">
        <div class="brand-message">
          <p>TU MARCA<br>TIENE ALGO QUE DECIR.</p>
          <span>algo que decir.</span>
        </div>
      </div>

      <div class="form-panel">
        <h1 id="login-title">Iniciar sesión</h1>
        <p class="form-intro">Entra al portal de clientes Dimotion.</p>
        @if (!auth.isConfigured()) {
          <p class="notice" role="status">Configura la URL y la clave pública de Supabase para habilitar el acceso.</p>
        }
        <form (ngSubmit)="submit()">
          <label>
            Usuario
            <input name="email" type="email" [(ngModel)]="email" required autocomplete="username" placeholder="Correo electrónico">
          </label>
          <label>
            Contraseña
            <input name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" placeholder="Contraseña">
          </label>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          <button type="submit" [disabled]="submitting()">
            {{ submitting() ? 'INGRESANDO…' : 'INICIAR SESIÓN' }}
          </button>
        </form>
        <p class="account-prompt">¿No tienes cuenta de cliente?</p>
        <a class="text-link" routerLink="/solicitar-cuenta">Solicita tu usuario aquí</a>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; width: min(100%, 1120px); }
    .auth-layout { align-items: center; display: grid; gap: clamp(3rem, 8vw, 8rem); grid-template-columns: 1.1fr .9fr; min-height: min(72vh, 650px); }
    .brand-panel { display: grid; justify-items: center; }
    .brand-logo { display: block; height: auto; margin-bottom: 2rem; max-width: 220px; width: 62%; }
    .brand-message { background: #121212; padding: .6rem .8rem .9rem; }
    .brand-message p { color: #f0efec; font-size: clamp(2rem, 4vw, 3.1rem); font-weight: 900; letter-spacing: -.055em; line-height: .92; margin: 0; }
    .brand-message span { color: #ff9418; font-family: Georgia, serif; font-size: clamp(1.8rem, 4vw, 2.9rem); font-style: italic; font-weight: 700; }
    .form-panel { margin: 0 auto; max-width: 360px; width: 100%; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); letter-spacing: -.04em; margin: 0 0 .5rem; }
    .form-intro, .account-prompt { color: #c6c2bc; font-size: .92rem; }
    form, label { display: grid; gap: .6rem; }
    form { gap: 1.2rem; margin: 2rem 0 1.4rem; }
    label { color: #e5e0d9; font-size: .86rem; }
    input { background: #080808; border: 1px solid #bd6711; border-radius: 999px; color: #fff; font: inherit; min-height: 44px; outline: none; padding: .7rem 1rem; }
    input:focus { border-color: #ff9b20; box-shadow: 0 0 0 2px #ff9b2033; }
    input::placeholder { color: #85817b; }
    button { background: #724a35; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font: inherit; justify-self: center; margin-top: .35rem; min-height: 42px; padding: .7rem 1.25rem; }
    button:hover:not(:disabled) { background: #995b35; }
    button:disabled { cursor: wait; opacity: .65; }
    .account-prompt { margin: 0 0 .35rem; text-align: center; }
    .text-link { color: #16b8fa; display: block; font-size: .92rem; text-align: center; text-decoration: none; }
    .text-link:hover { text-decoration: underline; }
    .notice, .error { border-radius: .5rem; font-size: .88rem; line-height: 1.5; padding: .8rem 1rem; }
    .notice { background: #20170d; border: 1px solid #6e451a; color: #f6c17d; }
    .error { background: #271212; color: #ffaaa2; }
    @media (max-width: 700px) {
      .auth-layout { gap: 2.5rem; grid-template-columns: 1fr; padding: 1rem 0; }
      .brand-logo { margin-bottom: 1rem; max-width: 175px; }
      .brand-message p { font-size: clamp(1.7rem, 8vw, 2.4rem); }
      .brand-message span { font-size: clamp(1.6rem, 7vw, 2.2rem); }
      .form-panel { max-width: 420px; }
    }
  `,
})
export class LoginComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly error = signal('');
  readonly submitting = signal(false);
  email = '';
  password = '';

  async submit(): Promise<void> {
    this.error.set('');
    this.submitting.set(true);
    try {
      await this.auth.signIn(this.email.trim(), this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/cliente';
      await this.router.navigateByUrl(returnUrl);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible iniciar sesión.');
    } finally {
      this.submitting.set(false);
    }
  }
}
