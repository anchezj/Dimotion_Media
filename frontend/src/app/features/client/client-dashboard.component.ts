import { DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { campaignStages, ManagementDataService } from '../../core/data/management-data.service';

registerLocaleData(localeEsCo);

interface CalendarCell {
  date: Date | null;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <main class="client-shell">
      <header class="client-header">
        <a class="brand" routerLink="/" aria-label="Volver al sitio Dimotion"><img src="/dimotion-logo.png" alt="Dimotion Media"></a>
        <div class="account-bar">
          <span class="client-label">CLIENTE</span>
          <span class="client-name">{{ clientName() }}</span>
          <button class="header-action" type="button" (click)="openScheduler()">NUEVA CAMPAÑA</button>
          <a class="header-action" routerLink="/logout">CERRAR SESIÓN</a>
        </div>
      </header>

      <p class="demo-note">Tus campañas se guardan de forma segura en Supabase.</p>
      @if (store.storageError()) {
        <p class="storage-error" role="alert">{{ store.storageError() }}</p>
      }

      <section class="progress" aria-label="Etapas de campaña">
        @for (stage of stages; track stage) {
          <div class="progress-stage">
            <span
              class="progress-dot"
              [class.current]="$index === currentStageIndex()"
              [class.done]="$index < currentStageIndex()"
            >{{ $index < currentStageIndex() ? '✓' : $index === currentStageIndex() ? '•' : '' }}</span>
            <span>{{ stage }}</span>
          </div>
        }
      </section>

      <section class="campaign-list" aria-labelledby="campaign-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">TU PRODUCCIÓN</p>
            <h1 id="campaign-title">Panel cliente</h1>
            <p class="panel-description">Consulta el avance y agenda tus próximas producciones.</p>
          </div>
          <button class="primary-button" type="button" (click)="openScheduler()">NUEVA CAMPAÑA <span aria-hidden="true">+</span></button>
        </div>

        @if (myCampaigns().length) {
          <div class="campaign-cards">
            @for (campaign of myCampaigns(); track campaign.id) {
              <article class="campaign-card">
                <div class="campaign-card-heading">
                  <div><span class="campaign-date">{{ campaign.date | date:'d MMM y':'':'es-CO' }}</span><h2>{{ campaign.title }}</h2></div>
                  <span class="status" [class.paused]="campaign.status === 'paused'">{{ campaign.status === 'paused' ? 'En pausa' : campaign.status === 'closed' ? 'Entregada' : 'Activa' }}</span>
                </div>
                <div class="client-progress">
                  @for (stage of stages; track stage; let index = $index) {
                    <div class="client-step" [class.done]="index < campaign.stageIndex" [class.current]="index === campaign.stageIndex">
                      <span class="step-dot">{{ index < campaign.stageIndex ? '✓' : index === campaign.stageIndex ? '•' : '' }}</span>
                      <span>{{ stage }}</span>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="empty-state"><p>Aún no tienes campañas agendadas.</p><button type="button" class="text-button" (click)="openScheduler()">Agenda tu primera campaña</button></div>
        }
      </section>

      @if (showScheduler()) {
        <section class="scheduler" aria-labelledby="scheduler-title">
          <div class="section-heading scheduler-heading">
            <div>
              <p class="eyebrow">AGENDA TU PRODUCCIÓN</p>
              <h2 id="scheduler-title">Nueva campaña</h2>
            </div>
            <button class="close-button" type="button" aria-label="Cerrar calendario" (click)="showScheduler.set(false)">×</button>
          </div>

          <div class="scheduler-layout">
            <div class="calendar" aria-label="Selecciona una fecha">
              <div class="calendar-toolbar">
                <button type="button" aria-label="Mes anterior" (click)="moveMonth(-1)">‹</button>
                <h3>{{ monthLabel() }}</h3>
                <button type="button" aria-label="Mes siguiente" (click)="moveMonth(1)">›</button>
              </div>
              <div class="calendar-grid">
                @for (weekday of weekdays; track weekday) { <span class="weekday">{{ weekday }}</span> }
                @for (cell of calendarCells(); track $index) {
                  @if (cell.date) {
                    <button
                      type="button"
                      class="day"
                      [class.today]="cell.isToday"
                      [class.selected]="cell.isSelected"
                      [disabled]="isPast(cell.date)"
                      [attr.aria-label]="cell.date | date:'EEEE d MMMM y':'':'es-CO'"
                      [attr.aria-pressed]="cell.isSelected"
                      (click)="selectDate(cell.date)"
                    >{{ cell.date.getDate() }}</button>
                  } @else {
                    <span class="day blank" aria-hidden="true"></span>
                  }
                }
              </div>
              <p class="selected-date">{{ selectedDate() | date:'EEEE, d MMMM y':'':'es-CO' }}</p>
            </div>

            <form class="campaign-form" (ngSubmit)="createCampaign()">
              <label>Nombre de la campaña
                <input name="title" [(ngModel)]="campaignTitle" maxlength="120" required placeholder="Ej. Lanzamiento de producto">
              </label>
              <label>Fecha seleccionada
                <input name="date" [value]="selectedDate() | date:'yyyy-MM-dd':'':'es-CO'" readonly>
              </label>
              <label>Hora de inicio
                <input name="time" type="time" [(ngModel)]="selectedTime" required>
              </label>
              @if (formError()) { <p class="form-error" role="alert">{{ formError() }}</p> }
              @if (createdMessage()) { <p class="form-success" role="status">{{ createdMessage() }}</p> }
              <button class="primary-button" type="submit" [disabled]="saving()">{{ saving() ? 'GUARDANDO…' : 'CONFIRMAR CAMPAÑA' }}</button>
            </form>
          </div>
        </section>
      }
    </main>
  `,
  styles: `
    :host { background:#080808; color:#f1f0ed; display:block; min-height:100vh; }
    .client-shell { margin:0 auto; max-width:1280px; min-height:100vh; padding:1.5rem clamp(1rem,4vw,3rem) 4rem; }
    .client-header { align-items:center; display:flex; gap:1.5rem; justify-content:space-between; }
    .brand img { display:block; height:auto; width:125px; }
    .account-bar { align-items:center; background:#1d1d1f; border:1px solid #333335; border-radius:999px; display:flex; gap:1rem; min-height:52px; padding:.45rem 1rem .45rem 1.4rem; width:min(760px,82%); }
    .client-label { font-size:1.1rem; letter-spacing:.1em; }
    .client-name { color:#b4b2af; flex:1; font-size:.85rem; }
    .header-action { background:transparent; border:1px solid #b77423; border-radius:999px; color:#f1d5b2; cursor:pointer; font-size:.62rem; padding:.55rem .8rem; text-decoration:none; white-space:nowrap; }
    .header-action:hover,.primary-button:hover { background:#8f5519; }
    .demo-note { color:#79746d; font-size:.7rem; margin:.8rem 0 0; text-align:right; }
    .storage-error,.form-error { background:#301616; border:1px solid #6f2d2d; border-radius:.5rem; color:#ffc1b8; font-size:.8rem; padding:.7rem 1rem; }
    .progress { align-items:flex-start; display:flex; margin:4.5rem auto 4rem; max-width:760px; }
    .progress-stage { align-items:center; color:#b9b4ad; display:flex; flex:1; flex-direction:column; font-size:.72rem; gap:.45rem; position:relative; }
    .progress-stage:not(:last-child)::after { background:#39322c; content:""; height:2px; left:calc(50% + 18px); position:absolute; right:calc(-50% + 18px); top:11px; }
    .progress-dot,.step-dot { align-items:center; background:#111; border:1px solid #40352a; border-radius:50%; color:#ff8100; display:flex; height:23px; justify-content:center; position:relative; width:23px; z-index:1; }
    .progress-dot.done,.step-dot.done { background:#ff8100; color:#080808; }
    .progress-dot.current,.step-dot.current { border-color:#ff8100; box-shadow:0 0 0 4px #ff810022; }
    .campaign-list,.scheduler { margin:0 auto; max-width:900px; }
    .section-heading { align-items:center; display:flex; justify-content:space-between; margin-bottom:1.25rem; }
    .eyebrow { color:#c87924; font-size:.65rem; letter-spacing:.17em; margin:0 0 .4rem; }
    h1,h2,h3 { margin:0; }
    h1,.scheduler h2 { font-size:1.45rem; font-weight:500; }
    .panel-description { color:#aaa39b; font-size:.78rem; margin:.4rem 0 0; }
    .primary-button { background:#e47800; border:1px solid #ff951a; border-radius:.45rem; color:#090909; cursor:pointer; font-size:.68rem; font-weight:700; letter-spacing:.07em; padding:.75rem 1rem; }
    .primary-button:disabled { cursor:wait; opacity:.65; }
    .campaign-cards { display:grid; gap:.8rem; }
    .campaign-card { background:#100e0c; border:1px solid #30251b; border-radius:.7rem; padding:1.1rem 1.25rem; }
    .campaign-card-heading { align-items:flex-start; display:flex; justify-content:space-between; }
    .campaign-date { color:#e8a146; font-size:.68rem; }
    .campaign-card h2 { font-size:1rem; font-weight:600; margin:.35rem 0 0; }
    .status { background:#10271d; border:1px solid #264a37; border-radius:999px; color:#72d596; font-size:.68rem; padding:.35rem .65rem; }
    .status.paused { background:#2b210e; border-color:#65501d; color:#f1c248; }
    .client-progress { display:flex; margin:1.4rem 0 .2rem; }
    .client-step { align-items:center; color:#96918a; display:flex; flex:1; flex-direction:column; font-size:.65rem; gap:.4rem; position:relative; }
    .client-step:not(:last-child)::after { background:#433a32; content:""; height:2px; left:calc(50% + 15px); position:absolute; right:calc(-50% + 15px); top:10px; }
    .client-step.done:not(:last-child)::after { background:#ed7900; }
    .empty-state { border:1px dashed #41372e; border-radius:.7rem; color:#b2ada6; padding:2rem; text-align:center; }
    .text-button { background:none; border:0; color:#f4a438; cursor:pointer; text-decoration:underline; }
    .scheduler { background:#0d0c0b; border:1px solid #56320f; border-radius:.8rem; margin-top:2rem; padding:1.3rem; }
    .scheduler-heading { margin-bottom:1.2rem; }
    .close-button { background:transparent; border:1px solid #41372e; border-radius:50%; color:#ddd; cursor:pointer; font-size:1.3rem; height:35px; width:35px; }
    .scheduler-layout { align-items:start; display:grid; gap:1.5rem; grid-template-columns:minmax(0,1fr) minmax(230px,.8fr); }
    .calendar { background:#070707; border:2px solid #f17c00; border-radius:.7rem; overflow:hidden; }
    .calendar-toolbar { align-items:center; border-bottom:1px solid #f17c00; display:flex; justify-content:space-between; padding:.65rem; }
    .calendar-toolbar h3 { color:#ff8500; font-size:.85rem; letter-spacing:.09em; text-transform:capitalize; }
    .calendar-toolbar button { background:#090909; border:1px solid #ef8000; border-radius:.4rem; color:#ff8500; cursor:pointer; font-size:1.15rem; height:32px; width:34px; }
    .calendar-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); }
    .weekday { align-items:center; border-bottom:1px solid #78450f; color:#ed8000; display:flex; font-size:.62rem; font-weight:700; justify-content:center; min-height:32px; }
    .day { align-items:center; aspect-ratio:1.05; background:#070707; border:0; border-bottom:1px solid #3c2c1c; border-right:1px solid #3c2c1c; color:#e6e1da; cursor:pointer; display:flex; font-size:.78rem; justify-content:center; }
    .day:hover:not(:disabled),.day.selected { background:#291a0c; color:#ff8500; }
    .day.selected { box-shadow:inset 0 0 0 1px #ff8500; font-weight:700; }
    .day.today { color:#ff8500; font-weight:700; }
    .day:disabled { color:#534d47; cursor:not-allowed; }
    .day.blank { cursor:default; }
    .selected-date { border-top:1px solid #78450f; color:#8e8983; font-size:.7rem; margin:0; padding:.65rem; text-align:center; text-transform:capitalize; }
    .campaign-form,.campaign-form label { display:grid; gap:.55rem; }
    .campaign-form { gap:1rem; }
    .campaign-form label { color:#d7d1c8; font-size:.73rem; }
    .campaign-form input { background:#090909; border:1px solid #483726; border-radius:.4rem; color:#f3f0eb; min-height:38px; outline:none; padding:.6rem .7rem; }
    .campaign-form input:focus { border-color:#ed8000; }
    .campaign-form input[readonly] { color:#aaa; }
    .form-error,.form-success { font-size:.75rem; margin:0; }
    .form-success { background:#10271d; border:1px solid #264a37; border-radius:.5rem; color:#8de2ad; padding:.7rem; }
    @media(max-width:700px) {
      .client-header { align-items:flex-start; flex-direction:column; }
      .account-bar { flex-wrap:wrap; width:100%; }
      .client-name { flex-basis:100%; }
      .header-action { flex:1; text-align:center; }
      .progress { margin:3rem 0; }
      .progress-stage { font-size:.58rem; }
      .section-heading { align-items:flex-start; gap:.7rem; }
      .primary-button { font-size:.58rem; padding:.7rem; }
      .scheduler-layout { grid-template-columns:1fr; }
      .day { aspect-ratio:1.25; }
    }
  `,
})
export class ClientDashboardComponent {
  readonly store = inject(ManagementDataService);
  private readonly today = this.startOfDay(new Date());
  private readonly month = signal(this.firstOfMonth(this.today));
  readonly selectedDate = signal(this.today);
  readonly showScheduler = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly createdMessage = signal('');
  campaignTitle = '';
  selectedTime = '09:00';
  readonly weekdays = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  readonly stages = campaignStages;
  readonly clientName = signal('Mi cuenta');
  readonly myCampaigns = computed(() =>
    this.store.campaigns().filter((campaign) => campaign.clientId === this.currentUserId()),
  );
  readonly currentStageIndex = computed(() => this.myCampaigns()[0]?.stageIndex ?? -1);
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.month()),
  );
  readonly calendarCells = computed(() => {
    const month = this.month();
    const first = this.firstOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const selected = this.selectedDate();
    return Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index): CalendarCell => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return { date: null, isToday: false, isSelected: false };
      const date = new Date(month.getFullYear(), month.getMonth(), dayNumber);
      return { date, isToday: this.sameDay(date, this.today), isSelected: this.sameDay(date, selected) };
    });
  });
  private currentUserId = signal('');

  constructor() {
    void this.loadClient();
  }

  openScheduler(): void {
    this.formError.set('');
    this.createdMessage.set('');
    this.showScheduler.set(true);
  }

  moveMonth(offset: number): void {
    const next = this.month();
    next.setMonth(next.getMonth() + offset);
    this.month.set(this.firstOfMonth(next));
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
  }

  isPast(date: Date): boolean {
    return date < this.today;
  }

  async createCampaign(): Promise<void> {
    this.formError.set('');
    this.createdMessage.set('');
    if (!this.campaignTitle.trim()) {
      this.formError.set('Escribe un nombre para la campaña.');
      return;
    }
    if (this.isPast(this.selectedDate())) {
      this.formError.set('Selecciona una fecha de hoy o posterior.');
      return;
    }

    this.saving.set(true);
    try {
      const client = this.store.currentClient();
      if (!client) throw new Error('No se encontró el cliente asociado a tu sesión.');
      await this.store.createCampaign({
        title: this.campaignTitle.trim(),
        date: this.dateKey(this.selectedDate()),
        time: this.selectedTime,
      });
      this.currentUserId.set(client.id);
      this.createdMessage.set(`Campaña agendada para el ${this.selectedDate().toLocaleDateString('es-CO')}.`);
      this.campaignTitle = '';
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'No fue posible guardar la campaña.');
    } finally {
      this.saving.set(false);
    }
  }

  private async loadClient(): Promise<void> {
    try {
      const client = await this.store.loadClientData();
      this.currentUserId.set(client.id);
      this.clientName.set(client.name);
    } catch (error) {
      console.error('No se pudo cargar la información del cliente.', error);
    }
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private firstOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private sameDay(left: Date, right: Date): boolean {
    return left.getFullYear() === right.getFullYear()
      && left.getMonth() === right.getMonth()
      && left.getDate() === right.getDate();
  }
}
