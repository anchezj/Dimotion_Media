import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-request-account',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="auth-layout" aria-labelledby="request-title">
      <div class="form-panel">
        <h1 id="request-title">Solicita tu cuenta</h1>
        <p class="form-intro">Déjanos tus datos y te enviaremos un enlace para verificar tu correo.</p>
        <form (ngSubmit)="submit()">
          <label>
            Cliente
            <input name="clientName" type="text" [(ngModel)]="clientName" required maxlength="160" autocomplete="organization" placeholder="Nombre de tu empresa o marca">
          </label>
          <label>
            Nombre de la persona solicitante
            <input name="requesterName" type="text" [(ngModel)]="requesterName" required maxlength="120" autocomplete="name" placeholder="Nombre completo">
          </label>
          <label>
            Nombre de usuario
            <input name="username" type="text" [(ngModel)]="username" required maxlength="120" autocomplete="username" placeholder="Elige tu usuario para iniciar sesión">
          </label>
          <label>
            Correo electrónico
            <input name="email" type="email" [(ngModel)]="email" required autocomplete="email" placeholder="nombre@empresa.com">
          </label>
          <label>
            Contraseña
            <input name="password" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres">
          </label>
          @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
          @if (success()) { <p class="success" role="status">{{ success() }}</p> }
          <button type="submit" [disabled]="submitting()">
            {{ submitting() ? 'ENVIANDO…' : 'SOLICITAR CUENTA' }}
          </button>
        </form>
        <p class="account-prompt">¿Ya tienes una cuenta?</p>
        <a class="text-link" routerLink="/login">Inicia sesión</a>
      </div>

      <div class="brand-panel">
        <img class="brand-logo" src="/dimotion-logo.png" alt="Dimotion Media">
        <div class="brand-message">
          <p>NO SOLO CREAMOS<br>CONTENIDO.</p>
          <span>creamos presencia.</span>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; width: min(100%, 1120px); }
    .auth-layout { align-items: center; display: grid; gap: clamp(3rem, 8vw, 8rem); grid-template-columns: .9fr 1.1fr; min-height: min(72vh, 650px); }
    .form-panel { margin: 0 auto; max-width: 380px; width: 100%; }
    h1 { font-size: clamp(1.8rem, 4vw, 2.5rem); letter-spacing: -.04em; margin: 0 0 .5rem; }
    .form-intro, .account-prompt { color: #c6c2bc; font-size: .92rem; line-height: 1.5; }
    form, label { display: grid; gap: .6rem; }
    form { gap: 1rem; margin: 1.5rem 0 1.2rem; }
    label { color: #e5e0d9; font-size: .86rem; }
    input { background: #080808; border: 1px solid #bd6711; border-radius: 999px; color: #fff; font: inherit; min-height: 42px; outline: none; padding: .65rem 1rem; }
    input:focus { border-color: #ff9b20; box-shadow: 0 0 0 2px #ff9b2033; }
    input::placeholder { color: #85817b; }
    button { background: #724a35; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font: inherit; justify-self: center; margin-top: .35rem; min-height: 42px; padding: .7rem 1.25rem; }
    button:hover:not(:disabled) { background: #995b35; }
    button:disabled { cursor: wait; opacity: .65; }
    .account-prompt { margin: 0 0 .35rem; text-align: center; }
    .text-link { color: #16b8fa; display: block; font-size: .92rem; text-align: center; text-decoration: none; }
    .text-link:hover { text-decoration: underline; }
    .error, .success { border-radius: .5rem; font-size: .88rem; line-height: 1.5; padding: .8rem 1rem; }
    .error { background: #271212; color: #ffaaa2; }
    .success { background: #102018; border: 1px solid #285d3f; color: #9ce0b6; }
    .brand-panel { display: grid; justify-items: center; }
    .brand-logo { display: block; height: auto; margin-bottom: 2rem; max-width: 220px; width: 62%; }
    .brand-message { background: #121212; padding: .6rem .8rem .9rem; }
    .brand-message p { color: #f0efec; font-size: clamp(2rem, 4vw, 3.1rem); font-weight: 900; letter-spacing: -.055em; line-height: .92; margin: 0; }
    .brand-message span { color: #ff9418; font-family: Georgia, serif; font-size: clamp(1.8rem, 4vw, 2.9rem); font-style: italic; font-weight: 700; }
    @media (max-width: 700px) {
      .auth-layout { gap: 2.5rem; grid-template-columns: 1fr; padding: 1rem 0; }
      .brand-panel { grid-row: 1; }
      .brand-logo { margin-bottom: 1rem; max-width: 175px; }
      .brand-message p { font-size: clamp(1.7rem, 8vw, 2.4rem); }
      .brand-message span { font-size: clamp(1.6rem, 7vw, 2.2rem); }
      .form-panel { max-width: 420px; }
    }
  `,
})
export class RequestAccountComponent {
  readonly auth = inject(AuthService);
  readonly error = signal('');
  readonly success = signal('');
  readonly submitting = signal(false);
  clientName = '';
  requesterName = '';
  username = '';
  email = '';
  password = '';

  async submit(): Promise<void> {
    this.error.set('');
    this.success.set('');
    this.submitting.set(true);
    try {
      await this.auth.requestAccount(
        this.email.trim(),
        this.clientName,
        this.requesterName,
        this.username,
        this.password,
      );
      this.success.set(
        'Revisa tu correo y confirma la cuenta. Después, Dimotion debe activar el cliente y usuario para que puedas iniciar sesión.',
      );
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible enviar la solicitud.');
    } finally {
      this.submitting.set(false);
    }
  }
}
