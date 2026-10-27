import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="password-page">
      <form class="password-form" (ngSubmit)="submit()">
        <img src="/dimotion-logo.png" alt="Dimotion Media">
        <h1>Actualiza tu contraseña</h1>
        <p>Por seguridad, crea una contraseña nueva para continuar al portal.</p>
        <label>
          Nueva contraseña
          <input name="password" type="password" [(ngModel)]="password" required minlength="12" autocomplete="new-password">
        </label>
        <label>
          Confirma tu contraseña
          <input name="confirmation" type="password" [(ngModel)]="confirmation" required minlength="12" autocomplete="new-password">
        </label>
        @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
        <button type="submit" [disabled]="submitting()">
          {{ submitting() ? 'ACTUALIZANDO…' : 'CAMBIAR CONTRASEÑA' }}
        </button>
      </form>
    </main>
  `,
  styles: `
    :host { display:block; min-height:100vh; }
    .password-page { align-items:center; background:#080808; color:#f2f0ed; display:grid; justify-items:center; min-height:100vh; padding:1.5rem; }
    .password-form { background:#100e0c; border:1px solid #49331f; border-radius:.7rem; display:grid; gap:1rem; max-width:420px; padding:2rem; width:100%; }
    img { justify-self:center; max-width:160px; }
    h1 { font-size:1.6rem; margin:0; }
    p { color:#c6c2bc; font-size:.9rem; line-height:1.5; margin:0; }
    label { color:#e5e0d9; display:grid; font-size:.86rem; gap:.5rem; }
    input { background:#080808; border:1px solid #bd6711; border-radius:999px; color:#fff; font:inherit; min-height:44px; outline:none; padding:.7rem 1rem; }
    input:focus { border-color:#ff9b20; box-shadow:0 0 0 2px #ff9b2033; }
    button { background:#ff9418; border:0; border-radius:999px; color:#17120c; cursor:pointer; font:inherit; font-weight:700; justify-self:center; min-height:44px; padding:.7rem 1.25rem; }
    button:disabled { cursor:wait; opacity:.65; }
    .error { background:#271212; border-radius:.5rem; color:#ffaaa2; padding:.8rem 1rem; }
  `,
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly error = signal('');
  readonly submitting = signal(false);
  password = '';
  confirmation = '';

  async submit(): Promise<void> {
    this.error.set('');
    if (this.password.length < 12) {
      this.error.set('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (this.password !== this.confirmation) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.submitting.set(true);
    try {
      await this.auth.changePassword(this.password);
      const role = await this.auth.getRole();
      await this.router.navigateByUrl(role === 'admin' ? '/admin/campanas' : '/cliente');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No fue posible actualizar la contraseña.');
    } finally {
      this.submitting.set(false);
    }
  }
}
