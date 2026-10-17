import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-page">
      <section class="home-hero">
        <svg
          class="orbit-lines"
          viewBox="0 0 1600 620"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <g
            fill="none"
            stroke="#df8a1d"
            stroke-width="1"
            [attr.transform]="'translate(' + (pointerX() * -0.24) + ' ' + (pointerY() * -0.24) + ')'"
          >
            <circle cx="1370" cy="245" r="230"></circle>
            <circle cx="1370" cy="245" r="360"></circle>
            <circle cx="1370" cy="245" r="500"></circle>
          </g>
          <g
            fill="none"
            stroke="#df8a1d"
            stroke-width="1"
            [attr.transform]="'translate(' + (pointerX() * 0.42) + ' ' + (pointerY() * 0.42) + ')'"
          >
            <circle cx="1370" cy="245" r="300"></circle>
            <path d="M670 550 A650 650 0 0 0 1500 -80"></path>
          </g>
        </svg>
        <div class="hero-copy">
          <p class="eyebrow"><span></span> DIRECCIÓN CREATIVA · PRODUCCIÓN · EDICIÓN</p>
          <h1>TU MARCA<br>TIENE</h1>
          <p class="hero-slogan">algo que decir.</p>
          <p class="hero-lead">NOSOTROS HACEMOS QUE SE VEA.</p>
          <p class="hero-description">Productora de contenido audiovisual en Bogotá, Colombia.<br>Dirección creativa, producción y edición para marcas que quieren construir una imagen que reconozca y conecte.</p>
          <div class="hero-actions">
            <a class="button button-primary" href="#trabajo">VER NUESTRO TRABAJO <span aria-hidden="true">↗</span></a>
            <a class="button button-secondary" href="#metodo">CÓMO TRABAJAMOS</a>
          </div>
          <div class="stats" aria-label="Dimotion en cifras">
            <div><strong>+60</strong><span>PROYECTOS<br>REALIZADOS</span></div>
            <div><strong>230+</strong><span>MARCAS<br>IMPULSADAS</span></div>
            <div><strong>10+</strong><span>AÑOS DE<br>EXPERIENCIA</span></div>
          </div>
        </div>
        <a class="hero-visual" href="#trabajo" aria-label="Conoce nuestro contenido audiovisual">
          <img src="/hero-reels-3d.webp" alt="Composición 3D de reels de distintas producciones audiovisuales de Dimotion">
        </a>
      </section>

      <section class="trust-section" aria-labelledby="trust-title">
        <div class="section-kicker" id="trust-title">CONFÍAN EN NOSOTROS <span></span></div>
        <img class="client-logos" src="/dimotion-clientes.png" alt="Marcas que confían en Dimotion">
      </section>

      <section class="work-section home-section" id="trabajo">
        <div class="section-heading">
          <div><p class="eyebrow">02 · NUESTRO TRABAJO</p><h2>LO QUE HACEMOS<br><em>se ve.</em></h2></div>
          <p>Historias reales. Marcas reales. Contenido que conecta.<br>Una selección de proyectos, campañas, fotografías y piezas audiovisuales producidas por Dimotion.</p>
        </div>
        <div class="work-feature">
          <img src="/dimotion-reels.png" alt="Producciones de video y contenido para redes sociales">
        </div>
        <div class="service-tags"><span>VIDEO COMERCIAL</span><span>CONTENIDO PARA REDES</span><span>CAMPAÑAS</span><span>FOTOGRAFÍA</span><span>PRODUCCIÓN</span></div>
      </section>

      <section class="services-section home-section" id="servicios">
        <div class="section-heading">
          <div><p class="eyebrow">03 · LO QUE HACEMOS</p><h2>Ideas que toman<br><em>forma.</em></h2></div>
          <p>Un equipo creativo y de producción que acompaña tu marca desde la primera idea hasta la pieza final.</p>
        </div>
        <div class="service-grid">
          <article><span class="service-number">01</span><h3>Producción audiovisual</h3><p>Videos comerciales y contenido visual que transmiten lo mejor de tu marca.</p><a routerLink="/servicios">CONOCE EL SERVICIO ↗</a></article>
          <article><span class="service-number">02</span><h3>Contenido para redes</h3><p>Reels, fotografía y piezas pensadas para conectar con tu comunidad.</p><a routerLink="/servicios">CONOCE EL SERVICIO ↗</a></article>
          <article><span class="service-number">03</span><h3>Dirección creativa</h3><p>Una idea clara y una identidad coherente para cada campaña.</p><a routerLink="/servicios">CONOCE EL SERVICIO ↗</a></article>
        </div>
      </section>

      <section class="method-section home-section" id="metodo">
        <div class="section-heading">
          <div><p class="eyebrow">04 · NUESTRO MÉTODO</p><h2>De la idea<br><em>a la pantalla.</em></h2></div>
          <p>Un proceso colaborativo, claro y hecho a la medida de cada proyecto.</p>
        </div>
        <ol class="method-steps">
          <li><span>01</span><div><h3>Nos conocemos</h3><p>Escuchamos tu historia, tus objetivos y lo que hace única a tu marca.</p></div></li>
          <li><span>02</span><div><h3>Imaginamos</h3><p>Construimos juntos el concepto y el plan de producción.</p></div></li>
          <li><span>03</span><div><h3>Lo hacemos realidad</h3><p>Producimos, editamos y cuidamos cada detalle de la pieza.</p></div></li>
          <li><span>04</span><div><h3>Lo lanzamos</h3><p>Entregamos contenido listo para conectar con tu audiencia.</p></div></li>
        </ol>
      </section>

      <section class="pricing-section home-section" id="precios">
        <p class="eyebrow">05 · PAQUETES Y PRECIOS</p>
        <h2>Una buena historia<br>merece <em>verse bien.</em></h2>
        <p>Cuéntanos qué tienes en mente y diseñamos una propuesta para las necesidades de tu marca.</p>
        <a class="button button-primary" routerLink="/contacto">HABLEMOS DE TU PROYECTO ↗</a>
      </section>

      <section class="industries-section home-section" id="industry">
        <div id="ug"><p class="eyebrow">06 · UG / INDUSTRY</p><h2>Contenido con<br><em>intención.</em></h2></div>
        <p>Trabajamos con marcas, equipos y creadores para contar historias que se sienten auténticas y se recuerdan.</p>
        <a class="button button-secondary" routerLink="/contacto">TRABAJEMOS JUNTOS ↗</a>
      </section>

      <footer class="home-footer">
        <a routerLink="/" aria-label="Dimotion, inicio"><img src="/dimotion-logo.png" alt="Dimotion Media"></a>
        <span>Historias reales. Marcas reales. Contenido que conecta.</span>
        <a routerLink="/login">PORTAL DE CLIENTES ↗</a>
      </footer>
      <a
        class="whatsapp-float"
        href="https://wa.me/573242340823?text=Hola%20Dimotion%2C%20quiero%20hablar%20sobre%20un%20proyecto."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.4 3.6A11.8 11.8 0 0 0 2 17.8L.5 23.5l5.8-1.5a11.8 11.8 0 0 0 5.6 1.4h.1A11.8 11.8 0 0 0 20.4 3.6Zm-8.5 17.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.4.9.9-3.3-.2-.4a9.8 9.8 0 1 1 8.1 4.4Zm5.4-7.3c-.3-.2-1.6-.8-1.9-.9-.3-.1-.5-.2-.7.2s-.7.9-.9 1.1c-.2.2-.3.2-.6.1a8 8 0 0 1-2.3-1.4 8.6 8.6 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.6s1.2 3 1.4 3.2c.2.2 2.3 3.5 5.6 4.9.8.3 1.4.5 1.8.6.8.2 1.5.2 2.1.1.7-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.2-.3-.3-.6-.5Z"></path>
        </svg>
        <span>WHATSAPP</span>
      </a>
    </div>
  `,
})
export class SiteHomeComponent {
  readonly pointerX = signal(0);
  readonly pointerY = signal(0);

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerX.set((event.clientX / window.innerWidth - 0.5) * 36);
    this.pointerY.set((event.clientY / window.innerHeight - 0.5) * 24);
  }
}
