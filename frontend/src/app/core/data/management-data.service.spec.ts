import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { ManagementDataService } from './management-data.service';

describe('ManagementDataService', () => {
  let store: ManagementDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('dimotion-demo-management-v1', JSON.stringify({
      clients: [{ id: 'local-client' }],
      campaigns: [{ id: 'local-campaign' }],
    }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ManagementDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('removes old demo storage and starts with no seeded clients or campaigns', () => {
    expect(localStorage.getItem('dimotion-demo-management-v1')).toBeNull();
    expect(store.clients()).toEqual([]);
    expect(store.campaigns()).toEqual([]);
  });

  it('loads administration data from the API', async () => {
    const loaded = store.loadAdminData();
    http.expectOne(`${environment.apiUrl}/clients`).flush([{
      id: 'remote-client',
      name: 'Carvajal',
      email: 'julian@example.com',
      active: true,
      createdAt: '2030-08-01',
      closedCampaigns: 0,
    }]);
    http.expectOne(`${environment.apiUrl}/campaigns`).flush([]);
    await loaded;

    expect(store.clients()[0].name).toBe('Carvajal');
    expect(store.campaigns()).toEqual([]);
  });

  it('persists campaign creation to the API and reloads saved campaigns', async () => {
    const creating = store.createCampaign({
      title: 'Lanzamiento',
      date: '2030-08-16',
      time: '10:30',
    });
    const createRequest = http.expectOne(`${environment.apiUrl}/campaigns`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ id: 'remote-campaign' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    http.expectOne(`${environment.apiUrl}/campaigns`).flush([{
      id: 'remote-campaign',
      clientId: 'remote-client',
      clientName: 'Carvajal',
      title: 'Lanzamiento',
      date: '2030-08-16',
      time: '10:30',
      stageIndex: 0,
      status: 'active',
      observation: '',
      createdAt: '2030-08-01',
      stageDates: ['2030-08-01'],
      closedCampaigns: 0,
    }]);
    await creating;

    expect(store.campaigns()[0].id).toBe('remote-campaign');
  });
});
