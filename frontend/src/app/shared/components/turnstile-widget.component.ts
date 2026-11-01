import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, signal } from '@angular/core';

interface TurnstileRenderOptions {
  sitekey: string;
  theme: 'dark';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

@Component({
  selector: 'app-turnstile-widget',
  standalone: true,
  template: `
    <div #container class="turnstile-container"></div>
    @if (message()) {
      <p class="turnstile-message" role="alert">{{ message() }}</p>
    }
  `,
  styles: `
    .turnstile-container { display: flex; justify-content: center; min-height: 65px; }
    .turnstile-message { color: #ffaaa2; font-size: .82rem; line-height: 1.5; margin: .25rem 0 0; text-align: center; }
  `,
})
export class TurnstileWidgetComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) siteKey = '';
  @Output() readonly tokenChange = new EventEmitter<string | null>();
  @ViewChild('container', { static: true }) private container!: ElementRef<HTMLDivElement>;

  readonly message = signal('');
  private widgetId: string | null = null;
  private destroyed = false;
  private static scriptPromise: Promise<void> | null = null;

  ngAfterViewInit(): void {
    if (!this.siteKey) {
      this.message.set('El CAPTCHA no está configurado. No es posible iniciar sesión.');
      return;
    }

    void this.loadScript()
      .then(() => {
        if (this.destroyed) return;
        const turnstile = window.turnstile;
        if (!turnstile) throw new Error('Turnstile no está disponible.');

        this.widgetId = turnstile.render(this.container.nativeElement, {
          sitekey: this.siteKey,
          theme: 'dark',
          callback: (token) => {
            this.message.set('');
            this.tokenChange.emit(token);
          },
          'expired-callback': () => {
            this.tokenChange.emit(null);
            this.message.set('El CAPTCHA expiró. Verifícalo nuevamente.');
          },
          'error-callback': () => {
            this.tokenChange.emit(null);
            this.message.set('No se pudo cargar el CAPTCHA. Revisa tu conexión e inténtalo de nuevo.');
          },
        });
      })
      .catch(() => {
        this.tokenChange.emit(null);
        this.message.set('No se pudo cargar el CAPTCHA. Revisa tu conexión e inténtalo de nuevo.');
      });
  }

  reset(): void {
    this.tokenChange.emit(null);
    if (this.widgetId) window.turnstile?.reset(this.widgetId);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.widgetId) window.turnstile?.remove(this.widgetId);
  }

  private loadScript(): Promise<void> {
    if (window.turnstile) return Promise.resolve();
    if (TurnstileWidgetComponent.scriptPromise) return TurnstileWidgetComponent.scriptPromise;

    TurnstileWidgetComponent.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No fue posible cargar el script de Turnstile.'));
      document.head.appendChild(script);
    });

    return TurnstileWidgetComponent.scriptPromise;
  }
}
