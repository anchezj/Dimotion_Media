import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { SiteHeaderComponent } from './layout/site-header.component';

@Component({
  imports: [RouterOutlet, SiteHeaderComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  readonly showHeader = signal(!this.isAuthRoute(this.router.url));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.showHeader.set(!this.isAuthRoute(event.urlAfterRedirects)));
  }

  private isAuthRoute(url: string): boolean {
    const path = url.split(/[?#]/, 1)[0];
    return path === '/login' || path === '/solicitar-cuenta' || path === '/cambiar-contrasena'
      || path.startsWith('/cliente') || path.startsWith('/admin');
  }
}
