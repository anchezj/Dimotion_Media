import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ManagementDataService } from '../../core/data/management-data.service';
import { ClientDashboardComponent } from './client-dashboard.component';

describe('ClientDashboardComponent', () => {
  const client = {
    id: 'test-client-id',
    name: 'Cliente de prueba',
    email: 'cliente@example.com',
    active: true,
    createdAt: '2030-08-01',
    closedCampaigns: 0,
  };
  const store = {
    campaigns: signal([]),
    clients: signal([]),
    storageError: signal(''),
    currentClient: signal<typeof client | null>(null),
    loadClientData: vi.fn(async () => {
      store.currentClient.set(client);
      return client;
    }),
    createCampaign: vi.fn(async () => undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    store.currentClient.set(null);
    await TestBed.configureTestingModule({
      imports: [ClientDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ManagementDataService, useValue: store },
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
    expect(store.loadClientData).toHaveBeenCalled();
  });

  it('sends the scheduled campaign to the remote data service', async () => {
    const fixture = TestBed.createComponent(ClientDashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    component.campaignTitle = 'Lanzamiento de temporada';
    component.selectedDate.set(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()));
    await component.createCampaign();

    expect(store.createCampaign).toHaveBeenCalledWith({
      title: 'Lanzamiento de temporada',
      date: component['dateKey'](component.selectedDate()),
      time: '09:00',
    });
  });
});
