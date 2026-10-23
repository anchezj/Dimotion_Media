import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { DemoDataService } from '../../core/demo/demo-data.service';
import { ClientDashboardComponent } from './client-dashboard.component';

describe('ClientDashboardComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ClientDashboardComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getSession: async () => ({
              user: {
                id: 'test-client-id',
                email: 'cliente@example.com',
                user_metadata: { client_name: 'Cliente de prueba' },
              },
            }),
          },
        },
      ],
    }).compileComponents();
  });

  it('opens the calendar when the client requests a new campaign', async () => {
    const fixture = TestBed.createComponent(ClientDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const createButton = fixture.nativeElement.querySelector('.header-action') as HTMLButtonElement;
    createButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.scheduler')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.calendar-grid')).toBeTruthy();
  });

  it('creates a campaign for the selected date and client', async () => {
    const fixture = TestBed.createComponent(ClientDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.campaignTitle = 'Lanzamiento de temporada';
    component.selectedDate.set(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));
    await component.createCampaign();

    const campaign = TestBed.inject(DemoDataService).campaigns()
      .find((item) => item.title === 'Lanzamiento de temporada');
    expect(campaign?.clientId).toBe('test-client-id');
    expect(campaign?.date).toBe(component['dateKey'](component.selectedDate()));
  });
});
