import { DatePipe, registerLocaleData } from '@angular/common';
import localeEsCo from '@angular/common/locales/es-CO';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

registerLocaleData(localeEsCo);

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <main class="dashboard">
      <header class="dashboard-header">
        <a class="brand" routerLink="/cliente" aria-label="Dimotion, portal del cliente">
          <img src="/dimotion-logo.png" alt="Dimotion Media">
        </a>
        <div class="account-bar">
          <span class="client-label">CLIENTE</span>
          <span class="client-name">{{ clientName() }}</span>
          <a class="header-action" routerLink="/contacto">NUEVA CAMPAÑA</a>
          <a class="header-action" routerLink="/logout">CERRAR SESIÓN</a>
        </div>
      </header>

      <section class="campaign-progress" aria-label="Etapas de las campañas">
        @for (stage of stages; track stage) {
          <div class="stage">
            <span>{{ stage }}</span>
            <span class="stage-line" aria-hidden="true"></span>
          </div>
        }
      </section>

      <section class="calendar-section" aria-labelledby="calendar-title">
        <div class="calendar-heading">
          <div>
            <p class="eyebrow">ORGANIZA TU PRODUCCIÓN</p>
            <h1 id="calendar-title">Calendario</h1>
          </div>
          <a class="create-campaign" routerLink="/contacto">CREA TU CAMPAÑA</a>
        </div>

        <div class="calendar">
          <div class="calendar-toolbar">
            <div class="month-controls">
              <button class="arrow" type="button" aria-label="Mes anterior" (click)="moveMonth(-1)">‹</button>
              <h2>{{ monthLabel() }}</h2>
              <button class="arrow" type="button" aria-label="Mes siguiente" (click)="moveMonth(1)">›</button>
            </div>
            <button class="today-button" type="button" (click)="goToToday()">Hoy</button>
          </div>

          <div class="calendar-grid" role="grid" [attr.aria-label]="'Calendario de ' + monthLabel()">
            @for (weekday of weekdays; track weekday) {
              <div class="weekday" role="columnheader">{{ weekday }}</div>
            }
            @for (day of calendarDays(); track day.date.toISOString()) {
              <button
                class="day"
                type="button"
                role="gridcell"
                [class.outside-month]="!day.inCurrentMonth"
                [class.today]="day.isToday"
                [class.selected]="day.isSelected"
                [attr.aria-label]="day.date | date:'EEEE d MMMM y':'':'es-CO'"
                [attr.aria-pressed]="day.isSelected"
                (click)="selectDay(day)"
              >{{ day.date.getDate() }}</button>
            }
          </div>
        </div>

        <aside class="selected-day" aria-live="polite">
          <span class="selected-date">{{ selectedDate() | date:'EEEE, d MMMM':'':'es-CO' }}</span>
          <p>No tienes actividades agendadas para este día.</p>
        </aside>
      </section>
    </main>
  `,
  styles: `
    :host { background: #080808; color: #f1f0ed; display: block; min-height: 100vh; }
    .dashboard { margin: 0 auto; max-width: 1440px; min-height: 100vh; padding: 2rem clamp(1rem, 4vw, 4rem) 4rem; }
    .dashboard-header { align-items: center; display: flex; gap: 1.5rem; justify-content: space-between; }
    .brand { align-items: center; display: flex; flex: 0 0 auto; }
    .brand img { display: block; height: auto; width: 112px; }
    .account-bar { align-items: center; background: #1d1d1f; border: 1px solid #333335; border-radius: 999px; display: flex; gap: clamp(.6rem, 2vw, 1.5rem); min-height: 52px; padding: .45rem .8rem .45rem 1.4rem; width: min(760px, 82%); }
    .client-label { font-size: .94rem; letter-spacing: .1em; }
    .client-name { color: #b4b2af; flex: 1; font-size: .85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .header-action { border: 1px solid #b77423; border-radius: 999px; color: #f1d5b2; font-size: .64rem; padding: .5rem .75rem; text-align: center; text-decoration: none; white-space: nowrap; }
    .header-action:hover, .create-campaign:hover { background: #8f5519; }
    .campaign-progress { align-items: center; display: flex; justify-content: center; margin: 3rem auto 4rem; max-width: 760px; }
    .stage { align-items: center; color: #d5d3d0; display: flex; flex: 1; font-size: .78rem; gap: .5rem; white-space: nowrap; }
    .stage-line { background: #535353; height: 3px; width: 100%; }
    .stage:last-child { flex: 0 0 auto; }
    .calendar-section { margin: 0 auto; max-width: 850px; }
    .calendar-heading { align-items: end; display: flex; justify-content: space-between; margin-bottom: 1.4rem; }
    .eyebrow { color: #c87924; font-size: .68rem; letter-spacing: .16em; margin: 0 0 .35rem; }
    h1 { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 500; margin: 0; }
    .create-campaign { background: #71442b; border-radius: 999px; color: #fff; font-size: .7rem; padding: .7rem 1rem; text-decoration: none; }
    .calendar { background: #f5f4f2; border-radius: .5rem; color: #242321; padding: clamp(.8rem, 2vw, 1.5rem); }
    .calendar-toolbar { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1rem; }
    .month-controls { align-items: center; display: flex; gap: 1rem; }
    .month-controls h2 { font-size: 1rem; font-weight: 650; margin: 0; min-width: 155px; text-align: center; text-transform: capitalize; }
    .arrow, .today-button { background: transparent; border: 1px solid #d4d1cc; border-radius: .35rem; color: #292724; cursor: pointer; min-height: 34px; }
    .arrow { font-size: 1.3rem; line-height: 1; width: 36px; }
    .today-button { padding: 0 .8rem; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
    .weekday { align-items: center; color: #75716c; display: flex; font-size: .7rem; font-weight: 650; justify-content: center; min-height: 38px; text-transform: uppercase; }
    .day { align-items: center; aspect-ratio: 1.5; background: transparent; border: 1px solid #e7e4df; color: #292724; cursor: pointer; display: flex; font-size: .84rem; justify-content: center; margin: -1px 0 0 -1px; position: relative; }
    .day:hover { background: #eee9e2; }
    .day.outside-month { color: #aaa6a0; }
    .day.today::after { border: 1px solid #c87524; border-radius: 50%; content: ''; height: 30px; position: absolute; width: 30px; }
    .day.selected { background: #f4e5d3; color: #633b17; font-weight: 700; }
    .day.selected.today::after { border-color: #9d5816; }
    .selected-day { border-left:2px solid #a55e1c; margin-top:1.5rem; padding:.2rem 0 .2rem 1rem; }
    .selected-date { color: #f1d5b2; font-size: .9rem; text-transform: capitalize; }
    .selected-day p { color: #aaa7a2; font-size: .82rem; margin: .4rem 0 0; }
    @media (max-width: 700px) {
      .dashboard { padding-top: 1.2rem; }
      .dashboard-header { align-items: flex-start; flex-direction: column; gap: 1rem; }
      .account-bar { flex-wrap: wrap; justify-content: flex-end; padding: .7rem; width: 100%; }
      .client-label { margin-left: .5rem; }
      .client-name { flex-basis: calc(100% - 5rem); }
      .header-action { flex: 1; }
      .campaign-progress { margin: 2rem 0 3rem; }
      .stage { align-items: center; flex-direction: column; font-size: .59rem; gap: .35rem; text-align: center; white-space: normal; }
      .stage-line { height: 2px; }
      .calendar-heading { align-items: flex-start; flex-direction: column; gap: 1rem; }
      .calendar { padding: .55rem; }
      .month-controls { gap: .4rem; }
      .month-controls h2 { font-size: .88rem; min-width: 130px; }
      .weekday { font-size: .57rem; }
      .day { aspect-ratio: 1; font-size: .72rem; }
      .day.today::after { height: 25px; width: 25px; }
    }
  `,
})
export class ClientDashboardComponent {
  private readonly auth = inject(AuthService);
  private readonly today = this.startOfDay(new Date());
  private readonly currentMonth = signal(this.firstOfMonth(this.today));
  readonly selectedDate = signal(this.today);
  readonly weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly stages = ['Pago confirmado', 'En producción', 'En edición', 'Entrega'];
  readonly clientName = signal('Mi cuenta');
  readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(this.currentMonth()),
  );
  readonly calendarDays = computed(() => {
    const month = this.currentMonth();
    const first = this.firstOfMonth(month);
    const offset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - offset);
    const selected = this.selectedDate();
    return Array.from({ length: 42 }, (_, index): CalendarDay => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return {
        date,
        inCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: this.sameDay(date, this.today),
        isSelected: this.sameDay(date, selected),
      };
    });
  });

  constructor() {
    void this.loadClientName();
  }

  moveMonth(offset: number): void {
    const next = this.currentMonth();
    next.setMonth(next.getMonth() + offset);
    this.currentMonth.set(this.firstOfMonth(next));
  }

  goToToday(): void {
    this.currentMonth.set(this.firstOfMonth(this.today));
    this.selectedDate.set(this.today);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    if (!day.inCurrentMonth) this.currentMonth.set(this.firstOfMonth(day.date));
  }

  private async loadClientName(): Promise<void> {
    try {
      const session = await this.auth.getSession();
      const metadata = session?.user.user_metadata;
      const name = metadata?.['client_name'] ?? metadata?.['requester_name'] ?? metadata?.['full_name'];
      if (typeof name === 'string' && name.trim()) this.clientName.set(name.trim());
    } catch (error) {
      console.error('No se pudo cargar el nombre del cliente.', error);
    }
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
