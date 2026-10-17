import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="site-header">
      <a class="wordmark" routerLink="/" aria-label="Dimotion, inicio">
        <img src="/dimotion-logo.png" alt="Dimotion Media">
      </a>
      <nav aria-label="Navegación principal">
        <a href="/#trabajo">Nuestro trabajo</a>
        <a href="/#servicios">Servicios</a>
        <a href="/#metodo">Método</a>
        <a href="/#precios">Precios</a>
        <a href="/#ug">UG</a>
        <a href="/#industry">Industry</a>
        <a class="login-link" routerLink="/login">Iniciar sesión</a>
      </nav>
    </header>
  `,
  styles: `
    :host { background: #09090b; display: block; position: relative; z-index: 2; }
    .site-header { align-items: center; display: flex; gap: clamp(1rem, 3vw, 3rem); justify-content: space-between; margin: 0 auto; max-width: 1280px; min-height: 92px; padding: 1rem 0; }
    .wordmark { display: block; flex: 0 0 auto; }
    .wordmark img { display: block; height: auto; width: 125px; }
    nav { align-items: center; background: #171719eF; border: 1px solid #39393c; border-radius: 999px; display: flex; gap: .15rem; justify-content: space-between; padding: .4rem; width: min(670px, 78%); }
    nav a { border-radius: 999px; color: #f1f0ee; font-size: clamp(.6rem, .75vw, .76rem); padding: .72rem clamp(.5rem, .8vw, .85rem); text-align: center; text-decoration: none; text-transform: uppercase; white-space: nowrap; }
    nav a:hover { background: #2c2c2f; }
    .login-link { background: #6f451d66; border: 1px solid #a86c1f; box-shadow: 0 0 0 2px #a86c1f33; font-weight: 700; }
    @media (max-width: 1320px) { .site-header { padding-left: clamp(1rem, 4vw, 3rem); padding-right: clamp(1rem, 4vw, 3rem); } }
    @media (max-width: 800px) { .site-header { align-items: flex-start; flex-direction: column; gap: 1rem; min-height: unset; padding-bottom: 1rem; padding-top: 1rem; } nav { border-radius: 1rem; flex-wrap: wrap; justify-content: center; width: 100%; } nav a { padding: .6rem .7rem; } }
  `,
})
export class SiteHeaderComponent {}
