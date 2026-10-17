import { Routes } from '@angular/router';
import { FeaturePageComponent } from '../../shared/components/feature-page.component';
import { SiteHomeComponent } from './site-home.component';

export const publicRoutes: Routes = [
  { path: 'inicio', component: SiteHomeComponent },
  { path: 'portafolio', component: FeaturePageComponent, data: { title: 'Portafolio', description: 'Una selección de proyectos y producciones de Dimotion.', section: 'Público' } },
  { path: 'servicios', component: FeaturePageComponent, data: { title: 'Servicios', description: 'Soluciones creativas para llevar cada marca más lejos.', section: 'Público' } },
  { path: 'precios', component: FeaturePageComponent, data: { title: 'Paquetes y precios', description: 'Conoce las opciones de producción y publicidad.', section: 'Público' } },
  { path: 'contacto', component: FeaturePageComponent, data: { title: 'Contacto', description: 'Cuéntanos sobre tu próximo proyecto.', section: 'Público' } },
];
