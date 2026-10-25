import { DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import {
  CampaignStatus,
  campaignStages,
  ManagementDataService,
} from '../../core/data/management-data.service';
import type { CampaignRecord, ClientRecord, UserRecord } from '../../core/data/management-data.service';

type AdminView = 'campaigns' | 'clients' | 'users';

registerLocaleData(localeEsCo);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/"><img src="/dimotion-logo.png" alt="Dimotion Media"></a>
        <p class="sidebar-label">ADMINISTRACIÓN</p>
        <nav aria-label="Administración">
          <a routerLink="/admin/campanas" [class.active]="view() === 'campaigns'">Campañas</a>
          <a routerLink="/admin/clientes" [class.active]="view() === 'clients'">Clientes</a>
          <a routerLink="/admin/usuarios" [class.active]="view() === 'users'">Usuarios</a>
        </nav>
        <a class="logout" routerLink="/logout">Cerrar sesión</a>
      </aside>

      <main class="admin-main">
        <header class="admin-heading">
          <div>
            <p class="eyebrow">DIMOTION MEDIA · ADMIN</p>
            <h1>{{ view() === 'campaigns' ? 'Campañas activas' : view() === 'clients' ? 'Clientes' : 'Usuarios' }}</h1>
          </div>
          @if (view() === 'clients') {
            <button class="button button-primary" type="button" (click)="openCreateClient()">Nuevo cliente</button>
          }
        </header>

        <p class="demo-note">DATOS CONECTADOS A SUPABASE</p>
        @if (store.storageError()) { <p class="storage-error" role="alert">{{ store.storageError() }}</p> }
        @if (operationError()) { <p class="storage-error" role="alert">{{ operationError() }}</p> }

        @if (view() === 'campaigns') {
          <label class="search-field">Buscar campaña o cliente
            <input type="search" [ngModel]="campaignSearch()" (ngModelChange)="campaignSearch.set($event)" placeholder="Escribe para filtrar">
          </label>
          <section class="campaign-table" aria-label="Listado de campañas">
            <div class="table-header">
              <span>CLIENTE / CAMPAÑA</span><span>CAMPAÑAS CERRADAS</span><span>ESTADO</span><span>OBSERVACIONES</span>
            </div>
            @for (campaign of filteredCampaigns(); track campaign.id) {
              <article class="campaign-row">
                <div class="campaign-client">
                  <strong>{{ campaign.clientName }}</strong>
                  <span>{{ campaign.title }}</span>
                </div>
                <input
                  class="closed-count"
                  type="number"
                  min="0"
                  [value]="campaign.closedCampaigns ?? 0"
                  [attr.aria-label]="'Campañas cerradas de ' + campaign.clientName"
                  (change)="updateClosedCount(campaign.clientId, $event)"
                >
                <div class="status-control">
                  <span class="status" [class.paused]="campaign.status === 'paused'" [class.closed]="campaign.status === 'closed'">
                    <i></i>{{ statusLabel(campaign.status) }}
                  </span>
                  <select [value]="campaign.status" [attr.aria-label]="'Estado de ' + campaign.clientName" (change)="changeStatus(campaign.id, $event)">
                    <option value="active">Activa</option>
                    <option value="paused">En pausa</option>
                    <option value="closed" disabled>Cerrada</option>
                  </select>
                </div>
                <input
                  class="observation"
                  type="text"
                  [value]="campaign.observation"
                  [attr.aria-label]="'Observaciones de ' + campaign.clientName"
                  placeholder="Agregar observación"
                  (change)="changeObservation(campaign.id, $event)"
                >
                <div class="campaign-meta">
                  <span>Seguimiento de {{ campaign.clientName }} · En curso: <strong>{{ stages[campaign.stageIndex] }}</strong></span>
                  <span>{{ campaign.date | date:'d MMM y':'':'es-CO' }} · {{ campaign.time }}</span>
                </div>
                <div class="campaign-actions">
                  <button class="button button-quiet" type="button" [disabled]="campaign.stageIndex === 0" (click)="stepCampaign(campaign, -1)">Deshacer etapa</button>
                  <button class="button button-primary" type="button" [disabled]="campaign.stageIndex === stages.length - 1" (click)="stepCampaign(campaign, 1)">
                    {{ campaign.stageIndex === stages.length - 1 ? 'Entregada' : 'Completar ' + stages[campaign.stageIndex] }}
                  </button>
                </div>
                <div class="admin-progress" aria-label="Progreso de campaña">
                  @for (stage of stages; track stage; let index = $index) {
                    <button
                      class="admin-step"
                      type="button"
                      [class.done]="index < campaign.stageIndex"
                      [class.current]="index === campaign.stageIndex"
                      [attr.aria-label]="'Cambiar etapa a ' + stage"
                      (click)="setStage(campaign.id, index)"
                    >
                      <span>{{ index < campaign.stageIndex ? '✓' : index === campaign.stageIndex ? '•' : '' }}</span>
                      <small>{{ stage }}</small>
                      @if (campaign.stageDates[index]) {
                        <em>{{ campaign.stageDates[index] | date:'d MMM, h:mm a':'':'es-CO' }}</em>
                      }
                    </button>
                  }
                </div>
              </article>
            } @empty {
              <p class="empty-state">No hay campañas que coincidan con la búsqueda.</p>
            }
          </section>
        } @else if (view() === 'clients') {
          <label class="search-field">Buscar cliente
            <input type="search" [ngModel]="clientSearch()" (ngModelChange)="clientSearch.set($event)" placeholder="Nombre o correo">
          </label>
          @if (showClientForm()) {
            <form class="client-form" (ngSubmit)="saveClient()">
              <h2>{{ editingClientId() ? 'Editar cliente' : 'Nuevo cliente' }}</h2>
              <label>Nombre del cliente
                <input name="name" [(ngModel)]="clientName" required maxlength="120" placeholder="Nombre de empresa o marca">
              </label>
              <label>Número de contacto
                <input name="phone" type="tel" [(ngModel)]="clientPhone" required minlength="7" maxlength="25" autocomplete="tel" placeholder="+57 300 123 4567">
              </label>
              <label>Correo electrónico
                <input name="email" type="email" [(ngModel)]="clientEmail" required maxlength="254" placeholder="contacto@empresa.com">
              </label>
              @if (!editingClientId()) {
                <label>Nombre de usuario
                  <input name="username" [(ngModel)]="clientUsername" required maxlength="120" autocomplete="off" placeholder="Usuario para iniciar sesión">
                </label>
                <p class="form-hint">Generaremos una contraseña temporal y la enviaremos al correo. El cliente deberá cambiarla al iniciar sesión por primera vez.</p>
              } @else {
                <label>Nombre de usuario
                  <input name="username" [(ngModel)]="clientUsername" maxlength="120" autocomplete="off" placeholder="Nombre de usuario">
                </label>
              }
              @if (formError()) { <p class="storage-error" role="alert">{{ formError() }}</p> }
              <div class="form-actions">
                <button class="button button-quiet" type="button" (click)="cancelClientForm()">Cancelar</button>
                <button class="button button-primary" type="submit">{{ editingClientId() ? 'Guardar cambios' : 'Crear cliente' }}</button>
              </div>
            </form>
          }
          <section class="client-table" aria-label="Listado de clientes">
            <div class="client-table-head"><span>CLIENTE</span><span>FECHA DE CREACIÓN</span><span>ACCIONES</span></div>
            @for (client of filteredClients(); track client.id) {
              <article class="client-row">
                <div class="client-identity">
                  <strong>{{ client.name }}</strong><span>{{ client.email }}</span>
                  @if (client.phone) { <span>{{ client.phone }}</span> }
                  @if (client.username) { <span>Usuario: {{ client.username }}</span> }
                  <span class="status" [class.paused]="!client.active"><i></i>{{ client.active ? 'Activo' : 'Inactivo' }}</span>
                </div>
                <span class="created-date">{{ client.createdAt | date:'d MMM y':'':'es-CO' }}</span>
                <div class="client-actions">
                  <button class="button button-quiet" type="button" (click)="editClient(client)">Editar</button>
                  <button class="button" [class.activate]="!client.active" [class.deactivate]="client.active" type="button" (click)="toggleClient(client)">
                    {{ client.active ? 'Inactivar' : 'Activar' }}
                  </button>
                  <button class="button button-delete" type="button" (click)="deleteClient(client)">Eliminar</button>
                </div>
              </article>
            } @empty {
              <p class="empty-state">No hay clientes que coincidan con la búsqueda.</p>
            }
          </section>
        } @else {
          <label class="search-field">Buscar usuario
            <input type="search" [ngModel]="userSearch()" (ngModelChange)="userSearch.set($event)" placeholder="Nombre, correo o cliente">
          </label>
          <label class="user-status-filter">Mostrar
            <select [ngModel]="userStatusFilter()" (ngModelChange)="userStatusFilter.set($event)">
              <option value="all">Todos los usuarios</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="deleted">Eliminados</option>
            </select>
          </label>
          <section class="client-table" aria-label="Registro de usuarios">
            <div class="client-table-head user-table-head"><span>USUARIO / CLIENTE</span><span>CORREO Y CONTACTO</span><span>ESTADO</span><span>ACCIONES</span></div>
            @for (user of filteredUsers(); track user.id) {
              <article class="client-row user-row">
                <div class="client-identity">
                  <strong>{{ user.username }}</strong>
                  <span>{{ user.clientName }} · {{ user.role === 'admin' ? 'Administrador' : 'Cliente' }}</span>
                </div>
                <div class="client-identity">
                  <span>{{ user.email }}</span>
                  @if (user.phone) { <span>{{ user.phone }}</span> }
                </div>
                <span class="status" [class.paused]="!user.active && !user.deleted" [class.closed]="user.deleted">
                  <i></i>{{ user.deleted ? 'Eliminado' : user.active ? 'Activo' : 'Inactivo' }}
                </span>
                <div class="client-actions">
                  @if (user.deleted && user.clientId) {
                    <button class="button button-primary" type="button" (click)="restoreUser(user)">Restaurar</button>
                  } @else if (user.role === 'cliente' && user.clientId) {
                    <button class="button" [class.activate]="!user.active" [class.deactivate]="user.active" type="button" (click)="toggleUser(user)">
                      {{ user.active ? 'Inactivar' : 'Activar' }}
                    </button>
                  }
                </div>
              </article>
            } @empty {
              <p class="empty-state">No hay usuarios en esta categoría.</p>
            }
          </section>
        }
      </main>
    </div>
  `,
  styles: `
    :host { background:#080808; color:#f2f0ed; display:block; min-height:100vh; min-width:0; width:100%; }
    .admin-shell { display:grid; grid-template-columns:230px minmax(0,1fr); min-height:100vh; width:100%; }
    .sidebar { background:#160e08; display:flex; flex-direction:column; gap:1.3rem; padding:1.5rem .9rem; }
    .brand { display:none; margin:0 auto 1rem; }
    .brand img { display:block; width:130px; }
    .sidebar-label { color:#aaa39b; font-size:.65rem; letter-spacing:.17em; margin:.3rem .9rem; }
    .sidebar nav { display:grid; gap:.3rem; }
    .sidebar nav a,.logout { border-radius:.4rem; color:#d9d4ce; padding:.8rem .9rem; text-decoration:none; }
    .sidebar nav a:hover,.sidebar nav a.active { background:#3a1e08; color:#fff; }
    .logout { margin-top:auto; }
    .admin-main { margin:0 auto; max-width:none; min-width:0; padding:2rem clamp(1rem,3vw,3rem); width:100%; }
    .admin-heading { align-items:center; display:flex; justify-content:center; margin:0 0 1.7rem; position:relative; text-align:center; }
    .admin-heading h1 { font-size:1.15rem; font-weight:600; margin:.2rem 0; text-transform:uppercase; }
    .eyebrow { color:#a79d93; font-size:.65rem; letter-spacing:.16em; }
    .admin-heading > .button { position:absolute; right:0; }
    .demo-note { color:#837a70; font-size:.62rem; letter-spacing:.08em; margin:.5rem 0 .8rem; text-align:right; }
    .storage-error { background:#301616; border:1px solid #6f2d2d; border-radius:.4rem; color:#ffc1b8; font-size:.78rem; padding:.7rem 1rem; }
    .search-field { color:#aaa39b; display:grid; font-size:.75rem; gap:.4rem; margin:0 0 .8rem auto; max-width:290px; }
    .search-field input,.observation,.closed-count,.status-control select,.client-form input { background:#100e0c; border:1px solid #342920; border-radius:.35rem; color:#f2f0ed; min-height:37px; outline:none; padding:.55rem .7rem; }
    .user-status-filter { color:#aaa39b; display:grid; font-size:.75rem; gap:.4rem; margin:0 0 .8rem; max-width:290px; }
    .user-status-filter select { background:#100e0c; border:1px solid #342920; border-radius:.35rem; color:#f2f0ed; min-height:37px; padding:.55rem .7rem; }
    input:focus,select:focus { border-color:#dc790a; }
    .campaign-table,.client-table { border:1px solid #30251c; border-radius:.55rem; overflow:hidden; }
    .table-header { align-items:center; background:#0c0b0a; color:#b9ada1; display:grid; font-size:.62rem; grid-template-columns:1.1fr .9fr 1.5fr 1.5fr; letter-spacing:.1em; min-height:45px; padding:.6rem 1rem; }
    .campaign-row { border-top:1px solid #30251c; display:grid; gap:.7rem 1rem; grid-template-columns:1.1fr .9fr 1.5fr 1.5fr; padding:1rem; }
    .campaign-client { align-self:center; display:grid; gap:.35rem; }
    .campaign-client strong { font-size:.83rem; }
    .campaign-client span,.campaign-meta { color:#aaa39b; font-size:.7rem; }
    .closed-count { align-self:start; max-width:75px; }
    .status-control { align-items:center; display:flex; flex-wrap:wrap; gap:.5rem; }
    .status { align-items:center; border:1px solid #2d4534; border-radius:999px; color:#6cd590; display:inline-flex; font-size:.65rem; gap:.4rem; padding:.35rem .55rem; white-space:nowrap; }
    .status i { background:#5dc87f; border-radius:50%; height:6px; width:6px; }
    .status.paused { border-color:#5b491e; color:#e9be4c; }
    .status.paused i { background:#e9be4c; }
    .status.closed { border-color:#4a4037; color:#aaa39b; }
    .status.closed i { background:#aaa39b; }
    .status-control select { min-height:34px; padding:.4rem .5rem; }
    .observation { width:100%; }
    .campaign-meta { align-self:center; display:flex; flex-wrap:wrap; grid-column:1/3; justify-content:space-between; }
    .campaign-meta strong { color:#eee; }
    .campaign-actions { align-items:center; display:flex; flex-wrap:wrap; gap:.45rem; grid-column:3/5; justify-content:flex-end; }
    .button { background:#19130d; border:1px solid #463322; border-radius:.35rem; color:#f4eee7; cursor:pointer; font-size:.68rem; min-height:32px; padding:.45rem .7rem; }
    .button:hover:not(:disabled) { filter:brightness(1.2); }
    .button:disabled { cursor:not-allowed; opacity:.45; }
    .button-primary { background:#f07800; border-color:#ff8c12; color:#090909; }
    .button-quiet { background:transparent; }
    .admin-progress { display:grid; grid-column:1/5; grid-template-columns:repeat(5,minmax(0,1fr)); margin:.6rem .7rem .2rem; }
    .admin-step { align-items:center; background:none; border:0; color:#aaa39b; cursor:pointer; display:flex; flex-direction:column; gap:.3rem; min-width:0; padding:0; position:relative; }
    .admin-step:not(:last-child)::after { background:#40362d; content:""; height:2px; left:calc(50% + 14px); position:absolute; right:calc(-50% + 14px); top:11px; }
    .admin-step.done:not(:last-child)::after { background:#f07800; }
    .admin-step > span { align-items:center; background:#100e0c; border:1px solid #4a3a2b; border-radius:50%; color:#f07800; display:flex; height:25px; justify-content:center; position:relative; width:25px; z-index:1; }
    .admin-step.done > span { background:#f07800; color:#080808; }
    .admin-step.current > span { border-color:#f07800; box-shadow:0 0 0 4px #f0780022; }
    .admin-step small { font-size:.65rem; }
    .admin-step em { color:#827a70; font-size:.54rem; font-style:normal; }
    .empty-state { color:#aaa39b; padding:2rem; text-align:center; }
    .client-table-head,.client-row { align-items:center; display:grid; gap:1rem; grid-template-columns:1.4fr 1fr 1.5fr; padding:.8rem 1rem; }
    .client-table-head { background:#0c0b0a; color:#b9ada1; font-size:.62rem; letter-spacing:.1em; }
    .client-row { border-top:1px solid #30251c; }
    .client-identity { align-items:center; display:flex; flex-wrap:wrap; gap:.55rem; }
    .client-identity strong { font-size:.8rem; }
    .client-identity > span:not(.status),.created-date { color:#aaa39b; font-size:.7rem; }
    .client-actions { display:flex; flex-wrap:wrap; gap:.4rem; }
    .activate { border-color:#376647; color:#7cda99; }
    .deactivate { border-color:#756025; color:#e9be4c; }
    .button-delete { border-color:#76342d; color:#ff9184; }
    .client-form { background:#100e0c; border:1px solid #49331f; border-radius:.6rem; display:grid; gap:.8rem; margin-bottom:1rem; max-width:440px; padding:1rem; }
    .client-form h2 { font-size:1rem; }
    .client-form label { color:#c3bcb4; display:grid; font-size:.73rem; gap:.35rem; }
    .form-hint { color:#aaa39b; font-size:.75rem; line-height:1.5; margin:0; }
    .form-actions { display:flex; gap:.5rem; justify-content:flex-end; }
    .user-table-head,.user-row { grid-template-columns:1.1fr 1.2fr .7fr 1fr; }
    .user-row { align-items:center; border-top:1px solid #30251c; display:grid; gap:.7rem 1rem; padding:1rem; }
    @media(max-width:900px) {
      .admin-shell { grid-template-columns:175px minmax(0,1fr); }
      .table-header { display:none; }
      .campaign-row { grid-template-columns:1fr 1fr; }
      .campaign-meta { grid-column:1/3; }
      .campaign-actions { grid-column:1/3; }
      .admin-progress { grid-column:1/3; }
    }
    @media(max-width:650px) {
      .admin-shell { grid-template-columns:1fr; }
      .sidebar { gap:.7rem; padding:1rem; }
      .brand { display:block; }
      .sidebar-label { display:none; }
      .sidebar nav { grid-template-columns:repeat(3,1fr); }
      .logout { margin:0; padding:.5rem .9rem; }
      .admin-main { padding-top:1rem; }
      .admin-heading { justify-content:space-between; text-align:left; }
      .admin-heading > .button { position:static; }
      .campaign-row { gap:.65rem; padding:.8rem; }
      .client-table-head { display:none; }
      .client-row { align-items:flex-start; grid-template-columns:1fr; }
      .client-actions { grid-column:1; }
      .user-row { align-items:flex-start; grid-template-columns:1fr; }
    }
  `,
})
export class AdminDashboardComponent {
  readonly store = inject(ManagementDataService);
  readonly stages = campaignStages;
  readonly view = signal<AdminView>('campaigns');
  readonly campaignSearch = signal('');
  readonly clientSearch = signal('');
  readonly userSearch = signal('');
  readonly userStatusFilter = signal('all');
  private readonly router = inject(Router);
  readonly filteredCampaigns = computed(() => {
    const term = this.campaignSearch().toLocaleLowerCase().trim();
    return this.store.campaigns().filter((campaign) =>
      !term || `${campaign.clientName} ${campaign.title}`.toLocaleLowerCase().includes(term),
    );
  });
  readonly filteredClients = computed(() => {
    const term = this.clientSearch().toLocaleLowerCase().trim();
    return this.store.clients().filter((client) =>
      !term || `${client.name} ${client.email}`.toLocaleLowerCase().includes(term),
    );
  });
  readonly filteredUsers = computed(() => {
    const term = this.userSearch().toLocaleLowerCase().trim();
    const status = this.userStatusFilter();
    return this.store.users().filter((user) => {
      const matchesSearch = !term || `${user.username} ${user.email} ${user.clientName} ${user.phone}`.toLocaleLowerCase().includes(term);
      const matchesStatus = status === 'all'
        || (status === 'deleted' && user.deleted)
        || (status === 'active' && user.active && !user.deleted)
        || (status === 'inactive' && !user.active && !user.deleted);
      return matchesSearch && matchesStatus;
    });
  });
  readonly showClientForm = signal(false);
  readonly editingClientId = signal('');
  readonly formError = signal('');
  readonly operationError = signal('');
  clientName = '';
  clientEmail = '';
  clientPhone = '';
  clientUsername = '';

  constructor() {
    void this.store.loadAdminData().catch(() => undefined);
    this.setViewFromUrl();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.setViewFromUrl());
  }

  statusLabel(status: CampaignStatus): string {
    return status === 'active' ? 'Activa' : status === 'paused' ? 'En pausa' : 'Cerrada';
  }

  stepCampaign(campaign: CampaignRecord, offset: number): void {
    void this.mutate(() => this.store.setStage(campaign.id, campaign.stageIndex + offset));
  }

  setStage(campaignId: string, stageIndex: number): void {
    void this.mutate(() => this.store.setStage(campaignId, stageIndex));
  }

  changeStatus(campaignId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    const value = target.value;
    if (value === 'active' || value === 'paused' || value === 'closed') {
      void this.mutate(() => this.store.setCampaignStatus(campaignId, value));
    }
  }

  changeObservation(campaignId: string, event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      void this.mutate(() => this.store.setObservation(campaignId, target.value));
    }
  }

  updateClosedCount(clientId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    const parsed = Number.parseInt(target.value, 10);
    const count = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
    void this.mutate(() => this.store.setClosedCampaignCount(clientId, count));
  }

  openCreateClient(): void {
    this.formError.set('');
    this.editingClientId.set('');
    this.clientName = '';
    this.clientEmail = '';
    this.clientPhone = '';
    this.clientUsername = '';
    this.showClientForm.set(true);
  }

  editClient(client: ClientRecord): void {
    this.formError.set('');
    this.editingClientId.set(client.id);
    this.clientName = client.name;
    this.clientEmail = client.email;
    this.clientPhone = client.phone;
    this.clientUsername = client.username;
    this.showClientForm.set(true);
  }

  async saveClient(): Promise<void> {
    this.formError.set('');
    const name = this.clientName.trim();
    const email = this.clientEmail.trim();
    const phone = this.clientPhone.trim();
    const username = this.clientUsername.trim();
    if (!name || !email || !phone || (!this.editingClientId() && !username)) {
      this.formError.set('Completa todos los datos del cliente.');
      return;
    }
    try {
      const id = this.editingClientId();
      if (id) await this.store.updateClient(id, { name, email, phone, username: username || undefined });
      else await this.store.createClient({ name, email, phone, username });
      this.cancelClientForm();
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'No se pudo guardar el cliente.');
    }
  }

  cancelClientForm(): void {
    this.showClientForm.set(false);
    this.editingClientId.set('');
    this.clientName = '';
    this.clientEmail = '';
    this.clientPhone = '';
    this.clientUsername = '';
  }

  toggleClient(client: ClientRecord): void {
    void this.mutate(() => this.store.toggleClient(client));
  }

  deleteClient(client: ClientRecord): void {
    if (!globalThis.confirm(`¿Estás seguro de eliminar al usuario ${client.username} del cliente ${client.name}? Se desactivará el acceso y se conservarán el cliente y sus campañas en la pestaña Usuarios > Eliminados.`)) return;
    void this.mutate(() => this.store.deleteClient(client.id));
  }

  toggleUser(user: UserRecord): void {
    void this.mutate(() => this.store.setUserActive(user, !user.active));
  }

  restoreUser(user: UserRecord): void {
    const clientId = user.clientId;
    if (!clientId || !globalThis.confirm(`¿Restaurar el acceso de ${user.username} para ${user.clientName}?`)) return;
    void this.mutate(() => this.store.restoreClient(clientId));
  }

  private async mutate(action: () => Promise<void>): Promise<void> {
    this.operationError.set('');
    try {
      await action();
    } catch (error) {
      this.operationError.set(error instanceof Error ? error.message : 'No se pudo guardar el cambio.');
    }
  }

  private setViewFromUrl(): void {
    const currentRoute = this.router.url.split(/[?#]/, 1)[0];
    this.view.set(currentRoute.endsWith('/clientes') ? 'clients' : currentRoute.endsWith('/usuarios') ? 'users' : 'campaigns');
  }
}
