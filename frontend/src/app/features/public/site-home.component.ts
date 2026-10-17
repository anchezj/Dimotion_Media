import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-page">
      <section class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow"><span></span> DIRECCIÓN CREATIVA · PRODUCCIÓN · EDICIÓN</p>
          <h1>TU MARCA<br>TIENE ALGO QUE DECIR.</h1>
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
          <img src="/dimotion-reels.png" alt="Selección de reels y producciones audiovisuales de Dimotion">
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
    </div>
  `,
})
export class SiteHomeComponent {}
