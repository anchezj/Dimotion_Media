import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="site-header">
      <a class="wordmark" routerLink="/inicio">DIMOTION</a>
      <nav aria-label="Navegación principal">
        <a routerLink="/portafolio">Portafolio</a>
        <a routerLink="/servicios">Servicios</a>
        <a routerLink="/precios">Paquetes</a>
        <a routerLink="/contacto">Contacto</a>
        <a routerLink="/cliente">Portal cliente</a>
        <a routerLink="/cliente/campanas">Mis campañas</a>
        <a routerLink="/seguimiento">Seguimiento</a>
        <a routerLink="/admin">Administración</a>
        <a routerLink="/admin/campanas">Campañas</a>
        <a routerLink="/admin/marcas">Marcas</a>
        <a routerLink="/admin/paquetes">Gestión de paquetes</a>
        <a routerLink="/admin/modelos">Modelos</a>
        <a class="login-link" routerLink="/login">Ingresar</a>
        <a routerLink="/logout">Cerrar sesión</a>
      </nav>
    </header>
  `,
  styles: `
    .site-header { align-items: center; background: #101114; color: #fff; display: flex; justify-content: space-between; padding: 1rem clamp(1rem, 5vw, 5rem); }
    .wordmark { color: #fff; font-size: 1.1rem; font-weight: 800; letter-spacing: .18em; text-decoration: none; }
    nav { align-items: center; display: flex; flex-wrap: wrap; gap: 1.25rem; }
    nav a { color: #d4d5da; font-size: .9rem; text-decoration: none; }
    nav a:hover { color: #fff; }
    .login-link { border: 1px solid #777983; border-radius: 999px; padding: .55rem .9rem; }
    @media (max-width: 1000px) { .site-header { align-items: flex-start; flex-direction: column; gap: 1rem; } nav { gap: .8rem; } }
  `,
})
export class SiteHeaderComponent {}
