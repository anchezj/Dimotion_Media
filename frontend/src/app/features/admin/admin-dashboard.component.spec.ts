import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { ManagementDataService } from '../../core/data/management-data.service';
import type { UserRecord } from '../../core/data/management-data.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  const store = {
    campaigns: signal([{
      id: 'campaign-1',
      clientId: 'client-1',
      clientName: 'Carvajal',
      title: 'Lanzamiento',
      date: '2030-08-16',
      time: '10:30',
      stageIndex: 1,
      status: 'active' as const,
      observation: '',
      createdAt: '2030-08-01',
      stageDates: ['', ''],
      closedCampaigns: 2,
    }]),
    clients: signal([{
      id: 'client-1',
      name: 'Carvajal',
      email: 'julian@example.com',
      phone: '+573001234567',
      username: 'julian',
      active: true,
      createdAt: '2030-08-01',
      closedCampaigns: 2,
    }]),
    users: signal<UserRecord[]>([]),
    storageError: signal(''),
    loadAdminData: vi.fn(async () => undefined),
    createClient: vi.fn(async () => undefined),
    updateClient: vi.fn(async () => undefined),
    setStage: vi.fn(async () => undefined),
    setCampaignStatus: vi.fn(async () => undefined),
    setObservation: vi.fn(async () => undefined),
    setClosedCampaignCount: vi.fn(async () => undefined),
    toggleClient: vi.fn(async () => undefined),
    deleteClient: vi.fn(async () => undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    store.campaigns.set([{
      id: 'campaign-1',
      clientId: 'client-1',
      clientName: 'Carvajal',
      title: 'Lanzamiento',
      date: '2030-08-16',
      time: '10:30',
      stageIndex: 1,
      status: 'active',
      observation: '',
      createdAt: '2030-08-01',
      stageDates: ['', ''],
      closedCampaigns: 2,
    }]);
    store.clients.set([{
      id: 'client-1',
      name: 'Carvajal',
      email: 'julian@example.com',
      phone: '+573001234567',
      username: 'julian',
      active: true,
      createdAt: '2030-08-01',
      closedCampaigns: 2,
    }]);
    store.users.set([]);
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: ManagementDataService, useValue: store },
      ],
    }).compileComponents();
  });

  it('renders campaign controls from the remote data service', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.campaign-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('.admin-step').length).toBeGreaterThan(0);
    expect(fixture.nativeElement.querySelector('select[aria-label="Estado de Carvajal"]')).toBeTruthy();
    expect(store.loadAdminData).toHaveBeenCalled();
  });

  it('saves a new client through the remote data service', async () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;
    component.openCreateClient();
    component.clientName = 'Cliente nuevo';
    component.clientEmail = 'nuevo@example.com';
    component.clientPhone = '+573001234567';
    component.clientUsername = 'cliente.nuevo';
    await component.saveClient();

    expect(store.createClient).toHaveBeenCalledWith({
      name: 'Cliente nuevo',
      email: 'nuevo@example.com',
      phone: '+573001234567',
      username: 'cliente.nuevo',
    });
  });

  it('filters the user register by active, inactive and deleted status', async () => {
    store.users.set([
      {
        id: 'active-user',
        clientId: 'active-client',
        clientName: 'Activo',
        phone: '+573001234567',
        username: 'activo',
        email: 'activo@example.com',
        role: 'cliente',
        active: true,
        deleted: false,
        createdAt: '2030-08-01',
      },
      {
        id: 'inactive-user',
        clientId: 'inactive-client',
        clientName: 'Inactivo',
        phone: '+573001234568',
        username: 'inactivo',
        email: 'inactivo@example.com',
        role: 'cliente',
        active: false,
        deleted: false,
        createdAt: '2030-08-01',
      },
      {
        id: 'deleted-user',
        clientId: 'deleted-client',
        clientName: 'Eliminado',
        phone: '+573001234569',
        username: 'eliminado',
        email: 'eliminado@example.com',
        role: 'cliente',
        active: false,
        deleted: true,
        createdAt: '2030-08-01',
      },
    ]);
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    const component = fixture.componentInstance;

    component.userStatusFilter.set('deleted');
    expect(component.filteredUsers().map((user) => user.id)).toEqual(['deleted-user']);
    component.userStatusFilter.set('inactive');
    expect(component.filteredUsers().map((user) => user.id)).toEqual(['inactive-user']);
    component.userStatusFilter.set('active');
    expect(component.filteredUsers().map((user) => user.id)).toEqual(['active-user']);
  });

  it('requires confirmation before archiving a client and its user', () => {
    const confirm = vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    const fixture = TestBed.createComponent(AdminDashboardComponent);

    fixture.componentInstance.deleteClient({
      id: 'client-1',
      name: 'Carvajal',
      email: 'julian@example.com',
      phone: '+573001234567',
      username: 'julian',
      active: true,
      createdAt: '2030-08-01',
      closedCampaigns: 2,
    });

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('julian'));
    expect(store.deleteClient).toHaveBeenCalledWith('client-1');
    confirm.mockRestore();
  });
});
