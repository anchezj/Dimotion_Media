import { Component, ElementRef, HostListener, QueryList, ViewChildren, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-site-home',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
        <div class="section-kicker" id="trust-title"><span>CONFÍAN EN NOSOTROS</span><span></span></div>
        <div class="client-logos" aria-label="Algunas marcas que confían en Dimotion">
          <div class="client-logo rosa-negra"><span>Rosa<br>Negra</span></div>
          <div class="client-logo mvc"><span>MVC</span><small>AGENCY</small></div>
          <div class="client-logo nbc"><span>NBCUniversal</span></div>
          <div class="client-logo rigoletto"><span>RIGOLETTO</span></div>
          <div class="client-logo buffalo"><span>BUFFALO WINGS</span><small>COLOMBIA</small></div>
        </div>
      </section>

      <section class="work-section home-section" id="trabajo">
        <div class="work-heading">
          <div class="work-intro">
            <p class="eyebrow">02 · NUESTRO TRABAJO</p>
            <h2>LO QUE HACEMOS<br><em>se ve.</em></h2>
            <p><strong>Historias reales. Marcas reales. Contenido que conecta.</strong><br>Una selección de proyectos, campañas, fotografías y piezas audiovisuales producidas por Dimotion.</p>
          </div>
          <div class="service-tags" aria-label="Tipos de contenido">
            <span>VIDEO COMERCIAL</span><span>CONTENIDO PARA REDES</span><span>CAMPAÑAS</span><span>FOTOGRAFÍA</span><span>PRODUCCIÓN</span>
          </div>
        </div>
        <div class="work-reels" aria-label="Videos destacados">
          @for (project of videoProjects; track project.id; let index = $index) {
            <article class="work-reel" [class.reel-featured]="index === 2">
              <button
                class="reel-poster"
                [class.is-playing]="activeVideoId() === project.id"
                type="button"
                [attr.aria-label]="'Reproducir video: ' + project.title"
                (click)="playProject(project, index)"
              >
                <img class="reel-cover" [src]="project.posterPath" alt="">
                <span class="reel-topbar" aria-hidden="true">
                  <span class="reel-back">‹</span>
                  <strong>Reels</strong>
                  <svg viewBox="0 0 24 24"><path d="M4 8h3l2-2h6l2 2h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg>
                </span>
                <span class="reel-side-actions" aria-hidden="true">
                  <span><svg viewBox="0 0 24 24"><path d="M20.8 8.8c0 4.2-8.8 10-8.8 10S3.2 13 3.2 8.8a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z"></path></svg><small>3.9 mil</small></span>
                  <span><svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4 9 9 0 0 1-3.5-.7L3 21l1.8-4.9a8 8 0 0 1-1.5-4.6A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"></path></svg><small>74</small></span>
                  <span><svg viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path></svg><small>Enviar</small></span>
                  <span class="reel-more">•••</span>
                </span>
                <span class="reel-play" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                </span>
                <span class="reel-bottom">
                  <span class="reel-account">
                    <span class="reel-avatar">D</span>
                    <strong>dimotion.media</strong>
                    <span class="reel-follow">Seguir</span>
                  </span>
                  <span class="reel-caption">{{ project.caption }}</span>
                  <span class="reel-audio"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg></span>
                </span>
                <span class="reel-progress" aria-hidden="true"><span></span></span>
              </button>
              <video
                #workVideo
                class="work-video"
                [class.is-visible]="activeVideoId() === project.id"
                controls
                playsinline
                preload="none"
                [attr.aria-label]="'Reproducción de ' + project.title"
                (error)="handleVideoError(project)"
                (ended)="finishProject(project)"
              ></video>
              @if (videoErrorId() === project.id) {
                <p class="video-error" role="status">Agrega el archivo <code>{{ project.videoPath }}</code> para activar este video.</p>
              }
            </article>
          }
        </div>
        <p class="reel-hint"><span aria-hidden="true">▶</span> Selecciona un proyecto para reproducirlo</p>
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
        <div class="pricing-heading">
          <div>
            <p class="eyebrow">05 · PAQUETES DE CONTENIDO</p>
            <h2>Un plan mensual para<br><em>sostener tu marca.</em></h2>
          </div>
          <p class="pricing-note">VALORES EN COP · MENSUAL</p>
        </div>
        <div class="pricing-cards" aria-label="Planes de contenido">
          <article class="pricing-card">
            <div class="pricing-card-heading">
              <h3>Signature</h3>
              <p>donde nace tu presencia.</p>
            </div>
            <ul>
              <li><strong>Calidad visual premium</strong></li>
              <li><strong>4 reels</strong><span>producción estándar</span></li>
              <li><strong>Creación de guiones</strong></li>
              <li><strong>Reunión mensual de análisis</strong></li>
              <li><strong>Still de reels para stories</strong></li>
            </ul>
            <div class="pricing-card-footer">
              <p class="price-label">INVERSIÓN MENSUAL</p>
              <p class="price">$800.000</p>
              <a class="button" routerLink="/contacto" [queryParams]="{ plan: 'Signature' }">QUIERO ESTE PLAN</a>
            </div>
          </article>

          <article class="pricing-card featured">
            <div class="pricing-card-heading">
              <h3>Prestige</h3>
              <span class="popular-badge">MÁS ELEGIDO</span>
              <p>más que visible... memorable.</p>
            </div>
            <ul>
              <li><strong>Calidad visual avanzada</strong></li>
              <li><strong>8 reels</strong><span>grabación log + corrección de color/audio</span></li>
              <li><strong>Guiones personalizados</strong></li>
              <li><strong>Reunión mensual de análisis</strong></li>
              <li><strong>4 carruseles</strong><span>contenido propio de la marca, no librerías</span></li>
              <li><strong>Fotos para carrusel o stories</strong></li>
              <li><strong>Producción y mejora de audio</strong></li>
            </ul>
            <div class="pricing-card-footer">
              <p class="price-label">INVERSIÓN MENSUAL</p>
              <p class="price">$1.500.000</p>
              <a class="button" routerLink="/contacto" [queryParams]="{ plan: 'Prestige' }">QUIERO ESTE PLAN</a>
            </div>
          </article>

          <article class="pricing-card">
            <div class="pricing-card-heading">
              <h3>Crown</h3>
              <p>no compites, lideras.</p>
            </div>
            <ul>
              <li><strong>Calidad visual cine</strong></li>
              <li><strong>12 reels</strong><span>grabación log + corrección de color/audio</span></li>
              <li><strong>Guiones con estructura</strong><span>hooks visuales</span></li>
              <li><strong>Reunión mensual de análisis</strong></li>
              <li><strong>4 carruseles</strong><span>contenido propio de la marca, no librerías</span></li>
              <li><strong>Fotos para carrusel o stories</strong></li>
              <li><strong>Diseño de portadas</strong></li>
              <li><strong>Sugerencia de descripción para post</strong></li>
              <li><strong>Equipos alta gama</strong><span>iluminación + estabilización + micrófonos</span></li>
            </ul>
            <div class="pricing-card-footer">
              <p class="price-label">INVERSIÓN MENSUAL</p>
              <p class="price">$2.500.000</p>
              <a class="button" routerLink="/contacto" [queryParams]="{ plan: 'Crown' }">QUIERO ESTE PLAN</a>
            </div>
          </article>

          <article class="pricing-card">
            <div class="pricing-card-heading">
              <h3>A medida</h3>
              <p>tu marca, tus reglas.</p>
            </div>
            <ul>
              <li><strong>Volumen de contenido flexible</strong><span>definimos cuántas piezas y de qué tipo</span></li>
              <li><strong>Jornadas según tu operación</strong><span>una intensiva o varias en el mes</span></li>
              <li><strong>Formatos que sí vas a usar</strong><span>reels, carruseles, fotos, video largo</span></li>
              <li><strong>Campañas y lanzamientos</strong><span>producción puntual por proyecto</span></li>
              <li><strong>Cobertura de eventos</strong></li>
              <li><strong>Equipo y locación a la medida</strong><span>según lo que exija la idea</span></li>
            </ul>
            <div class="pricing-card-footer">
              <p class="price-label">SEGÚN ALCANCE</p>
              <p class="price">A cotizar</p>
              <a class="button" routerLink="/contacto" [queryParams]="{ plan: 'A medida' }">COTIZAR A MEDIDA</a>
            </div>
          </article>
        </div>
      </section>

      <section class="ugc-section" id="ug">
        <div class="ugc-intro home-section">
          <div class="ugc-copy">
            <p class="eyebrow"><span></span> UGC · USER GENERATED CONTENT</p>
            <h2>PERSONAS<br>REALES.<br><em>Contenido que conecta.</em></h2>
            <p class="ugc-description">Creamos contenido auténtico con creadoras que conectan con tu audiencia. Historias cercanas, hechas para mostrar lo mejor de tu marca.</p>
            <div class="ugc-brand-callout">
              <span>PARA MARCAS</span>
              <p>Encuentra la creadora ideal para contar tu historia.</p>
            </div>
            <div class="ugc-actions">
              <a class="button button-primary" href="https://wa.me/573242340823?text=Hola%20Dimotion%2C%20quiero%20encontrar%20una%20creadora%20UGC%20para%20mi%20marca." target="_blank" rel="noopener noreferrer">QUIERO UNA CREADORA <span aria-hidden="true">↗</span></a>
              <a class="button button-secondary" href="#casting">QUIERO SER CREADORA</a>
            </div>
          </div>
          <div class="ugc-visual">
            <img src="/dimotion-reels.png" alt="Personas reales creando contenido para marcas con Dimotion">
            <span class="ugc-image-caption">Historias reales. Marcas reales.</span>
          </div>
        </div>

        <section class="casting-section home-section" id="casting" aria-labelledby="casting-title">
          <div class="casting-heading">
            <p class="eyebrow"><span></span> CASTING UGC</p>
            <h2 id="casting-title">Buscamos<br><em>nuevas creadoras.</em></h2>
            <p>Queremos conocerte. Si disfrutas comunicar y crear contenido, este espacio también es para ti.</p>
            <ul class="casting-criteria">
              <li>Mayores de edad</li>
              <li>Buena comunicación frente a cámara</li>
              <li>Personalidad auténtica</li>
              <li>Disponibilidad para grabar</li>
              <li>Diferentes perfiles y nichos</li>
            </ul>
          </div>

          <form class="casting-form" #castingApplication="ngForm" (ngSubmit)="applyToCasting()">
            <div class="casting-form-heading">
              <h3>Cuéntanos sobre ti</h3>
              <p>Completa tus datos y te contactaremos por WhatsApp.</p>
            </div>
            <div class="casting-fields">
              <label>
                <span>Nombre completo</span>
                <input name="name" [(ngModel)]="creatorApplication.name" required maxlength="120" autocomplete="name" placeholder="Tu nombre">
              </label>
              <label>
                <span>Ciudad</span>
                <input name="city" [(ngModel)]="creatorApplication.city" required maxlength="100" autocomplete="address-level2" placeholder="¿Dónde vives?">
              </label>
              <label>
                <span>Edad</span>
                <input name="age" [(ngModel)]="creatorApplication.age" type="number" min="18" max="99" required placeholder="Debes ser mayor de edad">
              </label>
              <label>
                <span>Instagram o TikTok</span>
                <input name="social" [(ngModel)]="creatorApplication.social" required maxlength="160" placeholder="@tuusuario o enlace">
              </label>
              <label class="casting-field-wide">
                <span>Categorías o nichos que te representan</span>
                <input name="niches" [(ngModel)]="creatorApplication.niches" required maxlength="240" placeholder="Ej. belleza, moda, gastronomía, lifestyle">
              </label>
              <label>
                <span>¿Tienes experiencia creando UGC?</span>
                <select name="experience" [(ngModel)]="creatorApplication.experience" required>
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="Sí">Sí</option>
                  <option value="Aún no, pero quiero empezar">Aún no, pero quiero empezar</option>
                </select>
              </label>
              <label>
                <span>¿Tienes equipo propio para grabar?</span>
                <select name="equipment" [(ngModel)]="creatorApplication.equipment" required>
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </label>
              <label>
                <span>Disponibilidad</span>
                <select name="availability" [(ngModel)]="creatorApplication.availability" required>
                  <option value="" disabled>Selecciona una opción</option>
                  <option value="Entre semana">Entre semana</option>
                  <option value="Fines de semana">Fines de semana</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </label>
              <label>
                <span>Enlace a video de presentación <small>(opcional)</small></span>
                <input name="videoLink" [(ngModel)]="creatorApplication.videoLink" type="url" maxlength="500" placeholder="https://">
              </label>
              <label>
                <span>Enlace a tus fotografías <small>(opcional)</small></span>
                <input name="photoLink" [(ngModel)]="creatorApplication.photoLink" type="url" maxlength="500" placeholder="https://">
              </label>
            </div>
            <p class="casting-upload-note">También puedes adjuntar tu video y tus fotografías directamente en el chat de WhatsApp.</p>
            <button class="button button-primary casting-submit" type="submit" [disabled]="castingApplication.invalid">POSTULARME AL CASTING <span aria-hidden="true">↗</span></button>
          </form>
        </section>
      </section>

      <section class="industries-section home-section" id="industry">
        <div><p class="eyebrow">INDUSTRY</p><h2>Contenido con<br><em>intención.</em></h2></div>
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
  readonly activeVideoId = signal<string | null>(null);
  readonly videoErrorId = signal<string | null>(null);
  readonly videoProjects = [
    { id: 'reel-01', title: 'Historias de marca', category: 'VIDEO COMERCIAL', caption: 'Detrás de cámaras · producción.', videoPath: '/videos/0824.mp4', posterPath: '/videos/0824-poster.jpg' },
    { id: 'reel-02', title: 'Momentos que conectan', category: 'CONTENIDO PARA REDES', caption: 'Dirección creativa en set.', videoPath: '/videos/0824-1.mp4', posterPath: '/videos/0824-1-poster.jpg' },
    { id: 'reel-03', title: 'Una idea en movimiento', category: 'CAMPAÑAS', caption: 'Contenido que hace que tu marca se vea y se recuerde.', videoPath: '/videos/0824-2.mp4', posterPath: '/videos/0824-2-poster.jpg' },
    { id: 'reel-04', title: 'Detalles que inspiran', category: 'FOTOGRAFÍA', caption: 'Edición para redes.', videoPath: '/videos/0824-3.mp4', posterPath: '/videos/0824-3-poster.jpg' },
    { id: 'reel-05', title: 'Hecho para recordar', category: 'PRODUCCIÓN', caption: 'Campaña de marca.', videoPath: '/videos/0824-4.mp4', posterPath: '/videos/0824-4-poster.jpg' },
  ];
  readonly creatorApplication = {
    name: '',
    city: '',
    age: null as number | null,
    social: '',
    niches: '',
    experience: '',
    equipment: '',
    availability: '',
    videoLink: '',
    photoLink: '',
  };

  @ViewChildren('workVideo') private workVideos!: QueryList<ElementRef<HTMLVideoElement>>;

  playProject(project: (typeof this.videoProjects)[number], index: number): void {
    for (const reference of this.workVideos) {
      const video = reference.nativeElement;
      video.pause();
      video.removeAttribute('src');
      video.load();
    }

    const video = this.workVideos.get(index)?.nativeElement;
    this.videoErrorId.set(null);
    this.activeVideoId.set(project.id);

    if (!video) {
      this.handleVideoError(project);
      return;
    }

    video.src = project.videoPath;
    video.load();
    void video.play().catch(() => this.handleVideoError(project));
  }

  handleVideoError(project: (typeof this.videoProjects)[number]): void {
    if (this.activeVideoId() !== project.id) return;
    this.activeVideoId.set(null);
    this.videoErrorId.set(project.id);
  }

  finishProject(project: (typeof this.videoProjects)[number]): void {
    if (this.activeVideoId() === project.id) this.activeVideoId.set(null);
  }

  applyToCasting(): void {
    const application = this.creatorApplication;
    const message = [
      'Hola Dimotion, quiero postularme al casting UGC.',
      `Nombre: ${application.name}`,
      `Ciudad: ${application.city}`,
      `Edad: ${application.age}`,
      `Instagram o TikTok: ${application.social}`,
      `Categorías o nichos: ${application.niches}`,
      `Experiencia creando UGC: ${application.experience}`,
      `Equipo propio: ${application.equipment}`,
      `Disponibilidad: ${application.availability}`,
      `Video de presentación: ${application.videoLink || 'Lo adjuntaré en este chat.'}`,
      `Fotografías: ${application.photoLink || 'Las adjuntaré en este chat.'}`,
    ].join('\n');

    globalThis.open(
      `https://wa.me/573242340823?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  @HostListener('window:pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointerX.set((event.clientX / window.innerWidth - 0.5) * 36);
    this.pointerY.set((event.clientY / window.innerHeight - 0.5) * 24);
  }
}
